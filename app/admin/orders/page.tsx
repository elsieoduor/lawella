"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, RefreshCw, ShoppingBag, ExternalLink, ChevronDown } from "lucide-react"
import { Order } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"


const ORDER_STATUSES = ["all","pending","processing","shipped","delivered","cancelled"] as const
const PAY_STATUSES   = ["all","unpaid","pending_verification","paid","failed","refunded"] as const

const orderStatusStyle: Record<string, string> = {
  pending:"bg-yellow-100 text-yellow-800", processing:"bg-blue-100 text-blue-800",
  shipped:"bg-purple-100 text-purple-800", delivered:"bg-green-100 text-green-800",
  cancelled:"bg-gray-100 text-gray-600",
}
const payStatusStyle: Record<string, string> = {
  unpaid:"bg-orange-100 text-orange-700", pending_verification:"bg-amber-100 text-amber-700",
  paid:"bg-green-100 text-green-700", failed:"bg-red-100 text-red-700", refunded:"bg-gray-100 text-gray-600",
}
const methodLabel: Record<string, string> = {
  mpesa:"M-Pesa", cash:"Cash", bank:"Bank",
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [payFilter, setPayFilter]       = useState("all")
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
    if (payFilter    !== "all" && o.payment_status !== payFilter)  return false
    if (search) {
      const q = search.toLowerCase()
      return (o.order_number?.toLowerCase().includes(q) ?? false) ||
        o.customer_name.toLowerCase().includes(q) || o.customer_phone.toLowerCase().includes(q)
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)

  const totalRevenue = orders.filter(o=>o.payment_status==="paid").reduce((s,o)=>s+o.total,0)
  const pendingCount = orders.filter(o=>o.status==="pending").length
  const unpaidCount  = orders.filter(o=>o.payment_status==="unpaid" || o.payment_status==="pending_verification").length

  const onFilter = (setter: (v: string)=>void) => (v: string) => { setter(v); setPage(1) }
  const onSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-brand-black">Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">{orders.length} total orders</p>
        </div>
        <Button variant="outline" onClick={load} className="rounded-xl gap-2 border-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label:"Total Orders",     value:orders.length,          color:"text-brand-black"  },
          { label:"Revenue (Paid)",   value:formatCurrency(totalRevenue), color:"text-green-600" },
          { label:"Pending Orders",   value:pendingCount,           color:"text-yellow-600"   },
          { label:"Awaiting Payment", value:unpaidCount,            color:"text-orange-600"   },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 sm:pt-5 sm:pb-4">
              <div className={cn("font-display font-black text-xl sm:text-2xl", s.color)}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters — scrollable on mobile */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <Input value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by order #, name, phone…" className="pl-9 rounded-xl border-2"/>
        </div>
        {/* <div className="flex gap-2 flex-wrap items-center overflow-x-auto pb-1">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide shrink-0">Status:</span>
          {ORDER_STATUSES.map((s) => (
            <button key={s} onClick={() => onFilter(setStatusFilter)(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border-2 capitalize whitespace-nowrap transition-all",
                statusFilter===s ? "bg-brand-red text-white border-brand-red" : "bg-white border-gray-200 text-gray-600 hover:border-brand-red/40")}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center overflow-x-auto pb-1">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide shrink-0">Payment:</span>
          {PAY_STATUSES.map((s) => (
            <button key={s} onClick={() => onFilter(setPayFilter)(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border-2 capitalize whitespace-nowrap transition-all",
                payFilter===s ? "bg-brand-black text-white border-brand-black" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400")}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div> */}
        <div className="flex gap-4 items-center">
          {/* Order Status Filter */}
          <OrderFilterDropdown 
            label="Status"
            options={ORDER_STATUSES}
            currentValue={statusFilter}
            onSelect={(val) => onFilter(setStatusFilter)(val)}
            activeColorClass="bg-brand-red"
          />

          {/* Payment Status Filter */}
          <OrderFilterDropdown 
            label="Payment"
            options={PAY_STATUSES}
            currentValue={payFilter}
            onSelect={(val) => onFilter(setPayFilter)(val)}
            activeColorClass="bg-brand-black"
          />
        </div>
      </div>

      {/* Table — desktop */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-30"/> Loading orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-30"/>
            <p>No orders found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Order","Customer","Total","Status","Payment","Method","Date",""].map((h) => (
                      <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-red text-xs">{o.order_number || "N/A"}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-brand-black leading-snug">{o.customer_name}</div>
                        <div className="text-xs text-gray-400">{o.customer_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-display font-bold text-brand-black">{formatCurrency(o.total)}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", orderStatusStyle[o.status]??"")}>{o.status}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", payStatusStyle[o.payment_status]??"")}>
                          {o.payment_status?.replace("_"," ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">{methodLabel[o.payment_method]??o.payment_method}</td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"2-digit"})}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/admin/orders/${o.id}`}>
                          <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-brand-red hover:text-brand-red">
                            <ExternalLink size={13}/> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {paged.map((o) => (
                <div key={o.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono font-bold text-brand-red text-sm">{o.order_number}</span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString("en-KE",{day:"numeric",month:"short"})}
                      </div>
                    </div>
                    <div className="font-display font-black text-brand-black">{formatCurrency(o.total)}</div>
                  </div>
                  <div className="font-semibold text-sm mb-1">{o.customer_name}</div>
                  <div className="text-xs text-gray-400 mb-2">{o.customer_phone}</div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold capitalize", orderStatusStyle[o.status]??"")}>{o.status}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", payStatusStyle[o.payment_status]??"")}>
                      {o.payment_status?.replace("_"," ")}
                    </span>
                    <span className="text-[10px] text-gray-400">{methodLabel[o.payment_method]}</span>
                  </div>
                  <Link href={`/admin/orders/${o.id}`}>
                    <Button size="sm" variant="outline" className="w-full rounded-xl border-2 h-9 gap-2 hover:border-brand-red hover:text-brand-red">
                      <ExternalLink size={13}/> View Order
                    </Button>
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

export function OrderFilterDropdown({ 
  label, 
  options, 
  currentValue, 
  onSelect,
  activeColorClass = "bg-brand-red" 
}: { 
  label: string;
  options: readonly string[];
  currentValue: string;
  onSelect: (val: string) => void;
  activeColorClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 rounded-xl border-2 capitalize font-semibold transition-all",
              currentValue !== "all" && `${activeColorClass} text-white border-transparent hover:bg-opacity-90`
            )}
          >
            {currentValue.replace("_", " ")}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 rounded-xl">
          <DropdownMenuLabel className="text-xs text-gray-400">Filter by {label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={currentValue} onValueChange={onSelect}>
            {options.map((opt) => (
              <DropdownMenuRadioItem 
                key={opt} 
                value={opt} 
                className="capitalize text-sm font-medium focus:bg-gray-100"
              >
                {opt.replace("_", " ")}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}