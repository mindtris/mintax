import Image from "next/image"
import Link from "next/link"
import config from "@/lib/core/config"
import { DemoForm } from "@/components/marketing/demo-form"

export default function BookADemoPage() {
  return (
    <div className="min-h-screen relative font-sans">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/mountain.svg')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top-left logo for navigation */}
        <header className="p-8 pb-0">
          <Link href="/" className="inline-block transition-opacity hover:opacity-70">
            <Image src="/logo/logo.svg" alt={config.app.title} width={32} height={32} className="w-8 h-8 brightness-0 invert" />
          </Link>
        </header>

        {/* Right-aligned card for consistency with auth */}
        <div className="flex-grow flex flex-col justify-center items-center md:items-end px-6 md:px-24 py-12">
          <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="flex flex-col items-center gap-3 text-center">
              <Image src="/logo/logo.svg" alt="Mintax" width={40} height={40} className="w-10 h-10" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Experience the <span className="text-primary">Difference</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Schedule a 15-minute walkthrough of {config.app.title}&apos;s specialized bookkeeping and hiring platform.
              </p>
            </div>

            <DemoForm />

            <p className="text-center text-sm text-muted-foreground">
              Need help?{" "}
              <a href={`mailto:${config.app.supportEmail}`} className="font-semibold text-primary hover:underline">
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} {config.app.title} by <a href="https://www.mindtris.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline-offset-4 hover:underline">Mindtris&trade; Inc</a>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
