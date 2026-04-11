import { getSession } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Bug } from "lucide-react"

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
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/book-a-demo"
              className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Book a demo
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-center mb-10">
              <Image src="/logo/logo.svg" alt={config.app.title} width={64} height={64} className="brightness-0 invert opacity-80" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white leading-tight">
              Automate the mundane so your team can focus on <span className="text-primary">what actually matters</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              One platform for accounting, invoicing, hiring, and engagement. Built for businesses that move fast.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/book-a-demo"
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
              >
                Book a demo
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

        <footer className="p-6 text-center">
          <p className="text-white/30 text-[10px] md:text-xs flex items-center justify-center gap-2 flex-wrap">
            <span>&copy; {new Date().getFullYear()} {config.app.title} by <a href="https://www.mindtris.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline-offset-4 hover:underline">Mindtris&trade; Inc</a>.</span>
            <span className="hidden md:inline">&middot;</span>
            <Link href="/report-bug" className="flex items-center gap-1 hover:text-white transition-colors">
              <Bug className="h-3 w-3" />
              Report a bug
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
