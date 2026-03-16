"use client"

import { useState, useEffect } from "react"
import {
  Store, Phone, CreditCard, Truck, Share2,
  Loader2, CheckCircle2, Save,
} from "lucide-react"
import { StoreSettings } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const DEFAULTS: StoreSettings = {
  store_name: "Lawella", store_email: "", whatsapp_number: "254700000000",
  bank_name: "", bank_account_name: "Lawella", bank_account_number: "",
  bank_branch: "", bank_swift: "", delivery_fee: 300,
  free_delivery_threshold: 5000, delivery_note: "Delivery within Nairobi 1-2 days, rest of Kenya 3-5 days.",
  instagram_url: "", facebook_url: "",
}

type Tab = "store" | "payments" | "delivery" | "social"

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "store",    label: "Store Info",   icon: <Store size={16} />     },
  { id: "payments", label: "Payments",     icon: <CreditCard size={16} /> },
  { id: "delivery", label: "Delivery",     icon: <Truck size={16} />     },
  { id: "social",   label: "Social",       icon: <Share2 size={16} />    },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState("")
  const [tab, setTab]           = useState<Tab>("store")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...DEFAULTS, ...d }))
      .finally(() => setLoading(false))
  }, [])

  const update = (k: keyof StoreSettings, v: string | number) =>
    setSettings((s) => ({ ...s, [k]: v }))

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return }
      setSettings(await res.json())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError("Network error — please try again")
    } finally { setSaving(false) }
  }

  const field = (label: string, key: keyof StoreSettings, opts?: {
    type?: string; placeholder?: string; hint?: string; prefix?: string
  }) => (
    <div className="space-y-1.5">
      <Label className="font-semibold text-sm md:text-base">{label}</Label>
      <div className={cn("flex flex-col sm:flex-row", opts?.prefix && "relative")}>
        {opts?.prefix && (
          <span className="flex items-center px-3 bg-gray-100 border border-gray-200 text-gray-500 text-xs md:text-sm shrink-0 rounded-t-xl sm:rounded-tr-none sm:rounded-l-xl sm:border-r-0 py-2 sm:py-0">
            {opts.prefix}
          </span>
        )}
        <Input
          type={opts?.type ?? "text"}
          value={String(settings[key] ?? "")}
          onChange={(e) => update(key, opts?.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={opts?.placeholder}
          className={cn(
            "rounded-xl border-2 text-sm md:text-base", 
            opts?.prefix && "rounded-t-none sm:rounded-l-none sm:rounded-tr-xl border-t-0 sm:border-t-2 sm:border-l-0"
          )}
        />
      </div>
      {opts?.hint && <p className="text-[10px] md:text-xs text-gray-400 leading-tight">{opts.hint}</p>}
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand-red" />
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="font-display font-black text-2xl md:text-3xl text-brand-black">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Configure your store, payments, and delivery.</p>
      </div>

      {/* Tabs - Scrollable on Mobile */}
      <div className="overflow-x-auto pb-2 mb-6 no-scrollbar">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-max">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap",
                tab === t.id
                  ? "bg-white text-brand-red shadow-sm"
                  : "text-gray-500 hover:text-brand-black"
              )}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Store Info */}
        {tab === "store" && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="p-5 md:p-6 pb-2">
              <CardTitle className="font-display font-bold text-lg md:text-xl flex items-center gap-2">
                <Store size={18} className="text-brand-red" /> Store Information
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Your public-facing business details.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6 space-y-5">
              {field("Store Name", "store_name", { placeholder: "Lawella" })}
              {field("Contact Email", "store_email", { type: "email", placeholder: "hello@lawella.co.ke",
                hint: "Used for order confirmation emails." })}
              {field("WhatsApp Number", "whatsapp_number", { placeholder: "254712345678",
                hint: "Include country code, no spaces or +. E.g. 254712345678" })}
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        {tab === "payments" && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="p-5 md:p-6 pb-2">
                <CardTitle className="font-display font-bold text-lg md:text-xl flex items-center gap-2 text-green-700">
                  <Phone size={18} /> M-Pesa Info
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Configured in your secure environment variables.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 md:p-6">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3 text-[11px] md:text-xs">
                  <p className="font-bold text-green-800 uppercase tracking-wider">Required .env keys:</p>
                  <div className="grid gap-2">
                    {["MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CONSUMER_KEY"].map(k => (
                      <code key={k} className="bg-white/60 p-1.5 rounded border border-green-200 text-green-700 block overflow-x-auto">{k}</code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="p-5 md:p-6 pb-2">
                <CardTitle className="font-display font-bold text-lg md:text-xl flex items-center gap-2 text-blue-700">
                  <CreditCard size={18} /> Bank Transfer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-5">
                {field("Bank Name", "bank_name", { placeholder: "Equity Bank" })}
                {field("Account Number", "bank_account_number", { placeholder: "0123456789" })}
                {field("Account Name", "bank_account_name", { placeholder: "Lawella" })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delivery */}
        {tab === "delivery" && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="p-5 md:p-6 pb-2">
              <CardTitle className="font-display font-bold text-lg md:text-xl flex items-center gap-2">
                <Truck size={18} className="text-brand-red" /> Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 md:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {field("Delivery Fee (KES)", "delivery_fee", { type: "number" })}
                {field("Free Threshold (KES)", "free_delivery_threshold", { type: "number" })}
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Delivery Note</Label>
                <Textarea
                  value={settings.delivery_note}
                  onChange={(e) => update("delivery_note", e.target.value)}
                  className="rounded-xl border-2 resize-none min-h-[100px] text-sm md:text-base"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social */}
        {tab === "social" && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="p-5 md:p-6 pb-2">
              <CardTitle className="font-display font-bold text-lg md:text-xl flex items-center gap-2">
                <Share2 size={18} className="text-brand-red" /> Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 md:p-6 space-y-5">
              {field("Instagram", "instagram_url", { prefix: "instagram.com/" })}
              {field("Facebook", "facebook_url", { prefix: "facebook.com/" })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Button - Responsive width */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className={cn(
            "w-full sm:w-auto rounded-xl px-8 py-6 font-bold gap-2 shadow-md transition-all active:scale-95",
            saved ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-brand-red hover:bg-brand-red-dark text-white disabled:opacity-60"
          )}
        >
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</>
           : saved  ? <><CheckCircle2 size={18} /> Settings Saved!</>
           : <><Save size={18} /> Save Settings</>}
        </Button>
        {error && <p className="text-sm text-red-500 font-medium">⚠️ {error}</p>}
      </div>
    </div>
  )
}