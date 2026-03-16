"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check, Phone, Banknote, CreditCard, Loader2,
  ArrowLeft, ShieldCheck, AlertCircle, Building2,
  ClipboardCheck, CheckCircle2, Copy, MapPin, Bike,
} from "lucide-react"
import { useCartStore } from "@/lib/store"
import { formatCurrency, getWhatsAppUrl, cn } from "@/lib/utils"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { StoreSettings, DeliveryZone } from "@/lib/types"

type Step          = 1 | 2
type PaymentMethod = "mpesa" | "cash" | "bank"
type MpesaState    = "idle" | "awaiting" | "success" | "cancelled" | "timeout" | "failed"
type BankState     = "idle" | "submitting" | "submitted" | "error"

interface OrderForm {
  name: string; email: string; phone: string
  address: string; city: string; notes: string
}

const PAYMENT_OPTIONS = [
  { value:"mpesa" as PaymentMethod, label:"M-Pesa",           icon:<Phone size={18}/>, hint:"You'll get a payment prompt — enter your PIN." },
  { value:"cash"  as PaymentMethod, label:"Cash on Delivery", icon:<Banknote size={18}/>, hint:"Pay with cash when your order arrives." },
  { value:"bank"  as PaymentMethod, label:"Bank Transfer",    icon:<CreditCard size={18}/>, hint:"Transfer to our account — submit your reference to confirm." },
]

const SETTINGS_DEFAULTS: StoreSettings = {
  store_name:"Lawella", store_email:"", whatsapp_number:"254700000000",
  bank_name:"Equity Bank Kenya", bank_account_name:"Lawella", bank_account_number:"",
  bank_branch:"", bank_swift:"", delivery_fee:300, free_delivery_threshold:5000,
  delivery_mode:"flat", delivery_note:"", instagram_url:"", facebook_url:"",
}

const ZONE_TYPE_ICONS: Record<string, React.ReactNode> = {
  pickup: <MapPin size={16}/>,
  rider:  <Bike size={16}/>,
  zone:   <MapPin size={16}/>,
}

