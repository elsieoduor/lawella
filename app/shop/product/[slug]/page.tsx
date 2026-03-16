"use client"

import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { use, useState, useEffect } from "react"
import { 
  ArrowLeft, 
  ShoppingBag, 
  MessageCircle, 
  Check, 
  Package, 
  Truck, 
  Gift, 
  RefreshCw, 
  Zap,
  Loader2
} from "lucide-react"
import { WHATSAPP_NUMBER } from "@/lib/data"
import { useCartStore } from "@/lib/store"
import { formatCurrency, getWhatsAppUrl, cn } from "@/lib/utils"
import { ProductVisual } from "@/components/product-visual"
import { ProductCard } from "@/components/product-card"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface Props {
  params: Promise<{ slug: string }>
}

export default function ProductPage({ params }: Props) {
  const resolvedParams = use(params)
  const urlSlug = resolvedParams.slug
  
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      // Fetch dynamic store settings (WhatsApp number, etc)
      const settingsRes = await fetch('/api/settings')
      const settingsData = await settingsRes.json()
      setSettings(settingsData)

      const searchTerm = urlSlug.replace(/-/g, '%')
      const { data: prod, error } = await supabase
        .from("products")
        .select("*")
        .ilike("name", searchTerm) 
        .single()

      if (error || !prod) {
        setLoading(false)
        return
      }

      setProduct(prod)
      setSelectedSize(prod.sizes?.[0] || "Standard")
      setSelectedColor(prod.colors?.[0] || "")

      const { data: rel } = await supabase
        .from("products")
        .select("*")
        .eq("category", prod.category)
        .neq("id", prod.id)
        .limit(3)

      setRelated(rel || [])
      setLoading(false)
    }
    loadData()
  }, [urlSlug, supabase])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-brand-red" size={40} />
        <p className="text-brand-gray font-medium font-display uppercase tracking-widest">Tailoring your view...</p>
      </div>
    )
  }

  if (!product) notFound()

  const handleAdd = () => {
    addItem(product, selectedSize, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  const handleBuyNow = () => {
    addItem(product, selectedSize, qty)
    router.push("/checkout")
  }

  // Enhanced dynamic WhatsApp message
  const waMessage = `Hi Lawella! I'm interested in ordering:
- ${product.name}
- Size: ${selectedSize}
${selectedColor ? `- Color: ${selectedColor}` : ""}
- Quantity: ${qty}
Total: ${formatCurrency(product.price * qty)}`

  return (
    <div className="pt-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-10">
        {/* Breadcrumb */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-brand-gray text-sm font-medium hover:text-brand-red transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left – Visual */}
          <div className="animate-fade-in">
            <div className="bg-brand-cream rounded-3xl p-10 flex justify-center items-center shadow-brand-sm">
              <ProductVisual product={product} size={500} />
            </div>
            {/* Color swatches (Assuming they exist in your DB) */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex gap-3 mt-5 px-2">
                {product.colors.map((c: string, i: number) => (
                  <div
                    key={i}
                    style={{ background: c }}
                    className="w-8 h-8 rounded-full border-[3px] border-white shadow-md"
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right – Details */}
          <div className="animate-slide-left">
            <div className="flex items-center gap-3 mb-2">
              {product.badge && (
                <Badge className="bg-brand-red text-white border-0 text-xs font-bold">
                  {product.badge}
                </Badge>
              )}
              <span className="text-brand-gray text-xs font-bold uppercase tracking-widest">
                {product.category}
              </span>
            </div>

            <h1 className="font-display font-black text-[clamp(32px,4vw,52px)] leading-tight mb-4">
              {product.name}
            </h1>

            <div className="font-display font-black text-4xl text-brand-red mb-6">
              {formatCurrency(product.price)}
            </div>

            <p className="text-brand-gray leading-relaxed text-base mb-8">
              {product.description || product.desc}
            </p>

            {/* Size selector */}
            {product.sizes && product.sizes.length > 1 && (
              <div className="mb-7">
                <p className="font-semibold text-sm mb-3">
                  Size: <span className="text-brand-red">{selectedSize}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={cn(
                        "px-5 py-2 rounded-xl font-semibold text-sm border-2 transition-all",
                        selectedSize === s
                          ? "bg-brand-red text-white border-brand-red"
                          : "bg-white border-black/12 hover:border-brand-red/60"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-7">
              <p className="font-semibold text-sm mb-3">Quantity</p>
              <div className="inline-flex items-center gap-4 bg-white border-2 border-black/10 rounded-2xl p-1.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl bg-brand-cream flex items-center justify-center font-bold text-xl hover:bg-brand-red-light transition-colors"
                >
                  −
                </button>
                <span className="font-display font-bold text-xl min-w-7 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-9 rounded-xl bg-brand-red text-white flex items-center justify-center font-bold text-xl hover:bg-brand-red-dark transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Display */}
            <div className="bg-brand-red-light rounded-2xl px-5 py-4 flex justify-between items-center mb-7">
              <span className="text-brand-gray font-medium">Total</span>
              <span className="font-display font-black text-2xl text-brand-red">
                {formatCurrency(product.price * qty)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <Button
                onClick={handleAdd}
                className={cn(
                  "w-full py-6 rounded-2xl text-base font-bold gap-2 transition-all",
                  added
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-brand-red hover:bg-brand-red-dark text-white shadow-lg"
                )}
              >
                {added ? (
                  <><Check size={18} /> Added to Cart!</>
                ) : (
                  <><ShoppingBag size={18} /> Add to Cart</>
                )}
              </Button>

              <Button
                onClick={handleBuyNow}
                className="w-full py-6 rounded-2xl text-base font-bold gap-2 bg-brand-black hover:bg-brand-black/80 text-white"
              >
                <Zap size={18} /> Buy Now
              </Button>

              <a
                href={settings ? getWhatsAppUrl(settings.whatsapp_number, waMessage) : "#"}
                target="_blank"
                rel="noreferrer"
                className={!settings ? "opacity-50 pointer-events-none" : ""}
              >
                <Button className="w-full py-7 rounded-2xl text-base font-black bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-green-500/10">
                  {settings ? <><MessageCircle size={18} className="mr-2" /> Order via WhatsApp</> : <Loader2 className="animate-spin" />}
                </Button>
              </a>
            </div>

            {/* Perks */}
            <div className="flex flex-wrap gap-5 text-sm text-brand-gray font-medium">
              {[
                { icon: <Package size={15} />, label: "Handmade" },
                { icon: <Truck size={15} />, label: "Fast delivery" },
                { icon: <Gift size={15} />, label: "Gift wrapping" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {icon} {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display font-black text-3xl mb-8">
              You might also <em className="text-brand-red">love</em>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}