"use client"

import { useActionState, useEffect, useState } from "react"
import { submitDemoRequestAction } from "@/app/book-a-demo/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
        <h2 className="text-2xl font-bold text-white mb-2">Request Received!</h2>
        <p className="text-white/60 max-w-sm">
          Thank you for your interest. A member of our team will contact you shortly to schedule your personalized demo.
        </p>
        <Button 
          variant="outline" 
          className="mt-8 border-white/20 text-white hover:bg-white/10"
          onClick={() => window.location.href = "/"}
        >
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/70">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="John Doe" 
            required 
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/70">Work Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="john@company.com" 
            required 
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <div className="space-y-2">
          <Label htmlFor="company" className="text-white/70">Company</Label>
          <Input 
            id="company" 
            name="company" 
            placeholder="Acme Inc" 
            required 
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white/70">Phone Number (Optional)</Label>
          <Input 
            id="phone" 
            name="phone" 
            type="tel" 
            placeholder="+1 (555) 000-0000" 
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="message" className="text-white/70">How can we help? (Optional)</Label>
        <Textarea 
          id="message" 
          name="message" 
          placeholder="Tell us a bit about your business needs..." 
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary min-h-[100px]"
        />
      </div>

      {state?.error && (
        <p className="text-sm font-medium text-red-400 animate-in fade-in slide-in-from-top-1">
          {state.error}
        </p>
      )}

      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 transition-all mt-4"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scheduling...
          </>
        ) : (
          "Book My Demo"
        )}
      </Button>
      
      <p className="text-[10px] text-white/30 text-center mt-4">
        By clicking "Book My Demo", you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
