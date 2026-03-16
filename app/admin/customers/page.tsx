"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, RefreshCw, Users, TrendingUp } from "lucide-react"
import { Customer } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/customers")
      if (res.ok) setCustomers(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    )
  })

  const totalCustomers = customers.length
  const totalRevenue   = customers.reduce((s, c) => s + c.total_spent, 0)
  const avgOrderValue  = customers.length
    ? Math.round(customers.reduce((s, c) => s + c.total_spent / c.order_count, 0) / customers.length)
    : 0
  const repeatCount    = customers.filter((c) => c.order_count > 1).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display font-black text-3xl text-brand-black">Customers</h1>
          <p className="text-gray-500 mt-1">{customers.length} unique customers</p>
        </div>
        <Button variant="outline" onClick={load} className="rounded-xl gap-2 border-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Customers", value: totalCustomers,            color: "text-brand-black" },
          { label: "Total Revenue",   value: formatCurrency(totalRevenue), color: "text-green-600" },
          { label: "Avg Order Value", value: formatCurrency(avgOrderValue), color: "text-blue-600" },
          { label: "Repeat Buyers",   value: `${repeatCount} (${totalCustomers ? Math.round(repeatCount/totalCustomers*100) : 0}%)`, color: "text-brand-red" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className={cn("font-display font-black text-2xl", s.color)}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email…"
          className="pl-9 rounded-xl border-2" />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Customer","Phone","Email","Orders","Total Spent","Avg Order","Last Order",""].map((h) => (
                  <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-30" />
                  Loading customers…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>{search ? "No customers match your search." : "No customers yet."}</p>
                </td></tr>
              ) : filtered.map((c) => (
                <tr key={c.phone} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-red-light flex items-center justify-center text-brand-red font-bold text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-brand-black">{c.name}</div>
                        {c.order_count > 1 && (
                          <div className="flex items-center gap-1 text-[10px] text-brand-red font-bold">
                            <TrendingUp size={10} /> Repeat buyer
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-sm text-gray-600">{c.phone}</td>
                  <td className="py-4 px-4 text-gray-500 text-sm">{c.email ?? <span className="text-gray-300">—</span>}</td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-brand-black">{c.order_count}</span>
                    <span className="text-gray-400 text-xs ml-1">order{c.order_count !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="py-4 px-4 font-display font-bold text-brand-red">{formatCurrency(c.total_spent)}</td>
                  <td className="py-4 px-4 text-gray-600">{formatCurrency(Math.round(c.total_spent / c.order_count))}</td>
                  <td className="py-4 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(c.last_order_at).toLocaleDateString("en-KE", { day:"numeric",month:"short",year:"2-digit" })}
                  </td>
                  <td className="py-4 px-4">
                    <Link href={`/admin/customers/${encodeURIComponent(c.phone)}`}>
                      <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-brand-red hover:text-brand-red">
                        History
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {customers.length} customers · Sorted by total spend
        </div>
      </Card>
    </div>
  )
}
