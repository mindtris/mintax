"use client"

import { useActionState, useEffect, useState } from "react"
import { submitDemoRequestAction } from "@/app/book-a-demo/actions"
import { Button } from "@/components/ui/button"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { CheckCircle2, Loader2 } from "lucide-react"

export function DemoForm() {
  const [state, formAction, isPending] = useActionState(submitDemoRequestAction, null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setIsSuccess(true)
    }
  }, [state])

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Request received</h2>
        <p className="text-white/60 max-w-sm">
          Thank you for your interest. A member of our team will contact you shortly to schedule your personalized demo.
        </p>
        <Button 
          variant="outline" 
          className="mt-8 border-white/20 text-white hover:bg-white/10"
          onClick={() => window.location.href = "/"}
        >
          Back to home
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 w-full">
      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            title="Full name"
            name="name"
            placeholder="Akshitha Kandikanti"
            required
          />
          <FormInput
            title="Work email"
            name="email"
            type="email"
            placeholder="akshitha@mindtris.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            title="Company"
            name="company"
            placeholder="Acme Inc"
            required
          />
          <FormInput
            title="Phone number (optional)"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <FormTextarea
          title="How can we help? (optional)"
          name="message"
          placeholder="Tell us a bit about your business needs..."
        />
      </div>

      {state?.error && (
        <p className="text-sm font-medium text-destructive text-center">
          {state.error}
        </p>
      )}

      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full h-11 text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : (
          "Book my demo"
        )}
      </Button>
      
      <p className="text-[10px] text-muted-foreground text-center">
        By clicking "Book my demo", you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
