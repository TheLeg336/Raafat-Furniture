/**
 * Raafat Furniture — local scan worker.
 *
 * Watches Firestore `scans` for status == 'queued', reconstructs a 3D model
 * on this PC's GPU (Meshroom / AliceVision), optimizes it to a web-ready GLB
 * (+ optional USDZ via Blender), uploads to Cloudinary and marks the scan
 * 'ready'. If the scan carries a productId, the product's model3d field is
 * updated automatically — the model appears on the site with no extra step.
 *
 * Run:  npm install && npm start   (see README.md for engine setup)
 * Dashboard:  http://localhost:8787
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- env ----------
// Minimal .env loader (no dependency): KEY=VALUE lines, # comments.
const envFile = path.join(__dirname, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const {
  FIREBASE_SERVICE_ACCOUNT,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  MESHROOM_BIN = 'meshroom_batch',
  BLENDER_BIN = '',
  PORT = '8787',
} = process.env;

function fail(msg) { console.error('✖ ' + msg); process.exit(1); }
if (!FIREBASE_SERVICE_ACCOUNT) fail('Set FIREBASE_SERVICE_ACCOUNT in scan-worker/.env');
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  fail('Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in scan-worker/.env');
}

const svc = FIREBASE_SERVICE_ACCOUNT.trim().startsWith('{')
  ? JSON.parse(FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(readFileSync(path.resolve(__dirname, FIREBASE_SERVICE_ACCOUNT), 'utf8'));
initializeApp({ credential: cert(svc) });
const db = getFirestore();
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// ---------- job state (for the dashboard) ----------
const state = {
  startedAt: new Date().toISOString(),
  current: null,          // { id, step, startedAt }
  log: [],                // recent log lines
  done: [],               // finished job summaries
};
function log(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(line);
  state.log.push(line);
  if (state.log.length > 200) state.log.shift();
}
function setStep(step) {
  if (state.current) state.current.step = step;
  log(step);
}

// ---------- helpers ----------
function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    log(`$ ${cmd} ${args.join(' ')}`);
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let tail = '';
    const keep = (buf) => { tail = (tail + buf.toString()).slice(-4000); };
    p.stdout.on('data', keep);
    p.stderr.on('data', keep);
    p.on('error', reject);
    p.on('close', (code) => code === 0 ? resolve(tail) : reject(new Error(`${path.basename(cmd)} exited ${code}: …${tail.slice(-600)}`)));
  });
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function findFile(dir, test) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await findFile(p, test));
    else if (test(e.name)) out.push(p);
  }
  return out;
}

/** Optimize GLB + scale it so real-world dimensions match (GLB units = metres). */
async function optimizeAndScale(glbPath, outPath, realDimensions) {
  const [{ NodeIO, getBounds }, fns] = await Promise.all([
    import('@gltf-transform/core'),
    import('@gltf-transform/functions'),
  ]);
  const io = new NodeIO();
  const doc = await io.read(glbPath);
  await doc.transform(fns.dedup(), fns.prune(), fns.weld());

  if (realDimensions && (realDimensions.width || realDimensions.height || realDimensions.depth)) {
    const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
    if (scene) {
      const { min, max } = getBounds(scene);
      const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
      const toM = (v) => (realDimensions.unit === 'cm' ? v / 100 : v);
      // Prefer height (Y), else width (X), else depth (Z).
      let factor = null;
      if (realDimensions.height && size[1] > 0) factor = toM(realDimensions.height) / size[1];
      else if (realDimensions.width && size[0] > 0) factor = toM(realDimensions.width) / size[0];
      else if (realDimensions.depth && size[2] > 0) factor = toM(realDimensions.depth) / size[2];
      if (factor && Number.isFinite(factor) && factor > 0) {
        for (const node of scene.listChildren()) {
          const s = node.getScale();
          node.setScale([s[0] * factor, s[1] * factor, s[2] * factor]);
        }
        log(`Scaled model ×${factor.toFixed(4)} to match real dimensions`);
      }
    }
  }
  await io.write(outPath, doc);
}

async function exportUsdz(glbPath, usdzPath) {
  const script = path.join(__dirname, 'export_usdz.py');
  await run(BLENDER_BIN, ['-b', '--factory-startup', '-P', script, '--', glbPath, usdzPath]);
  if (!existsSync(usdzPath)) throw new Error('Blender did not produce a USDZ');
}

async function uploadRaw(filePath, publicId) {
  const r = await cloudinary.uploader.upload(filePath, {
    resource_type: 'raw',
    folder: 'models',
    public_id: publicId,
    overwrite: true,
  });
  return r.secure_url;
}

