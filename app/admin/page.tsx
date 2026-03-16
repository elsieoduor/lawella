"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { TrendingUp, ShoppingBag, Package, Users, ArrowUpRight } from "lucide-react"
import {
  MONTHLY_REVENUE,
  CATEGORY_SALES,
  TOP_PRODUCTS,
  RECENT_ORDERS,
  PRODUCTS,
} from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

const STATS = [
  {
    label: "Total Revenue",
    value: "KES 397,900",
    change: "+23.4%",
    icon: <TrendingUp size={20} />,
    color: "bg-red-50 text-brand-red",
  },
  {
    label: "Total Orders",
    value: "478",
    change: "+18.2%",
    icon: <ShoppingBag size={20} />,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Products",
    value: String(PRODUCTS.length),
    change: "+2 this month",
    icon: <Package size={20} />,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Customers",
    value: "312",
    change: "+31 new",
    icon: <Users size={20} />,
    color: "bg-green-50 text-green-600",
  },
]

export default function AdminDashboard() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl md:text-3xl text-brand-black">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Welcome back! Here&apos;s how Lawella is doing.</p>
      </div>

      {/* Stat Cards - Grid: 1 col (base), 2 col (sm), 4 col (lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {STATS.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
                <span className="text-[10px] md:text-xs font-semibold text-green-600 bg-green-50 rounded-full px-2.5 py-1 flex items-center gap-1">
                  <ArrowUpRight size={11} /> {s.change}
                </span>
              </div>
              <div className="font-display font-black text-2xl text-brand-black">{s.value}</div>
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
            <CardDescription className="text-xs">Monthly revenue for the last 8 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 md:pl-6">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={MONTHLY_REVENUE} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: "none", 
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                    fontSize: '12px' 
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C41E3A" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-lg">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={CATEGORY_SALES}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORY_SALES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_REVENUE} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B5B5E" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8f8f8' }} contentStyle={{ borderRadius: 12, border: "none", fontSize: '12px' }} />
                <Bar dataKey="orders" fill="#C41E3A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-lg">Top Products</CardTitle>
            <CardDescription className="text-xs">By units sold</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {TOP_PRODUCTS.slice(0, 4).map((p, i) => (
              <div key={p.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-brand-black truncate mr-2">
                    <span className="text-gray-400 mr-1.5">#{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-xs font-bold text-brand-red shrink-0">{p.sales} sold</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-red transition-all duration-500"
                    style={{ width: `${(p.sales / TOP_PRODUCTS[0].sales) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders - Responsive Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display font-bold text-lg">Recent Orders</CardTitle>
          <CardDescription className="text-xs">Latest 6 orders across all channels</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-175">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Order ID", "Customer", "Amount", "Method", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left py-4 px-4 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-brand-red">{order.id}</td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-brand-black">{order.customer_name}</div>
                      <div className="text-[10px] text-gray-400">{order.customer_phone}</div>
                    </td>
                    <td className="py-4 px-4 font-bold">{formatCurrency(order.total)}</td>
                    <td className="py-4 px-4 text-gray-500 text-xs">{order.payment_method}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-xs">{order.order_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}