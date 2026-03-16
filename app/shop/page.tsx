// "use client"

// import { useState, useEffect } from "react"
// import { CATEGORIES } from "@/lib/data" // We keep this for the UI categories
// import { ProductCard } from "@/components/product-card"
// import { Footer } from "@/components/footer"
// import { createClient } from "@/lib/supabase/client" // Client-side helper
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { cn } from "@/lib/utils"

// export default function ShopPage() {
//   const [activeCategory, setActiveCategory] = useState("all")
//   const [sort, setSort] = useState("default")
//   const [products, setProducts] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
  
//   const supabase = createClient()

//   // 1. Fetch all active products from Supabase
//   useEffect(() => {
//     async function fetchProducts() {
//       setLoading(true)
//       const { data, error } = await supabase
//         .from("products")
//         .select("*")
//         .eq("is_active", true) // Only show active items

//       if (error) {
//         console.error("Error fetching products:", error)
//       } else {
//         setProducts(data || [])
//       }
//       setLoading(false)
//     }

//     fetchProducts()
//   }, [supabase])

//   // 2. Filter and Sort logic (runs on the fetched 'products' state)
//   const filtered = products
//     .filter((p) => activeCategory === "all" || p.category === activeCategory)
//     .sort((a, b) => {
//       if (sort === "price-asc") return a.price - b.price
//       if (sort === "price-desc") return b.price - a.price
//       return 0
//     })

//   return (
//     <div className="pt-[72px]">
//       {/* Header */}
//       <div className="bg-brand-red text-white px-4 sm:px-8 lg:px-20 pt-14 pb-12">
//         <div className="max-w-7xl mx-auto">
//           <p className="text-white/60 text-sm mb-3">Lawella / Shop</p>
//           <h1 className="font-display font-black text-[clamp(40px,6vw,72px)]">
//             Our <em>Collection</em>
//           </h1>
//           <p className="mt-3 text-white/80 text-base">
//             Every piece handcrafted with care. {products.length} products and counting.
//           </p>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-12">
//         {/* Filters */}
//         <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
//           <div className="flex flex-wrap gap-2">
//             {CATEGORIES.map((cat) => (
//               <button
//                 key={cat.key}
//                 onClick={() => setActiveCategory(cat.key)}
//                 className={cn(
//                   "px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer",
//                   activeCategory === cat.key
//                     ? "bg-brand-red text-white border-brand-red"
//                     : "bg-white text-brand-black border-black/10 hover:border-brand-red/50"
//                 )}
//               >
//                 {cat.emoji} {cat.label}
//               </button>
//             ))}
//           </div>

//           <Select value={sort} onValueChange={setSort}>
//             <SelectTrigger className="w-44 rounded-xl border-2">
//               <SelectValue placeholder="Sort" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="default">Sort: Default</SelectItem>
//               <SelectItem value="price-asc">Price: Low → High</SelectItem>
//               <SelectItem value="price-desc">Price: High → Low</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Results count */}
//         <p className="text-brand-gray text-sm mb-6">
//           {loading ? "Loading items..." : `Showing ${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
//         </p>

//         {/* Grid */}
//         {loading ? (
//            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//              {[...Array(4)].map((_, i) => (
//                <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-3xl" />
//              ))}
//            </div>
//         ) : filtered.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {filtered.map((p) => (
//               <ProductCard key={p.id} product={p} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-20 text-brand-gray">
//             No products in this category yet.
//           </div>
//         )}
//       </div>

//       <Footer />
//     </div>
//   )
// }
"use client"

import { useState, useEffect } from "react"
import { CATEGORIES } from "@/lib/data" // We keep this for the UI categories
import { ProductCard } from "@/components/product-card"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client" // Client-side helper
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [sort, setSort] = useState("default")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // 1. Fetch all active products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true) // Only show active items

      if (error) {
        console.error("Error fetching products:", error)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [supabase])

  // 2. Filter and Sort logic (runs on the fetched 'products' state)
  const filtered = products
    .filter((p) => activeCategory === "all" || p.category === activeCategory)
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price
      if (sort === "price-desc") return b.price - a.price
      return 0
    })

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
            Every piece handcrafted with care. {products.length} products and counting.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-12">
        {/* Filters */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer",
                  activeCategory === cat.key
                    ? "bg-brand-red text-white border-brand-red"
                    : "bg-white text-brand-black border-black/10 hover:border-brand-red/50"
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44 rounded-xl border-2">
              <SelectValue placeholder="Sort" />
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
          {loading ? "Loading items..." : `Showing ${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
        </p>

        {/* Grid */}
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[...Array(4)].map((_, i) => (
               <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-3xl" />
             ))}
           </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-brand-gray">
            No products in this category yet.
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}