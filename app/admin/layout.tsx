"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ArrowLeft,
  Settings,
  Users,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/products", label: "Products", icon: <Package size={18} /> },
  { href: "/admin/orders", label: "Orders", icon: <ShoppingBag size={18} /> },
  { href: "/admin/customers", label: "Customers", icon: <Users size={18} /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const NavContent = () => (
    <>
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-base">🧶</div>
          <span className="font-display font-black text-lg text-white">Lawella</span>
        </div>
        <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Admin Panel</span>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {ADMIN_LINKS.map((link) => {
          const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all",
                isActive ? "bg-brand-red text-white shadow-md" : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-5 border-t border-white/10">
        <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 hover:text-white text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Back to Store
        </Link>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Nav Header */}
      <header className="lg:hidden bg-brand-black text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-red flex items-center justify-center text-xs">🧶</div>
          <span className="font-display font-black text-sm uppercase tracking-tighter">Lawella Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="text-white hover:bg-white/10">
          <Menu size={24} />
        </Button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={cn(
        "bg-brand-black text-white flex flex-col fixed top-0 left-0 h-full z-70 transition-transform duration-300 lg:translate-x-0 lg:w-64",
        isOpen ? "translate-x-0 w-72" : "-translate-x-full"
      )}>
        <div className="lg:hidden absolute right-4 top-6">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X size={20}/></Button>
        </div>
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 w-full">
        {children}
      </main>
    </div>
  )
}