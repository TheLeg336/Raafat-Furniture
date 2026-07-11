var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/orderEmail.ts
function money(amount, currency) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
function buildOrderEmail(d) {
  const store = d.storeName || "Raafat Furniture";
  const subject = `${store} \u2014 Order ${d.orderNumber} confirmed`;
  const itemRows = d.items.map((it) => {
    const meta = [it.color, it.material, it.customDimensions].filter(Boolean).join(" \xB7 ");
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${INK};font-weight:bold;">${escapeHtml(it.name)}</div>
          ${meta ? `<div style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin-top:3px;">${escapeHtml(meta)}</div>` : ""}
          <div style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin-top:3px;">Qty ${it.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};text-align:right;vertical-align:top;font-family:Arial,sans-serif;font-size:15px;color:${INK};white-space:nowrap;">
          ${money(it.price * it.quantity, d.currency)}
        </td>
      </tr>`;
  }).join("");
  const totalRow = (label, value, bold = false) => `
    <tr>
      <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:${bold ? "17px" : "14px"};color:${bold ? INK : MUTED};${bold ? "font-weight:bold;" : ""}">${label}</td>
      <td style="padding:5px 0;text-align:right;font-family:Arial,sans-serif;font-size:${bold ? "17px" : "14px"};color:${bold ? INK : MUTED};${bold ? "font-weight:bold;" : ""}">${value}</td>
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
          <h1 style="font-family:Georgia,serif;font-size:28px;color:${INK};margin:10px 0 6px;">Thank you, ${escapeHtml(d.customerName || "valued customer")}.</h1>
          <p style="font-family:Arial,sans-serif;font-size:15px;color:${MUTED};margin:0;line-height:1.5;">
            We've received your order. Here are the details \u2014 keep your order number for reference.
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
            ${totalRow("Subtotal", money(d.subtotal, d.currency))}
            ${d.shipping ? totalRow("Shipping", money(d.shipping, d.currency)) : ""}
            ${d.tax ? totalRow(taxLabel(d), money(d.tax, d.currency)) : ""}
            <tr><td colspan="2" style="padding-top:8px;border-top:2px solid ${BORDER};"></td></tr>
            ${totalRow("Total", money(d.total, d.currency), true)}
          </table>
        </td></tr>

        <!-- Fulfillment -->
        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;">
            <tr><td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:14px;color:${INK};">
              <strong style="color:${NAVY};">${fulfillmentLabel[d.fulfillment] || d.fulfillment}</strong>
              ${d.contact.line1 ? `<br><span style="color:${MUTED};">${escapeHtml([d.contact.line1, d.contact.city, d.contact.governorate, d.contact.country].filter(Boolean).join(", "))}</span>` : ""}
              ${d.contact.phone ? `<br><span style="color:${MUTED};">${escapeHtml(d.contact.phone)}</span>` : ""}
            </td></tr>
          </table>
        </td></tr>

        ${d.transferNoteHint ? `<tr><td style="padding:20px 32px 0;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f3;border:1px solid ${BORDER};border-radius:12px;">
                   <tr><td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:14px;color:${INK};">
                     <strong style="color:${NAVY};">How to pay</strong>
                     ${d.instapayAddress ? `<br><span style="color:${MUTED};">InstaPay: <strong>${escapeHtml(d.instapayAddress)}</strong></span>` : ""}
                     <br><span style="color:${MUTED};">In the transfer note / title, write exactly:</span>
                     <div style="margin-top:8px;padding:10px 12px;background:#fff;border:1px dashed ${GOLD};border-radius:8px;font-family:Consolas,monospace;font-size:15px;font-weight:bold;color:${NAVY};">${escapeHtml(d.transferNoteHint)}</div>
                     <div style="margin-top:8px;color:${MUTED};font-size:13px;">Amount: <strong>${money(d.total, d.currency)}</strong></div>
                   </td></tr>
                 </table>
               </td></tr>` : ""}

        ${d.orderUrl ? `<tr><td style="padding:28px 32px 8px;text-align:center;">
                 <a href="${d.orderUrl}" style="display:inline-block;background:${GOLD};color:${NAVY};font-family:Arial,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:9999px;">View your order</a>
               </td></tr>` : ""}

        <!-- Footer -->
        <tr><td style="padding:28px 32px 32px;text-align:center;border-top:1px solid ${BORDER};margin-top:20px;">
          <p style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin:0 0 6px;line-height:1.6;">
            Questions about your order? Just reply to this email and our team will help.
          </p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;margin:8px 0 0;">
            \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${escapeHtml(store)}. ${d.siteUrl ? escapeHtml(d.siteUrl) : ""}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
  const text = `${store} \u2014 Order ${d.orderNumber} confirmed

Thank you, ${d.customerName}.

` + d.items.map((i) => `- ${i.name} x${i.quantity}  ${money(i.price * i.quantity, d.currency)}`).join("\n") + `

Subtotal: ${money(d.subtotal, d.currency)}
` + (d.shipping ? `Shipping: ${money(d.shipping, d.currency)}
` : "") + (d.tax ? `${taxLabel(d)}: ${money(d.tax, d.currency)}
` : "") + `Total: ${money(d.total, d.currency)}

Fulfillment: ${fulfillmentLabel[d.fulfillment] || d.fulfillment}
` + (d.orderUrl ? `
View your order: ${d.orderUrl}
` : "");
  return { subject, html, text };
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function taxLabel(d) {
  const pct = d.taxRate ? ` ${Math.round(d.taxRate * 100)}%` : "";
  return d.taxIncluded ? `VAT${pct} (included)` : `Tax${pct}`;
}
function orderToEmail(order, extras) {
  const isTransfer = order.paymentMethod === "instapay" || order.paymentMethod === "bank_transfer";
  const name = order.contact?.fullName || "";
  return {
    orderNumber: order.orderNumber,
    customerName: name,
    currency: order.currency || "USD",
    items: (order.items || []).map((i) => ({
      name: typeof i.name === "string" ? i.name : i.name?.en || "Item",
      quantity: i.quantity,
      price: i.price,
      color: i.color,
      material: i.material,
      customDimensions: i.customDimensions
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    taxRate: order.taxRate,
    taxIncluded: order.taxIncluded,
    total: order.total,
    fulfillment: order.fulfillment,
    paymentMethod: order.paymentMethod,
    contact: order.contact || {},
    storeName: "Raafat Furniture",
    siteUrl: process.env.SITE_URL || "",
    orderUrl: process.env.SITE_URL ? `${process.env.SITE_URL}/order/confirmation?order=${order.orderNumber}` : "",
    ...isTransfer ? {
      transferNoteHint: `${order.orderNumber} ${name}`.trim(),
      instapayAddress: extras?.instapayAddress || ""
    } : {}
  };
}
function buildOrderMessageEmail(opts) {
  const store = "Raafat Furniture";
  const subject = `${store} \u2014 Message about order ${opts.orderNumber}`;
  const replyHint = "Reply to this email to continue the conversation. Your reply will be attached to your order.";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid ${BORDER};">
      <tr><td style="background:${NAVY};padding:22px 32px;border-radius:16px 16px 0 0;">
        <span style="font-family:Georgia,serif;font-size:20px;color:${GOLD};">${store}</span>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <p style="font-family:Arial,sans-serif;font-size:15px;color:${INK};margin:0 0 12px;">Hi ${escapeHtml(opts.customerName || "there")},</p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin:0 0 16px;">Order <strong style="color:${NAVY};">${escapeHtml(opts.orderNumber)}</strong></p>
        <div style="font-family:Arial,sans-serif;font-size:15px;color:${INK};line-height:1.6;white-space:pre-wrap;padding:16px;background:#faf8f3;border-radius:12px;border:1px solid ${BORDER};">${escapeHtml(opts.body)}</div>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:${MUTED};margin:18px 0 0;">${replyHint}</p>
        ${opts.siteUrl ? `<p style="font-family:Arial,sans-serif;font-size:13px;margin:12px 0 0;"><a href="${escapeHtml(opts.siteUrl)}/order/confirmation?order=${escapeHtml(opts.orderNumber)}" style="color:${NAVY};">View your order</a></p>` : ""}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const text = `${subject}

Hi ${opts.customerName},
Order ${opts.orderNumber}

${opts.body}

${replyHint}`;
  return { subject, html, text };
}
function buildStatusEmail(order, type) {
  const store = "Raafat Furniture";
  const name = escapeHtml(order.contact?.fullName || "");
  const isReady = type === "ready";
  const subject = isReady ? `${store} \u2014 Order ${order.orderNumber} is ready for pickup` : `${store} \u2014 Order ${order.orderNumber} has shipped`;
  const trackingLine = !isReady && order.tracking?.number ? `<p style="font-family:Arial,sans-serif;font-size:15px;color:${INK};margin:14px 0 0;">Tracking number${order.tracking.carrier ? ` (${escapeHtml(order.tracking.carrier)})` : ""}: <strong>${escapeHtml(order.tracking.number)}</strong></p>` : "";
  const body = isReady ? "Your order is ready and waiting for you at our showroom. Bring your order number when you visit." : "Your order is on its way.";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid ${BORDER};">
      <tr><td style="background:${NAVY};padding:22px 32px;border-radius:16px 16px 0 0;">
        <span style="font-family:Georgia,serif;font-size:20px;color:${GOLD};">${store}</span>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <h1 style="font-family:Georgia,serif;font-size:22px;color:${NAVY};margin:0 0 10px;">${isReady ? "Ready for pickup" : "Your order has shipped"}</h1>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:${INK};margin:0;">Hi ${name}, ${body}</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:${MUTED};margin:14px 0 0;">Order number: <strong style="color:${NAVY};">${escapeHtml(order.orderNumber)}</strong></p>
        ${trackingLine}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const text = `${subject}

Hi ${order.contact?.fullName || ""}, ${isReady ? "your order is ready for pickup at our showroom." : "your order is on its way."}
Order number: ${order.orderNumber}` + (!isReady && order.tracking?.number ? `
Tracking number${order.tracking.carrier ? ` (${order.tracking.carrier})` : ""}: ${order.tracking.number}` : "");
  return { subject, html, text };
}
var NAVY, GOLD, INK, MUTED, BORDER, fulfillmentLabel;
var init_orderEmail = __esm({
  "server/orderEmail.ts"() {
    "use strict";
    NAVY = "#14213d";
    GOLD = "#e8c547";
    INK = "#1a202c";
    MUTED = "#6b7280";
    BORDER = "#e8e6e1";
    fulfillmentLabel = {
      pickup: "Store pickup",
      shipping: "Delivery",
      custom: "Custom order"
    };
  }
});

// server/launchEmail.ts
function escapeHtml2(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function buildLaunchEmail(d) {
  const store = d.storeName || "Raafat Furniture";
  const siteUrl = d.siteUrl.replace(/\/$/, "");
  const greeting = d.name.trim() ? `Hi ${d.name.trim()},` : "Hello,";
  const subject = `${store} is now open`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(20,33,61,0.08);">
        <tr><td style="background:${NAVY2};padding:22px 28px;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.04em;color:#ffffff;">${escapeHtml2(store)}</div>
        </td></tr>
        <tr><td style="padding:0;">
          <img src="${HERO_IMG}" alt="" width="560" style="display:block;width:100%;max-height:220px;object-fit:cover;" />
        </td></tr>
        <tr><td style="padding:32px 28px 8px;font-family:Arial,sans-serif;">
          <p style="margin:0 0 12px;font-size:15px;color:${MUTED2};">${escapeHtml2(greeting)}</p>
          <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${INK2};font-weight:bold;">We're open.</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${MUTED2};">
            You asked us to let you know when ${escapeHtml2(store)} went live. Handcrafted luxury furniture is ready to explore: browse collections, preview pieces in 3D, and order for pickup or worldwide delivery.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;"><tr><td style="border-radius:999px;background:${GOLD2};">
            <a href="${siteUrl}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${NAVY2};text-decoration:none;">Explore</a>
          </td></tr></table>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${MUTED2};">
            <strong style="color:${INK2};">Button not working?</strong> Copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 20px;font-size:13px;line-height:1.5;word-break:break-all;">
            <a href="${siteUrl}" style="color:${NAVY2};text-decoration:underline;">${siteUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid ${BORDER2};font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;text-align:center;">
          ${escapeHtml2(store)} \xB7 Cairo, Minya &amp; worldwide delivery
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const text = `${subject}

${greeting}

${store} is now live. Explore the collection: ${siteUrl}

If the link above does not open, copy and paste it into your browser's address bar.`;
  return { subject, html, text };
}
var NAVY2, GOLD2, INK2, MUTED2, BORDER2, HERO_IMG;
var init_launchEmail = __esm({
  "server/launchEmail.ts"() {
    "use strict";
    NAVY2 = "#14213d";
    GOLD2 = "#e8c547";
    INK2 = "#1a202c";
    MUTED2 = "#6b7280";
    BORDER2 = "#e8e6e1";
    HERO_IMG = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80";
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  emailConfigured: () => emailConfigured,
  sendLaunchAnnouncement: () => sendLaunchAnnouncement,
  sendOrderConfirmation: () => sendOrderConfirmation,
  sendOrderMessage: () => sendOrderMessage,
  sendOrderStatus: () => sendOrderStatus,
  sendPlain: () => sendPlain
});
function emailConfigured() {
  return !!RESEND_API_KEY;
}
async function send(to, subject, html, text, replyTo) {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY missing \u2014 would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text,
        ...replyTo || EMAIL_REPLY_TO ? { reply_to: replyTo || EMAIL_REPLY_TO } : {}
      })
    });
    if (!res.ok) {
      console.error("[email] Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed:", e.message);
    return false;
  }
}
async function sendOrderConfirmation(to, data) {
  const { subject, html, text } = buildOrderEmail(data);
  return send(to, subject, html, text);
}
async function sendOrderStatus(to, order, type) {
  const { subject, html, text } = buildStatusEmail(order, type);
  return send(to, subject, html, text);
}
async function sendOrderMessage(to, opts) {
  const { subject, html, text } = buildOrderMessageEmail({
    orderNumber: opts.orderNumber,
    customerName: opts.customerName,
    body: opts.body,
    siteUrl: process.env.SITE_URL || ""
  });
  let replyTo = EMAIL_REPLY_TO;
  if (EMAIL_REPLY_TO.includes("@")) {
    const [local, domain] = EMAIL_REPLY_TO.split("@");
    replyTo = `${local}+${opts.orderId}@${domain}`;
  }
  return send(to, subject, html, text, replyTo || void 0);
}
async function sendLaunchAnnouncement(to, data) {
  const { subject, html, text } = buildLaunchEmail(data);
  return send(to, subject, html, text);
}
async function sendPlain(to, subject, text, replyTo) {
  if (!to) {
    console.warn("[email] no recipient for:", subject);
    return false;
  }
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY missing \u2014 would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, text, ...replyTo ? { reply_to: replyTo } : {} })
    });
    return res.ok;
  } catch {
    return false;
  }
}
var RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    init_orderEmail();
    init_launchEmail();
    RESEND_API_KEY = process.env.RESEND_API_KEY || "";
    EMAIL_FROM = process.env.EMAIL_FROM || "Raafat Furniture <orders@example.com>";
    EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "";
  }
});

