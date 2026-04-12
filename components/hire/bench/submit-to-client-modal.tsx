"use client"

import React, { useState, useEffect } from 'react';
import { Providers, ProviderState } from "@microsoft/mgt-element";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Mail, 
  User, 
  FileText, 
  Sparkles,
  Loader2,
  CheckCircle2,
  Copy
} from "lucide-react";
import { resolveTemplate } from "@/lib/services/content-templates";
import { submitToClientAction } from "@/app/(app)/hire/actions";
import { toast } from "sonner";

interface SubmitToClientModalProps {
  candidate: any;
  organization: any;
  contacts: any[];
  templates: any[];
  children?: React.ReactNode;
}

export function SubmitToClientModal({ 
  candidate, 
  organization, 
  contacts, 
  templates,
  children 
}: SubmitToClientModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [subject, setSubject] = useState(`Talent Introduction: ${candidate.firstName} ${candidate.lastName[0]}.`);
  const [body, setBody] = useState("");

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Update Body when template or contact change
  useEffect(() => {
    if (selectedTemplate) {
      const resolved = resolveTemplate(selectedTemplate.content, {
        candidate_name: `${candidate.firstName} ${candidate.lastName}`,
        candidate_first_name: candidate.firstName,
        hourly_rate: candidate.hourlyRate ? `$${candidate.hourlyRate}/hr` : "Market Rate",
        client_name: selectedContact?.name || "[Client Name]",
        organization_name: organization.name,
        marketing_bio: candidate.marketingBio || "a highly skilled professional available for placement."
      });
      setBody(resolved);
    } else if (!selectedTemplateId) {
       // Default fallback
       setBody(`Hi ${selectedContact?.name || '[Client Name]'},\n\nI'd like to present ${candidate.firstName} ${candidate.lastName} for your review. They are currently available for placement through ${organization.name}.\n\nKey Highlights:\n- Rate: ${candidate.hourlyRate ? `$${candidate.hourlyRate}/hr` : "Market Rate"}\n- Profile: ${candidate.marketingBio || "Available for immediate start."}\n\nPlease let me know if you'd like to see their full profile or schedule a brief interview.\n\nBest regards,\n${organization.name} Talent Team`);
    }
  }, [selectedTemplateId, selectedContactId, candidate, organization]);

  const handleSend = async () => {
    if (!selectedContact?.email) {
      toast.error("Selected contact has no email address");
      return;
    }

    setLoading(true);
    try {
      // 1. Check MGT Provider
      const provider = Providers.globalProvider;
      const isOutlookConnected = provider && provider.state === ProviderState.SignedIn;

      if (!isOutlookConnected) {
        // Fallback: Use mailto:
        const mailtoUrl = `mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        
        // Log Submission in DB anyway
        await submitToClientAction(candidate.id, selectedContact.id, `Sent via mailto fallback: ${selectedTemplate?.name || 'Default'}`);
        
        setSuccess(true);
        toast.info("Opening default mail application...");
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
        return;
      }

      // 2. Send via Microsoft Graph
      const client = provider.graph.api('/me/sendMail');
      await client.post({
        message: {
          subject: subject,
          body: {
            contentType: 'Text',
            content: body
          },
          toRecipients: [
            {
              emailAddress: {
                address: selectedContact.email
              }
            }
          ]
        }
      });

      // 3. Log Submission in DB
      await submitToClientAction(candidate.id, selectedContact.id, `Sent via automated template: ${selectedTemplate?.name || 'Default'}`);
      
      setSuccess(true);
      toast.success("Profile submitted successfully!");
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary/[0.03] border-b border-primary/10">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Submit candidate to client
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select client</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger className="rounded-xl bg-muted/30 border-none h-11">
                  <SelectValue placeholder="Choose contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>
                  ))}
                  {contacts.length === 0 && <p className="p-2 text-xs text-muted-foreground">No client contacts found.</p>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Use template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="rounded-xl bg-muted/30 border-none h-11">
                  <SelectValue placeholder="Standard submission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template (manual)</SelectItem>
                  {templates.filter(t => t.category === "bench_submission").map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
              <Label className="text-sm font-medium">Subject</Label>
              <input 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-muted/30 border-none rounded-xl h-11 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Message</Label>
              <Textarea 
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                className="rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 resize-none text-sm leading-relaxed"
                placeholder="Compose your introduction..."
              />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                <FileText className="w-3 h-3" />
                Note: The professional Marketing Profile PDF will be mentioned in this outreach.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-black/[0.02] border-t border-black/[0.03]">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button 
            disabled={!selectedContactId || loading || success} 
            onClick={handleSend}
            className="rounded-xl px-8"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {loading ? "Sending..." : success ? "Sent!" : "Submit Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
