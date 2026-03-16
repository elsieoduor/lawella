// import { NextRequest, NextResponse } from "next/server"
// import { createAdminSupabase } from "@/lib/supabase/server"
// import { initiateStkPush, normalisePhone } from "@/lib/mpesa"

// export async function POST(req: NextRequest) {
//   const supabase = createAdminSupabase()

//   try {
//     const body = await req.json()
//     const {
//       customerName,
//       customerEmail,
//       customerPhone,
//       deliveryAddress,
//       deliveryCity,
//       notes,
//       paymentMethod,
//       items,
//     } = body

//     // 1. Fetch current Store Settings for truth
//     const { data: settings } = await supabase
//       .from("store_settings")
//       .select("*")
//       .eq("id", 1)
//       .single()

//     const dbFee = settings?.delivery_fee ?? 300
//     const dbThreshold = settings?.free_delivery_threshold ?? 5000

//     // 2. Validate basic fields
//     if (!customerName || !customerPhone || !deliveryAddress || !items?.length) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
//     }

//     // 3. RECALCULATE Totals (Don't trust the body.total from the frontend!)
//     const calculatedSubtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)
//     const calculatedFee = calculatedSubtotal >= dbThreshold ? 0 : dbFee
//     const finalTotal = calculatedSubtotal + calculatedFee

//     // 4. Insert order with server-calculated values
//     const { data: order, error: orderError } = await supabase
//       .from("orders")
//       .insert({
//         customer_name: customerName,
//         customer_email: customerEmail ?? null,
//         customer_phone: customerPhone,
//         delivery_address: deliveryAddress,
//         delivery_city: deliveryCity ?? null,
//         notes: notes ?? null,
//         payment_method: paymentMethod,
//         subtotal: calculatedSubtotal, // Use server value
//         delivery_fee: calculatedFee, // Use server value
//         total: finalTotal,           // Use server value
//         status: "pending",
//         payment_status: "unpaid",
//       })
//       .select()
//       .single()

//     if (orderError || !order) {
//       console.error("Order insert error:", orderError)
//       return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
//     }

//     // 2. Insert order items
//     const orderItems = items.map((item: any) => ({
//       order_id:      order.id,
//       product_id:    item.id ?? null,
//       product_name:  item.name,
//       product_emoji: item.emoji ?? "🧶",
//       size:          item.selectedSize ?? null,
//       qty:           item.qty,
//       unit_price:    item.price,
//     }))

//     const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

//     if (itemsError) {
//       console.error("Order items insert error:", itemsError)
//       // Order exists — don't fail the whole request
//     }

//     // 3. Trigger M-Pesa STK push if payment method is mpesa
//     let mpesaCheckoutRequestId: string | undefined

//     if (paymentMethod === "mpesa") {
//       const normalisedPhone = normalisePhone(customerPhone)
//       const mpesaResult = await initiateStkPush({
//         phoneNumber:  normalisedPhone,
//         amount:       total,
//         orderId:      order.id,
//         orderNumber:  order.order_number,
//       })

//       if (mpesaResult.success && mpesaResult.checkoutRequestId) {
//         mpesaCheckoutRequestId = mpesaResult.checkoutRequestId

//         // Save transaction record
//         await supabase.from("mpesa_transactions").insert({
//           order_id:            order.id,
//           merchant_request_id: mpesaResult.merchantRequestId,
//           checkout_request_id: mpesaResult.checkoutRequestId,
//           phone_number:        normalisedPhone,
//           amount:              total,
//           status:              "pending",
//         })
//       } else {
//         // STK failed — still return the order, frontend can retry
//         console.error("STK push failed:", mpesaResult.errorMessage)
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       orderId:      order.id,
//       orderNumber:  order.order_number,
//       mpesaCheckoutRequestId,
//     })
//   } catch (err: any) {
//     console.error("orders POST error:", err)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"
import { initiateStkPush, normalisePhone } from "@/lib/mpesa"

export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase()

  try {
    const body = await req.json()
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryCity,
      notes,
      paymentMethod,
      items, // CartItem[]
    } = body

    // 1. Fetch current Store Settings for truth (Prices/Fees)
    const { data: settings, error: settingsError } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single()

    if (settingsError) {
      console.error("Settings fetch error:", settingsError)
      // If DB settings fail, we use your established defaults
    }

    const dbFee = settings?.delivery_fee ?? 300
    const dbThreshold = settings?.free_delivery_threshold ?? 5000

    // 2. Validate basic fields
    if (!customerName || !customerPhone || !deliveryAddress || !items?.length) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 })
    }

    // 3. RECALCULATE Totals (Server-side validation)
    // We map through items to calculate the subtotal. 
    // Note: In a production-hardened app, you'd fetch item prices from the 'products' table here.
    const calculatedSubtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)
    const calculatedFee = calculatedSubtotal >= dbThreshold ? 0 : dbFee
    const finalTotal = calculatedSubtotal + calculatedFee

    // 4. Insert order with server-calculated values
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name:    customerName,
        customer_email:   customerEmail ?? null,
        customer_phone:   customerPhone,
        delivery_address: deliveryAddress,
        delivery_city:    deliveryCity ?? null,
        notes:            notes ?? null,
        payment_method:   paymentMethod,
        subtotal:         calculatedSubtotal,
        delivery_fee:     calculatedFee,
        total:            finalTotal,
        status:           "pending",
        payment_status:   "unpaid",
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error("Order insert error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // 5. Insert order items
    const orderItems = items.map((item: any) => ({
      order_id:      order.id,
      product_id:    item.id ?? null,
      product_name:  item.name,
      product_emoji: item.emoji ?? "🧶",
      size:          item.selectedSize ?? null,
      qty:           item.qty,
      unit_price:    item.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items insert error:", itemsError)
      // We don't crash here because the order header already exists
    }

    // 6. Trigger M-Pesa STK push if payment method is mpesa
    let mpesaCheckoutRequestId: string | undefined

    if (paymentMethod === "mpesa") {
      try {
        const normalisedPhone = normalisePhone(customerPhone)
        const mpesaResult = await initiateStkPush({
          phoneNumber:  normalisedPhone,
          amount:       finalTotal, // Using our calculated total
          orderId:      order.id,
          orderNumber:  order.order_number,
        })

        if (mpesaResult.success && mpesaResult.checkoutRequestId) {
          mpesaCheckoutRequestId = mpesaResult.checkoutRequestId

          // Save transaction record for polling/webhooks
          await supabase.from("mpesa_transactions").insert({
            order_id:            order.id,
            merchant_request_id: mpesaResult.merchantRequestId,
            checkout_request_id: mpesaResult.checkoutRequestId,
            phone_number:        normalisedPhone,
            amount:              finalTotal,
            status:              "pending",
          })
        } else {
          console.error("STK push failed:", mpesaResult.errorMessage)
          // We return the order anyway so the user can see the "Retry" button on frontend
        }
      } catch (mpesaErr) {
        console.error("M-Pesa integration error:", mpesaErr)
      }
    }

    return NextResponse.json({
      success: true,
      orderId:      order.id,
      orderNumber:  order.order_number,
      mpesaCheckoutRequestId,
    })

  } catch (err: any) {
    console.error("orders POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/orders?orderNumber=LW-0001
export async function GET(req: NextRequest) {
  const supabase = createAdminSupabase()
  const orderNumber = req.nextUrl.searchParams.get("orderNumber")

  if (orderNumber) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .single()

    if (error) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    return NextResponse.json(data)
  }

  // List all orders (admin)
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(count)")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
