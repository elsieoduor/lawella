"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { use, useState, useEffect } from "react"
import { ArrowLeft, RefreshCw, Package } from "lucide-react"
import { CATEGORIES } from "@/lib/data"
import { ProductCard } from "@/components/product-card"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"

interface Props {
  params: Promise<{ category: string }>
}

export default function CategoryPage({ params }: Props) {
  const resolvedParams = use(params)
  const categoryKey = resolvedParams.category
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Find category metadata (emoji, label) from our local config
  const cat = CATEGORIES.find((c) => c.key === categoryKey)

  useEffect(() => {
    async function fetchCategoryProducts() {
      if (!cat || cat.key === "all") return
      
      setLoading(true)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", categoryKey)
        .eq("is_active", true) // Only show active items

      if (!error) {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchCategoryProducts()
  }, [categoryKey, cat, supabase])

  // If the category doesn't exist in our CATEGORIES list, 404
  if (!cat || cat.key === "all") notFound()

  return (
    <div className="pt-18">
      {/* Hero Header */}
      <div
        className="text-white px-4 sm:px-8 lg:px-20 pt-14 pb-12"
        style={{ background: "linear-gradient(135deg, #C41E3A 0%, #8B2635 100%)" }}
      >
        <div className="max-w-7xl mx-auto">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-4 py-1.5 text-sm font-medium mb-5 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Shop
          </Link>
          <div className="text-5xl mb-3">{cat.emoji}</div>
          <h1 className="font-display font-black text-[clamp(40px,6vw,72px)]">
            {cat.label}
          </h1>
          <p className="mt-3 text-white/80">
            {loading ? "Loading..." : `${products.length} handcrafted items`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-brand-red" size={32} />
            <p className="text-brand-gray">Fetching collection...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-display font-bold text-brand-black">No items yet</h3>
            <p className="text-brand-gray mt-2">We haven't added any items to {cat.label} yet. Check back soon!</p>
            <Link href="/shop">
              <button className="mt-6 text-brand-red font-bold hover:underline">Explore other categories</button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}