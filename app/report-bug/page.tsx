import Image from "next/image"
import config from "@/lib/core/config"
import { BugReportForm } from "@/components/marketing/bug-report-form"
import { Bug } from "lucide-react"
import { ColoredText } from "@/components/ui/colored-text"

export default function ReportBugPage() {
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
        {/* Centered card */}
        <div className="flex-grow flex flex-col justify-center items-center md:items-end px-6 md:px-24 py-12">
          <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="flex flex-col items-center gap-3 text-center">
              <Image src="/logo/logo.svg" alt="Mintax" width={40} height={40} className="w-10 h-10" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground text-center">
                Report a bug in <ColoredText>{config.app.title}</ColoredText>
              </h1>
              <p className="text-sm text-muted-foreground">
                Found something broken? Let us know and we&apos;ll get it fixed. Your report will be sent directly to our GitHub repository.
              </p>
            </div>

            <BugReportForm />

            <p className="text-center text-sm text-muted-foreground">
              Need immediate help?{" "}
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
