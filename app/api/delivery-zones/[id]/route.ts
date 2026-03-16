import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

interface Params { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createAdminSupabase()
  try {
    const body = await req.json()
    const allowed: Record<string, unknown> = {}
    if (body.name        !== undefined) allowed.name        = body.name
    if (body.method      !== undefined) allowed.method      = body.method
    if (body.price       !== undefined) allowed.price       = Number(body.price)
    if (body.description !== undefined) allowed.description = body.description
    if (body.sort_order  !== undefined) allowed.sort_order  = Number(body.sort_order)
    if (body.is_active   !== undefined) allowed.is_active   = body.is_active

    const { data, error } = await supabase
      .from("delivery_zones").update(allowed).eq("id", params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createAdminSupabase()
  const { error } = await supabase
    .from("delivery_zones").update({ is_active: false }).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
