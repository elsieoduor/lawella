import Link from "next/link"
import { PRODUCTS } from "@/lib/data"
import { ProductVisual } from "@/components/product-visual"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Lawella",
  description: "The story behind Lawella handcrafted crochet.",
}

export default function AboutPage() {
  return (
    <div className="pt-[72px]">
      {/* Hero */}
      <div
        className="text-white text-center px-4 sm:px-8 lg:px-20 py-20"
        style={{ background: "linear-gradient(135deg, #C41E3A 0%, #6b1527 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-5">🧶</div>
          <h1 className="font-display font-black text-[clamp(40px,6vw,72px)] mb-5">
            The Lawella Story
          </h1>
          <p className="text-lg text-white/85 leading-relaxed">
            Every stitch is a labour of love, crafted in Nairobi by hands that care.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-20 px-4 sm:px-8 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display font-black text-[clamp(32px,4vw,52px)] leading-tight mb-7">
              Born from a <em className="text-brand-red">passion</em> for handcraft
            </h2>
            <p className="text-brand-gray leading-relaxed text-base mb-5">
              Lawella started as a small hobby — a hook, some yarn, and a quiet afternoon. What began as a way to make gifts for friends slowly grew into something more beautiful: a brand that believes every home and every wardrobe deserves something made just for it.
            </p>
            <p className="text-brand-gray leading-relaxed text-base mb-5">
              We make sweaters that hug you back, blankets you&apos;ll never want to fold, tote bags sturdy enough for the market, and scrunchies that are gentle on your hair. All made with high-quality yarn, one stitch at a time.
            </p>
            <p className="text-brand-gray leading-relaxed text-base">
              Our signature red and white palette is a declaration — bold, warm, and unapologetically handmade.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {PRODUCTS.slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                className={`rounded-2xl overflow-hidden shadow-brand-sm ${i % 2 ? "translate-y-4" : ""}`}
              >
                <ProductVisual product={p} size={200} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-8 lg:px-20 bg-brand-cream">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-black text-[clamp(32px,4vw,48px)] text-center mb-14">
            Our <em className="text-brand-red">values</em>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🤲", title: "Handcrafted", desc: "Every item is made by hand with care. No machines. No shortcuts." },
              { icon: "💚", title: "Sustainable", desc: "We use high-quality yarn that lasts, reducing waste and fast fashion." },
              { icon: "✨", title: "Custom-made", desc: "Can't find exactly what you want? We'll make it. Just ask." },
              { icon: "🌍", title: "Made in Kenya", desc: "Proudly crafted in Nairobi, supporting local artisans and communities." },
            ].map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 shadow-brand-sm hover:-translate-y-1 transition-transform"
              >
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-display font-bold text-xl mb-3">{v.title}</h3>
                <p className="text-brand-gray text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-8 text-center bg-brand-red text-white">
        <h2 className="font-display font-black text-[clamp(32px,4vw,52px)] mb-5">
          Ready to find your piece?
        </h2>
        <Link href="/shop">
          <Button className="bg-white text-brand-red hover:bg-white/90 rounded-full px-12 py-6 text-base font-bold shadow-xl hover:-translate-y-1 transition-all">
            Shop the Collection
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  )
}
