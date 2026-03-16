"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  ArrowLeft, Loader2, CheckCircle2, Truck,
  XCircle, Clock, RefreshCw, Building2,
} from "lucide-react"
import { Order } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ── Config ────────────────────────────────────────────────────────────────────
const ORDER_STATUSES = [
  { value: "pending",    label: "Pending",    icon: Clock,        color: "text-yellow-600" },
  { value: "processing", label: "Processing", icon: RefreshCw,    color: "text-blue-600"   },
  { value: "shipped",    label: "Shipped",    icon: Truck,        color: "text-purple-600" },
  { value: "delivered",  label: "Delivered",  icon: CheckCircle2, color: "text-green-600"  },
  { value: "cancelled",  label: "Cancelled",  icon: XCircle,      color: "text-gray-500"   },
]

const PAY_STATUSES = [
  { value: "unpaid",                label: "Unpaid"               },
  { value: "pending_verification",  label: "Pending Verification" },
  { value: "paid",                  label: "Paid"                 },
  { value: "failed",                label: "Failed"               },
  { value: "refunded",              label: "Refunded"             },
]

const statusBg: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped:    "bg-purple-100 text-purple-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-gray-100 text-gray-600",
}

const payBg: Record<string, string> = {
  unpaid:               "bg-orange-100 text-orange-700",
  pending_verification: "bg-amber-100 text-amber-700",
  paid:                 "bg-green-100 text-green-700",
  failed:               "bg-red-100 text-red-700",
  refunded:             "bg-gray-100 text-gray-600",
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
}

interface Props {
  params: Promise<{ id: string }>; //
}

export default function OrderDetailPage({ params }: Props) {
  // Unwrapping the promise using the use() hook
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder]       = useState<Order | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [status, setStatus]     = useState("")
  const [payStatus, setPayStatus] = useState("")
  const [saved, setSaved]       = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders/${orderId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((d: Order | null) => {
        if (!d) return
        setOrder(d)
        setStatus(d.status ?? "pending")
        setPayStatus(d.payment_status ?? "unpaid")
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [orderId])

  const handleSave = async () => {
    setSaving(true); setSaveError("")
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status, payment_status: payStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder(updated)
        setStatus(updated.status)
        setPayStatus(updated.payment_status)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        const err = await res.json()
        setSaveError(err.error ?? "Save failed")
      }
    } catch {
      setSaveError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 size={32} className="animate-spin text-brand-red" />
    </div>
  )

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !order) return (
    <div className="p-8 text-center text-gray-400">
      <p className="mb-4">Order not found.</p>
      <Link href="/admin/orders">
        <Button className="bg-brand-red text-white rounded-xl">← Back to Orders</Button>
      </Link>
    </div>
  )

  const currentStatus = ORDER_STATUSES.find((s) => s.value === order.status)
  const StatusIcon    = currentStatus?.icon ?? Clock
  const bankRef       = (order as any).bank_reference as string | undefined

  return (
    <div className="p-8 max-w-5xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/admin" className="hover:text-brand-red transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/orders" className="hover:text-brand-red transition-colors">Orders</Link>
        <span>/</span>
        <span className="text-brand-black font-medium">{order.order_number}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-5 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders"
            className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-red hover:text-brand-red transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-black text-2xl text-brand-black">
                {order.order_number}
              </h1>
              <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize", statusBg[order.status] ?? "bg-gray-100 text-gray-600")}>
                <StatusIcon size={12} className={currentStatus?.color} />
                {order.status}
              </span>
              <span className={cn("px-3 py-1 rounded-full text-xs font-bold", payBg[order.payment_status] ?? "bg-gray-100 text-gray-600")}>
                {order.payment_status?.replace("_", " ")}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        {/* Status update controls */}
        <Card className="border-2 border-brand-red/20 shadow-sm">
          <CardContent className="pt-4 pb-4 flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-2 w-44">
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
                <SelectTrigger className="rounded-xl border-2 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                onClick={handleSave}
                disabled={saving}
                className={cn("rounded-xl gap-2 font-bold px-5",
                  saved
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-brand-red hover:bg-brand-red-dark text-white"
                )}
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                 : saved ? <><CheckCircle2 size={14} /> Saved!</>
                 : "Update Status"}
              </Button>
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* Left column */}
        <div className="space-y-6">

          {/* Items */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="font-display font-bold text-lg">
                Items ({order.order_items?.length ?? 0})
              </CardTitle>
            </CardHeader>

            {(order.order_items?.length ?? 0) === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No items found for this order.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(order.order_items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-2xl shrink-0">
                      {item.product_emoji || "🧶"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{item.product_name}</div>
                      <div className="text-xs text-gray-400">
                        {item.size ? `Size: ${item.size} · ` : ""}Qty: {item.qty}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-gray-400">{formatCurrency(item.unit_price)} each</div>
                      <div className="font-display font-black text-brand-red">{formatCurrency(item.line_total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className={order.delivery_fee === 0 ? "text-green-600 font-semibold" : ""}>
                  {order.delivery_fee === 0 ? "Free" : formatCurrency(order.delivery_fee ?? 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="font-display font-black text-xl text-brand-red">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-display font-bold text-base">Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Customer */}
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
                <a href={`tel:${order.customer_phone}`}
                  className="font-semibold mt-0.5 text-brand-red hover:underline block">
                  {order.customer_phone}
                </a>
              </div>
              {order.customer_email && (
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Email</div>
                  <div className="font-semibold mt-0.5 text-sm break-all">{order.customer_email}</div>
                </div>
              )}
              <Link href={`/admin/customers/${encodeURIComponent(order.customer_phone)}`}
                className="text-xs text-brand-red hover:underline font-semibold">
                View customer history →
              </Link>
            </CardContent>
          </Card>

          {/* Delivery */}
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

          {/* Payment */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="font-display font-bold text-base flex items-center gap-2">
                {order.payment_method === "bank" && <Building2 size={15} className="text-blue-500" />}
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Method</span>
                <span className="font-semibold text-sm capitalize">
                  {order.payment_method === "mpesa" ? "M-Pesa"
                   : order.payment_method === "bank" ? "Bank Transfer"
                   : "Cash on Delivery"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", payBg[order.payment_status] ?? "bg-gray-100 text-gray-600")}>
                  {order.payment_status?.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="font-display font-black text-brand-red">{formatCurrency(order.total)}</span>
              </div>

              {/* Bank reference — shown when customer submitted one */}
              {bankRef && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                    Customer Bank Reference
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
                    <div className="font-mono font-black text-lg text-green-800 tracking-widest mb-1">
                      {bankRef}
                    </div>
                    <p className="text-xs text-green-600 leading-relaxed">
                      Check your bank app for a transfer of{" "}
                      <strong>{formatCurrency(order.total)}</strong> from{" "}
                      <strong>{order.customer_phone}</strong>.
                    </p>
                  </div>
                  {order.payment_status !== "paid" && (
                    <button
                      onClick={() => {
                        setPayStatus("paid")
                        setStatus("processing")
                      }}
                      className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
                    >
                      ✓ Verified — Mark as Paid
                    </button>
                  )}
                </div>
              )}

              {/* Waiting for reference */}
              {order.payment_method === "bank" && !bankRef && order.payment_status === "unpaid" && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
                    Awaiting customer bank transfer. They'll submit a reference code after paying.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}