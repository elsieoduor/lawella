"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CATEGORIES } from "@/lib/data"
import { ProductCard } from "@/components/product-card"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 12  // products per page

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [sort, setSort]         = useState("default")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)

  useEffect(() => {
    const supabase = createClient()
    setLoading(true)
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (!error) setProducts(data ?? [])
        setLoading(false)
      })
  }, [])

  // Reset to page 1 when filter or sort changes
  const setCategory = (c: string) => { setActiveCategory(c); setPage(1) }
  const setSort2    = (s: string) => { setSort(s);           setPage(1) }

  const filtered = products
    .filter((p) => activeCategory === "all" || p.category === activeCategory)
    .sort((a, b) => {
      if (sort === "price-asc")  return a.price - b.price
      if (sort === "price-desc") return b.price - a.price
      return 0
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Smart page number list (same logic as admin pagination component)
  const pageNums = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4)            return [1,2,3,4,5,"…",totalPages]
    if (page >= totalPages-3) return [1,"…",totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
    return [1,"…",page-1,page,page+1,"…",totalPages]
  }

  return (
    <div className="pt-18">
      {/* Header */}
      <div className="bg-brand-red text-white px-4 sm:px-8 lg:px-20 pt-14 pb-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/60 text-sm mb-3">Lawella / Shop</p>
          <h1 className="font-display font-black text-[clamp(40px,6vw,72px)]">
            Our <em>Collection</em>
          </h1>
          <p className="mt-3 text-white/80 text-base">
            Every piece handcrafted with care.{" "}
            {!loading && <span>{products.length} products and counting.</span>}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-10 sm:py-12">
        {/* Filters row */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => setCategory(cat.key)}
                className={cn(
                  "px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold border-2 transition-all whitespace-nowrap",
                  activeCategory === cat.key
                    ? "bg-brand-red text-white border-brand-red"
                    : "bg-white text-brand-black border-black/10 hover:border-brand-red/50"
                )}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <Select value={sort} onValueChange={setSort2}>
            <SelectTrigger className="w-44 rounded-xl border-2">
              <SelectValue placeholder="Sort"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Sort: Default</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-brand-gray text-sm mb-6">
          {loading
            ? "Loading items…"
            : filtered.length === 0
            ? "No products in this category yet."
            : `Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} of ${filtered.length} product${filtered.length!==1?"s":""}`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-3/4 bg-gray-100 animate-pulse rounded-3xl"/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-brand-gray">
            <div className="text-5xl mb-4">🧶</div>
            <p className="font-display font-bold text-xl mb-2">Nothing here yet</p>
            <button onClick={() => setCategory("all")} className="text-brand-red font-semibold hover:underline text-sm">
              View all products →
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {paged.map((p) => <ProductCard key={p.id} product={p}/>)}
            </div>

            {/* Pagination — only shown if more than one page */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-gray-100">
                <p className="text-sm text-brand-gray">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-red hover:text-brand-red disabled:opacity-40 disabled:cursor-default transition-all"
                  >
                    <ChevronLeft size={16}/>
                  </button>

                  {pageNums().map((p_, i) => (
                    <button key={i}
                      onClick={() => typeof p_ === "number" && setPage(p_)}
                      disabled={p_ === "…"}
                      className={cn(
                        "w-9 h-9 rounded-xl text-sm font-semibold transition-all",
                        p_ === page
                          ? "bg-brand-red text-white border-2 border-brand-red"
                          : p_ === "…"
                          ? "cursor-default text-gray-300 border-2 border-transparent"
                          : "border-2 border-gray-200 text-gray-600 hover:border-brand-red hover:text-brand-red"
                      )}>
                      {p_}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-red hover:text-brand-red disabled:opacity-40 disabled:cursor-default transition-all"
                  >
                    <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer/>
    </div>
  )
}
