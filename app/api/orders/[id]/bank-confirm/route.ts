import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"
import { sendEmail, sendSMS } from "@/lib/notifications"

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const supabase = createAdminSupabase()
  // Fix: Unwrapping the params promise
  const { id: orderId } = await params

  try {
    const { bankReference } = await req.json()
    if (!bankReference?.trim()) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 })
    }

    const ref = bankReference.trim().toUpperCase()

    // Use orderId (resolved) instead of params.id
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.payment_method !== "bank") {
      return NextResponse.json({ error: "This order is not a bank transfer order" }, { status: 400 })
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "This order has already been confirmed as paid" }, { status: 400 })
    }

    // 2. Save reference + update status to pending_verification
    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        bank_reference: ref,
        payment_status: "pending_verification",
      })
      .eq("id", orderId)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Safety Fix: Add a fallback for the fmt function to prevent toLocaleString crash
    const fmt = (n: number) => `KES ${(n ?? 0).toLocaleString()}`

    // 3. Fire admin alert — non-blocking
    const adminEmail   = process.env.NOTIFICATION_EMAIL
    const siteUrl      = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    const firstName    = order.customer_name.split(" ")[0]

    if (adminEmail) {
      sendEmail({
        to:      adminEmail,
        subject: `🏦 Bank Reference Submitted — ${order.order_number} (${fmt(order.total)})`,
        html: `
          <div style="font-family:Arial;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#C41E3A;margin:0 0 4px">Bank Reference Submitted</h2>
            <p style="color:#6B5B5E;font-size:14px;margin:0 0 20px">A customer has submitted their bank transaction reference. Please verify before confirming.</p>
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin-bottom:20px">
              <p style="font-size:13px;color:#166534;margin:0 0 4px;font-weight:700;">SUBMITTED REFERENCE</p>
              <p style="font-family:monospace;font-size:22px;font-weight:900;color:#14532D;letter-spacing:2px;margin:0">${ref}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
              <tr><td style="color:#6B5B5E;padding:6px 0;width:120px">Order</td><td style="font-weight:700;color:#C41E3A">${order.order_number}</td></tr>
              <tr><td style="color:#6B5B5E;padding:6px 0">Customer</td><td style="font-weight:600">${order.customer_name}</td></tr>
              <tr><td style="color:#6B5B5E;padding:6px 0">Phone</td><td>${order.customer_phone}</td></tr>
              <tr><td style="color:#6B5B5E;padding:6px 0">Amount</td><td style="font-weight:700">${fmt(order.total)}</td></tr>
            </table>
            <p style="font-size:13px;color:#6B5B5E;margin-bottom:16px">
              Check your bank app for a transfer of <strong>${fmt(order.total)}</strong> with reference <strong>${ref}</strong> from <strong>${order.customer_phone}</strong>.
            </p>
            <a href="${siteUrl}/admin/orders/${order.id}"
               style="display:inline-block;background:#C41E3A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
              Verify &amp; Confirm Payment →
            </a>
          </div>`,
      }).catch((e) => console.error("[bank-confirm] admin email failed:", e))
    }

    // 4. SMS the customer so they know we received it
    sendSMS(
      order.customer_phone,
      `Hi ${firstName}! We've received your bank transfer reference (${ref}) for Lawella order ${order.order_number}. We'll confirm your payment within a few hours. Thank you! 🧶`
    ).catch((e) => console.error("[bank-confirm] customer SMS failed:", e))

    return NextResponse.json({ success: true, reference: ref })
  } catch (err: any) {
    console.error("bank-confirm error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
