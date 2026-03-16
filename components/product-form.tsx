"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Save, Loader2, Upload, X, Palette, Check } from "lucide-react"
import { CATEGORIES } from "@/lib/data"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export type ProductFormValues = {
  name: string; category: string; price: string; description: string;
  emoji: string; badge: string; sizes: string; stock: string; 
  image_url: string; colors: string;
}

const EMPTY: ProductFormValues = {
  name:"", category:"sweaters", price:"", description:"",
  emoji:"🧶", badge:"", sizes:"S,M,L,XL", stock:"10", image_url:"", colors: "",
}

interface Props {
  mode: "create" | "edit"
  initialValues?: Partial<ProductFormValues>
  productId?: string | number
}

type Errors = Partial<ProductFormValues>

const EMOJI_PRESETS = ["🧶","🧣","🌸","🌊","👜","🛍️","💫","🤍","🌹","🏡"]
const BADGE_PRESETS = ["New","Bestseller","Popular","Gift Pick","Bundle","Eco Pick"]
const SIZE_PRESETS  = [
  { label:"Full range", value:"XS,S,M,L,XL" },
  { label:"S–XL",       value:"S,M,L,XL"    },
  { label:"One Size",   value:"One Size"     },
]

// User-friendly color presets (No hex codes needed for the user)
const COLOR_PRESETS = [
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Sky Blue", hex: "#6CB4EE" },
  { name: "Navy", hex: "#1A2B44" },
  { name: "Forest", hex: "#2D5A27" },
  { name: "Scarlet", hex: "#FF2400" },
  { name: "Lavender", hex: "#E6E6FA" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
]

// ── Image Uploader ──────────────────────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [imgError,  setImgError]  = useState("")

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) { setImgError("Images only"); return }
    if (file.size > 5 * 1024 * 1024)    { setImgError("Max 5 MB"); return }
    setImgError(""); setUploading(true)
    try {
      const supabase = createClient()
      const ext  = file.name.split(".").pop() ?? "jpg"
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      
      const { error: upErr } = await supabase.storage
        .from("product-images").upload(path, file, { upsert: false, contentType: file.type })
      
      if (upErr) throw upErr
      const { data } = supabase.storage.from("product-images").getPublicUrl(path)
      
      onChange(data.publicUrl)
    } catch (e: any) { 
      setImgError(e.message ?? "Upload failed")
    } finally { setUploading(false) }
  }

  const remove = async () => {
    if (!value) return
    try {
      const path = value.split("/product-images/")[1]
      if (path) {
        const supabase = createClient()
        await supabase.storage.from("product-images").remove([path])
      }
    } catch { /* non-fatal */ }
    onChange("")
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-brand-red/20 group aspect-video max-h-48 bg-brand-cream">
          <Image src={value} alt="Product" fill className="object-contain p-2" unoptimized />
          <button type="button" onClick={remove}
            className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600">
            <X size={14} />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">✓ Uploaded</div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-brand-red/30 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-red/60 hover:bg-brand-red-light/20 transition-all group flex flex-col items-center gap-3">
          {uploading ? (
            <><Loader2 size={28} className="text-brand-red animate-spin" /><p className="text-sm text-brand-gray font-medium">Uploading…</p></>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-brand-cream border-2 border-brand-red/20 flex items-center justify-center group-hover:bg-brand-red-light transition-colors">
                <Upload size={20} className="text-brand-red" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-black">Click to upload photo</p>
                <p className="text-xs text-brand-gray mt-0.5">PNG, JPG, WEBP — max 5 MB</p>
              </div>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
        </label>
      )}
      {imgError && <p className="text-xs text-red-500">⚠️ {imgError}</p>}
    </div>
  )
}

