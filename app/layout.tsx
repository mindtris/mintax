import config from "@/lib/core/config"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

// Fallback font stubs for restricted network environments
const inter = { variable: "--font-inter" }
const playfair = { variable: "--font-playfair" }

export const metadata: Metadata = {
  title: {
    template: "%s | Mintax",
    default: config.app.title,
  },
  description: config.app.description,
  icons: {
    icon: "/logo/logo.svg",
    shortcut: "/logo/logo.svg",
    apple: "/logo/logo.svg",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL(config.app.baseURL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: config.app.baseURL,
    title: config.app.title,
    description: config.app.description,
    siteName: config.app.title,
  },
  twitter: {
    card: "summary_large_image",
    title: config.app.title,
    description: config.app.description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background antialiased font-sans">{children}</body>
    </html>
  )
}
