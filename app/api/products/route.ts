import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase()

  try {
    const body = await req.json()
    const { name, category, price, description, emoji, badge, colors, sizes, stock, image_url } = body

    if (!name || !category || !price || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        category,
        price: Number(price),
        description,
        image_url,
        emoji:  emoji  ?? "🧶",
        badge:  badge  || null,
        colors: colors ?? ["#C41E3A", "#F5E6E8"],
        sizes:  Array.isArray(sizes) ? sizes : (sizes as string).split(",").map((s: string) => s.trim()),
        stock:  Number(stock) ?? 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
