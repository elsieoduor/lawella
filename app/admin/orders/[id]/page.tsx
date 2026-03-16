"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, CheckCircle2, Truck, XCircle, Clock, RefreshCw } from "lucide-react"
import { Order } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const ORDER_STATUSES = [
  { value: "pending",    label: "Pending",    icon: Clock,         color: "text-yellow-600" },
  { value: "processing", label: "Processing", icon: RefreshCw,      color: "text-blue-600"   },
  { value: "shipped",    label: "Shipped",    icon: Truck,         color: "text-purple-600" },
  { value: "delivered",  label: "Delivered",  icon: CheckCircle2,  color: "text-green-600"  },
  { value: "cancelled",  label: "Cancelled",  icon: XCircle,       color: "text-gray-500"   },
]

const PAY_STATUSES = [
  { value: "unpaid",   label: "Unpaid"   },
  { value: "paid",     label: "Paid"     },
  { value: "failed",   label: "Failed"   },
  { value: "refunded", label: "Refunded" },
]

const statusBg: Record<string, string> = {
  pending: "bg-yellow-100",
  processing: "bg-blue-100",
  shipped: "bg-purple-100",
  delivered: "bg-green-100",
  cancelled: "bg-gray-100",
}

const payBg: Record<string, string> = {
  unpaid: "bg-orange-100 text-orange-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("")
  const [payStatus, setPayStatus] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d: Order) => {
        setOrder(d)
        setStatus(d.status)
        setPayStatus(d.payment_status || "unpaid") // Handle optional field
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, payment_status: payStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (err) {
      console.error("Save failed", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 size={32} className="animate-spin text-brand-red" />
    </div>
  )

  if (!order) return (
    <div className="p-8 text-center text-gray-400">
      <p>Order not found.</p>
      <Link href="/admin/orders">
        <Button className="mt-4 bg-brand-red text-white rounded-xl">← Back to Orders</Button>
      </Link>
    </div>
  )

  const currentStatus = ORDER_STATUSES.find((s) => s.value === order.status)
  const StatusIcon = currentStatus?.icon ?? Clock

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/admin" className="hover:text-brand-red">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/orders" className="hover:text-brand-red">Orders</Link>
        <span>/</span>
        <span className="text-brand-black font-medium">{order.order_number || "Order Details"}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-5 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders"
            className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-red hover:text-brand-red transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-black text-2xl text-brand-black">{order.order_number || "—"}</h1>
              <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize", statusBg[order.status])}>
                <StatusIcon size={12} className={currentStatus?.color} />
                {order.status}
              </span>
              <span className={cn("px-3 py-1 rounded-full text-xs font-bold capitalize", payBg[order.payment_status || "unpaid"])}>
                {order.payment_status || "unpaid"}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Placed {new Date(order.created_at || order.order_date).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>

        {/* Update status controls */}
        <Card className="border-2 border-brand-red/20 shadow-sm">
          <CardContent className="pt-4 pb-4 flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-2 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Status</label>
              <Select value={payStatus} onValueChange={setPayStatus}>
                <SelectTrigger className="rounded-xl border-2 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving}
              className={cn("rounded-xl gap-2 font-bold px-5",
                saved ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-brand-red hover:bg-brand-red-dark text-white")}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
               : saved  ? <><CheckCircle2 size={14} /> Saved!</>
               : "Update Status"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="font-display font-bold text-lg">
                Items ({order.order_items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <div className="divide-y divide-gray-50">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-2xl shrink-0">
                    {item.product_emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.product_name}</div>
                    {(item.size || item.qty) && (
                      <div className="text-xs text-gray-400">
                        {item.size ? `Size: ${item.size} · ` : ""}Qty: {item.qty}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatCurrency(item.unit_price)} each</div>
                    <div className="font-display font-black text-brand-red">{formatCurrency(item.line_total)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className={order.delivery_fee === 0 ? "text-green-600 font-semibold" : ""}>
                  {order.delivery_fee === 0 ? "Free" : formatCurrency(order.delivery_fee ?? 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
                <span>Total</span>
                <span className="font-display font-black text-xl text-brand-red">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="font-display font-bold text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Name</div>
                <div className="font-semibold mt-0.5">{order.customer_name}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Phone</div>
                <a href={`tel:${order.customer_phone}`} className="font-semibold mt-0.5 text-brand-red hover:underline block">
                  {order.customer_phone}
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="font-display font-bold text-base">Delivery</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Address</div>
                <div className="font-semibold mt-0.5 text-sm">{order.delivery_address}</div>
              </div>
              {order.delivery_city && (
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">City</div>
                  <div className="font-semibold mt-0.5">{order.delivery_city}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}