// server/app.ts
init_email();
import express from "express";
import { v2 as cloudinary } from "cloudinary";

// server/firebaseAdmin.ts
var app = null;
var initTried = false;
async function getAdmin() {
  if (app) return app;
  if (initTried) return null;
  initTried = true;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasADC = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw && !hasADC) {
    console.warn("[firebase-admin] not configured \u2014 server-side order/webhook trust disabled.");
    return null;
  }
  try {
    const { initializeApp, cert, applicationDefault, getApps } = await import("firebase-admin/app");
    if (getApps().length) {
      app = getApps()[0];
      return app;
    }
    if (raw) {
      const creds = JSON.parse(raw);
      app = initializeApp({ credential: cert(creds) });
    } else {
      app = initializeApp({ credential: applicationDefault() });
    }
    return app;
  } catch (e) {
    console.error("[firebase-admin] init failed:", e.message);
    return null;
  }
}
async function getDb() {
  const a = await getAdmin();
  if (!a) return null;
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(a);
}
async function verifyIdToken(authHeader) {
  const a = await getAdmin();
  if (!a || !authHeader?.startsWith("Bearer ")) return null;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    return await getAuth(a).verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

// server/app.ts
init_orderEmail();

// server/ordersApi.ts
import { Router } from "express";

// lib/staff.ts
var BOOTSTRAP_DEVELOPER_EMAIL = "youssefhanna336@gmail.com";
function isBootstrapDeveloperEmail(email, verified) {
  if (!email || verified === false) return false;
  return email.toLowerCase() === BOOTSTRAP_DEVELOPER_EMAIL;
}
function normalizeStaffRole(role) {
  if (typeof role !== "string" || !role.trim()) return null;
  const r = role.trim().toLowerCase();
  if (r === "developer" || r === "admin" || r === "worker") return r;
  if (r === "dev") return "developer";
  return null;
}

// server/ordersApi.ts
init_email();
init_orderEmail();
var STORE_COUNTRY = "EG";
var EG_VAT_RATE = 0.14;
var ACTIVE_STATUSES = ["paid", "confirmed", "in_production"];
var round2 = (n) => Math.round(n * 100) / 100;
function ipCountry(req) {
  const h = req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"];
  return h && /^[A-Z]{2}$/i.test(h) ? h.toUpperCase() : null;
}
function toISO2(country) {
  if (!country) return "XX";
  const c = country.trim();
  if (/^[A-Za-z]{2}$/.test(c)) return c.toUpperCase();
  const map = {
    egypt: "EG",
    "\u0645\u0635\u0631": "EG",
    usa: "US",
    "united states": "US",
    "united states of america": "US",
    america: "US",
    uk: "GB",
    "united kingdom": "GB",
    uae: "AE",
    "united arab emirates": "AE",
    "saudi arabia": "SA",
    ksa: "SA",
    canada: "CA",
    france: "FR",
    germany: "DE",
    italy: "IT",
    spain: "ES",
    australia: "AU",
    kuwait: "KW",
    qatar: "QA",
    bahrain: "BH",
    oman: "OM",
    jordan: "JO",
    lebanon: "LB"
  };
  return map[c.toLowerCase()] || c.slice(0, 2).toUpperCase();
}
function computeTax(subtotal, destination) {
  if (destination === STORE_COUNTRY) {
    const tax = round2(subtotal - subtotal / (1 + EG_VAT_RATE));
    return { tax, taxRate: EG_VAT_RATE, taxIncluded: true };
  }
  return { tax: 0, taxRate: 0, taxIncluded: false };
}
async function reserveOrderNumber(db, cc, fullName) {
  const { randomInt } = await import("node:crypto");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const initialRaw = (fullName.trim()[0] || "X").toUpperCase();
  const initial = /[A-Z]/.test(initialRaw) ? initialRaw : "X";
  for (let attempt = 0; attempt < 8; attempt++) {
    const digits = String(randomInt(0, 1e6)).padStart(6, "0");
    const num = `${cc}${digits}${letters[randomInt(26)]}${initial}`;
    try {
      await db.collection("orderNumbers").doc(num).create({ reservedAt: (/* @__PURE__ */ new Date()).toISOString() });
      return num;
    } catch {
    }
  }
  throw new Error("Could not allocate an order number");
}
async function staffFromReq(req) {
  const db = await getDb();
  const decoded = await verifyIdToken(req.headers.authorization);
  if (!decoded?.email) return null;
  const email = decoded.email.toLowerCase();
  if (isBootstrapDeveloperEmail(email, decoded.email_verified === true)) {
    return { email, role: "developer" };
  }
  if (!db) return null;
  const snap = await db.collection("admins").doc(email).get();
  if (!snap.exists) return null;
  const role = normalizeStaffRole(snap.data()?.role);
  if (!role) return null;
  return { email, role };
}
var isAdminRole = (r) => r === "admin" || r === "developer";
function trackView(o, id) {
  return {
    id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    status: o.status,
    statusHistory: o.statusHistory,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    fulfillment: o.fulfillment,
    items: o.items,
    subtotal: o.subtotal,
    shipping: o.shipping,
    tax: o.tax,
    taxRate: o.taxRate,
    taxIncluded: o.taxIncluded,
    total: o.total,
    currency: o.currency,
    destinationCountry: o.destinationCountry,
    tracking: o.tracking || null,
    contact: { fullName: o.contact?.fullName, email: o.contact?.email }
  };
}
function workerView(o, id) {
  return {
    id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status: o.status,
    fulfillment: o.fulfillment,
    prepared: o.prepared || [],
    customerNote: o.customerNote || "",
    items: (o.items || []).map((it) => ({
      name: it.name,
      quantity: it.quantity,
      color: it.color || "",
      material: it.material || "",
      customDimensions: it.customDimensions || "",
      imageUrl: it.imageUrl || ""
    }))
  };
}
async function findOrderForGuest(db, orderNumber, email) {
  if (!orderNumber || !email) return null;
  const q = await db.collection("orders").where("orderNumber", "==", String(orderNumber).toUpperCase().trim()).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  const data = doc.data();
  if ((data.contact?.email || "").toLowerCase() !== String(email).toLowerCase().trim()) return null;
  return { doc, data };
}
async function appendStatus(ref, current, status, by, note, extra = {}) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await ref.update({
    status,
    statusHistory: [...current.statusHistory || [], { status, at: now, by, ...note ? { note } : {} }],
    updatedAt: now,
    ...extra
  });
}
function ordersRouter(rateLimit2) {
  const r = Router();
  r.get("/api/config", async (req, res) => {
    const country = ipCountry(req);
    const stripeEnv = !!process.env.STRIPE_SECRET_KEY;
    const paymobEnv = !!(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID && process.env.PAYMOB_IFRAME_ID);
    let methods = { stripe: true, paymob: true, instapay: true, bank_transfer: true };
    try {
      const db = await getDb();
      if (db) {
        const snap = await db.collection("settings").doc("payments").get();
        const m = snap.exists ? snap.data()?.methods : null;
        if (m && typeof m === "object") {
          methods = {
            stripe: m.stripe !== false,
            paymob: m.paymob !== false,
            instapay: m.instapay !== false,
            bank_transfer: m.bank_transfer !== false
          };
        }
      }
    } catch {
    }
    const stripe = stripeEnv && methods.stripe;
    const paymob = paymobEnv && methods.paymob;
    res.json({
      stripe,
      paymob,
      cardProvider: paymob && country === "EG" ? "paymob" : stripe ? "stripe" : paymob ? "paymob" : null,
      ipCountry: country,
      // Cash on pickup is Egypt-only. Outside prod there is no geo header — allow for dev.
      cashPickupAllowed: country === "EG" || !country && process.env.NODE_ENV !== "production",
      ordersConfigured: !!await getDb(),
      methods,
      env: { stripe: stripeEnv, paymob: paymobEnv }
    });
  });
  r.post("/api/orders/create", rateLimit2(10), async (req, res) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Ordering is not configured on the server (FIREBASE_SERVICE_ACCOUNT missing)." });
    try {
      const { items, contact, fulfillment, paymentMethod, customerNote, pickupLocationId } = req.body || {};
      const decoded = await verifyIdToken(req.headers.authorization);
      const userId = decoded?.uid ?? null;
      if (!Array.isArray(items) || items.length === 0 || items.length > 50) return res.status(400).json({ error: "Invalid items" });
      if (!contact?.fullName || String(contact.fullName).length > 120) return res.status(400).json({ error: "Name is required" });
      if (!/^\S+@\S+\.\S+$/.test(contact?.email || "")) return res.status(400).json({ error: "Valid email is required" });
      const phoneRaw = String(contact?.phone || "").trim();
      const phoneDigits = phoneRaw.replace(/\D/g, "");
      if (phoneRaw && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
        return res.status(400).json({ error: "Phone number looks invalid" });
      }
      if (!["pickup", "shipping", "custom"].includes(fulfillment)) return res.status(400).json({ error: "Invalid fulfillment" });
      if (fulfillment === "pickup" && !pickupLocationId) return res.status(400).json({ error: "Pickup location is required" });
      if (fulfillment !== "pickup" && (!contact?.line1 || !contact?.city || !contact?.country)) {
        return res.status(400).json({ error: "Address (street, city, country) is required" });
      }
      const geo = ipCountry(req);
      let methodFlags = { stripe: true, paymob: true, instapay: true, bank_transfer: true };
      try {
        const paySnap = await db.collection("settings").doc("payments").get();
        const m = paySnap.exists ? paySnap.data()?.methods : null;
        if (m && typeof m === "object") {
          methodFlags = {
            stripe: m.stripe !== false,
            paymob: m.paymob !== false,
            instapay: m.instapay !== false,
            bank_transfer: m.bank_transfer !== false
          };
        }
      } catch {
      }
      const allowed = ["stripe", "paymob", "instapay", "bank_transfer"].filter((k) => methodFlags[k]);
      if (!allowed.includes(paymentMethod)) return res.status(400).json({ error: "Payment method not available for this order" });
      if (paymentMethod === "stripe" && !process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: "Card payments are not configured" });
      if (paymentMethod === "paymob" && !process.env.PAYMOB_API_KEY) return res.status(400).json({ error: "Card payments are not configured" });
      if (paymentMethod === "instapay") {
        const destPreview = fulfillment === "shipping" ? toISO2(contact.country) : STORE_COUNTRY;
        if (destPreview !== "EG" && geo && geo !== "EG") {
          return res.status(400).json({ error: "InstaPay is only available for Egypt orders" });
        }
      }
      const destination = fulfillment === "shipping" ? toISO2(contact.country) : STORE_COUNTRY;
      const currency = destination === "EG" ? "EGP" : "USD";
      const priced = [];
      for (const it of items) {
        if ("price" in it || "total" in it || "subtotal" in it) {
          return res.status(400).json({ error: "Invalid items payload" });
        }
        const qty = Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)));
        const snap = await db.collection("products").doc(String(it.productId)).get();
        if (!snap.exists) return res.status(400).json({ error: `Product no longer available (${it.productId})` });
        const p = snap.data();
        if (p.archivedAt) return res.status(400).json({ error: `Product no longer available (${it.productId})` });
        const raw = currency === "EGP" ? p.priceEGP ?? p.price : p.priceUSD ?? p.price;
        const price = Number(raw);
        if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: `Item is not available in ${currency} (${it.productId})` });
        priced.push({
          productId: String(it.productId),
          name: p.name || p.nameKey || "Item",
          imageUrl: p.imageUrl || "",
          price,
          quantity: qty,
          ...it.color ? { color: String(it.color).slice(0, 60) } : {},
          ...it.material ? { material: String(it.material).slice(0, 60) } : {},
          ...it.customDimensions && p.customDimensionsEnabled ? { customDimensions: String(it.customDimensions).slice(0, 120) } : {}
        });
      }
      const subtotal = round2(priced.reduce((s, it) => s + it.price * it.quantity, 0));
      const shipping = 0;
      const { tax, taxRate, taxIncluded } = computeTax(subtotal, destination);
      const total = round2(subtotal + shipping + (taxIncluded ? 0 : tax));
      const numberCountry = fulfillment === "shipping" ? destination : toISO2(contact.country) === "XX" ? STORE_COUNTRY : toISO2(contact.country);
      const orderNumber = await reserveOrderNumber(db, numberCountry, String(contact.fullName));
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const initialStatus = paymentMethod === "stripe" || paymentMethod === "paymob" ? "pending_payment" : paymentMethod === "instapay" || paymentMethod === "bank_transfer" ? "pending_payment" : "confirmed";
      const order = {
        orderNumber,
        userId,
        items: priced,
        currency,
        subtotal,
        shipping,
        tax,
        taxRate,
        taxIncluded,
        total,
        destinationCountry: destination,
        fulfillment,
        paymentMethod,
        paymentStatus: "unpaid",
        status: initialStatus,
        statusHistory: [{ status: initialStatus, at: now, by: "system" }],
        contact: {
          fullName: String(contact.fullName).slice(0, 120),
          email: String(contact.email).slice(0, 254),
          phone: phoneRaw ? phoneRaw.slice(0, 40) : "",
          line1: String(contact.line1 || "").slice(0, 200),
          city: String(contact.city || "").slice(0, 80),
          governorate: String(contact.governorate || "").slice(0, 80),
          country: toISO2(contact.country),
          postalCode: String(contact.postalCode || "").slice(0, 20)
        },
        customerNote: String(customerNote || "").slice(0, 1e3),
        ...fulfillment === "pickup" && pickupLocationId ? { pickupLocationId: String(pickupLocationId).slice(0, 40) } : {},
        adminNotes: "",
        prepared: [],
        messages: [],
        unreadCustomerReplies: 0,
        createdAt: now,
        updatedAt: now,
        ipCountry: geo || ""
      };
      const ref = await db.collection("orders").add(order);
      await db.collection("orderNumbers").doc(orderNumber).update({ orderId: ref.id });
      if (["instapay", "bank_transfer"].includes(paymentMethod)) {
        let instapayAddress = "";
        try {
          const paySnap = await db.collection("settings").doc("payments").get();
          if (paySnap.exists) instapayAddress = String(paySnap.data()?.instapayAddress || "");
        } catch {
        }
        sendOrderConfirmation(order.contact.email, orderToEmail(order, { instapayAddress })).catch(() => {
        });
      }
      res.json({ order: { id: ref.id, ...order, messages: [], unreadCustomerReplies: 0 } });
    } catch (e) {
      console.error("[orders/create]", e.message);
      res.status(500).json({ error: "Could not place the order. Please try again." });
    }
  });
  r.post("/api/orders/track", rateLimit2(15), async (req, res) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Not configured" });
    const found = await findOrderForGuest(db, req.body?.orderNumber, req.body?.email);
    if (!found) return res.status(404).json({ error: "No order matches that number and email." });
    res.json({ order: trackView(found.data, found.doc.id) });
  });
  r.post("/api/orders/payment-reference", rateLimit2(10), async (req, res) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Not configured" });
    const reference = String(req.body?.reference || "").trim().slice(0, 120);
    if (!reference) return res.status(400).json({ error: "Reference is required" });
    const found = await findOrderForGuest(db, req.body?.orderNumber, req.body?.email);
    if (!found) return res.status(404).json({ error: "No order matches that number and email." });
    const { doc, data } = found;
    if (!["instapay", "bank_transfer"].includes(data.paymentMethod)) return res.status(400).json({ error: "This order is not paid by transfer." });
    if (data.paymentStatus === "paid") return res.status(400).json({ error: "This order is already paid." });
    await appendStatus(doc.ref, data, "payment_verification", "customer", `Payment reference: ${reference}`, { "payment.reference": reference });
    res.json({ ok: true });
  });
  r.post("/api/admin/orders/:id/notify", rateLimit2(30), async (req, res) => {
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: "Unauthorized" });
    const db = await getDb();
    const ref = db.collection("orders").doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });
    const order = snap.data();
    const type = req.body?.type;
    if (type === "ready") {
      await appendStatus(ref, order, "ready", staff.email, "Customer notified: ready for pickup");
      await sendOrderStatus(order.contact.email, order, "ready");
    } else if (type === "shipped") {
      const trackingNumber = String(req.body?.trackingNumber || "").trim().slice(0, 80);
      if (!trackingNumber) return res.status(400).json({ error: "Tracking number is required" });
      const carrier = String(req.body?.carrier || "").trim().slice(0, 60);
      await appendStatus(ref, order, "shipped", staff.email, `Tracking: ${trackingNumber}`, { tracking: { number: trackingNumber, ...carrier ? { carrier } : {} } });
      await sendOrderStatus(order.contact.email, { ...order, tracking: { number: trackingNumber, carrier } }, "shipped");
    } else {
      return res.status(400).json({ error: "type must be ready or shipped" });
    }
    res.json({ ok: true });
  });
  r.post("/api/admin/orders/:id/message", rateLimit2(30), async (req, res) => {
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: "Unauthorized" });
    const body = String(req.body?.body || "").trim().slice(0, 4e3);
    if (!body) return res.status(400).json({ error: "Message body is required" });
    const db = await getDb();
    const ref = db.collection("orders").doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });
    const order = snap.data();
    const email = order.contact?.email;
    if (!email) return res.status(400).json({ error: "Order has no customer email" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const msg = {
      id: `m_${Date.now().toString(36)}`,
      from: "admin",
      body,
      at: now,
      by: staff.email,
      emailSent: false
    };
    const sent = await sendOrderMessage(email, {
      orderNumber: order.orderNumber,
      customerName: order.contact?.fullName || "",
      body,
      orderId: snap.id
    });
    msg.emailSent = sent;
    await ref.update({
      messages: [...order.messages || [], msg],
      updatedAt: now
    });
    res.json({ ok: true, message: msg, emailed: sent });
  });
  r.post("/api/admin/orders/:id/messages/read", rateLimit2(60), async (req, res) => {
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: "Unauthorized" });
    const db = await getDb();
    await db.collection("orders").doc(String(req.params.id)).update({
      unreadCustomerReplies: 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ ok: true });
  });
  r.get("/api/worker/orders", rateLimit2(60), async (req, res) => {
    const staff = await staffFromReq(req);
    if (!staff) return res.status(401).json({ error: "Unauthorized" });
    if (staff.role !== "worker" && !isAdminRole(staff.role)) return res.status(403).json({ error: "Forbidden" });
    const db = await getDb();
    const q = await db.collection("orders").where("status", "in", ACTIVE_STATUSES).get();
    const orders = q.docs.map((d) => workerView(d.data(), d.id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json({ orders });
  });
  r.post("/api/worker/orders/:id/prepared", rateLimit2(120), async (req, res) => {
    const staff = await staffFromReq(req);
    if (!staff) return res.status(401).json({ error: "Unauthorized" });
    if (staff.role !== "worker" && !isAdminRole(staff.role)) return res.status(403).json({ error: "Forbidden" });
    const db = await getDb();
    const ref = db.collection("orders").doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });
    const order = snap.data();
    if (!ACTIVE_STATUSES.includes(order.status)) {
      return res.status(400).json({ error: "Order is not in an active workshop status" });
    }
    const itemCount = (order.items || []).length;
    const prepared = Array.isArray(req.body?.prepared) ? [...new Set(req.body.prepared.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < itemCount))] : [];
    await ref.update({ prepared, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    res.json({ ok: true, prepared });
  });
  r.post("/api/worker/orders/:id/complete", rateLimit2(30), async (req, res) => {
    const staff = await staffFromReq(req);
    if (!staff) return res.status(401).json({ error: "Unauthorized" });
    if (staff.role !== "worker" && !isAdminRole(staff.role)) return res.status(403).json({ error: "Forbidden" });
    const db = await getDb();
    const ref = db.collection("orders").doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });
    const order = snap.data();
    if (!ACTIVE_STATUSES.includes(order.status)) {
      return res.status(400).json({ error: "Order is not in an active workshop status" });
    }
    const prepared = order.prepared || [];
    if ((order.items || []).some((_, i) => !prepared.includes(i))) {
      return res.status(400).json({ error: "All items must be checked off first." });
    }
    await appendStatus(ref, order, "awaiting_approval", staff.email, "Workshop checklist complete");
    res.json({ ok: true });
  });
  r.post("/api/contact", rateLimit2(5), async (req, res) => {
    const { name, email, message } = req.body || {};
    if (!name || !/^\S+@\S+\.\S+$/.test(email || "") || !message) return res.status(400).json({ error: "Name, valid email and message are required" });
    const { sendPlain: sendPlain2 } = await Promise.resolve().then(() => (init_email(), email_exports));
    const ok = await sendPlain2(
      process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || "",
      `Website contact from ${String(name).slice(0, 80)}`,
      `From: ${String(name).slice(0, 80)} <${String(email).slice(0, 254)}>

${String(message).slice(0, 4e3)}`,
      String(email).slice(0, 254)
    );
    res.json({ sent: ok });
  });
  return r;
}

