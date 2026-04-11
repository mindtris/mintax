import Image from "next/image"
import Link from "next/link"
import config from "@/lib/core/config"
import { DemoForm } from "@/components/marketing/demo-form"

export default function BookADemoPage() {
  return (
    <div className="min-h-screen relative font-sans overflow-hidden">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/mountain.svg')" }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Minimal Header */}
        <header className="p-6 md:p-12">
          <Link href="/" className="inline-block transition-transform hover:scale-105 duration-300">
            <Image 
              src="/logo/logo.svg" 
              alt={config.app.title} 
              width={32} 
              height={32} 
              className="brightness-0 invert opacity-90" 
            />
          </Link>
        </header>

        {/* Main Form Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 mt-[-40px]">
          <div className="w-full max-w-xl">
            {/* Header within Card or above */}
            <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Experience the <span className="text-primary">Difference</span>
              </h1>
              <p className="text-white/60 text-base md:text-lg max-w-md mx-auto">
                Schedule a 15-minute walkthrough of {config.app.title}'s specialized bookkeeping and hiring platform.
              </p>
            </div>

            {/* Glassmorphism Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in duration-500">
              <DemoForm />
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="p-8 text-center">
          <p className="text-white/20 text-[10px] tracking-widest uppercase">
            &copy; {new Date().getFullYear()} {config.app.title} by <a href="https://www.mindtris.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Mindtris&trade; Inc</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
