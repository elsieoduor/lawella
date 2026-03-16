// import { NextRequest, NextResponse } from "next/server"
// import { createAdminSupabase } from "@/lib/supabase/server"

// // Update interface to use Promise
// interface Params { params: Promise<{ id: string }> }

// export async function GET(_req: NextRequest, { params }: Params) {
//   const { id } = await params; // Unwrapping
//   const supabase = createAdminSupabase()
//   const { data, error } = await supabase
//     .from("products")
//     .select("*")
//     .eq("id", id)
//     .single()

//   if (error) return NextResponse.json({ error: "Product not found" }, { status: 404 })
//   return NextResponse.json(data)
// }

// export async function PATCH(req: NextRequest, { params }: Params) {
//   const { id } = await params; // Unwrapping
//   const supabase = createAdminSupabase()

//   try {
//     const body = await req.json()
//     // ... logic for price/stock/sizes ...

//     const { data, error } = await supabase
//       .from("products")
//       .update(body)
//       .eq("id", id) // Use unwrapped id
//       .select()
//       .single()

//     if (error) return NextResponse.json({ error: error.message }, { status: 500 })
//     return NextResponse.json(data)
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 })
//   }
// }

// export async function DELETE(_req: NextRequest, { params }: Params) {
//   const { id } = await params; // Unwrapping
//   const supabase = createAdminSupabase()

//   const { error } = await supabase
//     .from("products")
//     .update({ is_active: false })
//     .eq("id", id) // Use unwrapped id

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 })
//   return NextResponse.json({ success: true })
// }
import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

// FIX: Define the context structure correctly for the Next.js RouteHandler constraint
interface RouteContext { 
  params: Promise<{ id: string }> 
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  // 1. Await the params promise to unwrap the ID
  const { id } = await params; 
  
  // 2. Guard against "undefined" strings to prevent Supabase UUID syntax errors
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params; 
  
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const supabase = createAdminSupabase()

  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", id) 
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params; 
  
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const supabase = createAdminSupabase()

  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id) 

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}