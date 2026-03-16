// "use client"

// import { useState, useEffect, useCallback } from "react"
// import Link from "next/link"
// import { Plus, Pencil, Trash2, Search, Package, RefreshCw, ExternalLink } from "lucide-react"
// import { CATEGORIES } from "@/lib/data"
// import { Product } from "@/lib/types"
// import { formatCurrency, cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent } from "@/components/ui/card"
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
//   AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from "@/components/ui/alert-dialog"

// const stockClass = (s: number) =>
//   s <= 5 ? "text-red-600 bg-red-50 font-bold"
//   : s <= 10 ? "text-yellow-700 bg-yellow-50 font-bold"
//   : "text-green-700 bg-green-50 font-semibold"

// export default function AdminProductsPage() {
//   const [products, setProducts]         = useState<Product[]>([])
//   const [loading, setLoading]           = useState(true)
//   const [search, setSearch]             = useState("")
//   const [filterCat, setFilterCat]       = useState("all")
//   const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
//   const [deleting, setDeleting]         = useState(false)

//   const loadProducts = useCallback(async () => {
//     setLoading(true)
//     try {
//       const res = await fetch("/api/products")
//       if (res.ok) setProducts(await res.json())
//     } catch { /* ignore */ } finally { setLoading(false) }
//   }, [])

//   useEffect(() => { loadProducts() }, [loadProducts])

//   const handleDelete = async () => {
//     if (!deleteTarget) return
//     setDeleting(true)
//     try {
//       await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" })
//       setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
//     } finally { setDeleting(false); setDeleteTarget(null) }
//   }

//   const filtered = products
//     .filter((p) => filterCat === "all" || p.category === filterCat)
//     .filter((p) =>
//       !search ||
//       p.name.toLowerCase().includes(search.toLowerCase()) ||
//       p.category.toLowerCase().includes(search.toLowerCase())
//     )

//   return (
//     <div className="p-8">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="font-display font-black text-3xl text-brand-black">Products</h1>
//           <p className="text-gray-500 mt-1">{products.length} total products in your store</p>
//         </div>
//         <div className="flex gap-3">
//           <Button variant="outline" size="sm" onClick={loadProducts} className="rounded-xl gap-2 border-2">
//             <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh
//           </Button>
//           <Link href="/admin/products/new">
//             <Button className="bg-brand-red hover:bg-brand-red-dark text-white rounded-xl gap-2 shadow-md">
//               <Plus size={16}/> Add Product
//             </Button>
//           </Link>
//         </div>
//       </div>

//       {/* Category stats */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
//         {CATEGORIES.filter((c) => c.key !== "all").map((cat) => {
//           const count = products.filter((p) => p.category === cat.key).length
//           return (
//             <Card
//               key={cat.key}
//               className={cn("border-2 cursor-pointer hover:shadow-md transition-all",
//                 filterCat === cat.key ? "border-brand-red bg-brand-red-light" : "border-transparent shadow-sm")}
//               onClick={() => setFilterCat(cat.key === filterCat ? "all" : cat.key)}
//             >
//               <CardContent className="pt-5 pb-4">
//                 <div className="text-2xl mb-1">{cat.emoji}</div>
//                 <div className="font-display font-bold text-xl">{count}</div>
//                 <div className="text-gray-500 text-xs">{cat.label}</div>
//               </CardContent>
//             </Card>
//           )
//         })}
//       </div>

