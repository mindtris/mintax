import config from "@/lib/core/config"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
        {/* Centered auth card */}
        <div className="flex-grow flex flex-col justify-center items-center md:items-end px-6 md:px-24 py-12">
          <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-1000">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-white/40 text-xs">
            &copy; 2026 {config.app.title} by <a href="https://www.mindtris.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline-offset-4 hover:underline">Mindtris&trade; Inc</a>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