// ── Main Form ────────────────────────────────────────────────────────────────
export function ProductForm({ mode, initialValues, productId }: Props) {
  const router = useRouter()
  const [form, setForm]           = useState<ProductFormValues>({ ...EMPTY, ...initialValues })
  const [errors, setErrors]       = useState<Errors>({})
  const [loading, setLoading]     = useState(false)
  const [serverError, setServerError] = useState("")

  const update = (k: keyof ProductFormValues, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const toggleColor = (hex: string) => {
    const current = form.colors ? form.colors.split(",").filter(Boolean) : []
    const updated = current.includes(hex) 
      ? current.filter(c => c !== hex) 
      : [...current, hex]
    update("colors", updated.join(","))
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.name.trim())              e.name        = "Product name is required"
    if (!form.price || Number(form.price) <= 0) e.price = "Enter a valid price"
    if (!form.description.trim())       e.description = "Description is required"
    if (!form.emoji.trim())             e.emoji       = "Choose an emoji"
    if (!form.sizes.trim())             e.sizes       = "Enter at least one size"
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true); setServerError("")

    const payload = {
      name: form.name.trim(), 
      category: form.category, 
      price: Number(form.price),
      description: form.description.trim(), 
      emoji: form.emoji.trim(),
      badge: form.badge.trim() || null,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(",").filter(Boolean),
      stock: Number(form.stock) || 0,
      image_url: form.image_url || null,
    }

    try {
      const url    = mode === "create" ? "/api/products" : `/api/products/${productId}`
      const method = mode === "create" ? "POST" : "PATCH"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setServerError(d.error ?? "Something went wrong"); return }
      router.push("/admin/products"); router.refresh()
    } catch { setServerError("Network error — please try again")
    } finally { setLoading(false) }
  }

  const fc = (k: keyof ProductFormValues) =>
    cn("rounded-xl border-2 transition-colors", errors[k] && "border-red-400 bg-red-50")

  return (
    <div className="max-w-2xl space-y-7 pb-10">
      {/* Name + Emoji */}
      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-1.5 flex-1">
          <Label className="font-semibold">Product Name <span className="text-brand-red">*</span></Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Scarlet Chunky Sweater" className={fc("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="font-semibold">Emoji <span className="text-brand-red">*</span></Label>
          <Input value={form.emoji} onChange={(e) => update("emoji", e.target.value)} className={cn(fc("emoji"), "text-2xl w-20 text-center")} maxLength={4} />
          <div className="flex gap-1 flex-wrap mt-1 justify-center">
            {EMOJI_PRESETS.map((e) => (
              <button key={e} type="button" onClick={() => update("emoji", e)}
                className={cn("w-8 h-8 rounded-lg text-base transition-all hover:scale-110", form.emoji === e ? "bg-brand-red-light ring-2 ring-brand-red" : "bg-gray-100 hover:bg-gray-200")}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category + Price */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="font-semibold">Category <span className="text-brand-red">*</span></Label>
          <Select value={form.category} onValueChange={(v) => update("category", v)}>
            <SelectTrigger className="rounded-xl border-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-semibold">Price (KES) <span className="text-brand-red">*</span></Label>
          <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="3200" className={fc("price")} />
          {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="font-semibold">Description <span className="text-brand-red">*</span></Label>
        <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What makes this product special?" rows={3} className={cn(fc("description"), "resize-none")} />
        <div className="flex justify-between">
          {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : <span />}
          <span className="text-xs text-gray-400">{form.description.length} chars</span>
        </div>
      </div>

      {/* Colors (User Friendly Selector) */}
      <div className="space-y-2">
        <Label className="font-semibold flex items-center gap-2"><Palette size={16} className="text-brand-red" /> Available Colors</Label>
        <div className="flex gap-3 flex-wrap p-4 bg-white border-2 rounded-2xl">
          {COLOR_PRESETS.map((c) => {
            const isSelected = form.colors.split(",").includes(c.hex);
            return (
              <button key={c.hex} type="button" onClick={() => toggleColor(c.hex)}
                className={cn("w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm hover:scale-110", isSelected ? "border-brand-red ring-2 ring-brand-red/20" : "border-gray-100")}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {isSelected && <Check size={16} className={c.hex === "#FFFFFF" ? "text-black" : "text-white"} />}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-gray-400">Click colors to select/deselect them.</p>
      </div>

      {/* Product Image */}
      <div className="space-y-1.5">
        <Label className="font-semibold">Product Photo <span className="text-gray-400 font-normal">(recommended)</span></Label>
        <ImageUploader value={form.image_url} onChange={(v) => update("image_url", v)} />
      </div>

      {/* Badge + Stock */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="font-semibold">Badge <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="New, Bestseller…" className="rounded-xl border-2" />
          <div className="flex gap-1.5 flex-wrap mt-1">
            {BADGE_PRESETS.map((b) => (
              <button key={b} type="button" onClick={() => update("badge", form.badge === b ? "" : b)}
                className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all", form.badge === b ? "bg-brand-red text-white border-brand-red" : "bg-white text-gray-500 border-gray-200 hover:border-brand-red/50")}>
                {b}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="font-semibold">Stock Quantity</Label>
          <Input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} className="rounded-xl border-2" />
          <p className="text-xs text-gray-400">Set to 0 if sold out</p>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-1.5">
        <Label className="font-semibold">Available Sizes <span className="text-brand-red">*</span></Label>
        <Input value={form.sizes} onChange={(e) => update("sizes", e.target.value)} className={fc("sizes")} />
        <div className="flex gap-2 flex-wrap mt-1">
          {SIZE_PRESETS.map(({ label, value }) => (
            <button key={value} type="button" onClick={() => update("sizes", value)}
              className="px-3 py-1 text-xs rounded-full border border-gray-200 hover:border-brand-red/50 text-gray-500 transition-all">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-brand-cream rounded-2xl p-5 border-2 border-dashed border-brand-red/20 shadow-inner">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">Live Preview</p>
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-brand-red flex items-center justify-center">
            {form.image_url 
              ? <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-3xl">{form.emoji || "🧶"}</span>}
          </div>
          <div className="flex-1">
            {form.badge && <span className="inline-block bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{form.badge}</span>}
            <div className="font-bold text-lg leading-tight">{form.name || "Product Name"}</div>
            <div className="text-xs text-gray-500 capitalize">{form.category}</div>
            <div className="flex gap-1.5 mt-2">
               {form.colors.split(",").filter(Boolean).map(c => (
                 <div key={c} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
               ))}
            </div>
            <div className="font-black text-brand-red mt-2 text-lg">KES {form.price ? Number(form.price).toLocaleString() : "—"}</div>
          </div>
        </div>
      </div>

      {serverError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">⚠️ {serverError}</div>}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={loading} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-xl px-8 py-6 font-bold gap-2 shadow-md flex-1 disabled:opacity-60">
          {loading ? <><Loader2 size={18} className="animate-spin"/> Saving…</> : <><Save size={18}/> {mode === "create" ? "Create Product" : "Save Changes"}</>}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={loading} className="rounded-xl px-6 border-2 py-6">Cancel</Button>
      </div>
    </div>
  )
}