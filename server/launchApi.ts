/**
 * Coming-soon mode, waitlist, and launch notifications (developer-only controls).
 */
import { Router, type Request, type Response } from 'express';
import { getDb, verifyIdToken } from './firebaseAdmin';
import { staffFromReq } from './ordersApi';
import { sendLaunchAnnouncement } from './email';
import { isBootstrapDeveloperEmail } from '../lib/staff';

const LAUNCH_DOC = 'settings/launch';

export interface LaunchSettings {
  comingSoon: boolean;
  message?: string;
  scheduledAt?: string | null;
  updatedAt?: string;
  launchedAt?: string | null;
}

async function readLaunchSettings(): Promise<LaunchSettings> {
  const db = await getDb();
  if (!db) return { comingSoon: false };
  const snap = await db.doc(LAUNCH_DOC).get();
  if (!snap.exists) return { comingSoon: false };
  const d = snap.data() as LaunchSettings;
  return {
    comingSoon: !!d.comingSoon,
    message: d.message || '',
    scheduledAt: d.scheduledAt || null,
    launchedAt: d.launchedAt || null,
    updatedAt: d.updatedAt,
  };
}

async function developerFromReq(req: Request): Promise<{ email: string; role: 'developer' } | null> {
  const decoded = await verifyIdToken(req.headers.authorization);
  if (!decoded?.email) return null;
  const staff = await staffFromReq(req);
  if (!staff) {
    if (isBootstrapDeveloperEmail(decoded.email, decoded.email_verified === true)) {
      return { email: decoded.email.toLowerCase(), role: 'developer' };
    }
    return null;
  }
  if (staff.role !== 'developer') return null;
  return { email: staff.email, role: 'developer' };
}

async function patchLaunchSettings(req: Request, res: Response) {
  const dev = await developerFromReq(req);
  if (!dev) {
    const decoded = await verifyIdToken(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: 'Sign in required' });
    const staff = await staffFromReq(req);
    if (!staff) return res.status(403).json({ error: 'Your account is not in the admins team list' });
    return res.status(403).json({ error: 'Developer role required for this action' });
  }

  const db = await getDb();
  if (!db) return res.status(503).json({ error: 'Not configured' });

  const { comingSoon, message, scheduledAt } = req.body || {};
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof comingSoon === 'boolean') patch.comingSoon = comingSoon;
  if (message !== undefined) patch.message = String(message).slice(0, 500);
  if (scheduledAt !== undefined) patch.scheduledAt = scheduledAt ? String(scheduledAt) : null;

  await db.doc(LAUNCH_DOC).set(patch, { merge: true });
  const s = await readLaunchSettings();
  res.json(s);
}

export function launchRouter(rateLimit: (n: number) => any) {
  const r = Router();

  r.get('/api/launch/status', async (_req: Request, res: Response) => {
    const s = await readLaunchSettings();
    res.json({
      comingSoon: s.comingSoon,
      message: s.message || null,
      scheduledAt: s.scheduledAt || null,
    });
  });

  r.post('/api/launch/waitlist', rateLimit(8), async (req: Request, res: Response) => {
    const settings = await readLaunchSettings();
    if (!settings.comingSoon) return res.status(400).json({ error: 'The store is already open.' });

    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Not configured' });

    const { name, email, phone } = req.body || {};
    const em = String(email || '').toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) return res.status(400).json({ error: 'Valid email is required' });
    if (!String(name || '').trim()) return res.status(400).json({ error: 'Name is required' });

    const now = new Date().toISOString();
    await db.collection('launch_waitlist').doc(em).set({
      name: String(name).trim().slice(0, 80),
      email: em,
      ...(phone ? { phone: String(phone).trim().slice(0, 30) } : {}),
      createdAt: now,
    }, { merge: true });

    res.json({ ok: true });
  });

  r.get('/api/launch/waitlist', rateLimit(30), async (req: Request, res: Response) => {
    if (!(await developerFromReq(req))) return res.status(401).json({ error: 'Developer access required' });

    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Not configured' });

    const snap = await db.collection('launch_waitlist').orderBy('createdAt', 'desc').limit(500).get();
    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ count: entries.length, entries });
  });

  r.patch('/api/launch/settings', rateLimit(20), patchLaunchSettings);
  r.post('/api/launch/settings', rateLimit(20), patchLaunchSettings);

  r.post('/api/launch/go-live', rateLimit(3), async (req: Request, res: Response) => {
    if (!(await developerFromReq(req))) return res.status(401).json({ error: 'Developer access required' });

    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Not configured' });

    const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://raafat-furniture.vercel.app').replace(/\/$/, '');
    const now = new Date().toISOString();

    await db.doc(LAUNCH_DOC).set({
      comingSoon: false,
      launchedAt: now,
      updatedAt: now,
    }, { merge: true });

    const snap = await db.collection('launch_waitlist').get();
    let sent = 0;
    let failed = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.notifiedAt) continue;
      const ok = await sendLaunchAnnouncement(String(data.email), {
        name: String(data.name || ''),
        siteUrl,
      });
      if (ok) {
        sent++;
        await doc.ref.update({ notifiedAt: now });
      } else {
        failed++;
      }
    }

    res.json({ ok: true, sent, failed, total: snap.size });
  });

  return r;
}
