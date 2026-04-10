"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, addMonths, subMonths } from "date-fns"

export function CalendarNav({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const date = new Date(currentMonth + "-01")

  const navigate = (newDate: Date) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("month", format(newDate, "yyyy-MM"))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const goToday = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("month")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" onClick={() => navigate(subMonths(date, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button size="sm" onClick={goToday} className="bg-primary text-primary-foreground hover:bg-primary/90">
        Today
      </Button>
      <Button size="icon" variant="ghost" onClick={() => navigate(addMonths(date, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
