"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ShoppingBag, Check } from "lucide-react"
import { Product } from "@/lib/types"
import { useCartStore } from "@/lib/store"
import { formatCurrency, cn, slugify } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductVisual } from "@/components/product-visual"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const [added, setAdded] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  // Check if this specific product is already in the cart
  const inCart = items.some((i) => i.id === product.id)
  const hasImage = !!product.image_url && !imgErr

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault() // Prevents the Link from triggering when clicking the button
    e.stopPropagation()
    
    // Safety check: only add if sizes exist, otherwise use "Standard"
    const defaultSize = product.sizes?.length > 0 ? product.sizes[0] : "Standard"
    addItem(product, defaultSize)
    
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // Consistent slug generation for the URL
  const productPath = `/shop/product/${slugify(product.name)}`

  return (
    <Link href={`/shop/product/${product.name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="bg-white rounded-4xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-black/5">
        
        {/* Thumbnail / Image Area */}
        <div className="relative overflow-hidden bg-brand-cream aspect-square">
          {hasImage ? (
            <Image
              src={product.image_url!}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-8 group-hover:scale-110 transition-transform duration-700">
              <ProductVisual product={product} size={200} />
            </div>
          )}

          {/* Top Badge (e.g., "New", "Sale") */}
          {product.badge && (
            <Badge className="absolute top-4 left-4 bg-brand-red text-white border-0 text-[10px] font-bold tracking-widest uppercase py-1 px-3 z-10 shadow-lg">
              {product.badge}
            </Badge>
          )}

          {/* Stock Status */}
          {(product.stock ?? 99) <= 5 && (product.stock ?? 99) > 0 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-brand-red text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-sm border border-brand-red/10">
              ONLY {product.stock} LEFT
            </div>
          )}

          {/* Sold Out Overlay */}
          {(product.stock ?? 99) === 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="font-display font-black text-brand-gray text-xs bg-white px-5 py-2 rounded-full border shadow-sm tracking-widest uppercase">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-6">
          <div className="flex flex-col gap-1 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red/60">
              {product.category}
            </p>
            <h3 className="font-display font-bold text-xl leading-tight text-brand-black group-hover:text-brand-red transition-colors line-clamp-1">
              {product.name}
            </h3>
          </div>

          <p className="text-brand-gray text-sm leading-relaxed line-clamp-2 mb-6 h-10">
            {product.description || product.desc}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-brand-gray uppercase tracking-wider">Price</span>
              <span className="font-display font-black text-2xl text-brand-black">
                {formatCurrency(product.price)}
              </span>
            </div>

            <Button
              size="icon"
              onClick={handleAdd}
              disabled={(product.stock ?? 99) === 0}
              className={cn(
                "h-12 w-12 rounded-2xl transition-all duration-300 shadow-lg",
                added || inCart
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-green-200"
                  : "bg-brand-red text-white hover:bg-brand-red-dark shadow-brand-red/20"
              )}
            >
              {added ? (
                <Check size={20} strokeWidth={3} />
              ) : inCart ? (
                <Check size={20} strokeWidth={3} />
              ) : (
                <ShoppingBag size={20} strokeWidth={2.5} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}