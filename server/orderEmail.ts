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
  duties?: number;
  tax: number;
  taxRate?: number;
  taxIncluded?: boolean;
  total: number;
  fulfillment: 'pickup' | 'shipping' | 'custom';
  paymentMethod: string;
  contact: { phone?: string; line1?: string; city?: string; governorate?: string; country?: string };
  storeName?: string;
  siteUrl?: string;
  orderUrl?: string;
  /** Shown for InstaPay / bank so the customer knows what to put in the transfer note. */
  transferNoteHint?: string;
  instapayAddress?: string;
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
            ${d.duties ? totalRow('Customs & duties (DDP)', money(d.duties, d.currency)) : ''}
            ${d.tax ? totalRow(taxLabel(d), money(d.tax, d.currency)) : ''}
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
          d.transferNoteHint
            ? `<tr><td style="padding:20px 32px 0;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f3;border:1px solid ${BORDER};border-radius:12px;">
                   <tr><td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:14px;color:${INK};">
                     <strong style="color:${NAVY};">How to pay</strong>
                     ${d.instapayAddress ? `<br><span style="color:${MUTED};">InstaPay: <strong>${escapeHtml(d.instapayAddress)}</strong></span>` : ''}
                     <br><span style="color:${MUTED};">In the transfer note / title, write exactly:</span>
                     <div style="margin-top:8px;padding:10px 12px;background:#fff;border:1px dashed ${GOLD};border-radius:8px;font-family:Consolas,monospace;font-size:15px;font-weight:bold;color:${NAVY};">${escapeHtml(d.transferNoteHint)}</div>
                     <div style="margin-top:8px;color:${MUTED};font-size:13px;">Amount: <strong>${money(d.total, d.currency)}</strong></div>
                   </td></tr>
                 </table>
               </td></tr>`
            : ''
        }

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
    (d.duties ? `Customs & duties (DDP): ${money(d.duties, d.currency)}\n` : '') +
    (d.tax ? `${taxLabel(d)}: ${money(d.tax, d.currency)}\n` : '') +
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

function taxLabel(d: OrderEmailData): string {
  const pct = d.taxRate ? ` ${Math.round(d.taxRate * 100)}%` : '';
  return d.taxIncluded ? `VAT${pct} (included)` : `Tax${pct}`;
}

/** Map a Firestore order document to the email payload. */
export function orderToEmail(order: any, extras?: { instapayAddress?: string }): OrderEmailData {
  const isTransfer = order.paymentMethod === 'instapay' || order.paymentMethod === 'bank_transfer';
  const name = order.contact?.fullName || '';
  return {
    orderNumber: order.orderNumber,
    customerName: name,
    currency: order.currency || 'USD',
    items: (order.items || []).map((i: any) => ({
      name: typeof i.name === 'string' ? i.name : i.name?.en || 'Item',
      quantity: i.quantity,
      price: i.price,
      color: i.color,
      material: i.material,
      customDimensions: i.customDimensions,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    duties: order.duties || 0,
    tax: order.tax,
    taxRate: order.taxRate,
    taxIncluded: order.taxIncluded,
    total: order.total,
    fulfillment: order.fulfillment,
    paymentMethod: order.paymentMethod,
    contact: order.contact || {},
    storeName: 'Raafat Furniture',
    siteUrl: process.env.SITE_URL || '',
    orderUrl: process.env.SITE_URL ? `${process.env.SITE_URL}/order/confirmation?order=${order.orderNumber}` : '',
    ...(isTransfer
      ? {
          transferNoteHint: `${order.orderNumber} ${name}`.trim(),
          instapayAddress: extras?.instapayAddress || '',
        }
      : {}),
  };
}

/** Admin message to customer — replyable thread email. */
export function buildOrderMessageEmail(opts: {
  orderNumber: string;
  customerName: string;
  body: string;
  siteUrl?: string;
}): { subject: string; html: string; text: string } {
  const store = 'Raafat Furniture';
  const subject = `${store} — Message about order ${opts.orderNumber}`;
  const replyHint = 'Reply to this email to continue the conversation. Your reply will be attached to your order.';
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid ${BORDER};">
      <tr><td style="background:${NAVY};padding:22px 32px;border-radius:16px 16px 0 0;">
        <span style="font-family:Georgia,serif;font-size:20px;color:${GOLD};">${store}</span>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <p style="font-family:Arial,sans-serif;font-size:15px;color:${INK};margin:0 0 12px;">Hi ${escapeHtml(opts.customerName || 'there')},</p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin:0 0 16px;">Order <strong style="color:${NAVY};">${escapeHtml(opts.orderNumber)}</strong></p>
        <div style="font-family:Arial,sans-serif;font-size:15px;color:${INK};line-height:1.6;white-space:pre-wrap;padding:16px;background:#faf8f3;border-radius:12px;border:1px solid ${BORDER};">${escapeHtml(opts.body)}</div>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin:18px 0 0;">${replyHint}</p>
        ${opts.siteUrl ? `<p style="font-family:Arial,sans-serif;font-size:13px;margin:12px 0 0;"><a href="${escapeHtml(opts.siteUrl)}/order/confirmation?order=${escapeHtml(opts.orderNumber)}" style="color:${NAVY};">View your order</a></p>` : ''}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const text = `${subject}\n\nHi ${opts.customerName},\nOrder ${opts.orderNumber}\n\n${opts.body}\n\n${replyHint}`;
  return { subject, html, text };
}

/** Short status update email: ready for pickup / shipped with tracking. */
export function buildStatusEmail(order: any, type: 'ready' | 'shipped'): { subject: string; html: string; text: string } {
  const store = 'Raafat Furniture';
  const name = escapeHtml(order.contact?.fullName || '');
  const isReady = type === 'ready';
  const subject = isReady
    ? `${store} — Order ${order.orderNumber} is ready for pickup`
    : `${store} — Order ${order.orderNumber} has shipped`;
  const trackingLine = !isReady && order.tracking?.number
    ? `<p style="font-family:Arial,sans-serif;font-size:15px;color:${INK};margin:14px 0 0;">Tracking number${order.tracking.carrier ? ` (${escapeHtml(order.tracking.carrier)})` : ''}: <strong>${escapeHtml(order.tracking.number)}</strong></p>`
    : '';
  const body = isReady
    ? 'Your order is ready and waiting for you at our showroom. Bring your order number when you visit.'
    : 'Your order is on its way.';
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid ${BORDER};">
      <tr><td style="background:${NAVY};padding:22px 32px;border-radius:16px 16px 0 0;">
        <span style="font-family:Georgia,serif;font-size:20px;color:${GOLD};">${store}</span>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <h1 style="font-family:Georgia,serif;font-size:22px;color:${NAVY};margin:0 0 10px;">${isReady ? 'Ready for pickup' : 'Your order has shipped'}</h1>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:${INK};margin:0;">Hi ${name}, ${body}</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:${MUTED};margin:14px 0 0;">Order number: <strong style="color:${NAVY};">${escapeHtml(order.orderNumber)}</strong></p>
        ${trackingLine}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const text = `${subject}\n\nHi ${order.contact?.fullName || ''}, ${isReady ? 'your order is ready for pickup at our showroom.' : 'your order is on its way.'}\nOrder number: ${order.orderNumber}` +
    (!isReady && order.tracking?.number ? `\nTracking number${order.tracking.carrier ? ` (${order.tracking.carrier})` : ''}: ${order.tracking.number}` : '');
  return { subject, html, text };
}
