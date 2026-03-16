import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase()
  try {
    const body = await req.json()
    const { name, method, price, description, sort_order } = body
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const { data, error } = await supabase
      .from("delivery_zones")
      .insert({ name: name.trim(), method: method ?? "flat_rate", price: Number(price) || 0, description: description ?? "", sort_order: Number(sort_order) || 0 })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
