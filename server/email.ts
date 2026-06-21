/**
 * Transactional email via Resend. Set RESEND_API_KEY + EMAIL_FROM to enable.
 * Absent → logs the email instead of sending (safe in dev; no hard failure).
 */
import { buildOrderEmail, type OrderEmailData } from './orderEmail';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Raafat Furniture <orders@example.com>';

export function emailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

async function send(to: string, subject: string, html: string, text: string): Promise<boolean> {
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
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
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
