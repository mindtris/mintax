"use client"

import { FormInput, FormSelect, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

export type ContactType =
  | "client"
  | "vendor"
  | "contractor"
  | "provider"
  | "partner"

const CONTACT_TYPES = [
  { code: "client", name: "Client" },
  { code: "vendor", name: "Vendor" },
  { code: "contractor", name: "Contractor" },
  { code: "provider", name: "Provider" },
  { code: "partner", name: "Partner" },
]

const PERSON_ROLES = [
  { code: "accounts", name: "Accounts" },
  { code: "procurement", name: "Procurement" },
  { code: "legal", name: "Legal" },
  { code: "cfo", name: "CFO" },
  { code: "hr", name: "HR" },
  { code: "other", name: "Other" },
]

interface PersonField {
  id: string // local key only
  name: string
  email: string
  phone: string
  role: string
  isPrimary: boolean
}

interface ContactFormProps {
  defaultValues?: {
    id?: string
    type?: ContactType
    name?: string
    email?: string
    phone?: string
    website?: string
    taxId?: string
    currency?: string
    reference?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    notes?: string
    paymentTerms?: string
    isTaxExempt?: boolean
    persons?: PersonField[]
  }
  currencies?: Array<{ code: string; name: string }>
  mode?: "create" | "edit"
  onSuccess?: () => void
}

function newPerson(isPrimary = false): PersonField {
  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    phone: "",
    role: "",
    isPrimary,
  }
}

