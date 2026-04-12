import { getSession } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Bug, Github, Leaf } from "lucide-react"

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
        <header className="flex items-center justify-between px-8 md:px-12 py-8 text-white">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
            <Image src="/logo/logo.svg" alt="Mindtris" width={32} height={32} className="w-8 h-8 brightness-0 invert" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium backdrop-blur-sm border border-white/10">
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
            <div className="flex justify-center items-center gap-3 mb-10">
              <Image src="/logo/logo.svg" alt="Mindtris" width={64} height={64} className="brightness-0 invert opacity-80" />
              <span className="text-3xl font-bold tracking-tight text-white/90 leading-tight">Mindtris&trade;</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white leading-tight">
              Automate the mundane so your team can focus on <span className="text-primary">what actually matters</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              One platform for accounting, invoicing, hiring, and engagement. Built for businesses that move fast.
            </p>
            <div className="mt-8 grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Link
                href="/book-a-demo"
                className="text-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
              >
                Book a demo
              </Link>
              <Link
                href="/signin"
                className="text-center bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm backdrop-blur-sm border border-white/10"
              >
                Sign in
              </Link>
              <a
                href="https://github.com/mindtris/mintax"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm backdrop-blur-sm border border-white/10"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://github.com/mindtris/mintax"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm backdrop-blur-sm border border-white/10"
              >
                <Leaf className="h-4 w-4" />
                Open source
              </a>
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
