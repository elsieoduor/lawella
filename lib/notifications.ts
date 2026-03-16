/**
 * Lawella — Order Notification System
 *
 * Email: Brevo (Sendinblue) — 300 free emails/day, no credit card needed
 * SMS:   Africa's Talking   — free sandbox, ~KES 2/SMS in production
 *
 * Required env vars:
 *   BREVO_API_KEY         From app.brevo.com → Settings → API Keys
 *   FROM_EMAIL            Must match your verified Brevo sender (e.g. orders@lawella.co.ke)
 *   FROM_NAME             Display name (e.g. Lawella)
 *   NOTIFICATION_EMAIL    Your personal email for new order admin alerts
 *
 *   AT_API_KEY            Africa's Talking API key
 *   AT_USERNAME           "sandbox" for testing, your real username for production
 *   AT_SENDER_ID          Optional: registered sender name e.g. LAWELLA
 */

import { Order } from "@/lib/types"

export type NotificationEvent =
  | "order.created"
  | "order.confirmed"
  | "order.processing"
  | "order.shipped"
  | "order.delivered"
  | "order.cancelled"

// ── Email via Brevo ──────────────────────────────────────────────────────────
export async function sendEmail(opts: {
  to:      string
  subject: string
  html:    string
  name?:   string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey   = process.env.BREVO_API_KEY
  const fromEmail = process.env.FROM_EMAIL  ?? "orders@lawella.co.ke"
  const fromName  = process.env.FROM_NAME   ?? "Lawella"

  if (!apiKey) {
    console.warn("[Email] BREVO_API_KEY not set — skipping email")
    return { ok: false, error: "BREVO_API_KEY not configured" }
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method:  "POST",
      headers: {
        "api-key":      apiKey,
        "Content-Type": "application/json",
        "Accept":       "application/json",
      },
      body: JSON.stringify({
        sender:      { name: fromName, email: fromEmail },
        to:          [{ email: opts.to, name: opts.name ?? opts.to }],
        subject:     opts.subject,
        htmlContent: opts.html,
      }),
    })

    if (res.ok) {
      console.log(`[Email] Sent to ${opts.to}`)
      return { ok: true }
    }

    const err = await res.json()
    console.error("[Email] Brevo error:", err)
    return { ok: false, error: JSON.stringify(err) }
  } catch (err: any) {
    console.error("[Email] Network error:", err.message)
    return { ok: false, error: err.message }
  }
}

// ── SMS via Africa's Talking ─────────────────────────────────────────────────
export async function sendSMS(
  phone: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey   = process.env.AT_API_KEY
  const username = process.env.AT_USERNAME ?? "sandbox"

  if (!apiKey) {
    console.warn("[SMS] AT_API_KEY not set — skipping SMS")
    return { ok: false, error: "AT_API_KEY not configured" }
  }

  // Normalise to +254 format
  const normalised = phone.startsWith("+") ? phone
    : phone.startsWith("254") ? `+${phone}`
    : phone.startsWith("0")   ? `+254${phone.slice(1)}`
    : `+254${phone}`

  try {
    const params = new URLSearchParams({
      username,
      to:      normalised,
      message,
      ...(process.env.AT_SENDER_ID ? { from: process.env.AT_SENDER_ID } : {}),
    })

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method:  "POST",
      headers: {
        Accept:         "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey,
      },
      body: params.toString(),
    })

    const data = await res.json()
    const recipient = data?.SMSMessageData?.Recipients?.[0]

    if (recipient?.statusCode === 101) {
      console.log(`[SMS] Sent to ${normalised}`)
      return { ok: true }
    }

    const errMsg = recipient?.status ?? JSON.stringify(data)
    console.error(`[SMS] Failed:`, errMsg)
    return { ok: false, error: errMsg }
  } catch (err: any) {
    console.error("[SMS] Network error:", err.message)
    return { ok: false, error: err.message }
  }
}

// ── Message templates ────────────────────────────────────────────────────────
function fmt(n: number) { return `KES ${n.toLocaleString()}` }