export function ContactForm({
  defaultValues,
  currencies = [],
  mode = "create",
  onSuccess,
}: ContactFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [persons, setPersons] = useState<PersonField[]>(
    defaultValues?.persons?.length
      ? defaultValues.persons.map((p) => ({ ...p, id: crypto.randomUUID() }))
      : []
  )

  const currencyItems =
    currencies.length > 0
      ? currencies
      : [
          { code: "INR", name: "INR Indian Rupee" },
          { code: "USD", name: "USD US Dollar" },
          { code: "EUR", name: "EUR Euro" },
          { code: "GBP", name: "GBP British Pound" },
        ]

  function addPerson() {
    setPersons((prev) => [...prev, newPerson(prev.length === 0)])
  }

  function removePerson(id: string) {
    setPersons((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, isPrimary: i === 0 }))
    )
  }

  function updatePerson(id: string, field: keyof PersonField, value: string | boolean) {
    setPersons((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const body = {
      type: fd.get("type") as string,
      name: fd.get("name") as string,
      email: fd.get("email") as string || null,
      phone: fd.get("phone") as string || null,
      website: fd.get("website") as string || null,
      taxId: fd.get("taxId") as string || null,
      currency: fd.get("currency") as string || "INR",
      reference: fd.get("reference") as string || null,
      address: fd.get("address") as string || null,
      city: fd.get("city") as string || null,
      state: fd.get("state") as string || null,
      zipCode: fd.get("zipCode") as string || null,
      country: fd.get("country") as string || null,
      notes: fd.get("notes") as string || null,
      paymentTerms: fd.get("paymentTerms") as string || null,
      isTaxExempt: fd.get("isTaxExempt") === "exempt",
      persons: persons.map((p) => ({
        name: p.name,
        email: p.email || null,
        phone: p.phone || null,
        role: p.role || null,
        isPrimary: p.isPrimary,
      })),
    }

    const url =
      mode === "edit" && defaultValues?.id
        ? `/api/contacts/${defaultValues.id}`
        : "/api/contacts"

    const method = mode === "edit" ? "PATCH" : "POST"

    startTransition(async () => {
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error ?? "Failed to save contact")
          return
        }

        toast.success(
          mode === "create" ? "Contact created" : "Contact updated"
        )
        router.refresh()
        onSuccess?.()
      } catch {
        toast.error("Something went wrong")
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ── Identity ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-foreground">
          Identity
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            name="type"
            title="Type"
            items={CONTACT_TYPES}
            defaultValue={defaultValues?.type ?? "client"}
            isRequired
          />
          <FormInput
            name="name"
            title="Name"
            placeholder="Mindtris"
            defaultValue={defaultValues?.name}
            isRequired
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            name="email"
            title="Email"
            type="email"
            placeholder="akshitha@mindtris.com"
            defaultValue={defaultValues?.email ?? ""}
          />
          <FormInput
            name="phone"
            title="Phone"
            type="tel"
            placeholder="+91 98765 43210"
            defaultValue={defaultValues?.phone ?? ""}
          />
        </div>
        <FormInput
          name="website"
          title="Website"
          placeholder="https://mindtris.com"
          defaultValue={defaultValues?.website ?? ""}
        />
      </section>

      <Separator />

      {/* ── Financial / Tax ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-foreground">
          Financial &amp; Tax
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            name="taxId"
            title="Tax ID"
            placeholder="GSTIN / EIN / VAT"
            defaultValue={defaultValues?.taxId ?? ""}
          />
          <FormSelect
            name="currency"
            title="Currency"
            items={currencyItems}
            defaultValue={defaultValues?.currency ?? "INR"}
          />
        </div>
        <FormInput
          name="reference"
          title="Internal reference"
          placeholder="CUST-001"
          defaultValue={defaultValues?.reference ?? ""}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            name="paymentTerms"
            title="Payment terms"
            items={[
              { code: "due_on_receipt", name: "Due on receipt" },
              { code: "net_15", name: "Net 15" },
              { code: "net_30", name: "Net 30" },
              { code: "net_60", name: "Net 60" },
            ]}
            defaultValue={defaultValues?.paymentTerms ?? "due_on_receipt"}
          />
          <FormSelect
            name="isTaxExempt"
            title="Tax status"
            items={[
              { code: "taxable", name: "Taxable" },
              { code: "exempt", name: "Tax exempt" },
            ]}
            defaultValue={defaultValues?.isTaxExempt ? "exempt" : "taxable"}
          />
        </div>
      </section>

      <Separator />

      {/* ── Address ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-foreground">
          Address
        </h3>
        <FormInput
          name="address"
          title="Street address"
          placeholder="123 Main St"
          defaultValue={defaultValues?.address ?? ""}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            name="city"
            title="City"
            placeholder="Mumbai"
            defaultValue={defaultValues?.city ?? ""}
          />
          <FormInput
            name="state"
            title="State / Province"
            placeholder="Maharashtra"
            defaultValue={defaultValues?.state ?? ""}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            name="zipCode"
            title="Zip / Postal code"
            placeholder="400001"
            defaultValue={defaultValues?.zipCode ?? ""}
          />
          <FormInput
            name="country"
            title="Country"
            placeholder="India"
            defaultValue={defaultValues?.country ?? ""}
          />
        </div>
      </section>

      <Separator />

      {/* ── Contact persons ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            Contact persons
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPerson}
          >
            <Plus className="h-3.5 w-3.5" />
            Add person
          </Button>
        </div>

        {persons.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No contact persons added yet.
          </p>
        )}

        {persons.map((person, idx) => (
          <div
            key={person.id}
            className="rounded-lg border bg-muted/30 p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Person {idx + 1}
                {person.isPrimary && (
                  <span className="ml-2 text-xs text-emerald-600 font-semibold">
                    Primary
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removePerson(person.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormInput
                title="Name"
                placeholder="Akshitha Kandikanti"
                value={person.name}
                onChange={(e) => updatePerson(person.id, "name", e.target.value)}
                required
              />
              <FormSelect
                title="Role"
                items={PERSON_ROLES}
                value={person.role}
                onValueChange={(v) => updatePerson(person.id, "role", v)}
                emptyValue="Select role"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                title="Email"
                type="email"
                placeholder="akshitha@mindtris.com"
                value={person.email}
                onChange={(e) => updatePerson(person.id, "email", e.target.value)}
              />
              <FormInput
                title="Phone"
                placeholder="+91 ..."
                value={person.phone}
                onChange={(e) => updatePerson(person.id, "phone", e.target.value)}
              />
            </div>
          </div>
        ))}
      </section>

      <Separator />

      {/* ── Notes ── */}
      <section className="flex flex-col gap-2">
        <FormTextarea
          name="notes"
          title="Notes"
          placeholder="Internal notes about this contact…"
          defaultValue={defaultValues?.notes ?? ""}
          rows={3}
        />
      </section>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? mode === "create"
            ? "Creating…"
            : "Saving…"
          : mode === "create"
          ? "Create contact"
          : "Save changes"}
      </Button>
    </form>
  )
}