// server/paymob.ts
import { Router as Router2 } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
init_email();
init_orderEmail();
var BASE = "https://accept.paymob.com/api";
var paymobConfigured = () => !!(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID && process.env.PAYMOB_IFRAME_ID);
async function pm(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Paymob ${path} \u2192 ${res.status}`);
  return res.json();
}
function paymobRouter(rateLimit2) {
  const r = Router2();
  r.post("/api/paymob/create-payment", rateLimit2(10), async (req, res) => {
    if (!paymobConfigured()) return res.status(503).json({ error: "Paymob is not configured." });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Ordering is not configured on the server." });
    try {
      const orderId = String(req.body?.orderId || "");
      const emailNorm = String(req.body?.email || "").toLowerCase().trim();
      const snap = await db.collection("orders").doc(orderId).get();
      if (!snap.exists) return res.status(404).json({ error: "Order not found" });
      const order = snap.data();
      if (!emailNorm || emailNorm !== String(order.contact?.email || "").toLowerCase()) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.paymentStatus === "paid") return res.status(400).json({ error: "Order already paid" });
      if (order.paymentMethod !== "paymob") {
        return res.status(400).json({ error: "This order is not set up for Paymob card payment" });
      }
      const amountCents = Math.round(Number(order.total) * 100);
      const { token } = await pm("/auth/tokens", { api_key: process.env.PAYMOB_API_KEY });
      const reg = await pm("/ecommerce/orders", {
        auth_token: token,
        delivery_needed: "false",
        amount_cents: String(amountCents),
        currency: order.currency || "EGP",
        merchant_order_id: `${orderId}-${Date.now()}`,
        // Paymob requires uniqueness across retries
        items: []
      });
      const [first = "", ...rest] = String(order.contact?.fullName || "Customer").split(" ");
      const key = await pm("/acceptance/payment_keys", {
        auth_token: token,
        amount_cents: String(amountCents),
        expiration: 3600,
        order_id: reg.id,
        currency: order.currency || "EGP",
        integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
        billing_data: {
          first_name: first || "Customer",
          last_name: rest.join(" ") || "NA",
          email: order.contact?.email || "NA",
          phone_number: order.contact?.phone || "NA",
          street: order.contact?.line1 || "NA",
          city: order.contact?.city || "NA",
          country: order.contact?.country || "EG",
          apartment: "NA",
          floor: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: order.contact?.postalCode || "NA",
          state: order.contact?.governorate || "NA"
        }
      });
      await snap.ref.update({ "paymobOrderId": reg.id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      res.json({ url: `${BASE.replace("/api", "")}/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${key.token}` });
    } catch (e) {
      console.error("[paymob] create-payment:", e.message);
      res.status(500).json({ error: "Could not start card payment." });
    }
  });
  r.post("/api/paymob/webhook", async (req, res) => {
    const secret = process.env.PAYMOB_HMAC_SECRET || "";
    const obj = req.body?.obj;
    if (!secret || !obj) return res.status(400).json({ error: "Bad request" });
    const fields = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id,
      obj.owner,
      obj.pending,
      obj.source_data?.pan,
      obj.source_data?.sub_type,
      obj.source_data?.type,
      obj.success
    ].map((v) => String(v)).join("");
    const digest = createHmac("sha512", secret).update(fields).digest("hex");
    const provided = String(req.query.hmac || req.body?.hmac || "");
    const ok = provided.length === digest.length && timingSafeEqual(Buffer.from(digest), Buffer.from(provided));
    if (!ok) {
      console.error("[paymob] webhook HMAC mismatch");
      return res.status(401).json({ error: "Invalid HMAC" });
    }
    if (obj.success === true && obj.pending === false) {
      const db = await getDb();
      const merchantId = String(obj.order?.merchant_order_id || "").split("-")[0];
      if (db && merchantId) {
        const ref = db.collection("orders").doc(merchantId);
        const snap = await ref.get();
        if (snap.exists && snap.data().paymentStatus !== "paid") {
          const order = snap.data();
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await ref.update({
            paymentStatus: "paid",
            status: "paid",
            statusHistory: [...order.statusHistory || [], { status: "paid", at: now, by: "system", note: "Paymob payment received" }],
            updatedAt: now
          });
          if (order.contact?.email) await sendOrderConfirmation(order.contact.email, orderToEmail(order));
        }
      }
    }
    res.json({ received: true });
  });
  return r;
}

// server/launchApi.ts
import { Router as Router3 } from "express";
init_email();
var LAUNCH_DOC = "settings/launch";
async function readLaunchSettings() {
  const db = await getDb();
  if (!db) return { comingSoon: false };
  const snap = await db.doc(LAUNCH_DOC).get();
  if (!snap.exists) return { comingSoon: false };
  const d = snap.data();
  return {
    comingSoon: !!d.comingSoon,
    message: d.message || "",
    scheduledAt: d.scheduledAt || null,
    launchedAt: d.launchedAt || null,
    updatedAt: d.updatedAt
  };
}
async function developerFromReq(req) {
  const decoded = await verifyIdToken(req.headers.authorization);
  if (!decoded?.email) return null;
  const staff = await staffFromReq(req);
  if (!staff) {
    if (isBootstrapDeveloperEmail(decoded.email, decoded.email_verified === true)) {
      return { email: decoded.email.toLowerCase(), role: "developer" };
    }
    return null;
  }
  if (staff.role !== "developer") return null;
  return { email: staff.email, role: "developer" };
}
async function patchLaunchSettings(req, res) {
  const dev = await developerFromReq(req);
  if (!dev) {
    const decoded = await verifyIdToken(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: "Sign in required" });
    const staff = await staffFromReq(req);
    if (!staff) return res.status(403).json({ error: "Your account is not in the admins team list" });
    return res.status(403).json({ error: "Developer role required for this action" });
  }
  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Not configured" });
  const { comingSoon, message, scheduledAt } = req.body || {};
  const patch = { updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  if (typeof comingSoon === "boolean") patch.comingSoon = comingSoon;
  if (message !== void 0) patch.message = String(message).slice(0, 500);
  if (scheduledAt !== void 0) patch.scheduledAt = scheduledAt ? String(scheduledAt) : null;
  await db.doc(LAUNCH_DOC).set(patch, { merge: true });
  const s = await readLaunchSettings();
  res.json(s);
}
function launchRouter(rateLimit2) {
  const r = Router3();
  r.get("/api/launch/status", async (_req, res) => {
    const s = await readLaunchSettings();
    res.json({
      comingSoon: s.comingSoon,
      message: s.message || null,
      scheduledAt: s.scheduledAt || null
    });
  });
  r.post("/api/launch/waitlist", rateLimit2(8), async (req, res) => {
    const settings = await readLaunchSettings();
    if (!settings.comingSoon) return res.status(400).json({ error: "The store is already open." });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Not configured" });
    const { name, email, phone } = req.body || {};
    const em = String(email || "").toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) return res.status(400).json({ error: "Valid email is required" });
    if (!String(name || "").trim()) return res.status(400).json({ error: "Name is required" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.collection("launch_waitlist").doc(em).set({
      name: String(name).trim().slice(0, 80),
      email: em,
      ...phone ? { phone: String(phone).trim().slice(0, 30) } : {},
      createdAt: now
    }, { merge: true });
    res.json({ ok: true });
  });
  r.get("/api/launch/waitlist", rateLimit2(30), async (req, res) => {
    if (!await developerFromReq(req)) return res.status(401).json({ error: "Developer access required" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Not configured" });
    const snap = await db.collection("launch_waitlist").orderBy("createdAt", "desc").limit(500).get();
    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ count: entries.length, entries });
  });
  r.patch("/api/launch/settings", rateLimit2(20), patchLaunchSettings);
  r.post("/api/launch/settings", rateLimit2(20), patchLaunchSettings);
  r.post("/api/launch/go-live", rateLimit2(3), async (req, res) => {
    if (!await developerFromReq(req)) return res.status(401).json({ error: "Developer access required" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Not configured" });
    const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://raafat-furniture.vercel.app").replace(/\/$/, "");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.doc(LAUNCH_DOC).set({
      comingSoon: false,
      launchedAt: now,
      updatedAt: now
    }, { merge: true });
    const snap = await db.collection("launch_waitlist").get();
    let sent = 0;
    let failed = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.notifiedAt) continue;
      const ok = await sendLaunchAnnouncement(String(data.email), {
        name: String(data.name || ""),
        siteUrl
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

// server/app.ts
var STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
var STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
var NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
var NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
var isProd = process.env.NODE_ENV === "production";
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  // Key + secret are server-only — never read a VITE_-prefixed name (Vite inlines
  // those into the client bundle, which would leak the Cloudinary secret).
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var stripeClient = null;
async function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  if (stripeClient) return stripeClient;
  const { default: Stripe } = await import("stripe");
  stripeClient = new Stripe(STRIPE_SECRET_KEY);
  return stripeClient;
}
function rateLimit(maxPerMinute) {
  const hits = /* @__PURE__ */ new Map();
  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now > entry.reset) {
      hits.set(ip, { count: 1, reset: now + 6e4 });
      return next();
    }
    if (entry.count >= maxPerMinute) {
      return res.status(429).json({ error: "Too many requests. Please slow down." });
    }
    entry.count++;
    next();
  };
}
async function markOrderPaid(orderId, note, stripeData) {
  const db = await getDb();
  if (!db || !orderId) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const ref = db.collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const order = snap.data();
  if (order.paymentStatus === "paid") return;
  await ref.update({
    paymentStatus: "paid",
    status: "paid",
    ...stripeData?.sessionId ? { "stripe.sessionId": stripeData.sessionId } : {},
    ...stripeData?.paymentIntentId ? { "stripe.paymentIntentId": stripeData.paymentIntentId } : {},
    statusHistory: [...order.statusHistory || [], { status: "paid", at: now, by: "system", note }],
    updatedAt: now
  });
  if (order.contact?.email) await sendOrderConfirmation(order.contact.email, orderToEmail(order));
}
async function handleStripeEvent(rawBody, signature) {
  const stripe = await getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return { status: 503, body: { error: "Stripe webhook not configured" } };
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe] webhook signature verification failed:", err.message);
    return { status: 400, body: `Webhook Error: ${err.message}` };
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await markOrderPaid(session.metadata?.orderId, "Stripe payment received", {
        sessionId: session.id,
        paymentIntentId: session.payment_intent || ""
      });
    } catch (e) {
      console.error("[stripe] webhook handling error:", e.message);
    }
  }
  return { status: 200, body: { received: true } };
}
function createApiApp() {
  const app3 = express();
  app3.disable("x-powered-by");
  app3.set("trust proxy", 1);
  app3.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (isProd) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
  app3.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const { status, body } = await handleStripeEvent(req.body, req.headers["stripe-signature"]);
    res.status(status).send(body);
  });
  app3.use(express.json({ limit: "1mb" }));
  app3.use(ordersRouter(rateLimit));
  app3.use(launchRouter(rateLimit));
  app3.use(paymobRouter(rateLimit));
  app3.post("/api/cloudinary/delete", rateLimit(30), async (req, res) => {
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: "Unauthorized" });
    const { imageUrl } = req.body || {};
    if (!imageUrl || typeof imageUrl !== "string") return res.status(400).json({ error: "Image URL is required" });
    try {
      const match = imageUrl.match(/\/v\d+\/([^.]+)\./);
      const publicId = match ? match[1] : null;
      if (!publicId) {
        if (!imageUrl.includes("cloudinary.com")) return res.json({ message: "Not a Cloudinary URL, skipping" });
        return res.status(400).json({ error: "Could not extract public_id from URL" });
      }
      let result = await cloudinary.uploader.destroy(publicId);
      if (result?.result === "not found") {
        result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      }
      res.json({ result });
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });
  app3.post("/api/stripe/create-checkout-session", rateLimit(20), async (req, res) => {
    const stripe = await getStripe();
    if (!stripe) return res.status(503).json({ error: "Payments are not configured yet." });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Payments are not configured on the server (FIREBASE_SERVICE_ACCOUNT missing)." });
    try {
      const { orderId, successUrl, cancelUrl, email } = req.body || {};
      const snap = await db.collection("orders").doc(String(orderId || "")).get();
      if (!snap.exists) return res.status(404).json({ error: "Order not found" });
      const order = snap.data();
      const emailNorm = String(email || "").toLowerCase().trim();
      if (!emailNorm || emailNorm !== String(order.contact?.email || "").toLowerCase()) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.paymentStatus === "paid") return res.status(400).json({ error: "Order already paid" });
      if (order.paymentMethod !== "stripe") {
        return res.status(400).json({ error: "This order is not set up for Stripe card payment" });
      }
      if (!["pending_payment", "payment_verification"].includes(order.status) && order.paymentStatus !== "unpaid") {
        return res.status(400).json({ error: "This order cannot accept payment" });
      }
      const base = (process.env.SITE_URL || "").replace(/\/$/, "");
      if (!base && isProd) return res.status(500).json({ error: "Server misconfigured: SITE_URL is required." });
      const httpOnly = (u) => {
        try {
          const p = new URL(u).protocol;
          return p === "http:" || p === "https:" ? u : "";
        } catch {
          return "";
        }
      };
      const successFinal = base ? `${base}/order/confirmation?order=${order.orderNumber}&paid=1` : httpOnly(String(successUrl || ""));
      const cancelFinal = base ? `${base}/order/confirmation?order=${order.orderNumber}&cancelled=1` : httpOnly(String(cancelUrl || ""));
      if (!successFinal || !cancelFinal) return res.status(400).json({ error: "Invalid return URL" });
      const cur = String(order.currency || "usd").toLowerCase();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        // No payment_method_types → Stripe enables card + Apple Pay + Google Pay (+ any
        // wallet methods active on the account) automatically.
        line_items: order.items.map((it) => ({
          price_data: {
            currency: cur,
            product_data: { name: String(typeof it.name === "string" ? it.name : it.name?.en || "Item").slice(0, 250) },
            unit_amount: Math.round(Number(it.price) * 100)
          },
          quantity: Math.max(1, Math.min(99, Number(it.quantity) || 1))
        })),
        customer_email: order.contact?.email,
        metadata: { orderId: snap.id },
        success_url: successFinal,
        cancel_url: cancelFinal
      });
      await snap.ref.update({ "stripe.sessionId": session.id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      res.json({ url: session.url, id: session.id });
    } catch (e) {
      console.error("[stripe] create-checkout-session error:", e.message);
      res.status(500).json({ error: "Could not start checkout." });
    }
  });
  app3.post("/api/stripe/sync", rateLimit(10), async (req, res) => {
    const stripe = await getStripe();
    const db = await getDb();
    if (!stripe || !db) return res.status(503).json({ error: "Not configured" });
    try {
      const { orderNumber, email } = req.body || {};
      const q = await db.collection("orders").where("orderNumber", "==", String(orderNumber || "").toUpperCase().trim()).limit(1).get();
      if (q.empty) return res.status(404).json({ error: "Order not found" });
      const order = q.docs[0].data();
      if ((order.contact?.email || "").toLowerCase() !== String(email || "").toLowerCase().trim()) return res.status(404).json({ error: "Order not found" });
      if (order.paymentStatus !== "paid" && order.stripe?.sessionId) {
        const session = await stripe.checkout.sessions.retrieve(order.stripe.sessionId);
        if (session.payment_status === "paid") {
          await markOrderPaid(q.docs[0].id, "Stripe payment confirmed on return", {
            sessionId: session.id,
            paymentIntentId: session.payment_intent || ""
          });
          return res.json({ paid: true });
        }
      }
      res.json({ paid: order.paymentStatus === "paid" });
    } catch (e) {
      console.error("[stripe] sync error:", e.message);
      res.status(500).json({ error: "Sync failed" });
    }
  });
  app3.post("/api/email/order-confirmation", rateLimit(10), async (req, res) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Not configured" });
    try {
      const { orderNumber, email } = req.body || {};
      const q = await db.collection("orders").where("orderNumber", "==", String(orderNumber || "").toUpperCase().trim()).limit(1).get();
      if (q.empty) return res.status(404).json({ error: "Order not found" });
      const order = q.docs[0].data();
      if ((order.contact?.email || "").toLowerCase() !== String(email || "").toLowerCase().trim()) return res.status(404).json({ error: "Order not found" });
      const ok = await sendOrderConfirmation(order.contact.email, orderToEmail(order));
      res.json({ sent: ok });
    } catch (e) {
      console.error("[email] endpoint error:", e.message);
      res.status(500).json({ error: "Could not send email" });
    }
  });
  app3.post("/api/translate", rateLimit(20), async (req, res) => {
    if (!NVIDIA_API_KEY) return res.status(503).json({ error: "Translation is not configured." });
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: "Unauthorized" });
    const { nameEn = "", nameAr = "", descEn = "", descAr = "" } = req.body || {};
    try {
      const system = `You are the bilingual copywriter for Raafat Furniture, an upscale Egyptian furniture house that ships worldwide.
Complete the missing fields so each product has BOTH an English and an Arabic name and description.
Rules:
- Arabic must be natural, warm EGYPTIAN dialect (\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629) as written by a refined Cairo showroom \u2014 elegant and premium, never stiff textbook Arabic and never street slang.
- English must read like polished boutique product copy (clean, confident, not flowery).
- Translate the MEANING and feel, not word-for-word. Stay faithful to any field already provided.
- NEVER change a field that already has text \u2014 only fill empty ones. Keep names concise; keep each description close in length to its counterpart.
- Keep measurements, materials and numbers accurate; do not invent features.
- Reply with ONLY a JSON object with exactly these keys: nameEn, nameAr, descEn, descAr. No prose, no code fences.`;
      const user = `Fill any empty string in this JSON:
` + JSON.stringify({ nameEn, nameAr, descEn, descAr }, null, 2);
      const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          temperature: 0.2,
          max_tokens: 1024,
          messages: [{ role: "system", content: system }, { role: "user", content: user }]
        })
      });
      if (!r.ok) {
        console.error("[translate] nvidia error:", r.status, (await r.text()).slice(0, 300));
        return res.status(502).json({ error: "Translation service error." });
      }
      const data = await r.json();
      let text = String(data?.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, "").trim();
      const a = text.indexOf("{");
      const b = text.lastIndexOf("}");
      if (a !== -1 && b >= a) text = text.slice(a, b + 1);
      const parsed = JSON.parse(text || "{}");
      res.json({
        nameEn: parsed.nameEn || nameEn,
        nameAr: parsed.nameAr || nameAr,
        descEn: parsed.descEn || descEn,
        descAr: parsed.descAr || descAr
      });
    } catch (e) {
      console.error("[translate] error:", e.message);
      res.status(500).json({ error: "Translation failed." });
    }
  });
  app3.get("/api/health", (_req, res) => res.json({ ok: true }));
  app3.post("/api/email/inbound", rateLimit(60), async (req, res) => {
    const secret = process.env.RESEND_INBOUND_SECRET || "";
    if (secret) {
      const got = String(req.query.secret || req.headers["x-webhook-secret"] || "");
      if (got !== secret) return res.status(401).json({ error: "Unauthorized" });
    }
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Not configured" });
    const payload = req.body || {};
    const toRaw = String(
      payload.to || payload.recipient || payload.data?.to?.[0] || payload.data?.to || ""
    );
    const fromRaw = String(payload.from || payload.sender || payload.data?.from || "");
    const text = String(
      payload.text || payload.plain || payload.data?.text || payload.data?.email?.text || ""
    ).trim();
    const html = String(payload.html || payload.data?.html || "");
    const body = (text || html.replace(/<[^>]+>/g, " ")).trim().slice(0, 4e3);
    if (!body) return res.status(200).json({ ok: true, ignored: "empty" });
    const m = toRaw.match(/\+([A-Za-z0-9_-]+)@/);
    const orderId = m?.[1];
    if (!orderId) return res.status(200).json({ ok: true, ignored: "no-order-id" });
    const ref = db.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(200).json({ ok: true, ignored: "unknown-order" });
    const order = snap.data();
    const customerEmail = String(order.contact?.email || "").toLowerCase();
    const fromEmail = fromRaw.match(/[\w.+-]+@[\w.-]+/)?.[0]?.toLowerCase() || "";
    if (fromEmail && customerEmail && fromEmail !== customerEmail) {
      console.warn("[email/inbound] from mismatch", fromEmail, customerEmail);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const msg = {
      id: `m_${Date.now().toString(36)}`,
      from: "customer",
      body,
      at: now,
      by: fromEmail || customerEmail
    };
    await ref.update({
      messages: [...order.messages || [], msg],
      unreadCustomerReplies: Number(order.unreadCustomerReplies || 0) + 1,
      updatedAt: now
    });
    res.json({ ok: true });
  });
  return app3;
}

// api-src/index.ts
var app2 = createApiApp();
function handler(req, res) {
  return app2(req, res);
}
export {
  handler as default
};
