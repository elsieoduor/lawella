import { NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createAdminSupabase()

  // Run all queries in parallel
  const [ordersRes, itemsRes, productsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total, status, payment_method, payment_status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),

    supabase
      .from("order_items")
      .select("order_id, product_name, product_emoji, unit_price, qty, line_total"),

    supabase
      .from("products")
      .select("id, name, category, emoji")
      .eq("is_active", true),
  ])

  const orders   = ordersRes.data   ?? []
  const items    = itemsRes.data    ?? []
  const products = productsRes.data ?? []

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const totalRevenue   = orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0)
  const totalOrders    = orders.length
  const totalProducts  = products.length
  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone)).size

  // ── Monthly revenue + orders (last 8 months) ───────────────────────────────
  const monthlyMap: Record<string, { revenue: number; orders: number }> = {}
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString("en-US", { month: "short" })
    monthlyMap[key] = { revenue: 0, orders: 0 }
  }
  for (const order of orders) {
    const d   = new Date(order.created_at)
    const key = d.toLocaleString("en-US", { month: "short" })
    if (key in monthlyMap) {
      monthlyMap[key].orders++
      if (order.payment_status === "paid") monthlyMap[key].revenue += order.total
    }
  }
  const monthlyRevenue = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }))

  // ── Category sales (% breakdown by order item count) ──────────────────────
  // Map product_name → category via products table
  const productCategoryMap: Record<string, string> = {}
  for (const p of products) productCategoryMap[p.name] = p.category

  // Also build from order_items product names (may not all be in active products)
  const categoryCounts: Record<string, number> = {}
  for (const item of items) {
    const cat = productCategoryMap[item.product_name] ?? "other"
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + item.qty
  }
  const totalQty   = Object.values(categoryCounts).reduce((s, n) => s + n, 0) || 1
  const CAT_COLORS: Record<string, string> = {
    sweaters: "#C41E3A", blankets: "#8B2635", totes: "#E8737C", scrunchies: "#F5A5AB", other: "#D4A574",
  }
  const CAT_LABELS: Record<string, string> = {
    sweaters: "Sweaters", blankets: "Blankets", totes: "Tote Bags", scrunchies: "Scrunchies", other: "Other",
  }
  const categorySales = Object.entries(categoryCounts)
    .map(([cat, qty]) => ({
      name:  CAT_LABELS[cat] ?? cat,
      value: Math.round((qty / totalQty) * 100),
      color: CAT_COLORS[cat] ?? "#999",
    }))
    .sort((a, b) => b.value - a.value)

  // ── Top products by units sold ─────────────────────────────────────────────
  const productSales: Record<string, { name: string; emoji: string; sales: number; revenue: number }> = {}
  for (const item of items) {
    if (!productSales[item.product_name]) {
      productSales[item.product_name] = { name: item.product_name, emoji: item.product_emoji ?? "🧶", sales: 0, revenue: 0 }
    }
    productSales[item.product_name].sales   += item.qty
    productSales[item.product_name].revenue += item.line_total
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  // ── Recent orders (last 8) ─────────────────────────────────────────────────
  const recentOrders = orders.slice(0, 8)

  return NextResponse.json({
    stats: { totalRevenue, totalOrders, totalProducts, uniqueCustomers },
    monthlyRevenue,
    categorySales,
    topProducts,
    recentOrders,
  })
}
