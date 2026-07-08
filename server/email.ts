/**
 * Transactional email via Resend. Set RESEND_API_KEY + EMAIL_FROM to enable.
 * Absent → logs the email instead of sending (safe in dev; no hard failure).
 *
 * Optional EMAIL_REPLY_TO (e.g. orders@yourdomain.com) enables plus-addressing
 * for admin→customer threads: replies land on orders+{orderId}@domain and are
 * ingested by POST /api/email/inbound (Resend inbound webhook).
 */
import { buildOrderEmail, buildStatusEmail, buildOrderMessageEmail, type OrderEmailData } from './orderEmail';
import { buildLaunchEmail, type LaunchEmailData } from './launchEmail';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Raafat Furniture <orders@example.com>';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || '';

export function emailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

async function send(to: string, subject: string, html: string, text: string, replyTo?: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY missing — would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text,
        ...(replyTo || EMAIL_REPLY_TO ? { reply_to: replyTo || EMAIL_REPLY_TO } : {}),
      }),
    });
    if (!res.ok) {
      console.error('[email] Resend error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] send failed:', (e as Error).message);
    return false;
  }
}

export async function sendOrderConfirmation(to: string, data: OrderEmailData): Promise<boolean> {
  const { subject, html, text } = buildOrderEmail(data);
  return send(to, subject, html, text);
}

/** Ready-for-pickup / shipped-with-tracking notification. */
export async function sendOrderStatus(to: string, order: any, type: 'ready' | 'shipped'): Promise<boolean> {
  const { subject, html, text } = buildStatusEmail(order, type);
  return send(to, subject, html, text);
}

/** Admin → customer message (customer can reply; inbound webhook attaches to order). */
export async function sendOrderMessage(
  to: string,
  opts: { orderNumber: string; customerName: string; body: string; orderId: string },
): Promise<boolean> {
  const { subject, html, text } = buildOrderMessageEmail({
    orderNumber: opts.orderNumber,
    customerName: opts.customerName,
    body: opts.body,
    siteUrl: process.env.SITE_URL || '',
  });
  let replyTo = EMAIL_REPLY_TO;
  if (EMAIL_REPLY_TO.includes('@')) {
    const [local, domain] = EMAIL_REPLY_TO.split('@');
    replyTo = `${local}+${opts.orderId}@${domain}`;
  }
  return send(to, subject, html, text, replyTo || undefined);
}

/** Launch announcement to waitlist signups. */
export async function sendLaunchAnnouncement(to: string, data: LaunchEmailData): Promise<boolean> {
  const { subject, html, text } = buildLaunchEmail(data);
  return send(to, subject, html, text);
}

/** Plain-text email (contact form). replyTo lets the store reply to the sender. */
export async function sendPlain(to: string, subject: string, text: string, replyTo?: string): Promise<boolean> {
  if (!to) { console.warn('[email] no recipient for:', subject); return false; }
  if (!RESEND_API_KEY) { console.warn(`[email] RESEND_API_KEY missing — would send "${subject}" to ${to}`); return false; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
