"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check, Phone, Banknote, CreditCard, Loader2,
  ArrowLeft, ShieldCheck, AlertCircle, Building2,
  ClipboardCheck, CheckCircle2, Copy,
} from "lucide-react"
import { useCartStore } from "@/lib/store"
import { formatCurrency, getWhatsAppUrl, cn } from "@/lib/utils"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { StoreSettings } from "@/lib/types"

type Step          = 1 | 2
type PaymentMethod = "mpesa" | "cash" | "bank"
type MpesaState    = "idle" | "awaiting" | "success" | "cancelled" | "timeout" | "failed"
type BankState     = "idle" | "submitting" | "submitted" | "error"

interface OrderForm {
  name: string; email: string; phone: string
  address: string; city: string; notes: string
}

const PAYMENT_OPTIONS = [
  { value: "mpesa" as PaymentMethod, label: "M-Pesa",           icon: <Phone size={18} />,
    hint: "You'll get a payment prompt — enter your PIN to confirm." },
  { value: "cash"  as PaymentMethod, label: "Cash on Delivery", icon: <Banknote size={18} />,
    hint: "Pay with cash when your order arrives." },
  { value: "bank"  as PaymentMethod, label: "Bank Transfer",    icon: <CreditCard size={18} />,
    hint: "Transfer to our bank account — submit your reference to confirm." },
]

const SETTINGS_DEFAULTS: StoreSettings = {
  store_name: "Lawella", store_email: "", whatsapp_number: "254700000000",
  bank_name: "Equity Bank Kenya", bank_account_name: "Lawella",
  bank_account_number: "", bank_branch: "", bank_swift: "",
  delivery_fee: 300, free_delivery_threshold: 5000,
  delivery_note: "", instagram_url: "", facebook_url: "",
}

