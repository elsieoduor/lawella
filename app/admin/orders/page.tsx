"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, RefreshCw, ShoppingBag, ExternalLink } from "lucide-react"
import { Order } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

/* ── Status config ─────────────────────────────────────────────────────────── */
// Remove "all" from the actual values used for display/logic, but keep for filters
const ORDER_STATUS_VALUES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const
const PAY_STATUS_VALUES = ["unpaid", "paid", "failed", "refunded"] as const

const ORDER_STATUSES = ["all", ...ORDER_STATUS_VALUES] as const
const PAY_STATUSES = ["all", ...PAY_STATUS_VALUES] as const

const orderStatusStyle: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
}
const payStatusStyle: Record<string, string> = {
  unpaid: "bg-orange-100 text-orange-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
}
const methodLabel: Record<string, string> = {
  mpesa: "M-Pesa", cash: "Cash", bank: "Bank",
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [payFilter, setPayFilter] = useState<string>("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/orders")
      if (res.ok) setOrders(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false
    if (payFilter !== "all" && o.payment_status !== payFilter) return false
    if (search) {
      const q = search.toLowerCase()
      // Fix: Handle optional order_number string safely
      return (
        (o.order_number?.toLowerCase().includes(q) ?? false) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Summary counts
  const totalRevenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((s, o) => s + o.total, 0)
  const pendingCount = orders.filter((o) => o.status === "pending").length
  const unpaidCount = orders.filter((o) => o.payment_status === "unpaid").length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display font-black text-3xl text-brand-black">Orders</h1>
          <p className="text-gray-500 mt-1">{orders.length} total orders</p>
        </div>
        <Button variant="outline" onClick={load} className="rounded-xl gap-2 border-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: orders.length, color: "text-brand-black" },
          { label: "Revenue (Paid)", value: formatCurrency(totalRevenue), color: "text-green-600" },
          { label: "Pending Orders", value: pendingCount, color: "text-yellow-600" },
          { label: "Awaiting Payment", value: unpaidCount, color: "text-orange-600" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className={cn("font-display font-black text-2xl", s.color)}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative min-w-55 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, name, phone…"
            className="pl-9 rounded-xl border-2" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Status:</span>
          {ORDER_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border-2 capitalize transition-all",
                statusFilter === s
                  ? "bg-brand-red text-white border-brand-red"
                  : "bg-white border-gray-200 text-gray-600 hover:border-brand-red/40")}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Payment:</span>
          {PAY_STATUSES.map((s) => (
            <button key={s} onClick={() => setPayFilter(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border-2 capitalize transition-all",
                payFilter === s
                  ? "bg-brand-black text-white border-brand-black"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Order", "Customer", "Items", "Total", "Status", "Payment", "Method", "Date", ""].map((h) => (
                  <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                  <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-30" />
                  Loading orders…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                  <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No orders found</p>
                </td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {/* Fix: Fallback for optional order_number */}
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-red text-xs">{o.order_number || "N/A"}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-brand-black leading-snug">{o.customer_name}</div>
                    <div className="text-xs text-gray-400">{o.customer_phone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {(o.order_items?.length ?? 0)} item{(o.order_items?.length ?? 0) !== 1 ? "s" : ""}
                  </td>
                  <td className="py-3.5 px-4 font-display font-bold text-brand-black">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", orderStatusStyle[o.status] ?? "bg-gray-100 text-gray-600")}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {/* Fix: Fallback for optional payment_status */}
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", payStatusStyle[o.payment_status || "unpaid"] ?? "bg-gray-100")}>
                      {o.payment_status || "unpaid"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{methodLabel[o.payment_method] ?? o.payment_method}</td>
                  <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {/* Fix: Use order_date if created_at is missing */}
                    {new Date(o.created_at || o.order_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td className="py-3.5 px-4">
                    <Link href={`/admin/orders/${o.id}`}>
                      <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-brand-red hover:text-brand-red">
                        <ExternalLink size={13} /> View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {orders.length} orders
        </div>
      </Card>
    </div>
  )
}