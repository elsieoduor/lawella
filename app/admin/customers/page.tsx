"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, RefreshCw, Users, TrendingUp } from "lucide-react"
import { Customer } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(10)

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
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)

  const totalRevenue  = customers.reduce((s, c) => s + c.total_spent, 0)
  const avgOrderValue = customers.length
    ? Math.round(customers.reduce((s, c) => s + c.total_spent / c.order_count, 0) / customers.length) : 0
  const repeatCount   = customers.filter(c => c.order_count > 1).length

  const onSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-brand-black">Customers</h1>
          <p className="text-gray-500 mt-1 text-sm">{customers.length} unique customers</p>
        </div>
        <Button variant="outline" onClick={load} className="rounded-xl gap-2 border-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label:"Total Customers",  value:customers.length,            color:"text-brand-black" },
          { label:"Total Revenue",    value:formatCurrency(totalRevenue), color:"text-green-600"   },
          { label:"Avg Order Value",  value:formatCurrency(avgOrderValue),color:"text-blue-600"    },
          { label:"Repeat Buyers",    value:`${repeatCount} (${customers.length ? Math.round(repeatCount/customers.length*100):0}%)`, color:"text-brand-red" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 sm:pt-5 sm:pb-4">
              <div className={cn("font-display font-black text-xl sm:text-2xl", s.color)}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <Input value={search} onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, phone, email…" className="pl-9 rounded-xl border-2"/>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-30"/> Loading customers…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30"/>
            <p>{search ? "No customers match your search." : "No customers yet."}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Customer","Phone","Email","Orders","Total Spent","Avg Order","Last Order",""].map((h) => (
                      <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => (
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
                                <TrendingUp size={10}/> Repeat buyer
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-gray-600">{c.phone}</td>
                      <td className="py-4 px-4 text-gray-500 text-sm">{c.email ?? <span className="text-gray-300">—</span>}</td>
                      <td className="py-4 px-4"><span className="font-bold text-brand-black">{c.order_count}</span></td>
                      <td className="py-4 px-4 font-display font-bold text-brand-red">{formatCurrency(c.total_spent)}</td>
                      <td className="py-4 px-4 text-gray-600">{formatCurrency(Math.round(c.total_spent/c.order_count))}</td>
                      <td className="py-4 px-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(c.last_order_at).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"2-digit"})}
                      </td>
                      <td className="py-4 px-4">
                        <Link href={`/admin/customers/${encodeURIComponent(c.phone)}`}>
                          <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 hover:border-brand-red hover:text-brand-red">History</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {paged.map((c) => (
                <div key={c.phone} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-red-light flex items-center justify-center text-brand-red font-bold shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-black truncate">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.phone}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-black text-brand-red text-sm">{formatCurrency(c.total_spent)}</div>
                      <div className="text-[10px] text-gray-400">{c.order_count} order{c.order_count!==1?"s":""}</div>
                    </div>
                  </div>
                  {c.order_count > 1 && (
                    <div className="flex items-center gap-1 text-[10px] text-brand-red font-bold mb-2">
                      <TrendingUp size={10}/> Repeat buyer
                    </div>
                  )}
                  <Link href={`/admin/customers/${encodeURIComponent(c.phone)}`}>
                    <Button size="sm" variant="outline" className="w-full rounded-xl border-2 h-9 hover:border-brand-red hover:text-brand-red">View History</Button>
                  </Link>
                </div>
              ))}
            </div>

            <Pagination
              page={page} totalPages={totalPages} pageSize={pageSize}
              totalItems={filtered.length} onPage={setPage}
              onPageSize={(n) => { setPageSize(n); setPage(1) }}
              pageSizes={PAGE_SIZE_OPTIONS}
            />
          </>
        )}
      </Card>
    </div>
  )
}
