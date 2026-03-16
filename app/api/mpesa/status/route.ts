import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

/**
 * The frontend polls this endpoint after triggering the STK push.
 * Returns the current status of the transaction from our DB.
 * The DB is updated by /api/mpesa/callback when Safaricom posts the result.
 */
export async function GET(req: NextRequest) {
  const checkoutRequestId = req.nextUrl.searchParams.get("checkoutRequestId")

  if (!checkoutRequestId) {
    return NextResponse.json({ error: "Missing checkoutRequestId" }, { status: 400 })
  }

  const supabase = createAdminSupabase()

  const { data, error } = await supabase
    .from("mpesa_transactions")
    .select("status, mpesa_receipt_number, result_desc, order_id")
    .eq("checkout_request_id", checkoutRequestId)
    .single()

  if (error || !data) {
    return NextResponse.json({ status: "pending" }) // still waiting
  }

  return NextResponse.json({
    status: data.status,                               // pending | success | failed | cancelled | timeout
    receiptNumber: data.mpesa_receipt_number ?? null,
    message: data.result_desc ?? null,
    orderId: data.order_id ?? null,
  })
}
