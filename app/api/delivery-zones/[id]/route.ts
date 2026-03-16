import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

// Update the interface to reflect that params is a Promise
interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const supabase = createAdminSupabase()
  // UNWRAP PARAMS FIRST
  const { id } = await params 

  try {
    const body = await req.json()
    const allowed: Record<string, unknown> = {}
    if (body.name         !== undefined) allowed.name        = body.name
    if (body.method       !== undefined) allowed.method      = body.method
    if (body.price        !== undefined) allowed.price       = Number(body.price)
    if (body.description  !== undefined) allowed.description = body.description
    if (body.sort_order   !== undefined) allowed.sort_order  = Number(body.sort_order)
    if (body.is_active    !== undefined) allowed.is_active   = body.is_active

    const { data, error } = await supabase
      .from("delivery_zones")
      .update(allowed)
      .eq("id", id) // Use the unwrapped id
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const supabase = createAdminSupabase()
  const { id } = await params // UNWRAP PARAMS FIRST
  
  const { error } = await supabase
    .from("delivery_zones")
    .update({ is_active: false })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}