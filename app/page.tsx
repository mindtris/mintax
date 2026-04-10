import { getSession } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default async function Home() {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen relative font-sans">
      {/* Full-screen background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/mountain.svg')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav */}
        <header className="flex items-center justify-between px-6 md:px-12 py-5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/logo.svg" alt={config.app.title} width={28} height={28} className="brightness-0 invert" />
            <span className="text-white font-bold text-lg tracking-tight">{config.app.title}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Get started
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white leading-tight">
              Automate the mundane so your
              <br />
              team can focus on <span className="text-primary">what actually matters</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/60 max-w-lg mx-auto leading-relaxed">
              Multi-tenant accounting, invoicing, hiring, and engagement — all in one platform built for modern businesses.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
              >
                Start free
              </Link>
              <Link
                href="/signin"
                className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm backdrop-blur-sm border border-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} {config.app.title} by Mindtris&trade; Inc. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
