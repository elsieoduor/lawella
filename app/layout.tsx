import type { Metadata } from "next"
import { Playfair_Display, DM_Sans } from "next/font/google"
import "./globals.css";
import { Nav } from "@/components/nav"


const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Lawella | Handcrafted Crochet",
  description:
    "Handmade crochet sweaters, blankets, tote bags & scrunchies made with love in Nairobi, Kenya.",
  keywords: "crochet, handmade, sweaters, blankets, tote bags, scrunchies, Nairobi, Kenya",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-brand-cream text-brand-black antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
