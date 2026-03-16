export function Ticker() {
  const items = [
    "Free delivery on orders over KES 5,000",
    "✦",
    "Handcrafted with love in Nairobi",
    "✦",
    "Customise any product",
    "✦",
    "DM us on WhatsApp for bulk orders",
    "✦",
  ]
  const text = [...items, ...items].join("   ")

  return (
    <div className="bg-brand-red text-white overflow-hidden py-2.5 text-[13px] font-medium tracking-wide whitespace-nowrap">
      <span className="inline-block animate-marquee">{text.repeat(3)}</span>
    </div>
  )
}
