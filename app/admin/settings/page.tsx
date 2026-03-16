"use client"

import { useState, useEffect } from "react"
import {
  Store, Phone, CreditCard, Truck, Share2,
  Loader2, CheckCircle2, Save, Plus, Pencil, Trash2, MapPin, X,
} from "lucide-react"
import { StoreSettings, DeliveryZone } from "@/lib/types"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const DEFAULTS: StoreSettings = {
  store_name:"Lawella", store_email:"", whatsapp_number:"254700000000",
  bank_name:"", bank_account_name:"Lawella", bank_account_number:"",
  bank_branch:"", bank_swift:"", delivery_fee:300, free_delivery_threshold:5000,
  delivery_mode:"flat", delivery_note:"Delivery within Nairobi 1-2 days, rest of Kenya 3-5 days.",
  instagram_url:"", facebook_url:"",
}

type Tab = "store" | "payments" | "delivery" | "social"
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id:"store",    label:"Store Info",  icon:<Store size={15}/>     },
  { id:"payments", label:"Payments",    icon:<CreditCard size={15}/> },
  { id:"delivery", label:"Delivery",    icon:<Truck size={15}/>     },
  { id:"social",   label:"Social",      icon:<Share2 size={15}/>    },
]

const ZONE_TYPE_LABELS = { zone:"Zone / Area", pickup:"Pickup Point", rider:"Own Rider" }

interface ZoneFormState { name:string; price:string; zone_type:string; description:string; sort_order:string }
const ZONE_EMPTY: ZoneFormState = { name:"", price:"0", zone_type:"zone", description:"", sort_order:"0" }

