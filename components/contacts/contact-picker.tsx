"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Building2, Check, ChevronsUpDown, Plus, Search, ShipWheel } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface ContactOption {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  taxId?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  type: string
}

interface ContactPickerProps {
  /** Called when a contact is selected — parent fills in other fields */
  onSelect: (contact: ContactOption | null) => void
  /** Pre-selected contact name (e.g. passed from URL params) */
  defaultName?: string
  defaultContactId?: string
  /** Filter by contact type (e.g. 'vendor', 'client') */
  type?: string
  /** Override the trigger button height (defaults to h-9) */
  triggerClassName?: string
}

export function ContactPicker({
  onSelect,
  defaultName = "",
  defaultContactId = "",
  type = "all",
  triggerClassName,
}: ContactPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ContactOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ContactOption | null>(null)
  const [inputValue, setInputValue] = useState(defaultName)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Search on query change
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: "20" })
        if (query.trim()) params.set("q", query.trim())
        if (type !== "all") params.set("type", type)
        const res = await fetch(`/api/contacts?${params}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.contacts ?? [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open])

  function handleSelect(contact: ContactOption) {
    setSelected(contact)
    setInputValue(contact.name)
    onSelect(contact)
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    setInputValue("")
    onSelect(null)
  }

  const labelText = type === "vendor" ? "Vendor" : type === "client" ? "Client" : "Contact"

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{labelText}</span>

      {/* Hidden inputs for form submission */}
      <input
        type="hidden"
        name="contactId"
        value={selected?.id ?? defaultContactId ?? ""}
      />

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn("flex-1 justify-between font-normal h-9", triggerClassName)}
            >
              <span className="flex items-center gap-2 truncate">
                {type === "vendor" ? (
                  <ShipWheel className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">
                  {selected
                    ? selected.name
                    : inputValue || `Search ${labelText.toLowerCase()}s…`}
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            {/* Search input */}
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search contacts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Results */}
            <div className="max-h-56 overflow-y-auto py-1">
              {loading && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Searching…
                </p>
              )}
              {!loading && results.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {query ? "No contacts found." : "Start typing to search…"}
                </p>
              )}
              {results.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelect(contact)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Check
                    className={[
                      "h-4 w-4 shrink-0",
                      selected?.id === contact.id
                        ? "opacity-100"
                        : "opacity-0",
                    ].join(" ")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.email}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize shrink-0">
                    {contact.type}
                  </span>
                </button>
              ))}
            </div>

            {/* Add new */}
            <div className="border-t">
              <button
                type="button"
                onClick={() => {
                  const path =
                    type === "vendor"
                      ? "/customers?type=vendor"
                      : type === "client"
                        ? "/customers?type=client"
                        : "/customers"
                  window.open(path, "_blank")
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors text-left font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a new {labelText.toLowerCase()}
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="px-2 text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Show selected contact detail */}
      {selected && (
        <p className="text-xs text-muted-foreground">
          {[selected.email, selected.phone].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  )
}
