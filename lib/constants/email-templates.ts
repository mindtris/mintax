export interface RegistryTemplate {
  module: string
  event: string
  name: string
  category: "Accounting" | "Pipeline" | "Hire" | "Others"
  sentTo: "Customer" | "Admin" | "Vendor" | "Applicant" | "Team" | "Subscriber"
  subjectDefault: string
  greetingDefault: string
  bodyDefault: string
  variables: string[]
}

export const TEMPLATE_REGISTRY: RegistryTemplate[] = [
  {
    module: "invoice",
    event: "sent",
    name: "New invoice",
    category: "Accounting",
    sentTo: "Customer",
    subjectDefault: "Invoice {invoiceNumber} from {orgName}",
    greetingDefault: "Hi {clientName},",
    bodyDefault: "A new invoice has been generated for your recent project with {orgName}.\n\nYou can view the details below or download the attached PDF.",
    variables: ["invoiceNumber", "clientName", "orgName", "total", "dueDate"],
  },
  {
    module: "invoice",
    event: "reminder",
    name: "Invoice reminder",
    category: "Accounting",
    sentTo: "Customer",
    subjectDefault: "Reminder: Invoice {invoiceNumber} is {status}",
    greetingDefault: "Hi {clientName},",
    bodyDefault: "This is a friendly reminder that invoice {invoiceNumber} for {total} is currently {status}.\n\nIf you have already sent the payment, please disregard this message.",
    variables: ["invoiceNumber", "clientName", "orgName", "total", "status", "dueDate"],
  },
  {
    module: "bill",
    event: "reminder",
    name: "Bill reminder",
    category: "Accounting",
    sentTo: "Admin",
    subjectDefault: "Bill {billNumber} from {vendorName} is {status}",
    greetingDefault: "Hello Team,",
    bodyDefault: "The bill {billNumber} from {vendorName} is currently {status}.\n\nPlease ensure payment is processed by {dueDate}.",
    variables: ["billNumber", "vendorName", "orgName", "total", "status", "dueDate"],
  },
  {
    module: "estimate",
    event: "sent",
    name: "New estimate",
    category: "Accounting",
    sentTo: "Customer",
    subjectDefault: "Estimate {estimateNumber} from {orgName}",
    greetingDefault: "Hi {clientName},",
    bodyDefault: "We have prepared an estimate for your consideration. Please review the attached document and let us know if you would like to proceed.",
    variables: ["estimateNumber", "clientName", "orgName", "total"],
  },
  {
    module: "lead",
    event: "assigned",
    name: "Lead assignment",
    category: "Pipeline",
    sentTo: "Admin",
    subjectDefault: "New Lead Assigned: {leadName}",
    greetingDefault: "Hello {assigneeName},",
    bodyDefault: "A new lead '{leadName}' from {source} has been assigned to you. \n\nPlease follow up as soon as possible.",
    variables: ["leadName", "source", "assigneeName", "orgName"],
  },
  {
    module: "hire",
    event: "application_received",
    name: "Application confirmation",
    category: "Hire",
    sentTo: "Subscriber",
    subjectDefault: "Application received: {jobTitle} at {orgName}",
    greetingDefault: "Hi {applicantName},",
    bodyDefault: "Thank you for applying for the {jobTitle} position. We have received your application and will review it shortly.",
    variables: ["applicantName", "jobTitle", "orgName"],
  },
  {
    module: "team",
    event: "invite",
    name: "Team invitation",
    category: "Others",
    sentTo: "Team",
    subjectDefault: "Invitation to join {orgName} on Mintax",
    greetingDefault: "Welcome!",
    bodyDefault: "{inviterName} has invited you to join the {orgName} team on Mintax.\n\nClick the button below to accept the invitation and get started.",
    variables: ["inviterName", "orgName"],
  },
]
