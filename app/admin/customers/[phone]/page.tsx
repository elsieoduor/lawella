"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react"
import { Order } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// 1. Explicitly type the keys to match the Order type to fix "index type" errors
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

export default function CustomerDetailPage({ params }: { params: Promise<{ phone: string }> }) {
  const unwrappedParams = use(params)
  const phone = decodeURIComponent(unwrappedParams.phone)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orders`)
      .then((r) => r.json())
      .then((all: Order[]) => {
        const filtered = all.filter((o) => o.customer_phone === phone)
        // Fix: Use a fallback date to avoid Date constructor errors
        setOrders(filtered.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ))
      })
      .finally(() => setLoading(false))
  }, [phone])

  const name = orders[0]?.customer_name ?? "Customer"
  const email = orders[0]?.customer_email
  const spent = orders.reduce((s, o) => s + (o.total ?? 0), 0)
  const paidOrders = orders.filter((o) => o.payment_status === "paid")
  const paidTotal = paidOrders.reduce((s, o) => s + (o.total ?? 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 size={32} className="animate-spin text-brand-red" />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/admin" className="hover:text-brand-red">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/customers" className="hover:text-brand-red">Customers</Link>
        <span>/</span>
        <span className="text-brand-black font-medium">{name}</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/customers"
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-red hover:text-brand-red transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-red/10 flex items-center justify-center text-brand-red font-display font-black text-2xl">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-brand-black">{name}</h1>
            <p className="text-gray-400 text-sm">{phone}{email ? ` · ${email}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: orders.length, color: "text-brand-black" },
          { label: "Total Spent", value: formatCurrency(spent), color: "text-brand-red" },
          { label: "Paid Amount", value: formatCurrency(paidTotal), color: "text-green-600" },
          { label: "Avg per Order", value: formatCurrency(orders.length ? Math.round(spent / orders.length) : 0), color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className={cn("font-display font-black text-2xl", s.color)}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="font-display font-bold text-lg">Order History</CardTitle>
        </CardHeader>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-mono font-bold text-brand-red text-sm">{o.order_number || "N/A"}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {/* Fix: Fallback for created_at to avoid undefined in Date constructor */}
                      {new Date(o.created_at || Date.now()).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      {" · "}
                      {o.order_items?.length ?? 0} item(s)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Fix: use || "pending" as a fallback key for the record */}
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", orderStatusStyle[o.status || "pending"])}>
                    {o.status}
                  </span>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", payStatusStyle[o.payment_status || "unpaid"])}>
                    {o.payment_status || "unpaid"}
                  </span>
                  <span className="font-display font-black text-brand-black">{formatCurrency(o.total ?? 0)}</span>
                  <Link href={`/admin/orders/${o.id}`}>
                    <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 hover:border-brand-red hover:text-brand-red">View</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}