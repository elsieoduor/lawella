// // import { NextRequest, NextResponse } from "next/server"
// // import { createAdminSupabase } from "@/lib/supabase/server"

// // interface Params { params: { id: string } }

// // export async function GET(_req: NextRequest, { params }: Params) {
// //   const supabase = createAdminSupabase()
// //   const { data, error } = await supabase
// //     .from("orders")
// //     .select("*, order_items(*)")
// //     .eq("id", params.id)
// //     .single()

// //   if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 })
// //   return NextResponse.json(data)
// // }

// // export async function PATCH(req: NextRequest, { params }: Params) {
// //   const supabase = createAdminSupabase()
// //   try {
// //     const body = await req.json()
// //     // Only allow updating status and payment_status from admin
// //     const allowed: Record<string, unknown> = {}
// //     if (body.status)         allowed.status         = body.status
// //     if (body.payment_status) allowed.payment_status = body.payment_status
// //     if (body.notes !== undefined) allowed.notes     = body.notes

// //     const { data, error } = await supabase
// //       .from("orders")
// //       .update(allowed)
// //       .eq("id", params.id)
// //       .select()
// //       .single()

// //     if (error) return NextResponse.json({ error: error.message }, { status: 500 })
// //     return NextResponse.json(data)
// //   } catch (err: any) {
// //     return NextResponse.json({ error: err.message }, { status: 500 })
// //   }
// // }
// import { NextRequest, NextResponse } from "next/server"
// import { createAdminSupabase } from "@/lib/supabase/server"
// import { Order } from "@/lib/types"
// import {
//   notifyOrderConfirmed, notifyOrderProcessing,
//   notifyOrderShipped, notifyOrderDelivered, notifyOrderCancelled,
// } from "@/lib/notifications"

// interface Params { params: { id: string } }

// // Map of which status transitions should fire which notification
// const STATUS_NOTIFICATIONS: Record<string, (o: Order) => Promise<void>> = {
//   processing: notifyOrderProcessing,
//   shipped:    notifyOrderShipped,
//   delivered:  notifyOrderDelivered,
//   cancelled:  notifyOrderCancelled,
// }

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

//     // Fetch current order state before update (to detect transitions)
//     const { data: before } = await supabase
//       .from("orders")
//       .select("*, order_items(*)")
//       .eq("id", params.id)
//       .single()

//     const allowed: Record<string, unknown> = {}
//     if (body.status         !== undefined) allowed.status         = body.status
//     if (body.payment_status !== undefined) allowed.payment_status = body.payment_status
//     if (body.notes          !== undefined) allowed.notes          = body.notes

//     const { data, error } = await supabase
//       .from("orders")
//       .update(allowed)
//       .eq("id", params.id)
//       .select("*, order_items(*)")
//       .single()

//     if (error) return NextResponse.json({ error: error.message }, { status: 500 })

//     // ── Trigger notifications based on what changed ──
//     const order = data as Order
//     const prevStatus    = before?.status
//     const prevPayStatus = before?.payment_status

//     // Status changed → fire order status notification
//     if (body.status && body.status !== prevStatus) {
//       const notify = STATUS_NOTIFICATIONS[body.status]
//       if (notify) {
//         notify(order).catch((e) => console.error("[Notification] status change failed:", e))
//       }
//     }

//     // Payment flipped to "paid" → fire confirmed notification
//     if (body.payment_status === "paid" && prevPayStatus !== "paid") {
//       notifyOrderConfirmed(order).catch((e) => console.error("[Notification] payment confirmed failed:", e))
//     }

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

const STATUS_NOTIFICATIONS: Record<string, (o: Order) => Promise<void>> = {
  processing: notifyOrderProcessing,
  shipped:    notifyOrderShipped,
  delivered:  notifyOrderDelivered,
  cancelled:  notifyOrderCancelled,
}

/**
 * Fetch order + items as two separate queries instead of an embedded join.
 * This avoids PostgREST join issues with RLS on the order_items table.
 */

async function fetchOrderWithItems(supabase: any, orderId: string) {
  // Try finding by UUID first, then by order_number as a fallback
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .or(`id.eq.${orderId},order_number.eq.${orderId}`) 
    .single()

  if (orderError || !order) {
    console.error("[orders/[id] GET] fetch error:", orderError)
    return { data: null, error: orderError || { message: "Order not found" } }
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id) 
    .order("id", { ascending: true })

  return { data: { ...order, order_items: items ?? [] }, error: null }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params; // Ensure params are awaited in Next.js 15

  // Guard against "undefined" or malformed IDs before querying Supabase
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Valid Order ID is required" }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  const { data, error } = await fetchOrderWithItems(supabase, id);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Order not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createAdminSupabase();
  
  try {
    // 1. Await params before accessing properties (Next.js 15 requirement)
    const { id: orderId } = await params;

    // 2. Guard against "undefined" string or missing ID to prevent Supabase UUID errors
    if (!orderId || orderId === "undefined") {
      return NextResponse.json({ error: "A valid Order ID is required" }, { status: 400 });
    }

    const body = await req.json();

    // Fetch current state before update using the resolved orderId
    const { data: before } = await fetchOrderWithItems(supabase, orderId);

    const allowed: Record<string, unknown> = {};
    if (body.status !== undefined) allowed.status = body.status;
    if (body.payment_status !== undefined) allowed.payment_status = body.payment_status;
    if (body.notes !== undefined) allowed.notes = body.notes;

    // Update the order row using the resolved orderId
    const { data: updatedRow, error: updateError } = await supabase
      .from("orders")
      .update(allowed)
      .eq("id", orderId)
      .select("*")
      .single();

    if (updateError) {
      console.error("[orders/[id] PATCH] update error:", JSON.stringify(updateError));
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Re-fetch items using the resolved orderId
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("id", { ascending: true });

    const order = { ...updatedRow, order_items: items ?? [] } as Order;

    // Trigger notifications based on changes
    const prevStatus = before?.status;
    const prevPayStatus = before?.payment_status;

    if (body.status && body.status !== prevStatus) {
      const notify = STATUS_NOTIFICATIONS[body.status];
      if (notify) {
        notify(order).catch((e) => console.error("[Notification] status change failed:", e));
      }
    }

    if (body.payment_status === "paid" && prevPayStatus !== "paid") {
      notifyOrderConfirmed(order).catch((e) => console.error("[Notification] payment confirmed failed:", e));
    }

    return NextResponse.json(order);
  } catch (err: any) {
    console.error("[orders/[id] PATCH] unexpected error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
