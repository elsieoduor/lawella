import { NextRequest, NextResponse } from "next/server"
import { MpesaCallbackBody, parseCallbackMetadata } from "@/lib/mpesa"
import { createAdminSupabase } from "@/lib/supabase/server"

/**
 * Safaricom posts the payment result here after the customer
 * enters their PIN (or cancels / times out).
 *
 * This URL must be publicly reachable over HTTPS.
 * For local dev: use ngrok → ngrok http 3000
 */
export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase()

  try {
    const rawBody: MpesaCallbackBody = await req.json()
    const callback = rawBody.Body.stkCallback

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback

    const meta = parseCallbackMetadata(CallbackMetadata)
    const isSuccess = ResultCode === 0

    // Map result code to our status
    let status: string
    if (isSuccess)       status = "success"
    else if (ResultCode === 1032) status = "cancelled"   // user cancelled
    else if (ResultCode === 1037) status = "timeout"     // user didn't respond
    else                          status = "failed"

    // Update the mpesa_transactions row
    const { data: txn, error: txnError } = await supabase
      .from("mpesa_transactions")
      .update({
        result_code: ResultCode,
        result_desc: ResultDesc,
        mpesa_receipt_number: meta.MpesaReceiptNumber ?? null,
        transaction_date: meta.TransactionDate ? String(meta.TransactionDate) : null,
        status,
        raw_callback: rawBody,
      })
      .eq("checkout_request_id", CheckoutRequestID)
      .select("order_id")
      .single()

    if (txnError) {
      console.error("Failed to update mpesa_transaction:", txnError)
    }

    // If payment succeeded, mark the order as paid
    if (isSuccess && txn?.order_id) {
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
        })
        .eq("id", txn.order_id)

      if (orderError) {
        console.error("Failed to update order payment status:", orderError)
      }
    }

    // Safaricom expects a 200 OK with this exact body
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
  } catch (err) {
    console.error("mpesa/callback error:", err)
    // Still return 200 so Safaricom doesn't retry endlessly
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
  }
}
