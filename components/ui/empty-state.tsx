"use client"

import Image from "next/image"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  showImage?: boolean
  imageSrc?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  showImage = true,
  imageSrc = "/empty-state.svg",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 px-4 gap-4",
        className
      )}
    >
      {showImage ? (
        <Image
          src={imageSrc}
          alt={title}
          width={100}
          height={100}
          aria-hidden="true"
        />
      ) : Icon ? (
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-xs max-w-sm">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
