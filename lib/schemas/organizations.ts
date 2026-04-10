import { z } from "zod"

export const organizationFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
  type: z.enum(["business", "personal"]).default("business"),
  baseCurrency: z.string().max(5).default("INR"),
  fiscalYearStart: z.coerce.number().min(1).max(12).default(1),
  taxId: z.string().max(128).optional().nullable(),
  address: z.string().max(512).optional().nullable(),
  bankDetails: z.string().max(1024).optional().nullable(),
  logo: z.any().optional(),
  
  businessStructure: z.enum(["sole_proprietorship", "partnership", "llc", "corporation", "other"]).optional().nullable(),
  industry: z.string().max(128).optional().nullable(),
  website: z.string().url().or(z.string().max(0)).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  registrationNumber: z.string().max(128).optional().nullable(),
})
