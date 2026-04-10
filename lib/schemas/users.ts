import { z } from "zod"

export const userFormSchema = z.object({
  name: z.string().max(128).optional(),
  avatar: z.any().optional(), // Can be File or string
  firstName: z.string().max(64).optional().nullable(),
  lastName: z.string().max(64).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  country: z.string().max(64).optional().nullable(),
  state: z.string().max(64).optional().nullable(),
  city: z.string().max(64).optional().nullable(),
  postalCode: z.string().max(16).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(), // Store as ISO string
  timezone: z.string().max(64).optional().nullable(),
})
