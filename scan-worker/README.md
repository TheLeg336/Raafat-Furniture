# Raafat Scan Worker — free 3D reconstruction on your own PC

Turns queued admin scans (photos captured with the guided scanner) into
high-quality, AR-ready GLB models using your GPU (RTX 5070 + Ryzen 7 9700X is
ideal), then uploads them and attaches them to the right product automatically.

## How it fits together

1. Admin scans a product with the guided camera flow (phone) → frames upload to
   Cloudinary → the scan job sits in Firestore with `status: 'queued'`.
2. This worker (running on your PC, whenever it's on) picks the job up,
   reconstructs the mesh with Meshroom (free, GPU-accelerated), converts and
   optimizes it to a web-ready GLB, scales it to the real dimensions entered
   during the scan, optionally exports a USDZ for iPhone AR, uploads both to
   Cloudinary, and marks the scan `ready`.
3. If the scan was started while editing an existing product, the model is
   attached to that product automatically — nothing else to do.
   Otherwise use the **Use model** button in Admin → product → 3D section.

Your PC doesn't need to be always on: jobs simply wait in the queue until the
worker starts.

## One-time setup

1. **Node 20+** — https://nodejs.org
2. **Meshroom** (free) — https://alicevision.org/#meshroom
   Download, extract, note the path to `meshroom_batch.exe`.
   Needs an NVIDIA GPU with CUDA — your RTX 5070 qualifies (use the newest
   Meshroom release for Blackwell-generation GPU support).
3. **Blender 4.x** (optional, for iPhone AR / USDZ) — https://blender.org
4. Service account: Firebase Console → Project settings → Service accounts →
   Generate new private key → save as `scan-worker/service-account.json`.
   (Keep it out of git — it's ignored.)
5. Cloudinary API credentials: Dashboard → API Keys (cloud name, key, secret).
6. Configure:
   ```
   cd scan-worker
   copy .env.example .env     # then fill it in
   npm install
   ```

## Run

```
cd scan-worker
npm start
```

Open **http://localhost:8787** — you'll see pending jobs, the current step,
and a live log. Leave it running; it processes queued scans one at a time
(reconstruction takes roughly 10–40 minutes per item on your hardware).

### Start automatically when the PC boots (optional)

Task Scheduler → Create Basic Task → At log on →
Program: `node`, Arguments: `worker.mjs`, Start in: `...\scan-worker`.

## Quality tips (what makes scans great)

- Even, diffuse light; avoid harsh shadows and reflections.
- Follow all four guided passes (eye level, high, low, details).
- Keep the whole piece in frame; fill ~70% of it.
- Enter real dimensions during the scan — AR then places it at true size.

## Troubleshooting

- **`meshroom_batch exited …`** — run the same command manually to see the
  full log; most failures are too few/blurry frames.
- **Scan marked `failed`** — the reason is stored on the scan job and shown in
  the admin scan list; fix and re-scan, or attach a GLB manually (Polycam,
  Luma, RealityScan phone apps also produce GLBs).
- **No USDZ** — set `BLENDER_BIN` in `.env`. Android AR works without it;
  iPhone AR needs the USDZ.