//       {/* Search + category filters */}
//       <div className="flex flex-wrap gap-3 mb-6">
//         <div className="relative flex-1 min-w-[200px]">
//           <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//           <Input value={search} onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search products…" className="pl-9 rounded-xl border-2"/>
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           {CATEGORIES.map((cat) => (
//             <button key={cat.key} onClick={() => setFilterCat(cat.key)}
//               className={cn("px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
//                 filterCat === cat.key
//                   ? "bg-brand-red text-white border-brand-red"
//                   : "bg-white border-gray-200 text-gray-600 hover:border-brand-red/40")}>
//               {cat.emoji} {cat.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Table */}
//       <Card className="border-0 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-50 border-b border-gray-100">
//               <tr>
//                 {["Product","Category","Price","Stock","Badge","Sizes","Actions"].map((h) => (
//                   <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr><td colSpan={7} className="text-center py-16 text-gray-400">
//                   <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-30"/>
//                   <p>Loading products…</p>
//                 </td></tr>
//               ) : filtered.length === 0 ? (
//                 <tr><td colSpan={7} className="text-center py-16 text-gray-400">
//                   <Package size={40} className="mx-auto mb-3 opacity-30"/>
//                   <p>{search ? "No products match your search." : "No products yet."}</p>
//                   {!search && (
//                     <Link href="/admin/products/new">
//                       <Button size="sm" className="mt-4 bg-brand-red text-white rounded-xl gap-1.5"><Plus size={13}/> Add your first product</Button>
//                     </Link>
//                   )}
//                 </td></tr>
//               ) : filtered.map((p) => (
//                 <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
//                   {/* Product */}
//                   <td className="py-4 px-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
//                         style={{ background: p.colors?.[0] ?? "#C41E3A" }}>
//                         {p.emoji}
//                       </div>
//                       <div>
//                         <div className="font-semibold text-brand-black leading-snug">{p.name}</div>
//                         <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[200px]">{p.desc ?? (p as any).description}</div>
//                       </div>
//                     </div>
//                   </td>
//                   {/* Category */}
//                   <td className="py-4 px-4 capitalize text-gray-600">{p.category}</td>
//                   {/* Price */}
//                   <td className="py-4 px-4 font-display font-bold text-brand-red">{formatCurrency(p.price)}</td>
//                   {/* Stock */}
//                   <td className="py-4 px-4">
//                     <span className={cn("px-2.5 py-0.5 rounded-full text-xs", stockClass(p.stock ?? 99))}>
//                       {p.stock ?? "—"}
//                     </span>
//                   </td>
//                   {/* Badge */}
//                   <td className="py-4 px-4">
//                     {p.badge
//                       ? <Badge className="bg-brand-red text-white text-[10px] border-0">{p.badge}</Badge>
//                       : <span className="text-gray-300">—</span>}
//                   </td>
//                   {/* Sizes */}
//                   <td className="py-4 px-4 text-gray-500">{p.sizes.join(", ")}</td>
//                   {/* Actions */}
//                   <td className="py-4 px-4">
//                     <div className="flex gap-2">
//                       <Link href={`/admin/products/${p.id}/edit`}>
//                         <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-brand-red hover:text-brand-red">
//                           <Pencil size={13}/> Edit
//                         </Button>
//                       </Link>
//                       <Link href={`/shop/product/${p.name}`} target="_blank">
//                         <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-blue-400 hover:text-blue-500">
//                           <ExternalLink size={13}/> View
//                         </Button>
//                       </Link>
//                       <Button size="sm" variant="outline" onClick={() => setDeleteTarget(p)}
//                         className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-red-400 hover:text-red-500">
//                         <Trash2 size={13}/> Delete
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
//           <span>Showing {filtered.length} of {products.length} products</span>
//           {filterCat !== "all" && (
//             <button onClick={() => setFilterCat("all")} className="text-brand-red hover:underline">Clear filter</button>
//           )}
//         </div>
//       </Card>

//       {/* Delete confirmation */}
//       <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
//         <AlertDialogContent className="rounded-2xl">
//           <AlertDialogHeader>
//             <AlertDialogTitle className="font-display font-bold text-xl">Delete Product?</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete <strong>&quot;{deleteTarget?.name}&quot;</strong>?
//               The product will be hidden from your store. This cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={handleDelete} disabled={deleting}
//               className="bg-red-500 hover:bg-red-600 text-white rounded-xl gap-2">
//               {deleting ? "Deleting…" : "Delete Product"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   )
// }
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

const stockClass = (s: number) =>
  s <= 5 ? "text-red-600 bg-red-50 font-bold"
  : s <= 10 ? "text-yellow-700 bg-yellow-50 font-bold"
  : "text-green-700 bg-green-50 font-semibold"

export default function AdminProductsPage() {
  const [products, setProducts]         = useState<Product[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [filterCat, setFilterCat]       = useState("all")
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting]         = useState(false)

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display font-black text-3xl text-brand-black">Products</h1>
          <p className="text-gray-500 mt-1">{products.length} total products in your store</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadProducts} className="rounded-xl gap-2 border-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh
          </Button>
          <Link href="/admin/products/new">
            <Button className="bg-brand-red hover:bg-brand-red-dark text-white rounded-xl gap-2 shadow-md">
              <Plus size={16}/> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {CATEGORIES.filter((c) => c.key !== "all").map((cat) => {
          const count = products.filter((p) => p.category === cat.key).length
          return (
            <Card
              key={cat.key}
              className={cn("border-2 cursor-pointer hover:shadow-md transition-all",
                filterCat === cat.key ? "border-brand-red bg-brand-red-light" : "border-transparent shadow-sm")}
              onClick={() => setFilterCat(cat.key === filterCat ? "all" : cat.key)}
            >
              <CardContent className="pt-5 pb-4">
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="font-display font-bold text-xl">{count}</div>
                <div className="text-gray-500 text-xs">{cat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-50">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…" className="pl-9 rounded-xl border-2"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setFilterCat(cat.key)}
              className={cn("px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Product","Category","Price","Stock","Badge","Sizes","Actions"].map((h) => (
                  <th key={h} className="text-left py-3.5 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-30"/>
                  <p>Loading products…</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <Package size={40} className="mx-auto mb-3 opacity-30"/>
                  <p>{search ? "No products match your search." : "No products yet."}</p>
                </td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-cream flex items-center justify-center shrink-0 border border-black/5 shadow-sm relative">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xl">{p.emoji || "🧶"}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-brand-black leading-snug">{p.name}</div>
                        {/* Handling both 'desc' and 'description' keys */}
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-50">
                          {p.description || (p as any).desc}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 capitalize text-gray-600">{p.category}</td>
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
                  <td className="py-4 px-4 text-gray-500">
                    {Array.isArray(p.sizes) ? p.sizes.join(", ") : p.sizes || "—"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${p.id}/edit`}>
                        <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-brand-red hover:text-brand-red">
                          <Pencil size={13}/> Edit
                        </Button>
                      </Link>
                      
                      {/* FIXED: URL encoding for name-based route */}
                      <Link href={`/shop/product/${encodeURIComponent(p.name)}`} target="_blank">
                        <Button size="sm" variant="outline" className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-blue-400 hover:text-blue-500">
                          <ExternalLink size={13}/> View
                        </Button>
                      </Link>

                      <Button size="sm" variant="outline" onClick={() => setDeleteTarget(p)}
                        className="rounded-lg border-2 h-8 px-3 gap-1.5 hover:border-red-400 hover:text-red-500">
                        <Trash2 size={13}/> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete confirmation remains the same */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold text-xl">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.name}&quot;</strong>?
              This will remove it from the database permanently.
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