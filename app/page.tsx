import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
import { PRODUCTS, CATEGORIES, WHATSAPP_NUMBER } from "@/lib/data"
import { getWhatsAppUrl } from "@/lib/utils"
import { ProductCard } from "@/components/product-card"
import { ProductVisual } from "@/components/product-visual"
import { Ticker } from "@/components/ticker"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const featured = PRODUCTS.slice(0, 4)

  return (
    <div className="pt-[72px]">
      {/* ── Hero ── */}
      <section className="min-h-[92vh] bg-brand-cream flex items-center px-4 sm:px-8 lg:px-20 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[10%] right-[-5%] w-[420px] h-[420px] rounded-[60%_40%_55%_45%] bg-brand-red/8 pointer-events-none" />
        <div className="absolute bottom-[5%] right-[15%] w-48 h-48 rounded-full bg-brand-red/5 pointer-events-none" />
        <div className="absolute top-[30%] right-[8%] text-[220px] opacity-[0.05] pointer-events-none select-none animate-float">
          🧶
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10 py-20">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-red-light text-brand-red px-4 py-1.5 rounded-full text-sm font-semibold mb-7 animate-fade-up">
              ✦ Handmade with love
            </div>
            <h1 className="font-display font-black text-[clamp(52px,7vw,88px)] leading-[1.02] text-brand-black mb-7 animate-fade-up animate-delay-100">
              Crochet<br />
              <em className="text-brand-red italic">crafted</em><br />
              for you.
            </h1>
            <p className="text-lg text-brand-gray leading-relaxed max-w-lg mb-11 animate-fade-up animate-delay-200">
              Sweaters, blankets, tote bags & scrunchies — all lovingly handmade by Lawella. Every stitch tells a story.
            </p>
            <div className="flex flex-wrap gap-4 mb-14 animate-fade-up animate-delay-300">
              <Link href="/shop">
                <Button className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all gap-2">
                  Shop Now <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="rounded-full px-10 py-6 text-base font-semibold border-2 hover:border-brand-red hover:text-brand-red transition-all">
                  Our Story
                </Button>
              </Link>
            </div>
            {/* Stats */}
            <div className="flex gap-10 animate-fade-up animate-delay-400">
              {[["500+", "Happy clients"], ["100%", "Handmade"], ["10+", "Products"]].map(([n, l]) => (
                <div key={n}>
                  <div className="font-display font-black text-3xl text-brand-red">{n}</div>
                  <div className="text-brand-gray text-sm font-medium">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right – floating product grid */}
          <div className="hidden lg:grid grid-cols-2 gap-4 py-8 animate-fade-in animate-delay-300">
            {PRODUCTS.slice(0, 4).map((p, i) => (
              <Link
                key={p.id}
                href={`/shop/product/${p.id}`}
                className={`block rounded-2xl overflow-hidden shadow-brand cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all duration-300 ${i % 2 === 0 ? "-translate-y-3" : "translate-y-3"}`}
              >
                <ProductVisual product={p} size={220} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Ticker />

      {/* ── Categories ── */}
      <section className="py-20 px-4 sm:px-8 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-black text-[clamp(32px,4vw,48px)] mb-2">
            Browse by <em className="text-brand-red">category</em>
          </h2>
          <p className="text-brand-gray mb-12 text-base">Find exactly what you&apos;re looking for.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {CATEGORIES.filter((c) => c.key !== "all").map((cat) => (
              <Link key={cat.key} href={`/shop/${cat.key}`}>
                <div className="group bg-brand-cream border-2 border-transparent hover:border-brand-red hover:bg-brand-red-light rounded-2xl p-8 text-center transition-all duration-250 hover:-translate-y-1 cursor-pointer">
                  <div className="text-4xl mb-3">{cat.emoji}</div>
                  <div className="font-display font-bold text-base">{cat.label}</div>
                  <div className="text-brand-gray text-xs mt-1">
                    {PRODUCTS.filter((p) => p.category === cat.key).length} items
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-20 px-4 sm:px-8 lg:px-20 bg-brand-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display font-black text-[clamp(32px,4vw,48px)]">
                Featured <em className="text-brand-red">pieces</em>
              </h2>
              <p className="text-brand-gray mt-2">Our most-loved handcrafted items.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center mt-14">
            <Link href="/shop">
              <Button className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-14 py-6 text-base font-semibold shadow-lg hover:-translate-y-1 transition-all">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Custom CTA ── */}
      <section className="bg-brand-red text-white py-20 px-4 sm:px-8 lg:px-20 relative overflow-hidden">
        <div className="absolute right-[-40px] top-[-40px] text-[280px] opacity-[0.06] pointer-events-none select-none">🧶</div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="font-display font-black text-[clamp(36px,5vw,64px)] max-w-2xl leading-tight mb-6">
            Want something <em>custom</em>? Let&apos;s make it together.
          </h2>
          <p className="text-lg text-white/85 mb-10 max-w-lg">
            Pick your colors, choose your size, and we&apos;ll handcraft a piece that&apos;s entirely yours.
          </p>
          <a
            href={getWhatsAppUrl(WHATSAPP_NUMBER, "Hi Lawella! I'd love a custom piece.")}
            target="_blank"
            rel="noreferrer"
          >
            <Button className="bg-white text-brand-red hover:bg-white/90 rounded-full px-10 py-6 text-base font-bold shadow-xl hover:-translate-y-1 transition-all gap-2">
              <MessageCircle size={18} /> Chat on WhatsApp
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
