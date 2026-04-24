"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  /** Field name for form submission */
  name?: string
  /** Selected date value */
  value?: Date | string | null
  /** Default date value (uncontrolled) */
  defaultValue?: Date | string | null
  /** Callback when date changes */
  onChange?: (date: Date | undefined) => void
  /** Placeholder text */
  placeholder?: string
  /** Disable the picker */
  disabled?: boolean
  /** Additional className */
  className?: string
  /** Date display format */
  dateFormat?: string
  /** id for label association */
  id?: string
  /** locale for date formatting */
  locale?: any
  /** variant for the trigger button */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

function parseDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

export function DatePicker({
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  dateFormat = "PPP",
  id,
  locale,
  variant = "outline",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isControlled = value !== undefined
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    parseDate(isControlled ? value : defaultValue)
  )

  const selectedDate = isControlled ? parseDate(value) : internalDate

  const handleSelect = (date: Date | undefined) => {
    if (!isControlled) setInternalDate(date)
    onChange?.(date)
    setOpen(false)
  }

  // Sync controlled value
  React.useEffect(() => {
    if (isControlled) setInternalDate(parseDate(value))
  }, [value, isControlled])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={variant}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selectedDate ? format(selectedDate, dateFormat, { locale }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
        />
      )}
    </Popover>
  )
}
