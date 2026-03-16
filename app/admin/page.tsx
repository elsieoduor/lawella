"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts"
import {
  TrendingUp, ShoppingBag, Package, Users,
  RefreshCw, ArrowUpRight,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardData {
  stats: {
    totalRevenue:    number
    totalOrders:     number
    totalProducts:   number
    uniqueCustomers: number
  }
  monthlyRevenue: { month: string; revenue: number; orders: number }[]
  categorySales:  { name: string; value: number; color: string }[]
  topProducts:    { name: string; emoji: string; sales: number; revenue: number }[]
  recentOrders:   {
    id: string; order_number: string; customer_name: string;
    customer_phone: string; total: number; status: string;
    payment_method: string; payment_status: string; created_at: string;
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-gray-100 text-gray-500",
}
const PAY_COLORS: Record<string, string> = {
  unpaid:               "bg-orange-100 text-orange-700",
  pending_verification: "bg-amber-100 text-amber-700",
  paid:                 "bg-green-100 text-green-700",
  failed:               "bg-red-100 text-red-700",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-100 rounded-xl", className)} />
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setLastFetched(new Date())
    } catch (e: any) {
      setError(e.message ?? "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const stats = data?.stats
  const STAT_CARDS = [
    { label: "Total Revenue",  value: stats ? formatCurrency(stats.totalRevenue)    : "—", icon: <TrendingUp size={20}/>, color: "bg-red-50 text-brand-red"   },
    { label: "Total Orders",   value: stats ? String(stats.totalOrders)              : "—", icon: <ShoppingBag size={20}/>,color: "bg-blue-50 text-blue-600"   },
    { label: "Products",       value: stats ? String(stats.totalProducts)            : "—", icon: <Package size={20}/>,    color: "bg-purple-50 text-purple-600"},
    { label: "Customers",      value: stats ? String(stats.uniqueCustomers)          : "—", icon: <Users size={20}/>,      color: "bg-green-50 text-green-600"  },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-brand-black">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {lastFetched
              ? `Last updated ${lastFetched.toLocaleTimeString("en-KE", { timeStyle: "short" })}`
              : "Loading live data…"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-brand-red hover:text-brand-red transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          ⚠️ {error} — <button onClick={load} className="underline font-semibold">Try again</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {STAT_CARDS.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl", s.color)}>{s.icon}</div>
                {loading && <Skeleton className="w-12 h-5" />}
              </div>
              {loading
                ? <Skeleton className="w-24 h-7 mb-1" />
                : <div className="font-display font-black text-2xl text-brand-black">{s.value}</div>}
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Revenue area chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-lg">Revenue Over Time</CardTitle>
            <CardDescription className="text-xs">Paid orders · last 8 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 md:pl-6">
            {loading ? (
              <Skeleton className="w-full h-65" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data?.monthlyRevenue ?? []} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#C41E3A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C41E3A" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C41E3A" strokeWidth={2.5} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-lg">Sales by Category</CardTitle>
            <CardDescription className="text-xs">% of units sold</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-65" />
            ) : (data?.categorySales?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center h-65 text-gray-400 text-sm">No sales data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data?.categorySales} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                    paddingAngle={5} dataKey="value">
                    {data?.categorySales.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders bar + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-lg">Orders Per Month</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 md:pl-6">
            {loading ? (
              <Skeleton className="w-full h-55" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.monthlyRevenue ?? []} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#f8f8f8" }} contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#C41E3A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-lg">Top Products</CardTitle>
            <CardDescription className="text-xs">By units sold</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-8" />)
            ) : (data?.topProducts?.length ?? 0) === 0 ? (
              <p className="text-gray-400 text-sm">No order data yet</p>
            ) : (
              data!.topProducts.slice(0, 5).map((p, i) => (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-brand-black truncate mr-2 flex items-center gap-1.5">
                      <span className="text-gray-400">#{i + 1}</span>
                      <span>{p.emoji}</span>
                      {p.name}
                    </span>
                    <span className="text-xs font-bold text-brand-red shrink-0">{p.sales} sold</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-red transition-all duration-500"
                      style={{ width: `${(p.sales / (data!.topProducts[0]?.sales || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display font-bold text-lg">Recent Orders</CardTitle>
            <CardDescription className="text-xs">Latest 8 orders</CardDescription>
          </div>
          <Link href="/admin/orders"
            className="text-xs text-brand-red font-semibold hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={12}/>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Order", "Customer", "Total", "Method", "Status", "Payment", "Date"].map((h) => (
                      <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentOrders ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No orders yet</td>
                    </tr>
                  ) : (
                    data!.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link href={`/admin/orders/${order.id}`} className="font-bold text-brand-red hover:underline text-xs font-mono">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-brand-black text-sm">{order.customer_name}</div>
                          <div className="text-[10px] text-gray-400">{order.customer_phone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-sm">{formatCurrency(order.total)}</td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs capitalize">
                          {order.payment_method === "mpesa" ? "M-Pesa" : order.payment_method === "bank" ? "Bank" : "Cash"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold capitalize", STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-500")}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold", PAY_COLORS[order.payment_status] ?? "bg-gray-100 text-gray-500")}>
                            {order.payment_status?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
