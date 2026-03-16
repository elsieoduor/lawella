"use client"

import { useState } from "react"
import { MessageCircle, Mail, MapPin, Clock, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { WHATSAPP_NUMBER } from "@/lib/data"
import { getWhatsAppUrl } from "@/lib/utils"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CONTACT_INFO = [
  {
    icon: <MessageCircle size={22} />,
    title: "WhatsApp",
    value: "+254 710 776 500",
    sub: "Our fastest response channel",
    link: `https://wa.me/${WHATSAPP_NUMBER}`,
  },
  {
    icon: <Mail size={22} />,
    title: "Email",
    value: "hello@lawella.co.ke",
    sub: "We reply within 24 hours",
    link: "mailto:hello@lawella.co.ke",
  },
  {
    icon: <MapPin size={22} />,
    title: "Location",
    value: "Nairobi, Kenya",
    sub: "We deliver nationwide",
    link: null,
  },
  {
    icon: <Clock size={22} />,
    title: "Hours",
    value: "Mon–Sat, 8am–8pm",
    sub: "We're rarely offline on WhatsApp",
    link: null,
  },
]

type SendState = "idle" | "sending" | "sent" | "error"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sendState, setSendState] = useState<SendState>("idle")
  const [errorMsg, setErrorMsg]   = useState("")

  const update   = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const canSend  = form.name.trim() && form.message.trim() && sendState !== "sending"

  const handleSubmit = async () => {
    if (!canSend) return
    setSendState("sending"); setErrorMsg("")

    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Try WhatsApp instead.")
        setSendState("error")
        return
      }

      setSendState("sent")
    } catch {
      setErrorMsg("Network error — please try WhatsApp instead.")
      setSendState("error")
    }
  }

  return (
    <div className="pt-18">
      {/* Header */}
      <div
        className="text-white text-center px-4 sm:px-8 lg:px-20"
        style={{ background: "linear-gradient(135deg, #C41E3A 0%, #8B2635 100%)" }}
      >
        <div className="max-w-2xl mx-auto py-16 sm:py-20">
          <h1 className="font-display font-black text-[clamp(40px,6vw,72px)] mb-4">
            Get in <em>touch</em>
          </h1>
          <p className="text-white/85 text-lg max-w-md mx-auto">
            For custom orders, bulk purchases, or just to say hi — we&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

        {/* Contact info */}
        <div>
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-8 sm:mb-10">
            Let&apos;s <em className="text-brand-red">connect</em>
          </h2>

          <div className="flex flex-col gap-6 sm:gap-8 mb-10">
            {CONTACT_INFO.map((c) => (
              <div key={c.title} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-brand-red-light text-brand-red flex items-center justify-center shrink-0">
                  {c.icon}
                </div>
                <div>
                  <div className="font-bold text-base">{c.title}</div>
                  {c.link ? (
                    <a href={c.link} target="_blank" rel="noreferrer"
                      className="text-brand-red font-semibold hover:underline text-sm">
                      {c.value}
                    </a>
                  ) : (
                    <div className="font-semibold text-sm">{c.value}</div>
                  )}
                  <div className="text-brand-gray text-xs mt-0.5">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <a href={getWhatsAppUrl(WHATSAPP_NUMBER, "Hi Lawella! I'd like to chat.")}
            target="_blank" rel="noreferrer">
            <Button className="bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full px-8 py-6 font-bold text-base gap-2 shadow-lg">
              <MessageCircle size={18} /> Chat on WhatsApp Now
            </Button>
          </a>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-brand">

          {/* ── Success state ── */}
          {sendState === "sent" ? (
            <div className="text-center py-10 sm:py-14 animate-fade-up">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h3 className="font-display font-black text-2xl mb-3">Message sent!</h3>
              <p className="text-brand-gray leading-relaxed mb-1">
                Thank you, <strong>{form.name}</strong>!
              </p>
              <p className="text-brand-gray text-sm mb-6">
                We&apos;ll get back to you as soon as possible.
                {form.email && <> Check your inbox — we&apos;ve sent you a confirmation.</>}
              </p>
              <a href={getWhatsAppUrl(WHATSAPP_NUMBER, "Hi Lawella! I just sent you a message through your website.")}
                target="_blank" rel="noreferrer">
                <Button className="bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full px-8 py-4 font-bold gap-2">
                  <MessageCircle size={16}/> Also ping us on WhatsApp
                </Button>
              </a>
            </div>
          ) : (
            <>
              <h3 className="font-display font-black text-2xl mb-6 sm:mb-8">Send us a message</h3>

              {/* Name + Email — stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label>Your Name <span className="text-brand-red">*</span></Label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jane Wanjiku"
                    className="rounded-xl border-2"
                    disabled={sendState === "sending"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email <span className="text-gray-400 font-normal text-xs">(for auto-reply)</span></Label>
                  <Input
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jane@email.com"
                    className="rounded-xl border-2"
                    disabled={sendState === "sending"}
                  />
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  placeholder="Custom order, bulk order, question…"
                  className="rounded-xl border-2"
                  disabled={sendState === "sending"}
                />
              </div>

              <div className="space-y-1.5 mb-6 sm:mb-7">
                <Label>Message <span className="text-brand-red">*</span></Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Tell us what you're looking for…"
                  className="rounded-xl border-2 min-h-32.5 resize-none"
                  disabled={sendState === "sending"}
                />
              </div>

              {/* Error */}
              {sendState === "error" && (
                <div className="flex gap-2 items-start bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!canSend}
                className="w-full py-5 sm:py-6 rounded-2xl text-base font-bold bg-brand-red hover:bg-brand-red-dark text-white gap-2 shadow-lg disabled:opacity-50"
              >
                {sendState === "sending"
                  ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  : <><Send size={16} /> Send Message</>}
              </Button>

              <p className="text-xs text-brand-gray text-center mt-4">
                Prefer instant replies?{" "}
                <a href={getWhatsAppUrl(WHATSAPP_NUMBER, "Hi Lawella!")}
                  target="_blank" rel="noreferrer" className="text-brand-red font-semibold hover:underline">
                  Message us on WhatsApp →
                </a>
              </p>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
