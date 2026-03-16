import { NextRequest, NextResponse } from "next/server"
import { initiateStkPush, normalisePhone } from "@/lib/mpesa"
import { createAdminSupabase } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, orderNumber, phone, amount } = body

    // Validate input
    if (!orderId || !phone || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, phone, amount" },
        { status: 400 }
      )
    }

    const normalisedPhone = normalisePhone(phone)

    // Initiate STK push
    const result = await initiateStkPush({
      phoneNumber: normalisedPhone,
      amount: Number(amount),
      orderId,
      orderNumber: orderNumber ?? orderId,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.errorMessage ?? "Failed to initiate payment" },
        { status: 502 }
      )
    }

    // Save pending transaction to DB
    const supabase = createAdminSupabase()
    const { error: dbError } = await supabase.from("mpesa_transactions").insert({
      order_id: orderId,
      merchant_request_id: result.merchantRequestId,
      checkout_request_id: result.checkoutRequestId,
      phone_number: normalisedPhone,
      amount: Number(amount),
      status: "pending",
    })

    if (dbError) {
      console.error("Failed to save mpesa_transaction:", dbError)
      // Non-fatal — payment is still in flight
    }

    return NextResponse.json({
      success: true,
      checkoutRequestId: result.checkoutRequestId,
      customerMessage: result.customerMessage,
    })
  } catch (err: any) {
    console.error("mpesa/pay error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
