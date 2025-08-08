import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PlugPost - Modern Blog Platform",
  description: "Discover amazing stories, insights, and ideas from our community of writers.",
  keywords: ["blog", "articles", "stories", "writing", "community"],
  authors: [{ name: "PlugPost Team" }],
  openGraph: {
    title: "PlugPost - Modern Blog Platform",
    description: "Discover amazing stories, insights, and ideas from our community of writers.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlugPost - Modern Blog Platform",
    description: "Discover amazing stories, insights, and ideas from our community of writers.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
