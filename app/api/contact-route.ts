import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 })
    }

    const apiKey      = process.env.BREVO_API_KEY
    const adminEmail  = process.env.NOTIFICATION_EMAIL
    const fromEmail   = process.env.FROM_EMAIL  ?? "orders@lawella.co.ke"
    const fromName    = process.env.FROM_NAME   ?? "Lawella"

    if (!apiKey) {
      console.warn("[Contact] BREVO_API_KEY not set — skipping email")
      // Still return success so the customer sees the confirmation
      return NextResponse.json({ success: true })
    }

    const emailSubject = subject?.trim()
      ? `Contact Form: ${subject.trim()}`
      : `New message from ${name.trim()} — Lawella Contact Form`

    // ── 1. Notify admin ────────────────────────────────────────────────────
    if (adminEmail) {
      const adminHtml = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <div style="background:#C41E3A;border-radius:12px 12px 0 0;padding:24px;text-align:center">
            <p style="color:#fff;font-size:20px;font-weight:900;margin:0">🧶 Lawella</p>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0">New Contact Form Submission</p>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:24px">
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
              <tr><td style="color:#6B5B5E;padding:8px 0;width:100px;vertical-align:top">Name</td><td style="font-weight:600;padding:8px 0">${name.trim()}</td></tr>
              ${email?.trim() ? `<tr><td style="color:#6B5B5E;padding:8px 0;vertical-align:top">Email</td><td style="padding:8px 0"><a href="mailto:${email.trim()}" style="color:#C41E3A;font-weight:600">${email.trim()}</a></td></tr>` : ""}
              ${subject?.trim() ? `<tr><td style="color:#6B5B5E;padding:8px 0;vertical-align:top">Subject</td><td style="font-weight:600;padding:8px 0">${subject.trim()}</td></tr>` : ""}
            </table>
            <div style="background:#FAF6F1;border-radius:10px;padding:16px">
              <p style="color:#6B5B5E;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Message</p>
              <p style="color:#1A1012;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap">${message.trim()}</p>
            </div>
            ${email?.trim() ? `
            <div style="margin-top:20px">
              <a href="mailto:${email.trim()}?subject=Re: ${encodeURIComponent(subject?.trim() || "Your enquiry")}"
                style="display:inline-block;background:#C41E3A;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
                Reply to ${name.trim()} →
              </a>
            </div>` : ""}
          </div>
        </div>`

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method:  "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          sender:      { name: "Lawella Contact Form", email: fromEmail },
          to:          [{ email: adminEmail, name: "Lawella Admin" }],
          replyTo:     email?.trim() ? { email: email.trim(), name: name.trim() } : undefined,
          subject:     emailSubject,
          htmlContent: adminHtml,
        }),
      })
    }

    // ── 2. Auto-reply to customer (only if they gave an email) ─────────────
    if (email?.trim()) {
      const customerHtml = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#FAF6F1;padding:32px 16px">
          <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
            <div style="background:#C41E3A;padding:32px;text-align:center">
              <p style="font-size:28px;margin:0 0 6px">🧶</p>
              <p style="color:#fff;font-size:22px;font-weight:900;margin:0">Lawella</p>
            </div>
            <div style="padding:32px">
              <h2 style="font-size:20px;color:#1A1012;margin:0 0 8px;font-weight:700">We got your message, ${name.trim().split(" ")[0]}! 💌</h2>
              <p style="color:#6B5B5E;font-size:15px;line-height:1.6;margin:0 0 20px">
                Thanks for reaching out to Lawella. We've received your message and will get back to you as soon as possible — usually within a few hours on WhatsApp or by the next business day via email.
              </p>
              ${subject?.trim() ? `<div style="background:#FAF6F1;border-radius:10px;padding:14px 16px;margin-bottom:20px"><p style="color:#6B5B5E;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px">Your subject</p><p style="color:#1A1012;font-size:14px;margin:0;font-weight:600">${subject.trim()}</p></div>` : ""}
              <a href="https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? "254700000000"}"
                style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:24px">
                💬 Chat on WhatsApp for faster response
              </a>
              <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center">Lawella · Handcrafted in Nairobi, Kenya 🧶</p>
            </div>
          </div>
        </div>`

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method:  "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          sender:      { name: fromName, email: fromEmail },
          to:          [{ email: email.trim(), name: name.trim() }],
          subject:     `We received your message — Lawella`,
          htmlContent: customerHtml,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[contact] error:", err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
