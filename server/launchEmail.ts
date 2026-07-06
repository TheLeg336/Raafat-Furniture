/**
 * Launch announcement email — compact landing-style HTML for waitlist signups.
 */

const NAVY = '#14213d';
const GOLD = '#e8c547';
const INK = '#1a202c';
const MUTED = '#6b7280';
const BORDER = '#e8e6e1';
const HERO_IMG = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface LaunchEmailData {
  name: string;
  siteUrl: string;
  storeName?: string;
}

export function buildLaunchEmail(d: LaunchEmailData): { subject: string; html: string; text: string } {
  const store = d.storeName || 'Raafat Furniture';
  const siteUrl = d.siteUrl.replace(/\/$/, '');
  const greeting = d.name.trim() ? `Hi ${d.name.trim()},` : 'Hello,';
  const subject = `${store} is now open`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(20,33,61,0.08);">
        <tr><td style="background:${NAVY};padding:22px 28px;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.04em;color:#ffffff;">${escapeHtml(store)}</div>
        </td></tr>
        <tr><td style="padding:0;">
          <img src="${HERO_IMG}" alt="" width="560" style="display:block;width:100%;max-height:220px;object-fit:cover;" />
        </td></tr>
        <tr><td style="padding:32px 28px 8px;font-family:Arial,sans-serif;">
          <p style="margin:0 0 12px;font-size:15px;color:${MUTED};">${escapeHtml(greeting)}</p>
          <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${INK};font-weight:bold;">We're open.</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${MUTED};">
            You asked us to let you know when ${escapeHtml(store)} went live. Handcrafted luxury furniture is ready to explore: browse collections, preview pieces in 3D, and order for pickup or worldwide delivery.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;"><tr><td style="border-radius:999px;background:${GOLD};">
            <a href="${siteUrl}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${NAVY};text-decoration:none;">Explore</a>
          </td></tr></table>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${MUTED};">
            <strong style="color:${INK};">Button not working?</strong> Copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 20px;font-size:13px;line-height:1.5;word-break:break-all;">
            <a href="${siteUrl}" style="color:${NAVY};text-decoration:underline;">${siteUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid ${BORDER};font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;text-align:center;">
          ${escapeHtml(store)} · Cairo, Minya &amp; worldwide delivery
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${subject}\n\n${greeting}\n\n${store} is now live. Explore the collection: ${siteUrl}\n\nIf the link above does not open, copy and paste it into your browser's address bar.`;

  return { subject, html, text };
}
