import { NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

// Derive customers by aggregating the orders table
export async function GET() {
  const supabase = createAdminSupabase()

  const { data, error } = await supabase
    .from("orders")
    .select("customer_name, customer_email, customer_phone, total, created_at, status")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate by phone number
  const map = new Map<string, {
    phone: string; name: string; email: string | null
    order_count: number; total_spent: number
    last_order_at: string; first_order_at: string
    statuses: string[]
  }>()

  for (const row of (data ?? [])) {
    const phone = row.customer_phone
    if (map.has(phone)) {
      const c = map.get(phone)!
      c.order_count++
      c.total_spent += row.total
      if (row.created_at > c.last_order_at)  c.last_order_at  = row.created_at
      if (row.created_at < c.first_order_at) c.first_order_at = row.created_at
      c.statuses.push(row.status)
    } else {
      map.set(phone, {
        phone,
        name:           row.customer_name,
        email:          row.customer_email ?? null,
        order_count:    1,
        total_spent:    row.total,
        last_order_at:  row.created_at,
        first_order_at: row.created_at,
        statuses:       [row.status],
      })
    }
  }

  const customers = Array.from(map.values())
    .sort((a, b) => b.total_spent - a.total_spent)

  return NextResponse.json(customers)
}
