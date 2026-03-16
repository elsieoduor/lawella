"use client"

import { useState } from "react"
import { MessageCircle, Mail, MapPin, Clock, Send } from "lucide-react"
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
    value: "+254 700 000 000",
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

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const canSend = form.name.trim() && form.message.trim()

  return (
    <div className="pt-[72px]">
      {/* Header */}
      <div
        className="text-white text-center px-4 sm:px-8 lg:px-20 py-18"
        style={{ background: "linear-gradient(135deg, #C41E3A 0%, #8B2635 100%)" }}
      >
        <div className="max-w-2xl mx-auto py-12">
          <h1 className="font-display font-black text-[clamp(40px,6vw,72px)] mb-4">
            Get in <em>touch</em>
          </h1>
          <p className="text-white/85 text-lg max-w-md mx-auto">
            For custom orders, bulk purchases, or just to say hi — we&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Contact Info */}
        <div>
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-10">
            Let&apos;s <em className="text-brand-red">connect</em>
          </h2>

          <div className="flex flex-col gap-8 mb-10">
            {CONTACT_INFO.map((c) => (
              <div key={c.title} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-brand-red-light text-brand-red flex items-center justify-center shrink-0">
                  {c.icon}
                </div>
                <div>
                  <div className="font-bold text-base">{c.title}</div>
                  {c.link ? (
                    <a
                      href={c.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-red font-semibold hover:underline text-sm"
                    >
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

          <a
            href={getWhatsAppUrl(WHATSAPP_NUMBER, "Hi Lawella! I'd like to chat.")}
            target="_blank"
            rel="noreferrer"
          >
            <Button className="bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full px-8 py-6 font-bold text-base gap-2 shadow-lg">
              <MessageCircle size={18} /> Chat on WhatsApp Now
            </Button>
          </a>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-brand">
          {sent ? (
            <div className="text-center py-12 animate-fade-up">
              <div className="text-6xl mb-5">💌</div>
              <h3 className="font-display font-black text-2xl mb-3">Message sent!</h3>
              <p className="text-brand-gray">
                Thank you, <strong>{form.name}</strong>! We&apos;ll get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <>
              <h3 className="font-display font-black text-2xl mb-8">Send us a message</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label>Your Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jane Wanjiku"
                    className="rounded-xl border-2 focus:border-brand-red"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jane@email.com"
                    className="rounded-xl border-2 focus:border-brand-red"
                  />
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  placeholder="Custom order, bulk order, question..."
                  className="rounded-xl border-2 focus:border-brand-red"
                />
              </div>
              <div className="space-y-1.5 mb-7">
                <Label>Message *</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Tell us what you're looking for..."
                  className="rounded-xl border-2 focus:border-brand-red min-h-[130px] resize-none"
                />
              </div>
              <Button
                onClick={() => canSend && setSent(true)}
                disabled={!canSend}
                className="w-full py-6 rounded-2xl text-base font-bold bg-brand-red hover:bg-brand-red-dark text-white gap-2 shadow-lg disabled:opacity-50"
              >
                <Send size={16} /> Send Message
              </Button>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