const SMS_TEMPLATES: Record<NotificationEvent, (o: Order) => string> = {
  "order.created":    (o) => `Hi ${o.customer_name.split(" ")[0]}! Your Lawella order ${o.order_number} (${fmt(o.total)}) has been placed. We'll confirm once payment is received. Thank you! 🧶`,
  "order.confirmed":  (o) => `Hi ${o.customer_name.split(" ")[0]}! Payment received for ${o.order_number} ✓ Your piece is being prepared with care!`,
  "order.processing": (o) => `Hi ${o.customer_name.split(" ")[0]}! Your Lawella order ${o.order_number} is being prepared. We'll notify you once it ships! 🧶`,
  "order.shipped":    (o) => `Hi ${o.customer_name.split(" ")[0]}! Your Lawella order ${o.order_number} is on its way to ${o.delivery_city ?? o.delivery_address}! 🚚`,
  "order.delivered":  (o) => `Hi ${o.customer_name.split(" ")[0]}! Your Lawella order ${o.order_number} has arrived 🎉 Thank you for supporting handcraft!`,
  "order.cancelled":  (o) => `Hi ${o.customer_name.split(" ")[0]}, your Lawella order ${o.order_number} has been cancelled. WhatsApp us anytime if you have questions.`,
}

// ── Email HTML builder ───────────────────────────────────────────────────────
function buildEmailHTML(event: NotificationEvent, order: Order): string {
  const configs: Record<NotificationEvent, { headline: string; body: string; color: string }> = {
    "order.created":    { headline: "Order Placed! 🧶",       body: `Thank you for your order! We've received <strong>${order.order_number}</strong> and will confirm once payment is verified.`, color: "#C41E3A" },
    "order.confirmed":  { headline: "Payment Confirmed ✓",    body: `Your payment of <strong>${fmt(order.total)}</strong> for <strong>${order.order_number}</strong> has been received. Your piece is being prepared with care.`, color: "#16A34A" },
    "order.processing": { headline: "We're Making It! 🪡",    body: `Your Lawella order <strong>${order.order_number}</strong> is being prepared by our makers. We'll notify you when it ships.`, color: "#2563EB" },
    "order.shipped":    { headline: "It's On Its Way! 🚚",    body: `Your Lawella order <strong>${order.order_number}</strong> has been dispatched to <strong>${order.delivery_city ?? order.delivery_address}</strong>.`, color: "#7C3AED" },
    "order.delivered":  { headline: "Delivered! 🎉",          body: `We hope your order arrived in perfect condition. Enjoy your handcrafted Lawella piece!`, color: "#CA8A04" },
    "order.cancelled":  { headline: "Order Cancelled",        body: `Your order <strong>${order.order_number}</strong> has been cancelled. Contact us on WhatsApp if you have any questions.`, color: "#6B7280" },
  }

  const { headline, body, color } = configs[event]
  const items = order.order_items ?? []

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF6F1;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <!-- Header -->
  <div style="background:${color};padding:32px;text-align:center">
    <p style="font-size:28px;margin:0 0 4px">🧶</p>
    <p style="color:#ffffff;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.5px">Lawella</p>
  </div>
  <!-- Body -->
  <div style="padding:32px">
    <h1 style="font-size:20px;color:#1A1012;margin:0 0 8px;font-weight:700">${headline}</h1>
    <p style="color:#6B5B5E;font-size:15px;line-height:1.6;margin:0 0 24px">${body}</p>
    <!-- Order summary -->
    <div style="background:#FAF6F1;border-radius:12px;padding:20px">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="color:#6B5B5E;font-size:13px">Order number</span>
        <span style="font-weight:700;color:#C41E3A;font-size:13px">${order.order_number}</span>
      </div>
      ${items.map(i => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #E5E7EB">
        <span style="color:#1A1012;font-size:13px">${i.product_emoji} ${i.product_name}${i.size ? ` (${i.size})` : ""} ×${i.qty}</span>
        <span style="font-weight:600;color:#1A1012;font-size:13px">${fmt(i.line_total)}</span>
      </div>`).join("")}
      <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:2px solid #E5E7EB;margin-top:8px">
        <span style="font-weight:700;color:#1A1012;font-size:14px">Total</span>
        <span style="font-weight:900;color:#C41E3A;font-size:17px">${fmt(order.total)}</span>
      </div>
    </div>
    <!-- Footer -->
    <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:24px 0 0">Lawella · Handcrafted in Nairobi, Kenya 🧶</p>
  </div>
</div>
</body></html>`
}

// ── Admin alert ───────────────────────────────────────────────────────────────
async function notifyAdmin(event: NotificationEvent, order: Order) {
  const adminEmail = process.env.NOTIFICATION_EMAIL
  if (!adminEmail) return

  const alertEvents: Partial<Record<NotificationEvent, string>> = {
    "order.created":   `🛍️ New Order: ${order.order_number} — ${fmt(order.total)} via ${order.payment_method.toUpperCase()}`,
    "order.confirmed": `💚 Payment Confirmed: ${order.order_number} — ${fmt(order.total)}`,
  }

  const subject = alertEvents[event]
  if (!subject) return

  const items = order.order_items ?? []
  const html = `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:24px">
    <h2 style="color:#C41E3A;margin:0 0 16px">${subject}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="color:#6B5B5E;padding:6px 0">Customer</td><td style="font-weight:600">${order.customer_name}</td></tr>
      <tr><td style="color:#6B5B5E;padding:6px 0">Phone</td><td>${order.customer_phone}</td></tr>
      <tr><td style="color:#6B5B5E;padding:6px 0">Address</td><td>${order.delivery_address}${order.delivery_city ? `, ${order.delivery_city}` : ""}</td></tr>
      <tr><td style="color:#6B5B5E;padding:6px 0">Payment</td><td style="text-transform:uppercase">${order.payment_method}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0">
    <p style="font-size:14px;font-weight:600;margin:0 0 8px">Items:</p>
    ${items.map(i => `<p style="font-size:13px;color:#374151;margin:4px 0">${i.product_emoji} ${i.product_name}${i.size ? ` (${i.size})` : ""} ×${i.qty} — ${fmt(i.line_total)}</p>`).join("")}
    <p style="font-size:16px;font-weight:700;margin:12px 0">Total: <span style="color:#C41E3A">${fmt(order.total)}</span></p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/orders/${order.id}"
       style="display:inline-block;background:#C41E3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px">
       View in Admin →
    </a>
  </div>`

  await sendEmail({ to: adminEmail, subject, html, name: "Lawella Admin" })
}

// ── Main trigger ──────────────────────────────────────────────────────────────
export async function triggerOrderNotification(
  event: NotificationEvent,
  order: Order,
  opts: { sms?: boolean; email?: boolean } = { sms: true, email: true }
): Promise<void> {
  const tasks: Promise<unknown>[] = []

  if (opts.sms !== false) {
    tasks.push(
      sendSMS(order.customer_phone, SMS_TEMPLATES[event](order))
        .catch((e) => console.error("[Notifications] SMS failed:", e))
    )
  }

  if (opts.email !== false && order.customer_email) {
    tasks.push(
      sendEmail({
        to:      order.customer_email,
        name:    order.customer_name,
        subject: buildSubject(event, order),
        html:    buildEmailHTML(event, order),
      }).catch((e) => console.error("[Notifications] Email failed:", e))
    )
  }

  tasks.push(
    notifyAdmin(event, order)
      .catch((e) => console.error("[Notifications] Admin alert failed:", e))
  )

  await Promise.allSettled(tasks)
}

function buildSubject(event: NotificationEvent, order: Order): string {
  const map: Record<NotificationEvent, string> = {
    "order.created":    `Order Received — ${order.order_number}`,
    "order.confirmed":  `Payment Confirmed — ${order.order_number}`,
    "order.processing": `Your order is being prepared — ${order.order_number}`,
    "order.shipped":    `Your order has shipped — ${order.order_number}`,
    "order.delivered":  `Order Delivered — ${order.order_number}`,
    "order.cancelled":  `Order Cancelled — ${order.order_number}`,
  }
  return map[event]
}

// ── Convenience exports ───────────────────────────────────────────────────────
export const notifyOrderCreated    = (o: Order) => triggerOrderNotification("order.created",    o)
export const notifyOrderConfirmed  = (o: Order) => triggerOrderNotification("order.confirmed",  o)
export const notifyOrderProcessing = (o: Order) => triggerOrderNotification("order.processing", o)
export const notifyOrderShipped    = (o: Order) => triggerOrderNotification("order.shipped",    o)
export const notifyOrderDelivered  = (o: Order) => triggerOrderNotification("order.delivered",  o)
export const notifyOrderCancelled  = (o: Order) => triggerOrderNotification("order.cancelled",  o)