export default function AdminSettingsPage() {
  const [settings, setSettings]   = useState<StoreSettings>(DEFAULTS)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState("")
  const [tab, setTab]             = useState<Tab>("store")

  // Zone management state
  const [zones, setZones]             = useState<DeliveryZone[]>([])
  const [zonesLoading, setZonesLoading] = useState(false)
  const [zoneForm, setZoneForm]       = useState<ZoneFormState>(ZONE_EMPTY)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [zoneModal, setZoneModal]     = useState(false)
  const [zoneSaving, setZoneSaving]   = useState(false)
  const [zoneError, setZoneError]     = useState("")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...DEFAULTS, ...d }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === "delivery") loadZones()
  }, [tab])

  const loadZones = async () => {
    setZonesLoading(true)
    try {
      const res = await fetch("/api/delivery-zones")
      if (res.ok) setZones(await res.json())
    } finally { setZonesLoading(false) }
  }

  const update = (k: keyof StoreSettings, v: string | number) =>
    setSettings((s) => ({ ...s, [k]: v }))

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false)
    try {
      const res = await fetch("/api/settings", {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(settings),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return }
      setSettings(await res.json())
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch { setError("Network error — please try again") } finally { setSaving(false) }
  }

  const openAddZone = () => {
    setEditingZone(null); setZoneForm(ZONE_EMPTY); setZoneError(""); setZoneModal(true)
  }
  const openEditZone = (z: DeliveryZone) => {
    setEditingZone(z)
    setZoneForm({ name:z.name, price:String(z.price), zone_type:z.zone_type, description:z.description ?? "", sort_order:String(z.sort_order) })
    setZoneError(""); setZoneModal(true)
  }
  const deleteZone = async (id: number) => {
    if (!confirm("Remove this delivery zone?")) return
    await fetch(`/api/delivery-zones/${id}`, { method:"DELETE" })
    setZones((prev) => prev.filter((z) => z.id !== id))
  }
  const saveZone = async () => {
    if (!zoneForm.name.trim()) { setZoneError("Zone name is required"); return }
    setZoneSaving(true); setZoneError("")
    try {
      const payload = { name:zoneForm.name.trim(), price:Number(zoneForm.price)||0, zone_type:zoneForm.zone_type, description:zoneForm.description||null, sort_order:Number(zoneForm.sort_order)||0 }
      const url    = editingZone ? `/api/delivery-zones/${editingZone.id}` : "/api/delivery-zones"
      const method = editingZone ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setZoneError(d.error ?? "Save failed"); return }
      setZoneModal(false)
      loadZones()
    } catch { setZoneError("Network error")
    } finally { setZoneSaving(false) }
  }

  const field = (label: string, key: keyof StoreSettings, opts?: { type?:string; placeholder?:string; hint?:string; prefix?:string }) => (
    <div className="space-y-1.5">
      <Label className="font-semibold text-sm">{label}</Label>
      <div className={cn("flex", opts?.prefix && "relative")}>
        {opts?.prefix && <span className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-xl border-gray-200 text-gray-500 text-sm shrink-0">{opts.prefix}</span>}
        <Input type={opts?.type ?? "text"} value={String(settings[key] ?? "")}
          onChange={(e) => update(key, opts?.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={opts?.placeholder}
          className={cn("rounded-xl border-2", opts?.prefix && "rounded-l-none border-l-0")} />
      </div>
      {opts?.hint && <p className="text-xs text-gray-400">{opts.hint}</p>}
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 size={32} className="animate-spin text-brand-red" />
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl md:text-3xl text-brand-black">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Configure your store, payments, and delivery.</p>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-gray-100 sm:p-1 sm:rounded-2xl sm:w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0",
              tab === t.id ? "bg-white text-brand-red shadow-sm" : "text-gray-500 hover:text-brand-black")}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Store Info */}
      {tab === "store" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-xl flex items-center gap-2">
              <Store size={18} className="text-brand-red"/> Store Information
            </CardTitle>
            <CardDescription className="text-sm">Your public-facing business details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {field("Store Name",        "store_name",       { placeholder:"Lawella" })}
            {field("Contact Email",     "store_email",      { type:"email", placeholder:"hello@lawella.co.ke" })}
            {field("WhatsApp Number",   "whatsapp_number",  { placeholder:"254712345678", hint:"Country code, no spaces or +. E.g. 254712345678" })}
          </CardContent>
        </Card>
      )}

      {/* Payments */}
      {tab === "payments" && (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display font-bold text-xl flex items-center gap-2">
                <Phone size={18} className="text-green-600"/> M-Pesa Configuration
              </CardTitle>
              <CardDescription className="text-sm">
                M-Pesa credentials are stored in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> — edit those directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2 text-sm text-green-700">
                <p className="font-semibold text-sm">Required in .env.local:</p>
                {[["MPESA_ENV","sandbox or production"],["MPESA_CONSUMER_KEY","From Daraja portal"],["MPESA_CONSUMER_SECRET","From Daraja portal"],["MPESA_SHORTCODE","Your Paybill/Till"],["MPESA_PASSKEY","From Safaricom"],["MPESA_CALLBACK_URL","https://yourdomain.com/api/mpesa/callback"]].map(([k,v]) => (
                  <div key={k} className="flex gap-2 flex-wrap">
                    <code className="font-mono font-bold text-green-800 bg-green-100 px-1.5 rounded text-xs shrink-0">{k}</code>
                    <span className="text-green-600 text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display font-bold text-xl flex items-center gap-2">
                <CreditCard size={18} className="text-blue-600"/> Bank Transfer Details
              </CardTitle>
              <CardDescription className="text-sm">Shown at checkout when customer selects Bank Transfer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {field("Bank Name",          "bank_name",           { placeholder:"Equity Bank Kenya"    })}
              {field("Account Name",       "bank_account_name",   { placeholder:"Lawella Creative Studio" })}
              {field("Account Number",     "bank_account_number", { placeholder:"0123456789"            })}
              {field("Branch",             "bank_branch",         { placeholder:"Westlands"             })}
              {field("SWIFT Code",         "bank_swift",          { placeholder:"EQBLKENA (optional)"   })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery */}
      {tab === "delivery" && (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display font-bold text-xl flex items-center gap-2">
                <Truck size={18} className="text-brand-red"/> Delivery Mode
              </CardTitle>
              <CardDescription className="text-sm">How delivery fees are calculated at checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Mode selector */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Delivery Mode</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value:"flat",  label:"Flat Rate",    desc:"Single fee for all orders" },
                    { value:"zones", label:"By Zone / Area", desc:"Price varies by location"  },
                    { value:"free",  label:"Always Free",  desc:"No delivery charge"         },
                  ] as const).map((m) => (
                    <button key={m.value} type="button" onClick={() => update("delivery_mode", m.value)}
                      className={cn("text-left p-4 rounded-2xl border-2 transition-all",
                        settings.delivery_mode === m.value ? "border-brand-red bg-brand-red-light" : "border-gray-200 hover:border-brand-red/40")}>
                      <div className="font-bold text-sm">{m.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {settings.delivery_mode === "flat" && (
                <>
                  {field("Standard Delivery Fee (KES)", "delivery_fee", { type:"number", placeholder:"300", hint:"Charged when order is below the free delivery threshold." })}
                  {field("Free Delivery Threshold (KES)", "free_delivery_threshold", { type:"number", placeholder:"5000", hint:"Orders above this amount get free delivery." })}
                </>
              )}

              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Delivery Note</Label>
                <Textarea value={settings.delivery_note} onChange={(e) => update("delivery_note", e.target.value)}
                  placeholder="Delivery within Nairobi 1-2 days…" className="rounded-xl border-2 resize-none min-h-18" />
                <p className="text-xs text-gray-400">Shown on the cart and checkout pages.</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Zones */}
          {settings.delivery_mode === "zones" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display font-bold text-xl flex items-center gap-2">
                      <MapPin size={18} className="text-brand-red"/> Delivery Zones
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Customer picks their zone at checkout — price is set per zone.
                    </CardDescription>
                  </div>
                  <Button onClick={openAddZone} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-xl gap-1.5 text-sm h-9 shrink-0">
                    <Plus size={14}/> Add Zone
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {zonesLoading ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Loader2 size={20} className="mx-auto mb-2 animate-spin opacity-40"/> Loading zones…
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
                    <MapPin size={28} className="mx-auto mb-2 opacity-30"/>
                    <p>No zones yet. Add your first delivery zone above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {zones.map((z) => (
                      <div key={z.id} className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", z.is_active ? "border-gray-100 bg-gray-50" : "border-gray-100 bg-gray-50/50 opacity-50")}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                            z.zone_type === "pickup" ? "bg-green-100 text-green-700"
                            : z.zone_type === "rider" ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700")}>
                            {z.zone_type}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm">{z.name}</div>
                            {z.description && <div className="text-xs text-gray-400 truncate">{z.description}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="font-display font-bold text-brand-red text-sm">
                            {z.price === 0 ? "Free" : formatCurrency(z.price)}
                          </span>
                          <button onClick={() => openEditZone(z)} className="text-gray-400 hover:text-brand-red transition-colors p-1">
                            <Pencil size={14}/>
                          </button>
                          <button onClick={() => deleteZone(z.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Social */}
      {tab === "social" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-bold text-xl flex items-center gap-2">
              <Share2 size={18} className="text-brand-red"/> Social Links
            </CardTitle>
            <CardDescription className="text-sm">Links shown in the footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {field("Instagram", "instagram_url", { prefix:"instagram.com/", placeholder:"lawella.ke" })}
            {field("Facebook",  "facebook_url",  { prefix:"facebook.com/",  placeholder:"lawellacrochet" })}
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <Button onClick={handleSave} disabled={saving}
          className={cn("rounded-xl px-8 py-5 font-bold gap-2 shadow-md transition-all",
            saved ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-brand-red hover:bg-brand-red-dark text-white disabled:opacity-60")}>
          {saving ? <><Loader2 size={16} className="animate-spin"/> Saving…</>
           : saved  ? <><CheckCircle2 size={16}/> Saved!</>
           : <><Save size={16}/> Save Settings</>}
        </Button>
        {error && <p className="text-sm text-red-500">⚠️ {error}</p>}
      </div>

      {/* Zone modal */}
      {zoneModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setZoneModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-lg">{editingZone ? "Edit Zone" : "Add Delivery Zone"}</h3>
              <button onClick={() => setZoneModal(false)} className="text-gray-400 hover:text-brand-black transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Zone Name <span className="text-brand-red">*</span></Label>
                <Input value={zoneForm.name} onChange={(e) => setZoneForm((f) => ({...f,name:e.target.value}))} placeholder="e.g. Nairobi CBD, Karen, Pickup Mtaani" className="rounded-xl border-2"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">Type</Label>
                  <Select value={zoneForm.zone_type} onValueChange={(v) => setZoneForm((f) => ({...f,zone_type:v}))}>
                    <SelectTrigger className="rounded-xl border-2"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zone">Zone / Area</SelectItem>
                      <SelectItem value="pickup">Pickup Point</SelectItem>
                      <SelectItem value="rider">Own Rider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">Price (KES)</Label>
                  <Input type="number" min={0} value={zoneForm.price} onChange={(e) => setZoneForm((f) => ({...f,price:e.target.value}))} placeholder="300" className="rounded-xl border-2"/>
                  <p className="text-[10px] text-gray-400">Set 0 for free</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input value={zoneForm.description} onChange={(e) => setZoneForm((f) => ({...f,description:e.target.value}))} placeholder="Shown to customer at checkout" className="rounded-xl border-2"/>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Sort Order</Label>
                <Input type="number" min={0} value={zoneForm.sort_order} onChange={(e) => setZoneForm((f) => ({...f,sort_order:e.target.value}))} placeholder="0" className="rounded-xl border-2"/>
                <p className="text-[10px] text-gray-400">Lower number = shown first</p>
              </div>
              {zoneError && <p className="text-xs text-red-500">⚠️ {zoneError}</p>}
              <div className="flex gap-3 pt-1">
                <Button onClick={saveZone} disabled={zoneSaving} className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl py-5 font-bold gap-2">
                  {zoneSaving ? <><Loader2 size={15} className="animate-spin"/>Saving…</> : <><Save size={15}/>{editingZone ? "Update" : "Add Zone"}</>}
                </Button>
                <Button variant="outline" onClick={() => setZoneModal(false)} className="rounded-xl border-2 px-5">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