export default function CheckoutPage() {
  const router    = useRouter()
  const items     = useCartStore((s) => s.items)
  const rawTotal  = useCartStore((s) => s.total())
  const clearCart = useCartStore((s) => s.clearCart)

  const [settings, setSettings]   = useState<StoreSettings>(SETTINGS_DEFAULTS)
  const [zones, setZones]         = useState<DeliveryZone[]>([])
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...SETTINGS_DEFAULTS, ...d }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (settings.delivery_mode === "zones") {
      fetch("/api/delivery-zones")
        .then((r) => r.json())
        .then((d: DeliveryZone[]) => {
          setZones(d.filter((z) => z.is_active))
          if (d.length > 0 && !selectedZone) setSelectedZone(d[0])
        })
        .catch(() => {})
    }
  }, [settings.delivery_mode])

  // Delivery fee depends on mode
  const delivery: number = (() => {
    if (settings.delivery_mode === "free")  return 0
    if (settings.delivery_mode === "zones") return selectedZone?.price ?? 0
    return rawTotal >= settings.free_delivery_threshold ? 0 : settings.delivery_fee
  })()
  const grandTotal = rawTotal + delivery
  const WHATSAPP   = settings.whatsapp_number || "254700000000"

  const [step, setStep]               = useState<Step>(1)
  const [payment, setPayment]         = useState<PaymentMethod>("mpesa")
  const [submitting, setSubmitting]   = useState(false)
  const [serverError, setServerError] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [orderId, setOrderId]         = useState("")
  const [placed, setPlaced]           = useState(false)
  const [mpesaState, setMpesaState]   = useState<MpesaState>("idle")
  const [mpesaMsg, setMpesaMsg]       = useState("")
  const [receipt, setReceipt]         = useState("")
  const [bankState, setBankState]     = useState<BankState>("idle")
  const [bankReference, setBankRef]   = useState("")
  const [bankRefError, setBankRefErr] = useState("")
  const [submittedRef, setSubmittedRef] = useState("")
  const [copiedField, setCopied]      = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState<OrderForm>({ name:"", email:"", phone:"", address:"", city:"", notes:"" })
  const update      = (k: keyof OrderForm, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const canContinue = form.name.trim() && form.phone.trim() && form.address.trim()

  // Validate zone is selected when in zones mode
  const canPay = settings.delivery_mode !== "zones" || !!selectedZone

  useEffect(() => {
    if (!placed && items.length === 0) router.replace("/shop")
  }, [items, placed, router])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const startPolling = useCallback((cri: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/mpesa/status?checkoutRequestId=${encodeURIComponent(cri)}`)
        const data = await res.json()
        if (data.status === "success") {
          clearInterval(pollRef.current!); setReceipt(data.receiptNumber ?? "")
          setMpesaState("success"); clearCart(); setPlaced(true)
        } else if (["cancelled","timeout","failed"].includes(data.status)) {
          clearInterval(pollRef.current!)
          setMpesaState(data.status as MpesaState); setMpesaMsg(data.message ?? "")
          setSubmitting(false)
        }
      } catch { }
    }, 4000)
  }, [clearCart])

  const handlePlaceOrder = async () => {
    setSubmitting(true); setServerError("")
    try {
      const res = await fetch("/api/orders", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          customerName: form.name.trim(), customerEmail: form.email.trim() || null,
          customerPhone: form.phone.trim(), deliveryAddress: form.address.trim(),
          deliveryCity: form.city.trim() || null, notes: form.notes.trim() || null,
          paymentMethod: payment, items, subtotal: rawTotal, deliveryFee: delivery, total: grandTotal,
          deliveryZoneId:   selectedZone?.id ?? null,
          deliveryZoneName: selectedZone?.name ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setServerError(data.error ?? "Something went wrong."); setSubmitting(false); return }
      setOrderNumber(data.orderNumber); setOrderId(data.orderId)
      if (payment === "mpesa" && data.mpesaCheckoutRequestId) {
        setMpesaState("awaiting"); startPolling(data.mpesaCheckoutRequestId)
      } else { clearCart(); setPlaced(true); setSubmitting(false) }
    } catch { setServerError("Network error — please try again."); setSubmitting(false) }
  }

  const handleMpesaRetry = async () => {
    setMpesaState("idle"); setSubmitting(true); setServerError("")
    try {
      const res = await fetch("/api/mpesa/pay", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ orderId, orderNumber, phone:form.phone, amount:grandTotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkoutRequestId) { setServerError(data.error ?? "Could not send prompt."); setSubmitting(false); return }
      setMpesaState("awaiting"); startPolling(data.checkoutRequestId)
    } catch { setServerError("Network error."); setSubmitting(false) }
  }

  const handleSubmitBankRef = async () => {
    if (!bankReference.trim()) { setBankRefErr("Please enter your transaction reference."); return }
    if (bankReference.trim().length < 4) { setBankRefErr("Reference looks too short."); return }
    setBankRefErr(""); setBankState("submitting")
    try {
      const res = await fetch(`/api/orders/${orderId}/bank-confirm`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bankReference: bankReference.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setBankRefErr(data.error ?? "Submission failed."); setBankState("error"); return }
      setSubmittedRef(data.reference); setBankState("submitted")
    } catch { setBankRefErr("Network error."); setBankState("error") }
  }

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(field); setTimeout(() => setCopied(null), 2000) })
  }

  // ── Success screens ────────────────────────────────────────────────────────
  if (placed && payment === "mpesa" && mpesaState === "success") return (
    <div className="pt-18 min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="text-center max-w-md w-full py-14 animate-fade-up">
        <div className="text-7xl md:text-8xl mb-6 animate-float">🎉</div>
        <h1 className="font-display font-black text-4xl md:text-5xl text-brand-red mb-3">Payment Received!</h1>
        <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full mb-5">Order {orderNumber}</div>
        {receipt && <p className="text-xs text-brand-gray mb-3">M-Pesa receipt: <strong>{receipt}</strong></p>}
        <p className="text-brand-gray text-base leading-relaxed mb-8">Thank you, <strong>{form.name}</strong>! We&apos;ll contact you on <strong>{form.phone}</strong> to arrange delivery.</p>
        <Button onClick={() => router.push("/")} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-12 py-5 font-bold shadow-lg w-full sm:w-auto">Back to Home</Button>
      </div>
    </div>
  )

  if (placed && payment === "cash") return (
    <div className="pt-18 min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="text-center max-w-md w-full py-14 animate-fade-up">
        <div className="text-7xl md:text-8xl mb-6 animate-float">🎉</div>
        <h1 className="font-display font-black text-4xl md:text-5xl text-brand-red mb-3">Order Placed!</h1>
        <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full mb-5">Order {orderNumber}</div>
        <p className="text-brand-gray text-base leading-relaxed mb-8">Have your cash ready when your order arrives. We&apos;ll contact you on <strong>{form.phone}</strong>.</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/")} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full py-5 font-bold shadow-lg">Back to Home</Button>
          <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! I placed order ${orderNumber}. Looking forward to delivery!`)} target="_blank" rel="noreferrer">
            <Button className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full py-5 font-bold gap-2">💬 Confirm via WhatsApp</Button>
          </a>
        </div>
      </div>
    </div>
  )

  if (placed && payment === "bank" && bankState === "submitted") return (
    <div className="pt-18 min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="text-center max-w-md w-full py-14 animate-fade-up">
        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={44} className="text-green-600"/></div>
        <h1 className="font-display font-black text-3xl md:text-4xl text-brand-black mb-3">Reference Submitted!</h1>
        <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full mb-5">Order {orderNumber}</div>
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-sm text-green-700 mb-6 text-left">
          <p className="font-bold mb-1">Reference received ✓</p>
          <p className="font-mono font-bold text-lg tracking-widest text-green-800 mb-2">{submittedRef}</p>
          <p>We&apos;ll verify and confirm your order within a few hours. SMS confirmation incoming.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/")} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full py-5 font-bold shadow-lg">Back to Home</Button>
          <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! I submitted reference ${submittedRef} for order ${orderNumber}.`)} target="_blank" rel="noreferrer">
            <Button className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full py-5 font-bold gap-2">💬 Message us on WhatsApp</Button>
          </a>
        </div>
      </div>
    </div>
  )

  if (placed && payment === "bank") return (
    <div className="pt-18 min-h-screen bg-brand-cream">
      <div className="max-w-lg mx-auto px-4 py-12 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4"><Building2 size={36} className="text-blue-600"/></div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-brand-black mb-2">Transfer Payment</h1>
          <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full">Order {orderNumber}</div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-brand-sm mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
            <h2 className="font-bold text-sm md:text-base">Transfer {formatCurrency(grandTotal)} to this account</h2>
          </div>
          <div className="space-y-2 mb-4">
            {[
              { label:"Bank",         value:settings.bank_name           || "Equity Bank Kenya", field:"bank"    },
              { label:"Paybill",  value: "247247",                 field:"-"  },
              { label:"Account Name", value:settings.bank_account_name   || "Lawella",           field:"accname" },
              { label:"Account No.",  value:settings.bank_account_number || "—",                 field:"accnum"  },
              ...(settings.bank_branch ? [{ label:"Branch", value:settings.bank_branch, field:"branch" }] : []),
              { label:"Reference",    value:orderNumber,                                          field:"ref"     },
            ].map(({ label, value, field }) => (
              <div key={field} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 gap-2">
                <div>
                  <div className="text-[10px] font-bold text-brand-gray uppercase tracking-wide">{label}</div>
                  <div className={cn("font-bold mt-0.5", field === "ref" ? "text-brand-red font-mono text-sm md:text-base" : "text-brand-black text-sm")}>{value}</div>
                </div>
                {value !== "—" && (
                  <button onClick={() => copy(value, field)} className="text-gray-400 hover:text-brand-red transition-colors shrink-0">
                    {copiedField === field ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
            <strong>Use {orderNumber} as your reference</strong> so we can match your transfer.
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-brand-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
            <h2 className="font-bold text-sm md:text-base">Enter your confirmation code</h2>
          </div>
          <p className="text-xs text-brand-gray mb-4 ml-9">The transaction code from your bank/M-Pesa app (e.g. <span className="font-mono">SAM1A2B3C4D</span>).</p>
          <Input value={bankReference} onChange={(e) => { setBankRef(e.target.value.toUpperCase()); setBankRefErr("") }}
            placeholder="e.g. SAM1A2B3C4D" className={cn("rounded-xl border-2 font-mono text-sm md:text-base tracking-wider", bankRefError ? "border-red-400 bg-red-50" : "")}
            maxLength={30} disabled={bankState === "submitting"}/>
          {bankRefError && <p className="text-xs text-red-500 mt-1">⚠️ {bankRefError}</p>}
          <Button onClick={handleSubmitBankRef} disabled={bankState === "submitting" || !bankReference.trim()}
            className="w-full mt-4 py-5 rounded-2xl font-bold gap-2 bg-brand-red hover:bg-brand-red-dark text-white shadow-lg disabled:opacity-60">
            {bankState === "submitting" ? <><Loader2 size={15} className="animate-spin"/>Submitting…</> : <><ClipboardCheck size={17}/>Submit Reference</>}
          </Button>
        </div>
        <p className="text-center text-sm text-brand-gray">
          Haven&apos;t transferred yet?{" "}
          <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! I placed order ${orderNumber}.`)} target="_blank" rel="noreferrer" className="text-brand-red font-semibold hover:underline">WhatsApp us →</a>
        </p>
      </div>
    </div>
  )

  if (mpesaState !== "idle" && payment === "mpesa") return (
    <div className="pt-18 min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="text-center max-w-md w-full py-14 animate-fade-up">
        {mpesaState === "awaiting" ? (
          <>
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-brand-red-light rounded-full flex items-center justify-center mb-8 shadow-brand">
              <Phone size={36} className="text-brand-red animate-pulse"/>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl mb-3">Check your phone</h2>
            <p className="text-brand-gray mb-2">Prompt sent to <strong>{form.phone}</strong>.</p>
            <p className="text-brand-gray text-sm mb-8">Enter your PIN to pay <strong>{formatCurrency(grandTotal)}</strong>.</p>
            <div className="flex items-center justify-center gap-3 text-brand-gray text-sm">
              <Loader2 size={15} className="animate-spin text-brand-red"/> Waiting for confirmation…
            </div>
            <p className="text-xs text-brand-gray/60 mt-4">Expires in 60 seconds. Don&apos;t close this page.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-8"><AlertCircle size={36} className="text-red-500"/></div>
            <h2 className="font-display font-black text-2xl md:text-3xl mb-3">Payment Not Completed</h2>
            <p className="text-brand-gray mb-2">
              {mpesaState === "cancelled" ? "You dismissed the M-Pesa prompt."
               : mpesaState === "timeout" ? "The prompt expired before you entered your PIN."
               : mpesaMsg || "The payment could not be processed."}
            </p>
            <p className="text-sm text-brand-gray mb-8">Order <strong>{orderNumber}</strong> saved — retry below.</p>
            {serverError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-5">{serverError}</p>}
            <div className="flex flex-col gap-3">
              <Button onClick={handleMpesaRetry} disabled={submitting} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-10 py-5 font-bold gap-2 shadow-lg">
                {submitting ? <><Loader2 size={15} className="animate-spin"/>Sending…</> : "Retry M-Pesa Payment"}
              </Button>
              <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! My M-Pesa for order ${orderNumber} failed.`)} target="_blank" rel="noreferrer">
                <Button className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full py-5 font-bold gap-2">💬 Pay via WhatsApp</Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="pt-18">
      <div className="bg-brand-red text-white px-4 sm:px-8 lg:px-20 pt-10 pb-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display font-black text-[clamp(32px,5vw,56px)]">Checkout</h1>
          <div className="flex items-center gap-3 mt-4">
            {([1,2] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn("w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all",
                  step >= s ? "bg-white text-brand-red" : "bg-white/25 text-white")}>
                  {step > s ? <Check size={13}/> : s}
                </div>
                <span className={cn("text-xs md:text-sm font-medium", step >= s ? "opacity-100":"opacity-50")}>
                  {s === 1 ? "Your Details" : "Review & Pay"}
                </span>
                {s < 2 && <span className="opacity-30 ml-1 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">
          <div>
            {step === 1 ? (
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-brand-sm animate-fade-in">
                <h2 className="font-display font-bold text-xl md:text-2xl mb-6">Your Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Full Name <span className="text-brand-red">*</span></Label>
                    <Input value={form.name} onChange={(e)=>update("name",e.target.value)} placeholder="Jane Wanjiku" className="rounded-xl border-2"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Phone <span className="text-brand-red">*</span></Label>
                    <Input value={form.phone} onChange={(e)=>update("phone",e.target.value)} placeholder="+254 700 000 000" className="rounded-xl border-2"/>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  <Label className="text-sm">Email</Label>
                  <Input value={form.email} onChange={(e)=>update("email",e.target.value)} placeholder="jane@email.com" className="rounded-xl border-2"/>
                </div>
                <div className="space-y-1.5 mb-4">
                  <Label className="text-sm">Delivery Address <span className="text-brand-red">*</span></Label>
                  <Input value={form.address} onChange={(e)=>update("address",e.target.value)} placeholder="123 Moi Avenue, Apt 4B" className="rounded-xl border-2"/>
                </div>
                <div className="space-y-1.5 mb-4">
                  <Label className="text-sm">City</Label>
                  <Input value={form.city} onChange={(e)=>update("city",e.target.value)} placeholder="Nairobi" className="rounded-xl border-2"/>
                </div>
                <div className="space-y-1.5 mb-6">
                  <Label className="text-sm">Order Notes <span className="text-brand-gray font-normal">(optional)</span></Label>
                  <Textarea value={form.notes} onChange={(e)=>update("notes",e.target.value)} placeholder="Leave at gate, call on arrival…" className="rounded-xl border-2 min-h-18 resize-none"/>
                </div>
                <Button onClick={()=>setStep(2)} disabled={!canContinue} className="w-full py-5 rounded-2xl font-bold bg-brand-red hover:bg-brand-red-dark text-white disabled:opacity-50 shadow-lg">
                  Continue to Review →
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Delivery details summary */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 shadow-brand-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display font-bold text-lg md:text-xl">Delivery Details</h2>
                    <button onClick={()=>setStep(1)} className="text-brand-red text-sm font-semibold hover:underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[["Name",form.name],["Phone",form.phone],["Email",form.email||"—"],["Address",form.address]].map(([k,v])=>(
                      <div key={k}><div className="text-[11px] text-brand-gray font-bold uppercase tracking-wide">{k}</div><div className="font-semibold mt-0.5 text-sm">{v}</div></div>
                    ))}
                  </div>
                </div>

                {/* Delivery zone picker — shown only in zones mode */}
                {settings.delivery_mode === "zones" && zones.length > 0 && (
                  <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 shadow-brand-sm">
                    <h2 className="font-display font-bold text-lg md:text-xl mb-4">Select Delivery Area</h2>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {zones.map((z) => (
                        <label key={z.id} className={cn("flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                          selectedZone?.id === z.id ? "border-brand-red bg-brand-red-light" : "border-gray-100 hover:border-brand-red/30")}>
                          <input type="radio" name="zone" checked={selectedZone?.id === z.id} onChange={() => setSelectedZone(z)} className="accent-brand-red w-4 h-4 shrink-0"/>
                          <div className={cn("shrink-0", selectedZone?.id === z.id ? "text-brand-red" : "text-gray-400")}>
                            {ZONE_TYPE_ICONS[z.zone_type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm">{z.name}</div>
                            {z.description && <div className="text-xs text-gray-400 truncate">{z.description}</div>}
                          </div>
                          <div className="font-display font-bold text-sm shrink-0 text-brand-red">
                            {z.price === 0 ? "Free" : formatCurrency(z.price)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment method */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 shadow-brand-sm">
                  <h2 className="font-display font-bold text-lg md:text-xl mb-5">Payment Method</h2>
                  <div className="flex flex-col gap-3 mb-5">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <label key={opt.value} className={cn("flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all",
                        payment===opt.value ? "border-brand-red bg-brand-red-light" : "border-black/10 hover:border-brand-red/40")}>
                        <input type="radio" name="payment" value={opt.value} checked={payment===opt.value} onChange={()=>setPayment(opt.value)} className="accent-brand-red w-4 h-4 shrink-0"/>
                        <div className={cn("shrink-0", payment===opt.value?"text-brand-red":"text-brand-gray")}>{opt.icon}</div>
                        <div><div className="font-semibold text-sm">{opt.label}</div><div className="text-xs text-brand-gray mt-0.5">{opt.hint}</div></div>
                      </label>
                    ))}
                  </div>
                  {payment === "mpesa" && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex gap-2 mb-4">
                      <ShieldCheck size={16} className="text-green-600 shrink-0 mt-0.5"/>
                      <p className="text-xs text-green-700"><strong>Secure via Safaricom M-Pesa.</strong> Check your phone for the prompt after clicking below.</p>
                    </div>
                  )}
                  {payment === "bank" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-xs text-blue-700 mb-4">
                      <p className="font-bold mb-1">How bank transfer works:</p>
                      <p>1. Place order — bank details shown next.</p>
                      <p>2. Transfer the amount to our account.</p>
                      <p>3. Enter your transaction code — confirmed same day.</p>
                    </div>
                  )}
                  {serverError && (
                    <div className="flex gap-2 items-start bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs mb-4">
                      <AlertCircle size={14} className="shrink-0 mt-0.5"/> {serverError}
                    </div>
                  )}
                  <Button onClick={handlePlaceOrder} disabled={submitting || !canPay}
                    className="w-full py-5 rounded-2xl font-bold text-base gap-2 bg-brand-red hover:bg-brand-red-dark text-white shadow-lg disabled:opacity-60">
                    {submitting ? <><Loader2 size={15} className="animate-spin"/>Placing order…</>
                     : payment === "mpesa" ? `📱 Pay ${formatCurrency(grandTotal)} via M-Pesa`
                     : payment === "bank"  ? `🏦 Place Order — Get Bank Details`
                     : `🎉 Place Order — ${formatCurrency(grandTotal)}`}
                  </Button>
                  {settings.delivery_mode === "zones" && !selectedZone && (
                    <p className="text-xs text-red-500 text-center mt-2">Please select a delivery area above.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 shadow-brand lg:sticky lg:top-24">
            <h2 className="font-display font-bold text-lg md:text-xl mb-5">Order Summary</h2>
            <div className="flex flex-col gap-3 mb-4">
              {items.map((item)=>(
                <div key={`${item.id}-${item.selectedSize}`} className="flex items-center gap-3">
                  <svg width={44} height={44} viewBox="0 0 44 44" className="rounded-xl shrink-0">
                    <rect width={44} height={44} fill={item.colors[0]} rx={8}/>
                    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize={20}>{item.emoji}</text>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-snug truncate">{item.name}</div>
                    {item.sizes.length > 1 && <div className="text-xs text-brand-gray">{item.selectedSize} · ×{item.qty}</div>}
                  </div>
                  <div className="font-bold text-sm shrink-0">{formatCurrency(item.price*item.qty)}</div>
                </div>
              ))}
            </div>
            <Separator className="mb-3"/>
            <div className="flex justify-between text-sm mb-2 text-brand-gray"><span>Subtotal</span><span>{formatCurrency(rawTotal)}</span></div>
            <div className="flex justify-between text-sm mb-1 text-brand-gray">
              <span>Delivery{selectedZone ? ` (${selectedZone.name})` : ""}</span>
              <span className={delivery===0?"text-green-600 font-semibold":""}>{delivery===0?"Free 🎉":formatCurrency(delivery)}</span>
            </div>
            {settings.delivery_note && (
              <p className="text-xs text-brand-gray/70 mb-3 leading-relaxed">{settings.delivery_note}</p>
            )}
            <Separator className="mb-3"/>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm md:text-base">Grand Total</span>
              <span className="font-display font-black text-xl md:text-2xl text-brand-red">{formatCurrency(grandTotal)}</span>
            </div>
            <Link href="/cart">
              <button className="flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-red transition-colors mt-4">
                <ArrowLeft size={11}/> Edit cart
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  )
}
