import Link from "next/link"
import { getWhatsAppUrl } from "@/lib/utils"
import { WHATSAPP_NUMBER, CATEGORIES } from "@/lib/data"

export function Footer() {
  return (
    <footer className="bg-brand-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center text-lg">
                🧶
              </div>
              <span className="font-display font-black text-xl text-white">Lawella</span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs mb-6">
              Handcrafted crochet pieces made with love in Nairobi, Kenya. One stitch at a time.
            </p>
            <a
              href={getWhatsAppUrl(WHATSAPP_NUMBER, "Hi Lawella! I'd like to chat.")}
              target="_blank"
              rel="noreferrer"
            >
              <button className="bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg">
                💬 WhatsApp Us
              </button>
            </a>
          </div>

          {/* Shop */}
          <div>
            <div className="text-brand-red text-xs font-bold uppercase tracking-widest mb-5">
              Shop
            </div>
            <div className="flex flex-col gap-3">
              {CATEGORIES.filter((c) => c.key !== "all").map((cat) => (
                <Link
                  key={cat.key}
                  href={`/shop/${cat.key}`}
                  className="text-white/60 text-sm hover:text-white transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company + Contact */}
          <div>
            <div className="text-brand-red text-xs font-bold uppercase tracking-widest mb-5">
              Company
            </div>
            <div className="flex flex-col gap-3 mb-8">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
                { href: "/admin", label: "Admin" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-white/60 text-sm hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="text-white/55 text-sm space-y-2">
              <div>📍 Nairobi, Kenya</div>
              <div>📱 +254 700 000 000</div>
              <div>📧 hello@lawella.co.ke</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/35 text-xs">
          <span>© 2025 Lawella. All rights reserved.</span>
          <span>Made with 🧶 & ❤️ in Nairobi</span>
        </div>
      </div>
    </footer>
  )
}
