var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
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
var init_launchEmail = __esm({
  "server/launchEmail.ts"() {
    "use strict";
  }
});

// server/email.ts
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

// server/app.ts
init_orderEmail();

// server/ordersApi.ts
import { Router } from "express";
init_email();
init_orderEmail();

// server/paymob.ts
import { Router as Router2 } from "express";
init_email();
init_orderEmail();

// server/launchApi.ts
import { Router as Router3 } from "express";
init_email();

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

// api-src/stripe-webhook.ts
var config = { api: { bodyParser: false } };
async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  const { status, body } = await handleStripeEvent(raw, String(req.headers["stripe-signature"] || ""));
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(typeof body === "string" ? JSON.stringify({ error: body }) : JSON.stringify(body));
}
export {
  config,
  handler as default
};
