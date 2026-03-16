import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

interface Params { params: { id: string } }

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
    // Only allow updating status and payment_status from admin
    const allowed: Record<string, unknown> = {}
    if (body.status)         allowed.status         = body.status
    if (body.payment_status) allowed.payment_status = body.payment_status
    if (body.notes !== undefined) allowed.notes     = body.notes

    const { data, error } = await supabase
      .from("orders")
      .update(allowed)
      .eq("id", params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
