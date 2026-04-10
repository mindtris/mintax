import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoLoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LogoLoader({ className, size = "md" }: LogoLoaderProps) {
  const dimensions = {
    sm: 32,
    md: 48,
    lg: 64,
  }

  return (
    <div className={cn("flex flex-col items-center justify-center animate-in fade-in duration-300", className)}>
      <Image
        src="/logo/logo.svg"
        alt="Loading..."
        width={dimensions[size]}
        height={dimensions[size]}
        className="animate-pulse" 
      />
    </div>
  )
}