// ---------- the pipeline ----------
async function processScan(scanDoc) {
  const scan = scanDoc.data();
  const id = scanDoc.id;
  state.current = { id, step: 'starting', startedAt: new Date().toISOString() };
  const work = path.join(__dirname, 'work', id);
  const frames = path.join(work, 'frames');
  const out = path.join(work, 'out');

  const patch = (data) => scanDoc.ref.update({ ...data, updatedAt: new Date().toISOString() });

  try {
    await patch({ status: 'processing', error: null });
    await rm(work, { recursive: true, force: true });
    await mkdir(frames, { recursive: true });
    await mkdir(out, { recursive: true });

    const urls = scan.frameUrls || [];
    if (urls.length < 8) throw new Error(`Only ${urls.length} frames — need at least 8 for reconstruction`);
    setStep(`Downloading ${urls.length} frames…`);
    for (let i = 0; i < urls.length; i++) {
      await download(urls[i], path.join(frames, `frame-${String(i).padStart(3, '0')}.jpg`));
    }

    setStep('Reconstructing with Meshroom (GPU)… this can take 10–40 min');
    await run(MESHROOM_BIN, ['--input', frames, '--output', out]);

    setStep('Locating textured mesh…');
    const objs = await findFile(out, (n) => n.toLowerCase().endsWith('.obj'));
    if (!objs.length) throw new Error('Meshroom finished but produced no .obj mesh');
    const obj = objs[0];

    setStep('Converting OBJ → GLB…');
    const rawGlb = path.join(work, 'raw.glb');
    const { default: obj2gltf } = await import('obj2gltf');
    const glbBuf = await obj2gltf(obj, { binary: true });
    await writeFile(rawGlb, Buffer.from(glbBuf));

    setStep('Optimizing GLB (dedup/prune/weld + real-size scaling)…');
    const finalGlb = path.join(work, `${id}.glb`);
    await optimizeAndScale(rawGlb, finalGlb, scan.realDimensions);

    let iosUrl;
    if (BLENDER_BIN) {
      try {
        setStep('Exporting USDZ for iOS AR…');
        const usdz = path.join(work, `${id}.usdz`);
        await exportUsdz(finalGlb, usdz);
        iosUrl = await uploadRaw(usdz, `scan-${id}`);
      } catch (e) {
        log(`USDZ export skipped: ${e.message}`);
      }
    }

    setStep('Uploading GLB to Cloudinary…');
    const modelUrl = await uploadRaw(finalGlb, `scan-${id}`);

    setStep('Marking scan ready…');
    await patch({ status: 'ready', modelUrl, ...(iosUrl ? { iosUrl } : {}) });

    if (scan.productId) {
      setStep(`Attaching model to product ${scan.productId}…`);
      const prodRef = db.collection('products').doc(scan.productId);
      const prod = await prodRef.get();
      if (prod.exists) {
        const existing = prod.data().model3d || {};
        await prodRef.update({
          model3d: {
            ...existing,
            url: modelUrl,
            ...(iosUrl ? { iosUrl } : {}),
            createdVia: 'scan',
            scanId: id,
            ...(scan.realDimensions ? { dimensions: scan.realDimensions } : {}),
          },
        });
        log(`✓ Product ${scan.productId} now has the 3D model`);
      } else {
        log(`Product ${scan.productId} no longer exists — model left on the scan job`);
      }
    }

    state.done.unshift({ id, ok: true, finishedAt: new Date().toISOString(), modelUrl });
    log(`✓ Scan ${id} complete: ${modelUrl}`);
    await rm(work, { recursive: true, force: true });
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    log(`✖ Scan ${id} failed: ${msg}`);
    state.done.unshift({ id, ok: false, finishedAt: new Date().toISOString(), error: msg });
    await patch({ status: 'failed', error: `worker: ${msg}` }).catch(() => {});
  } finally {
    state.current = null;
    if (state.done.length > 50) state.done.pop();
  }
}

// ---------- queue loop ----------
const pending = new Map(); // id -> doc
let busy = false;

async function pump() {
  if (busy) return;
  const next = pending.values().next().value;
  if (!next) return;
  pending.delete(next.id);
  busy = true;
  try { await processScan(next); } finally { busy = false; }
  void pump();
}

db.collection('scans').where('status', '==', 'queued')
  .onSnapshot((snap) => {
    for (const d of snap.docs) if (!pending.has(d.id)) pending.set(d.id, d);
    log(`Queue: ${pending.size + (busy ? 1 : 0)} job(s)`);
    void pump();
  }, (err) => log(`Firestore listener error: ${err.message}`));

// ---------- dashboard ----------
const server = createServer(async (req, res) => {
  if (req.url === '/api/status') {
    const snap = await db.collection('scans').orderBy('createdAt', 'desc').limit(25).get();
    const scans = snap.docs.map((d) => ({ id: d.id, ...d.data(), frameUrls: undefined }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...state, scans }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset="utf-8"><title>Raafat Scan Worker</title>
<style>body{font:14px system-ui;margin:2rem;background:#101418;color:#e8e4da}
table{border-collapse:collapse;width:100%;margin-top:1rem}td,th{padding:.4rem .6rem;border-bottom:1px solid #2a2f36;text-align:left}
.ok{color:#7bc47f}.bad{color:#e07070}.cur{color:#d4af6a}pre{background:#181d23;padding:1rem;overflow:auto;max-height:300px}
h1{color:#d4af6a}</style>
<h1>Raafat Scan Worker</h1>
<div id="cur"></div><table id="t"><thead><tr><th>Scan</th><th>Status</th><th>Frames</th><th>Product</th><th>Updated</th></tr></thead><tbody></tbody></table>
<h3>Log</h3><pre id="log"></pre>
<script>
async function tick(){
  const s=await (await fetch('/api/status')).json();
  document.getElementById('cur').innerHTML = s.current
    ? '<p class="cur">Working on <b>'+s.current.id+'</b> — '+s.current.step+'</p>'
    : '<p>Idle — waiting for queued scans.</p>';
  document.querySelector('#t tbody').innerHTML = s.scans.map(x=>
    '<tr><td>'+x.id+'</td><td class="'+(x.status==='ready'?'ok':x.status==='failed'?'bad':'cur')+'">'+x.status+'</td><td>'+(x.frameCount||0)+'</td><td>'+(x.productId||'—')+'</td><td>'+(x.updatedAt||'').replace('T',' ').slice(0,19)+'</td></tr>').join('');
  document.getElementById('log').textContent = s.log.slice(-60).join('\\n');
}
tick();setInterval(tick,5000);
</script>`);
});
server.listen(Number(PORT), () => log(`Dashboard: http://localhost:${PORT}`));
