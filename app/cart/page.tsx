"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, MessageCircle, ArrowLeft, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { formatCurrency, getWhatsAppUrl } from "@/lib/utils"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const total = useCartStore((s) => s.total())

  // --- Settings State ---
  const [settings, setSettings] = useState({
    whatsapp_number: "254700000000", // Default fallback
    delivery_fee: 300,
    free_delivery_threshold: 5000
  })
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [])

  const deliveryFee = total >= settings.free_delivery_threshold ? 0 : settings.delivery_fee

  const waMessage = `Hi Lawella! I'd like to order:\n${items
    .map((i) => `- ${i.name} (${i.selectedSize}) x${i.qty}`)
    .join("\n")}\n\nTotal: ${formatCurrency(total + deliveryFee)}`

  return (
    <div className="min-h-screen bg-brand-cream/20 pt-18">
      <div className="bg-brand-red text-white px-4 sm:px-8 lg:px-20 pt-14 pb-12">
        <div className="max-w-7xl mx-auto">
          <Link href="/shop" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-4">
            <ArrowLeft size={14} /> Back to Shop
          </Link>
          <h1 className="font-display font-black text-[clamp(36px,5vw,60px)] leading-none">
            Your <em>Cart</em>
          </h1>
          <p className="mt-4 text-white/80 font-medium">
            {items.length} item{items.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-12">
        {items.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-brand-sm border-2 border-dashed border-brand-red/10">
            <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={40} className="text-brand-red" />
            </div>
            <h2 className="font-display text-3xl font-black mb-3">Your cart is empty</h2>
            <Link href="/shop">
              <Button className="bg-brand-red hover:bg-brand-red-dark text-white rounded-xl px-10 py-6 font-bold">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="bg-white rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-6 items-center shadow-brand-sm border border-brand-red/5">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-brand-cream shrink-0">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">{item.emoji}</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-brand-red/60 mb-1">{item.category}</p>
                    <h3 className="font-display font-bold text-base sm:text-lg truncate">{item.name}</h3>
                    <p className="text-xs text-brand-gray">Size: <span className="font-bold text-brand-black">{item.selectedSize}</span></p>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center bg-brand-cream/50 rounded-lg border border-brand-red/10 overflow-hidden">
                        <button onClick={() => updateQty(item.id, item.selectedSize, item.qty - 1)} className="p-2 hover:bg-brand-red/10 text-brand-red"><Minus size={14} /></button>
                        <span className="font-bold text-sm w-8 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.selectedSize, item.qty + 1)} className="p-2 hover:bg-brand-red/10 text-brand-red"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeItem(item.id, item.selectedSize)} className="text-brand-gray/40 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-display font-black text-lg text-brand-red">{formatCurrency(item.price * item.qty)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-brand sticky top-24 border border-brand-red/5">
              <h2 className="font-display font-bold text-xl mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-gray">Subtotal</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-brand-gray">Delivery</span>
                  <span className={deliveryFee === 0 ? "text-green-600 font-bold" : "font-bold"}>
                    {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                  </span>
                </div>

                {total < settings.free_delivery_threshold && (
                  <div className="bg-brand-cream/30 p-3 rounded-xl">
                    <p className="text-[11px] text-brand-gray">
                      Add <span className="font-bold text-brand-red">{formatCurrency(settings.free_delivery_threshold - total)}</span> more for <b>Free Delivery</b>!
                    </p>
                  </div>
                )}
              </div>

              <Separator className="mb-6" />

              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-lg">Total</span>
                <span className="font-display font-black text-2xl text-brand-red">{formatCurrency(total + deliveryFee)}</span>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/checkout">
                  <Button className="w-full py-7 rounded-2xl font-bold bg-brand-red hover:bg-brand-red-dark text-white">
                    Checkout Now →
                  </Button>
                </Link>
                
                <a
                  href={loadingSettings ? "#" : getWhatsAppUrl(settings.whatsapp_number, waMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className={loadingSettings ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" className="w-full py-7 rounded-2xl font-bold border-2 border-[#25D366] text-[#25D366] gap-2">
                    {loadingSettings ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
                    Order via WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}