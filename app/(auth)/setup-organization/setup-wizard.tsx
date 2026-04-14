"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect } from "@/components/forms/simple"
import { setupOrganizationAction } from "../actions"
import { 
  ShipWheel, 
  ChevronRight, 
  ChevronLeft, 
  BadgeCent, 
  CheckCircle2
} from "lucide-react"

const STEPS = [
  { id: "identity", title: "Identity", icon: ShipWheel },
  { id: "financials", title: "Financials", icon: BadgeCent },
]

const STRUCTURES = [
  { code: "sole_proprietorship", name: "Sole Proprietorship" },
  { code: "partnership", name: "Partnership" },
  { code: "llc", name: "Limited Liability Company (LLC)" },
  { code: "corporation", name: "Corporation" },
  { code: "other", name: "Other" },
]

const MONTHS = [
  { code: "1", name: "January" },
  { code: "2", name: "February" },
  { code: "3", name: "March" },
  { code: "4", name: "April" },
  { code: "5", name: "May" },
  { code: "6", name: "June" },
  { code: "7", name: "July" },
  { code: "8", name: "August" },
  { code: "9", name: "September" },
  { code: "10", name: "October" },
  { code: "11", name: "November" },
  { code: "12", name: "December" },
]

const CURRENCIES = [
  { code: "INR", name: "INR - Indian Rupee" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GBP", name: "GBP - British Pound" },
  { code: "AUD", name: "AUD - Australian Dollar" },
  { code: "CAD", name: "CAD - Canadian Dollar" },
  { code: "SGD", name: "SGD - Singapore Dollar" },
  { code: "JPY", name: "JPY - Japanese Yen" },
  { code: "AED", name: "AED - UAE Dirham" },
]

export function SetupWizard() {
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    type: "business",
    businessStructure: "sole_proprietorship",
    baseCurrency: "INR",
    fiscalYearStart: "1",
  })

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < STEPS.length - 1) {
      nextStep()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => data.append(key, value))
      
      const result: any = await setupOrganizationAction(data)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to setup organization")
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        <div className="min-h-[300px] animate-in slide-in-from-right-4 duration-500">
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <FormInput
                title="Company / member name"
                placeholder="E.g. Mindtris"
                value={formData.name}
                onChange={(e) => setFormData(s => ({ ...s, name: e.target.value }))}
                required
                className="shadow-sm"
              />
              
              <FormSelect
                title="Organization type"
                items={[
                  { code: "business", name: "Business" },
                  { code: "personal", name: "Personal" },
                ]}
                value={formData.type}
                onValueChange={(v) => setFormData(s => ({ ...s, type: v }))}
              />
              <FormSelect
                title="Business structure"
                items={STRUCTURES}
                value={formData.businessStructure}
                onValueChange={(v) => setFormData(s => ({ ...s, businessStructure: v }))}
              />

            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
                <FormSelect
                  title="Base currency"
                  items={CURRENCIES}
                  value={formData.baseCurrency}
                  onValueChange={(v) => setFormData(s => ({ ...s, baseCurrency: v }))}
                />
                <FormSelect
                  title="Fiscal year start"
                  items={MONTHS}
                  value={formData.fiscalYearStart}
                  onValueChange={(v) => setFormData(s => ({ ...s, fiscalYearStart: v }))}
                />

              <FormInput
                title="Business industry (optional)"
                placeholder="E.g. Software, Retail, Consulting"
                onChange={(e) => setFormData(s => ({ ...s, industry: e.target.value } as any))}
                className="bg-transparent"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-destructive text-center bg-destructive/5 p-3 rounded-lg border border-destructive/10 animate-in shake">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 0 ? () => router.back() : prevStep}
            disabled={isLoading}
            className="font-semibold h-11 px-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading || (step === 0 && !formData.name)}
            className="font-semibold h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px] shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing...
              </div>
            ) : step === STEPS.length - 1 ? (
              "Launch Workspace"
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  )
}
