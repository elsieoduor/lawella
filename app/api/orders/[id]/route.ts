// import { NextRequest, NextResponse } from "next/server"
// import { createAdminSupabase } from "@/lib/supabase/server"

// interface Params { params: { id: string } }

// export async function GET(_req: NextRequest, { params }: Params) {
//   const supabase = createAdminSupabase()
//   const { data, error } = await supabase
//     .from("orders")
//     .select("*, order_items(*)")
//     .eq("id", params.id)
//     .single()

//   if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 })
//   return NextResponse.json(data)
// }

// export async function PATCH(req: NextRequest, { params }: Params) {
//   const supabase = createAdminSupabase()
//   try {
//     const body = await req.json()
//     // Only allow updating status and payment_status from admin
//     const allowed: Record<string, unknown> = {}
//     if (body.status)         allowed.status         = body.status
//     if (body.payment_status) allowed.payment_status = body.payment_status
//     if (body.notes !== undefined) allowed.notes     = body.notes

//     const { data, error } = await supabase
//       .from("orders")
//       .update(allowed)
//       .eq("id", params.id)
//       .select()
//       .single()

//     if (error) return NextResponse.json({ error: error.message }, { status: 500 })
//     return NextResponse.json(data)
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 })
//   }
// }
import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"
import { Order } from "@/lib/types"
import {
  notifyOrderConfirmed, notifyOrderProcessing,
  notifyOrderShipped, notifyOrderDelivered, notifyOrderCancelled,
} from "@/lib/notifications"

interface Params { params: { id: string } }

// Map of which status transitions should fire which notification
const STATUS_NOTIFICATIONS: Record<string, (o: Order) => Promise<void>> = {
  processing: notifyOrderProcessing,
  shipped:    notifyOrderShipped,
  delivered:  notifyOrderDelivered,
  cancelled:  notifyOrderCancelled,
}

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createAdminSupabase()
  try {
    const body = await req.json()

    // Fetch current order state before update (to detect transitions)
    const { data: before } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", params.id)
      .single()

    const allowed: Record<string, unknown> = {}
    if (body.status         !== undefined) allowed.status         = body.status
    if (body.payment_status !== undefined) allowed.payment_status = body.payment_status
    if (body.notes          !== undefined) allowed.notes          = body.notes

    const { data, error } = await supabase
      .from("orders")
      .update(allowed)
      .eq("id", params.id)
      .select("*, order_items(*)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ── Trigger notifications based on what changed ──
    const order = data as Order
    const prevStatus    = before?.status
    const prevPayStatus = before?.payment_status

    // Status changed → fire order status notification
    if (body.status && body.status !== prevStatus) {
      const notify = STATUS_NOTIFICATIONS[body.status]
      if (notify) {
        notify(order).catch((e) => console.error("[Notification] status change failed:", e))
      }
    }

    // Payment flipped to "paid" → fire confirmed notification
    if (body.payment_status === "paid" && prevPayStatus !== "paid") {
      notifyOrderConfirmed(order).catch((e) => console.error("[Notification] payment confirmed failed:", e))
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
