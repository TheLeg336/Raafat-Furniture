/**
 * Elegant, email-client-safe order confirmation.
 * Inline styles + table layout (Gmail/Outlook strip <style>/flex/grid).
 * Brand: champagne gold + midnight navy, Georgia serif headings (Cormorant won't load in email).
 * Mirrors the on-screen receipt the customer just saw.
 */

interface EmailItem {
  name: string;
  quantity: number;
  price: number;
  color?: string;
  material?: string;
  customDimensions?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  currency: string;
  items: EmailItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  fulfillment: 'pickup' | 'shipping' | 'custom';
  paymentMethod: string;
  contact: { phone?: string; line1?: string; city?: string; governorate?: string; country?: string };
  storeName?: string;
  siteUrl?: string;
  orderUrl?: string;
}

const NAVY = '#14213d';
const GOLD = '#e8c547';
const INK = '#1a202c';
const MUTED = '#6b7280';
const BORDER = '#e8e6e1';

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

const fulfillmentLabel: Record<string, string> = {
  pickup: 'Store pickup',
  shipping: 'Delivery',
  custom: 'Custom order',
};

export function buildOrderEmail(d: OrderEmailData): { subject: string; html: string; text: string } {
  const store = d.storeName || 'Raafat Furniture';
  const subject = `${store} — Order ${d.orderNumber} confirmed`;

  const itemRows = d.items
    .map((it) => {
      const meta = [it.color, it.material, it.customDimensions].filter(Boolean).join(' · ');
      return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${INK};font-weight:bold;">${escapeHtml(it.name)}</div>
          ${meta ? `<div style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin-top:3px;">${escapeHtml(meta)}</div>` : ''}
          <div style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin-top:3px;">Qty ${it.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};text-align:right;vertical-align:top;font-family:Arial,sans-serif;font-size:15px;color:${INK};white-space:nowrap;">
          ${money(it.price * it.quantity, d.currency)}
        </td>
      </tr>`;
    })
    .join('');

  const totalRow = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:${bold ? '17px' : '14px'};color:${bold ? INK : MUTED};${bold ? 'font-weight:bold;' : ''}">${label}</td>
      <td style="padding:5px 0;text-align:right;font-family:Arial,sans-serif;font-size:${bold ? '17px' : '14px'};color:${bold ? INK : MUTED};${bold ? 'font-weight:bold;' : ''}">${value}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f3ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(20,33,61,0.08);">

        <!-- Header -->
        <tr><td style="background:${NAVY};padding:28px 32px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:1px;color:#ffffff;">${escapeHtml(store)}</div>
          <div style="height:2px;width:48px;background:${GOLD};margin:12px auto 0;"></div>
        </td></tr>

        <!-- Confirmation -->
        <tr><td style="padding:36px 32px 8px;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:bold;">Order Confirmed</div>
          <h1 style="font-family:Georgia,serif;font-size:28px;color:${INK};margin:10px 0 6px;">Thank you, ${escapeHtml(d.customerName || 'valued customer')}.</h1>
          <p style="font-family:Arial,sans-serif;font-size:15px;color:${MUTED};margin:0;line-height:1.5;">
            We've received your order. Here are the details — keep your order number for reference.
          </p>
        </td></tr>

        <!-- Order number -->
        <tr><td style="padding:20px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f3;border:1px solid ${BORDER};border-radius:12px;">
            <tr><td style="padding:16px 20px;text-align:center;">
              <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Order number</div>
              <div style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:${NAVY};letter-spacing:2px;margin-top:4px;">${escapeHtml(d.orderNumber)}</div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Items -->
        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="padding:14px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${totalRow('Subtotal', money(d.subtotal, d.currency))}
            ${d.shipping ? totalRow('Shipping', money(d.shipping, d.currency)) : ''}
            ${d.tax ? totalRow('Tax', money(d.tax, d.currency)) : ''}
            <tr><td colspan="2" style="padding-top:8px;border-top:2px solid ${BORDER};"></td></tr>
            ${totalRow('Total', money(d.total, d.currency), true)}
          </table>
        </td></tr>

        <!-- Fulfillment -->
        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;">
            <tr><td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:14px;color:${INK};">
              <strong style="color:${NAVY};">${fulfillmentLabel[d.fulfillment] || d.fulfillment}</strong>
              ${d.contact.line1 ? `<br><span style="color:${MUTED};">${escapeHtml([d.contact.line1, d.contact.city, d.contact.governorate, d.contact.country].filter(Boolean).join(', '))}</span>` : ''}
              ${d.contact.phone ? `<br><span style="color:${MUTED};">${escapeHtml(d.contact.phone)}</span>` : ''}
            </td></tr>
          </table>
        </td></tr>

        ${
          d.orderUrl
            ? `<tr><td style="padding:28px 32px 8px;text-align:center;">
                 <a href="${d.orderUrl}" style="display:inline-block;background:${GOLD};color:${NAVY};font-family:Arial,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:9999px;">View your order</a>
               </td></tr>`
            : ''
        }

        <!-- Footer -->
        <tr><td style="padding:28px 32px 32px;text-align:center;border-top:1px solid ${BORDER};margin-top:20px;">
          <p style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin:0 0 6px;line-height:1.6;">
            Questions about your order? Just reply to this email and our team will help.
          </p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;margin:8px 0 0;">
            © ${new Date().getFullYear()} ${escapeHtml(store)}. ${d.siteUrl ? escapeHtml(d.siteUrl) : ''}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `${store} — Order ${d.orderNumber} confirmed\n\n` +
    `Thank you, ${d.customerName}.\n\n` +
    d.items.map((i) => `- ${i.name} x${i.quantity}  ${money(i.price * i.quantity, d.currency)}`).join('\n') +
    `\n\nSubtotal: ${money(d.subtotal, d.currency)}\n` +
    (d.shipping ? `Shipping: ${money(d.shipping, d.currency)}\n` : '') +
    (d.tax ? `Tax: ${money(d.tax, d.currency)}\n` : '') +
    `Total: ${money(d.total, d.currency)}\n\n` +
    `Fulfillment: ${fulfillmentLabel[d.fulfillment] || d.fulfillment}\n` +
    (d.orderUrl ? `\nView your order: ${d.orderUrl}\n` : '');

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
