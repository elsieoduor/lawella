"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Search, Package, RefreshCw, ExternalLink } from "lucide-react"
import { CATEGORIES } from "@/lib/data"
import { Product } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pagination } from "@/components/pagination"

const stockClass = (s: number) =>
  s <= 5  ? "text-red-600 bg-red-50 font-bold"
  : s <= 10 ? "text-yellow-700 bg-yellow-50 font-bold"
  : "text-green-700 bg-green-50 font-semibold"

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function AdminProductsPage() {
  const [products, setProducts]         = useState<Product[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [filterCat, setFilterCat]       = useState("all")
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [page, setPage]                 = useState(1)
  const [pageSize, setPageSize]         = useState(10)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/products")
      if (res.ok) setProducts(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" })
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    } finally { setDeleting(false); setDeleteTarget(null) }
  }

  const filtered = products
    .filter((p) => filterCat === "all" || p.category === filterCat)
    .filter((p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)

  const onFilter = (cat: string) => { setFilterCat(cat); setPage(1) }
  const onSearch = (v: string)   => { setSearch(v);      setPage(1) }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-brand-black">Products</h1>
          <p className="text-gray-500 mt-1 text-sm">{products.length} total products in your store</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={loadProducts} className="rounded-xl gap-2 border-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/admin/products/new">
            <Button className="bg-brand-red hover:bg-brand-red-dark text-white rounded-xl gap-2 shadow-md">
              <Plus size={16}/>
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Category stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {CATEGORIES.filter((c) => c.key !== "all").map((cat) => {
          const count = products.filter((p) => p.category === cat.key).length
          return (
            <Card
              key={cat.key}
              className={cn("border-2 cursor-pointer hover:shadow-md transition-all",
                filterCat === cat.key ? "border-brand-red bg-brand-red-light" : "border-transparent shadow-sm")}
              onClick={() => onFilter(cat.key === filterCat ? "all" : cat.key)}
            >
              <CardContent className="pt-4 pb-3 sm:pt-5 sm:pb-4">
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="font-display font-bold text-xl">{count}</div>
                <div className="text-gray-500 text-xs">{cat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search + category filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <Input value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products…" className="pl-9 rounded-xl border-2"/>
        </div>
        <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => onFilter(cat.key)}
              className={cn("px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 transition-all whitespace-nowrap",
                filterCat === cat.key
                  ? "bg-brand-red text-white border-brand-red"
                  : "bg-white border-gray-200 text-gray-600 hover:border-brand-red/40")}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-30"/>
            <p>Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30"/>
            <p>{search || filterCat !== "all" ? "No products match your filters." : "No products yet."}</p>
            {!search && filterCat === "all" && (
              <Link href="/admin/products/new">
                <Button size="sm" className="mt-4 bg-brand-red text-white rounded-xl gap-1.5">
                  <Plus size={13}/> Add your first product
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Product","Category","Price","Stock","Badge","Sizes","Actions"].map((h) => (
                      <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      {/* Product */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-brand-cream flex items-center justify-center shrink-0 border border-black/5">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display="none" }}/>
                              : <span className="text-xl">{p.emoji || "🧶"}</span>}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-black leading-snug">{p.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-45">
                              {(p as any).description ?? (p as any).desc}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize text-gray-600 text-sm">{p.category}</td>
                      <td className="py-4 px-4 font-display font-bold text-brand-red">{formatCurrency(p.price)}</td>
                      <td className="py-4 px-4">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-xs", stockClass(p.stock ?? 99))}>
                          {p.stock ?? "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {p.badge
                          ? <Badge className="bg-brand-red text-white text-[10px] border-0">{p.badge}</Badge>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-xs">
                        {Array.isArray(p.sizes) ? p.sizes.join(", ") : p.sizes || "—"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-1.5">
                          <Link href={`/admin/products/${p.id}/edit`}>
                            <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1 hover:border-brand-red hover:text-brand-red">
                              <Pencil size={12}/> Edit
                            </Button>
                          </Link>
                          <Link href={`/shop/product/${p.id}`} target="_blank">
                            <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-2 hover:border-blue-400 hover:text-blue-500">
                              <ExternalLink size={12}/>
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => setDeleteTarget(p)}
                            className="rounded-lg border-2 h-8 px-2 hover:border-red-400 hover:text-red-500">
                            <Trash2 size={12}/>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paged.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-cream flex items-center justify-center shrink-0 border border-black/5">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover"/>
                        : <span className="text-xl">{p.emoji || "🧶"}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-black truncate">{p.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{p.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-black text-brand-red">{formatCurrency(p.price)}</div>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px]", stockClass(p.stock ?? 99))}>
                        {p.stock ?? "—"} in stock
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {p.badge && <Badge className="bg-brand-red text-white text-[10px] border-0">{p.badge}</Badge>}
                    <span className="text-xs text-gray-400">
                      {Array.isArray(p.sizes) ? p.sizes.join(", ") : p.sizes || "—"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/products/${p.id}/edit`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full rounded-xl border-2 h-9 gap-1.5 hover:border-brand-red hover:text-brand-red">
                        <Pencil size={13}/> Edit
                      </Button>
                    </Link>
                    <Link href={`/shop/product/${p.id}`} target="_blank">
                      <Button size="sm" variant="outline" className="rounded-xl border-2 h-9 px-3 hover:border-blue-400 hover:text-blue-500">
                        <ExternalLink size={13}/>
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => setDeleteTarget(p)}
                      className="rounded-xl border-2 h-9 px-3 hover:border-red-400 hover:text-red-500">
                      <Trash2 size={13}/>
                    </Button>
                  </div>
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold text-xl">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.name}&quot;</strong>?
              It will be hidden from your store immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
              {deleting ? "Deleting…" : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