export default function CheckoutPage() {
  const router    = useRouter()
  const items     = useCartStore((s) => s.items)
  const rawTotal  = useCartStore((s) => s.total())
  const clearCart = useCartStore((s) => s.clearCart)

  // ── Settings (delivery fee, bank details, WhatsApp) ───────────────────────
  const [settings, setSettings] = useState<StoreSettings>(SETTINGS_DEFAULTS)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...SETTINGS_DEFAULTS, ...d }))
      .catch(() => {}) // silently fall back to defaults
  }, [])

  // Derived from settings
  const delivery   = rawTotal >= settings.free_delivery_threshold ? 0 : settings.delivery_fee
  const grandTotal = rawTotal + delivery
  const WHATSAPP   = settings.whatsapp_number || "254700000000"

  // ── Page state ────────────────────────────────────────────────────────────
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

  // Bank reference state
  const [bankState, setBankState]         = useState<BankState>("idle")
  const [bankReference, setBankReference] = useState("")
  const [bankRefError, setBankRefError]   = useState("")
  const [submittedRef, setSubmittedRef]   = useState("")
  const [copiedField, setCopiedField]     = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState<OrderForm>({
    name:"", email:"", phone:"", address:"", city:"", notes:"",
  })
  const update      = (k: keyof OrderForm, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const canContinue = form.name.trim() && form.phone.trim() && form.address.trim()

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
      } catch { /* network blip — keep polling */ }
    }, 4000)
  }, [clearCart])

  const handlePlaceOrder = async () => {
    setSubmitting(true); setServerError("")
    try {
      const res  = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name.trim(), customerEmail: form.email.trim() || null,
          customerPhone: form.phone.trim(), deliveryAddress: form.address.trim(),
          deliveryCity: form.city.trim() || null, notes: form.notes.trim() || null,
          paymentMethod: payment, items, subtotal: rawTotal, deliveryFee: delivery, total: grandTotal,
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
      const res  = await fetch("/api/mpesa/pay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderNumber, phone: form.phone, amount: grandTotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkoutRequestId) { setServerError(data.error ?? "Could not send prompt."); setSubmitting(false); return }
      setMpesaState("awaiting"); startPolling(data.checkoutRequestId)
    } catch { setServerError("Network error."); setSubmitting(false) }
  }

  const handleSubmitBankRef = async () => {
    if (!bankReference.trim()) { setBankRefError("Please enter your transaction reference."); return }
    if (bankReference.trim().length < 4) { setBankRefError("Reference looks too short — check again."); return }
    setBankRefError(""); setBankState("submitting")
    try {
      const res  = await fetch(`/api/orders/${orderId}/bank-confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankReference: bankReference.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setBankRefError(data.error ?? "Submission failed — please try again."); setBankState("error"); return }
      setSubmittedRef(data.reference); setBankState("submitted")
    } catch { setBankRefError("Network error — please try again."); setBankState("error") }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  // ── M-Pesa success ─────────────────────────────────────────────────────────
  if (placed && payment === "mpesa" && mpesaState === "success") return (
    <div className="pt-[72px] min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="text-center max-w-md px-6 py-14 animate-fade-up">
        <div className="text-8xl mb-6 animate-float">🎉</div>
        <h1 className="font-display font-black text-5xl text-brand-red mb-3">Payment Received!</h1>
        <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full mb-5">
          Order {orderNumber}
        </div>
        {receipt && <p className="text-xs text-brand-gray mb-3">M-Pesa receipt: <strong>{receipt}</strong></p>}
        <p className="text-brand-gray text-base leading-relaxed mb-8">
          Thank you, <strong>{form.name}</strong>! We&apos;ll reach out on <strong>{form.phone}</strong> to arrange delivery.
        </p>
        <Button onClick={() => router.push("/")} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-12 py-5 font-bold shadow-lg">
          Back to Home
        </Button>
      </div>
    </div>
  )

  // ── Cash on delivery success ───────────────────────────────────────────────
  if (placed && payment === "cash") return (
    <div className="pt-[72px] min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="text-center max-w-md px-6 py-14 animate-fade-up">
        <div className="text-8xl mb-6 animate-float">🎉</div>
        <h1 className="font-display font-black text-5xl text-brand-red mb-3">Order Placed!</h1>
        <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full mb-5">
          Order {orderNumber}
        </div>
        <p className="text-brand-gray text-base leading-relaxed mb-8">
          Thank you, <strong>{form.name}</strong>! Have your cash ready when your order arrives. We&apos;ll contact you on <strong>{form.phone}</strong>.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/")} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-12 py-5 font-bold shadow-lg">
            Back to Home
          </Button>
          <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! I placed order ${orderNumber}. Looking forward to delivery!`)} target="_blank" rel="noreferrer">
            <Button className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full py-5 font-bold gap-2">
              💬 Confirm via WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  )

  // ── Bank transfer — reference submitted ────────────────────────────────────
  if (placed && payment === "bank" && bankState === "submitted") return (
    <div className="pt-[72px] min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="text-center max-w-md px-6 py-14 animate-fade-up">
        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={44} className="text-green-600" />
        </div>
        <h1 className="font-display font-black text-4xl text-brand-black mb-3">Reference Submitted!</h1>
        <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full mb-5">
          Order {orderNumber}
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-sm text-green-700 mb-6 text-left">
          <p className="font-bold mb-1">Reference received ✓</p>
          <p className="font-mono font-bold text-lg tracking-widest text-green-800 mb-2">{submittedRef}</p>
          <p>We&apos;ll verify your payment and confirm your order within a few hours. You&apos;ll get an SMS once confirmed.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/")} className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-12 py-5 font-bold shadow-lg">
            Back to Home
          </Button>
          <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! I submitted reference ${submittedRef} for order ${orderNumber}.`)} target="_blank" rel="noreferrer">
            <Button className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full py-5 font-bold gap-2">
              💬 Message us on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  )

  // ── Bank transfer — show details + reference input ─────────────────────────
  if (placed && payment === "bank") return (
    <div className="pt-[72px] min-h-screen bg-brand-cream">
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 size={36} className="text-blue-600" />
          </div>
          <h1 className="font-display font-black text-4xl text-brand-black mb-2">Transfer Payment</h1>
          <div className="inline-block bg-brand-red-light text-brand-red font-bold text-sm px-4 py-1.5 rounded-full">
            Order {orderNumber}
          </div>
        </div>

        {/* Step 1: Bank details */}
        <div className="bg-white rounded-3xl p-6 shadow-brand-sm mb-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
            <h2 className="font-bold text-base">Transfer {formatCurrency(grandTotal)} to this account</h2>
          </div>
          <div className="space-y-3 mb-4">
            {[
              { label: "Bank",         value: settings.bank_name           || "Equity Bank Kenya", field: "bank"    },
              { label: "Account Name", value: settings.bank_account_name   || "Lawella",           field: "accname" },
              { label: "Account No.",  value: settings.bank_account_number || "—",                 field: "accnum"  },
              ...(settings.bank_branch ? [{ label: "Branch", value: settings.bank_branch,          field: "branch"  }] : []),
              ...(settings.bank_swift  ? [{ label: "SWIFT",  value: settings.bank_swift,           field: "swift"   }] : []),
              { label: "Reference",    value: orderNumber,                                          field: "ref"     },
            ].map(({ label, value, field }) => (
              <div key={field} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-2">
                <div>
                  <div className="text-[11px] font-bold text-brand-gray uppercase tracking-wide">{label}</div>
                  <div className={cn("font-bold mt-0.5", field === "ref" ? "text-brand-red font-mono text-base" : "text-brand-black text-sm")}>
                    {value}
                  </div>
                </div>
                {value !== "—" && (
                  <button onClick={() => copyToClipboard(value, field)}
                    className="text-gray-400 hover:text-brand-red transition-colors shrink-0 ml-2" title="Copy">
                    {copiedField === field ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
            <strong>Important:</strong> Use <strong>{orderNumber}</strong> as your payment reference so we can match your transfer.
          </div>
        </div>

        {/* Step 2: Reference input */}
        <div className="bg-white rounded-3xl p-6 shadow-brand-sm mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
            <h2 className="font-bold text-base">Enter your confirmation code after transferring</h2>
          </div>
          <p className="text-sm text-brand-gray mb-5 ml-9">
            You&apos;ll get a transaction code from your bank or M-Pesa app (e.g. <span className="font-mono">SAM1A2B3C4D</span>).
          </p>
          <div className="space-y-3">
            <Label className="font-semibold text-sm">
              Transaction / Confirmation Code <span className="text-brand-red">*</span>
            </Label>
            <Input
              value={bankReference}
              onChange={(e) => { setBankReference(e.target.value.toUpperCase()); setBankRefError("") }}
              placeholder="e.g. SAM1A2B3C4D or TXN123456"
              className={cn("rounded-xl border-2 font-mono text-base tracking-wider",
                bankRefError ? "border-red-400 bg-red-50" : "border-gray-200")}
              maxLength={30}
              disabled={bankState === "submitting"}
            />
            {bankRefError && <p className="text-xs text-red-500">⚠️ {bankRefError}</p>}
            <p className="text-xs text-brand-gray">Your order is confirmed once we verify this reference — usually within a few hours.</p>
          </div>
          <Button onClick={handleSubmitBankRef} disabled={bankState === "submitting" || !bankReference.trim()}
            className="w-full mt-5 py-5 rounded-2xl font-bold text-base gap-2 bg-brand-red hover:bg-brand-red-dark text-white shadow-lg disabled:opacity-60">
            {bankState === "submitting"
              ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
              : <><ClipboardCheck size={18} /> Submit Reference</>}
          </Button>
        </div>

        <p className="text-center text-sm text-brand-gray">
          Haven&apos;t transferred yet?{" "}
          <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! I placed order ${orderNumber} and will send payment soon.`)}
            target="_blank" rel="noreferrer"
            className="text-brand-red font-semibold hover:underline">
            Message us on WhatsApp instead →
          </a>
        </p>
      </div>
    </div>
  )

  // ── M-Pesa awaiting / failed ───────────────────────────────────────────────
  if (mpesaState !== "idle" && payment === "mpesa") return (
    <div className="pt-[72px] min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="text-center max-w-md px-6 py-14 animate-fade-up">
        {mpesaState === "awaiting" ? (
          <>
            <div className="w-24 h-24 mx-auto bg-brand-red-light rounded-full flex items-center justify-center mb-8 shadow-brand">
              <Phone size={40} className="text-brand-red animate-pulse" />
            </div>
            <h2 className="font-display font-black text-3xl mb-3">Check your phone</h2>
            <p className="text-brand-gray mb-2">An M-Pesa prompt was sent to <strong>{form.phone}</strong>.</p>
            <p className="text-brand-gray text-sm mb-8">Enter your PIN to pay <strong>{formatCurrency(grandTotal)}</strong>.</p>
            <div className="flex items-center justify-center gap-3 text-brand-gray text-sm">
              <Loader2 size={16} className="animate-spin text-brand-red" />
              Waiting for confirmation…
            </div>
            <p className="text-xs text-brand-gray/60 mt-4">Prompt expires in 60 seconds. Don&apos;t close this page.</p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-8">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="font-display font-black text-3xl mb-3">Payment Not Completed</h2>
            <p className="text-brand-gray mb-2">
              {mpesaState === "cancelled" ? "You dismissed the M-Pesa prompt."
               : mpesaState === "timeout"  ? "The prompt expired before you entered your PIN."
               : mpesaMsg || "The payment could not be processed."}
            </p>
            <p className="text-sm text-brand-gray mb-8">Order <strong>{orderNumber}</strong> saved — retry below.</p>
            {serverError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-5">{serverError}</p>}
            <div className="flex flex-col gap-3">
              <Button onClick={handleMpesaRetry} disabled={submitting}
                className="bg-brand-red hover:bg-brand-red-dark text-white rounded-full px-10 py-5 font-bold gap-2 shadow-lg">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : "Retry M-Pesa Payment"}
              </Button>
              <a href={getWhatsAppUrl(WHATSAPP, `Hi Lawella! My M-Pesa for order ${orderNumber} failed. Can you help?`)} target="_blank" rel="noreferrer">
                <Button className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full py-5 font-bold gap-2">
                  💬 Pay via WhatsApp
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── Main checkout form ─────────────────────────────────────────────────────
  return (
    <div className="pt-[72px]">
      <div className="bg-brand-red text-white px-4 sm:px-8 lg:px-20 pt-14 pb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display font-black text-[clamp(36px,5vw,60px)]">Checkout</h1>
          <div className="flex items-center gap-3 mt-5">
            {([1,2] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                  step >= s ? "bg-white text-brand-red" : "bg-white/25 text-white")}>
                  {step > s ? <Check size={14}/> : s}
                </div>
                <span className={cn("text-sm font-medium", step >= s ? "opacity-100":"opacity-50")}>
                  {s === 1 ? "Your Details" : "Review & Pay"}
                </span>
                {s < 2 && <span className="opacity-30 ml-1">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div>
            {step === 1 ? (
              <div className="bg-white rounded-3xl p-8 shadow-brand-sm animate-fade-in">
                <h2 className="font-display font-bold text-2xl mb-7">Your Details</h2>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="space-y-1.5">
                    <Label>Full Name <span className="text-brand-red">*</span></Label>
                    <Input value={form.name} onChange={(e)=>update("name",e.target.value)} placeholder="Jane Wanjiku" className="rounded-xl border-2"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone <span className="text-brand-red">*</span></Label>
                    <Input value={form.phone} onChange={(e)=>update("phone",e.target.value)} placeholder="+254 700 000 000" className="rounded-xl border-2"/>
                  </div>
                </div>
                <div className="space-y-1.5 mb-5">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e)=>update("email",e.target.value)} placeholder="jane@email.com" className="rounded-xl border-2"/>
                </div>
                <div className="space-y-1.5 mb-5">
                  <Label>Delivery Address <span className="text-brand-red">*</span></Label>
                  <Input value={form.address} onChange={(e)=>update("address",e.target.value)} placeholder="123 Moi Avenue, Apt 4B" className="rounded-xl border-2"/>
                </div>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={form.city} onChange={(e)=>update("city",e.target.value)} placeholder="Nairobi" className="rounded-xl border-2"/>
                  </div>
                </div>
                <div className="space-y-1.5 mb-8">
                  <Label>Order Notes <span className="text-brand-gray font-normal">(optional)</span></Label>
                  <Textarea value={form.notes} onChange={(e)=>update("notes",e.target.value)} placeholder="Leave at gate, call on arrival…" className="rounded-xl border-2 min-h-[88px] resize-none"/>
                </div>
                <Button onClick={()=>setStep(2)} disabled={!canContinue}
                  className="w-full py-5 rounded-2xl font-bold bg-brand-red hover:bg-brand-red-dark text-white disabled:opacity-50 shadow-lg">
                  Continue to Review →
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="bg-white rounded-3xl p-7 shadow-brand-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="font-display font-bold text-xl">Delivery Details</h2>
                    <button onClick={()=>setStep(1)} className="text-brand-red text-sm font-semibold hover:underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[["Name",form.name],["Phone",form.phone],["Email",form.email||"—"],["Address",form.address],["City",form.city||"—"]].map(([k,v])=>(
                      <div key={k}>
                        <div className="text-[11px] text-brand-gray font-bold uppercase tracking-wide">{k}</div>
                        <div className="font-semibold mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-7 shadow-brand-sm">
                  <h2 className="font-display font-bold text-xl mb-6">Payment Method</h2>
                  <div className="flex flex-col gap-3 mb-6">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <label key={opt.value} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        payment===opt.value ? "border-brand-red bg-brand-red-light" : "border-black/10 hover:border-brand-red/40")}>
                        <input type="radio" name="payment" value={opt.value} checked={payment===opt.value}
                          onChange={()=>setPayment(opt.value)} className="accent-brand-red w-4 h-4"/>
                        <div className={cn(payment===opt.value?"text-brand-red":"text-brand-gray")}>{opt.icon}</div>
                        <div>
                          <div className="font-semibold text-sm">{opt.label}</div>
                          <div className="text-xs text-brand-gray mt-0.5">{opt.hint}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {payment === "mpesa" && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex gap-3 mb-6">
                      <ShieldCheck size={18} className="text-green-600 shrink-0 mt-0.5"/>
                      <p className="text-sm text-green-700">
                        <strong>Secure via Safaricom M-Pesa.</strong> After clicking below, check your phone for the prompt and enter your PIN within 60 seconds.
                      </p>
                    </div>
                  )}
                  {payment === "bank" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 text-sm text-blue-700 mb-6">
                      <p className="font-bold mb-1">How bank transfer works:</p>
                      <p>1. Place your order — bank details shown next.</p>
                      <p>2. Transfer the amount to our account.</p>
                      <p>3. Enter your transaction code — we confirm same day.</p>
                    </div>
                  )}
                  {payment === "cash" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700 mb-6">
                      Have your cash ready when your order arrives. We&apos;ll contact you to arrange delivery.
                    </div>
                  )}

                  {serverError && (
                    <div className="flex gap-2 items-start bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                      <AlertCircle size={16} className="shrink-0 mt-0.5"/> {serverError}
                    </div>
                  )}

                  <Button onClick={handlePlaceOrder} disabled={submitting}
                    className="w-full py-5 rounded-2xl font-bold text-base gap-2 bg-brand-red hover:bg-brand-red-dark text-white shadow-lg disabled:opacity-60">
                    {submitting ? <><Loader2 size={16} className="animate-spin"/> Placing order…</>
                     : payment === "mpesa" ? `📱 Pay ${formatCurrency(grandTotal)} via M-Pesa`
                     : payment === "bank"  ? `🏦 Place Order — Get Bank Details`
                     : `🎉 Place Order — ${formatCurrency(grandTotal)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-3xl p-7 shadow-brand sticky top-24">
            <h2 className="font-display font-bold text-xl mb-6">Order Summary</h2>
            <div className="flex flex-col gap-4 mb-5">
              {items.map((item)=>(
                <div key={`${item.id}-${item.selectedSize}`} className="flex items-center gap-3">
                  <svg width={52} height={52} viewBox="0 0 52 52" className="rounded-xl shrink-0">
                    <rect width={52} height={52} fill={item.colors[0]} rx={10}/>
                    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize={24}>{item.emoji}</text>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-snug truncate">{item.name}</div>
                    {item.sizes.length > 1 && <div className="text-xs text-brand-gray">{item.selectedSize} · ×{item.qty}</div>}
                  </div>
                  <div className="font-bold text-sm shrink-0">{formatCurrency(item.price*item.qty)}</div>
                </div>
              ))}
            </div>
            <Separator className="mb-4"/>
            <div className="flex justify-between text-sm mb-2 text-brand-gray"><span>Subtotal</span><span>{formatCurrency(rawTotal)}</span></div>
            <div className="flex justify-between text-sm mb-4 text-brand-gray">
              <span>Delivery</span>
              <span className={delivery===0?"text-green-600 font-semibold":""}>{delivery===0?"Free 🎉":formatCurrency(delivery)}</span>
            </div>
            {settings.delivery_note && (
              <p className="text-xs text-brand-gray mb-4 leading-relaxed">{settings.delivery_note}</p>
            )}
            <Separator className="mb-4"/>
            <div className="flex justify-between items-center">
              <span className="font-bold text-base">Grand Total</span>
              <span className="font-display font-black text-2xl text-brand-red">{formatCurrency(grandTotal)}</span>
            </div>
            <Link href="/cart">
              <button className="flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-red transition-colors mt-5">
                <ArrowLeft size={12}/> Edit cart
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  )
}
