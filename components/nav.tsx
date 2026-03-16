"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCartStore } from "@/lib/store"

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Nav() {
  const pathname = usePathname()
  const count = useCartStore((s) => s.count())
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isAdmin = pathname.startsWith("/admin")
  if (isAdmin) return null

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-brand-cream/95 backdrop-blur-md border-b border-brand-red/10 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
            🧶
          </div>
          <span className="font-display font-black text-xl text-brand-red tracking-tight">
            Lawella
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors pb-0.5 border-b-2",
                pathname === link.href
                  ? "text-brand-red border-brand-red"
                  : "text-brand-black border-transparent hover:text-brand-red hover:border-brand-red/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Cart + Mobile */}
        <div className="flex items-center gap-3">
          <Link href="/cart">
            <Button
              className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-5 gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="bg-white/25 rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs px-1.5 font-bold">
                  {count}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-brand-cream">
              <SheetHeader>
                <SheetTitle className="font-display text-brand-red text-xl font-black text-left">
                  🧶 Lawella
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-8">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl font-medium text-base transition-all",
                      pathname === link.href
                        ? "bg-brand-red text-white"
                        : "text-brand-black hover:bg-brand-red-light hover:text-brand-red"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="mt-4 px-4 py-3 rounded-xl font-medium text-base bg-brand-black text-white flex items-center gap-2"
                >
                  <ShoppingBag size={16} />
                  Cart {count > 0 && `(${count})`}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
