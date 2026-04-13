"use server"

import {
  categoryFormSchema,
  currencyFormSchema,
  emailTemplateSettingsSchema,
  estimateSettingsSchema,
  fieldFormSchema,
  invoiceSettingsSchema,
  projectFormSchema,
  settingsFormSchema,
} from "@/lib/schemas/settings"
import { organizationFormSchema } from "@/lib/schemas/organizations"
import { userFormSchema } from "@/lib/schemas/users"
import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { uploadStaticImage } from "@/lib/uploads"
import { codeFromName, randomHexColor } from "@/lib/utils"
import { createCategory, deleteCategory, updateCategory } from "@/lib/services/categories"
import { createCurrency, deleteCurrency, updateCurrency } from "@/lib/services/currencies"
import { createField, deleteField, updateField } from "@/lib/services/fields"
import { createProject, deleteProject, updateProject } from "@/lib/services/projects"
import { SettingsMap, updateSettings } from "@/lib/services/settings"
import { updateOrganization } from "@/lib/services/organizations"
import { updateUser } from "@/lib/services/users"
import { createTax, deleteTax, updateTax } from "@/lib/services/taxes"
import { createItem, deleteItem, updateItem } from "@/lib/services/items"
import { migrateLegacyCategoryTypes } from "@/lib/services/migration"
import { Prisma, User } from "@/lib/prisma/client"
import { revalidatePath } from "next/cache"
import path from "path"

export async function saveSettingsAction(
  _prevState: ActionState<SettingsMap> | null,
  formData: FormData
): Promise<ActionState<SettingsMap>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const validatedForm = settingsFormSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  for (const key in validatedForm.data) {
    const value = validatedForm.data[key as keyof typeof validatedForm.data]
    if (value !== undefined) {
      await updateSettings(org.id, key, value)
      
      // Sync default_currency back to Organization.baseCurrency
      if (key === "default_currency") {
        await updateOrganization(org.id, { baseCurrency: value })
      }
    }
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function saveProfileAction(
  _prevState: ActionState<User> | null,
  formData: FormData
): Promise<ActionState<User>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const validatedForm = userFormSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  // Upload avatar
  let avatarUrl = user.avatar
  const avatarFile = formData.get("avatar") as File | null
  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      const uploadedAvatarPath = await uploadStaticImage(user, org.id, avatarFile, "avatar.webp", 500, 500)
      avatarUrl = `/files/static/${path.basename(uploadedAvatarPath)}`
    } catch (error) {
      return { success: false, error: "Failed to upload avatar: " + error }
    }
  }

  await updateUser(user.id, {
    name: validatedForm.data.name || (validatedForm.data.firstName && validatedForm.data.lastName ? `${validatedForm.data.firstName} ${validatedForm.data.lastName}` : user.name),
    firstName: validatedForm.data.firstName,
    lastName: validatedForm.data.lastName,
    phone: validatedForm.data.phone,
    country: validatedForm.data.country,
    state: validatedForm.data.state,
    city: validatedForm.data.city,
    postalCode: validatedForm.data.postalCode,
    dateOfBirth: validatedForm.data.dateOfBirth ? new Date(validatedForm.data.dateOfBirth) : undefined,
    timezone: validatedForm.data.timezone,
    avatar: avatarUrl,
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function saveBusinessAction(
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const validatedForm = organizationFormSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  // Upload business logo
  let logoUrl = org.logo
  const logoFile = formData.get("logo") as File | null
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      const uploadedLogoPath = await uploadStaticImage(user, org.id, logoFile, "businessLogo.png", 500, 500)
      logoUrl = `/files/static/${path.basename(uploadedLogoPath)}`
    } catch (error) {
      return { success: false, error: "Failed to upload logo: " + error }
    }
  }

  await updateOrganization(org.id, {
    name: validatedForm.data.name,
    type: validatedForm.data.type,
    baseCurrency: validatedForm.data.baseCurrency,
    fiscalYearStart: validatedForm.data.fiscalYearStart,
    taxId: validatedForm.data.taxId,
    address: validatedForm.data.address,
    bankDetails: validatedForm.data.bankDetails,
    businessStructure: validatedForm.data.businessStructure,
    industry: validatedForm.data.industry,
    website: validatedForm.data.website,
    phone: validatedForm.data.phone,
    registrationNumber: validatedForm.data.registrationNumber,
    logo: logoUrl,
  })

  // Sync Organization.baseCurrency to Setting table
  if (validatedForm.data.baseCurrency) {
    await updateSettings(org.id, "default_currency", validatedForm.data.baseCurrency)
  }

  // Save transaction defaults
  const defaultCurrency = formData.get("default_currency") as string | null
  const defaultType = formData.get("default_type") as string | null
  const defaultCategory = formData.get("default_category") as string | null
  if (defaultCurrency) await updateSettings(org.id, "default_currency", defaultCurrency)
  if (defaultType) await updateSettings(org.id, "default_type", defaultType)
  if (defaultCategory) await updateSettings(org.id, "default_category", defaultCategory)

  revalidatePath("/settings")
  revalidatePath("/settings")
  return { success: true }
}

export async function addProjectAction(orgId: string, data: Prisma.ProjectCreateInput) {
  const validatedForm = projectFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const project = await createProject(orgId, {
    code: codeFromName(validatedForm.data.name),
    name: validatedForm.data.name,
    llm_prompt: validatedForm.data.llm_prompt || null,
    color: validatedForm.data.color || randomHexColor(),
  })
  revalidatePath("/settings")

  return { success: true, project }
}

export async function editProjectAction(orgId: string, code: string, data: Prisma.ProjectUpdateInput) {
  const validatedForm = projectFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const project = await updateProject(orgId, code, {
    name: validatedForm.data.name,
    llm_prompt: validatedForm.data.llm_prompt,
    color: validatedForm.data.color || "",
  })
  revalidatePath("/settings")

  return { success: true, project }
}

export async function deleteProjectAction(orgId: string, code: string) {
  try {
    await deleteProject(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete project" + error }
  }
  revalidatePath("/settings")
  return { success: true }
}

export async function addCurrencyAction(orgId: string, data: Prisma.CurrencyCreateInput) {
  const validatedForm = currencyFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const currency = await createCurrency(orgId, {
    code: validatedForm.data.code,
    name: validatedForm.data.name,
  })
  revalidatePath("/settings")

  return { success: true, currency }
}

export async function editCurrencyAction(orgId: string, code: string, data: Prisma.CurrencyUpdateInput) {
  const validatedForm = currencyFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const currency = await updateCurrency(orgId, code, { name: validatedForm.data.name })
  revalidatePath("/settings")
  return { success: true, currency }
}

export async function deleteCurrencyAction(orgId: string, code: string) {
  try {
    await deleteCurrency(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete currency" + error }
  }
  revalidatePath("/settings")
  return { success: true }
}

export async function addCategoryAction(orgId: string, data: Prisma.CategoryCreateInput) {
  const validatedForm = categoryFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const code = codeFromName(validatedForm.data.name)
  try {
    const category = await createCategory(orgId, {
      code,
      name: validatedForm.data.name,
      type: validatedForm.data.type,
      llm_prompt: validatedForm.data.llm_prompt,
      color: validatedForm.data.color || "",
      parentId: validatedForm.data.parentId === "none" ? null : (validatedForm.data.parentId || null),
      defaultChartAccountId: validatedForm.data.defaultChartAccountId,
      defaultTaxId: validatedForm.data.defaultTaxId,
      defaultProjectCode: validatedForm.data.defaultProjectCode,
    } as any)
    revalidatePath("/settings")

    return { success: true, category }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        error: `Category with the code "${code}" already exists. Try a different name.`,
      }
    }
    return { success: false, error: "Failed to create category" }
  }
}

export async function editCategoryAction(orgId: string, code: string, data: Prisma.CategoryUpdateInput) {
  const validatedForm = categoryFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const category = await updateCategory(orgId, code, {
    name: validatedForm.data.name,
    type: validatedForm.data.type,
    llm_prompt: validatedForm.data.llm_prompt,
    color: validatedForm.data.color || "",
    parentId: validatedForm.data.parentId === "none" ? null : (validatedForm.data.parentId || null),
    defaultChartAccountId: validatedForm.data.defaultChartAccountId,
    defaultTaxId: validatedForm.data.defaultTaxId,
    defaultProjectCode: validatedForm.data.defaultProjectCode,
  } as any)
  revalidatePath("/settings")

  return { success: true, category }
}

export async function deleteCategoryAction(orgId: string, code: string) {
  try {
    await deleteCategory(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete category" + error }
  }
  revalidatePath("/settings")
  return { success: true }
}

export async function addFieldAction(orgId: string, data: Prisma.FieldCreateInput) {
  const validatedForm = fieldFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const field = await createField(orgId, {
    code: codeFromName(validatedForm.data.name),
    name: validatedForm.data.name,
    type: validatedForm.data.type,
    llm_prompt: validatedForm.data.llm_prompt,
    isVisibleInList: validatedForm.data.isVisibleInList,
    isVisibleInAnalysis: validatedForm.data.isVisibleInAnalysis,
    isRequired: validatedForm.data.isRequired,
    isExtra: true,
  })
  revalidatePath("/settings")

  return { success: true, field }
}

export async function editFieldAction(orgId: string, code: string, data: Prisma.FieldUpdateInput) {
  const validatedForm = fieldFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const field = await updateField(orgId, code, {
    name: validatedForm.data.name,
    type: validatedForm.data.type,
    llm_prompt: validatedForm.data.llm_prompt,
    isVisibleInList: validatedForm.data.isVisibleInList,
    isVisibleInAnalysis: validatedForm.data.isVisibleInAnalysis,
    isRequired: validatedForm.data.isRequired,
  })
  revalidatePath("/settings")

  return { success: true, field }
}

export async function deleteFieldAction(orgId: string, code: string) {
  try {
    await deleteField(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete field" + error }
  }
  revalidatePath("/settings")
  return { success: true }
}

// --- Categorization Rules ---

export async function addCategorizationRuleAction(orgId: string, data: any) {
  try {
    const { prisma } = await import("@/lib/core/db")
    await prisma.categorizationRule.create({
      data: {
        organizationId: orgId,
        name: data.name || "Unnamed rule",
        priority: data.priority ? Number(data.priority) : 100,
        enabled: data.enabled !== false && data.enabled !== "false",
        merchantContains: data.merchantContains || null,
        amountMin: data.amountMin ? Math.round(parseFloat(data.amountMin) * 100) : null,
        amountMax: data.amountMax ? Math.round(parseFloat(data.amountMax) * 100) : null,
        paymentMethod: data.paymentMethod || null,
        contactId: data.contactId || null,
        setCategoryCode: data.setCategoryCode || null,
        setChartAccountId: data.setChartAccountId || null,
        setProjectCode: data.setProjectCode || null,
        setTaxId: data.setTaxId || null,
      },
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add rule" }
  }
}

export async function editCategorizationRuleAction(orgId: string, id: string, data: any) {
  try {
    const { prisma } = await import("@/lib/core/db")
    await prisma.categorizationRule.update({
      where: { id, organizationId: orgId },
      data: {
        name: data.name,
        priority: data.priority ? Number(data.priority) : undefined,
        enabled: data.enabled !== false && data.enabled !== "false",
        merchantContains: data.merchantContains || null,
        amountMin: data.amountMin != null && data.amountMin !== "" ? Math.round(parseFloat(data.amountMin) * 100) : null,
        amountMax: data.amountMax != null && data.amountMax !== "" ? Math.round(parseFloat(data.amountMax) * 100) : null,
        paymentMethod: data.paymentMethod || null,
        contactId: data.contactId || null,
        setCategoryCode: data.setCategoryCode || null,
        setChartAccountId: data.setChartAccountId || null,
        setProjectCode: data.setProjectCode || null,
        setTaxId: data.setTaxId || null,
      },
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update rule" }
  }
}

export async function deleteCategorizationRuleAction(orgId: string, id: string) {
  try {
    const { prisma } = await import("@/lib/core/db")
    await prisma.categorizationRule.delete({
      where: { id, organizationId: orgId },
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete rule" }
  }
}

// --- Tax Actions ---

export async function addTaxAction(orgId: string, data: any) {
  try {
    await createTax(orgId, data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to add tax" }
  }
}

export async function editTaxAction(orgId: string, id: string, data: any) {
  try {
    await updateTax(id, orgId, data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update tax" }
  }
}

export async function deleteTaxAction(orgId: string, id: string) {
  try {
    await deleteTax(id, orgId)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete tax" }
  }
}

// --- Item Actions ---

export async function addItemAction(orgId: string, data: any) {
  try {
    await createItem(orgId, data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to add item" }
  }
}

export async function editItemAction(orgId: string, id: string, data: any) {
  try {
    await updateItem(id, orgId, data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update item" }
  }
}

export async function deleteItemAction(orgId: string, id: string) {
  try {
    await deleteItem(id, orgId)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete item" }
  }
}

// --- LLM Prompt Actions ---

export async function addLlmPromptAction(orgId: string, data: any) {
  try {
    const { createLlmPrompt } = await import("@/lib/services/llm-prompts")
    await createLlmPrompt(orgId, data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to add prompt" }
  }
}

export async function editLlmPromptAction(orgId: string, id: string, data: any) {
  try {
    const { updateLlmPrompt } = await import("@/lib/services/llm-prompts")
    await updateLlmPrompt(id, orgId, data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update prompt" }
  }
}

export async function deleteLlmPromptAction(orgId: string, id: string) {
  try {
    const { deleteLlmPrompt } = await import("@/lib/services/llm-prompts")
    await deleteLlmPrompt(id, orgId)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete prompt" }
  }
}

// --- Email Template Settings Actions ---

export async function saveEmailTemplateSettingsAction(
  _prevState: ActionState<SettingsMap> | null,
  formData: FormData
): Promise<ActionState<SettingsMap>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const validatedForm = emailTemplateSettingsSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  for (const key in validatedForm.data) {
    const value = validatedForm.data[key as keyof typeof validatedForm.data]
    if (value !== undefined) {
      await updateSettings(org.id, key, value)
    }
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function addEmailTemplateAction(orgId: string, data: any) {
  const { emailTemplateFormSchema } = await import("@/lib/schemas/settings")
  const validatedForm = emailTemplateFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const { upsertEmailTemplate } = await import("@/lib/services/email-templates")
  await upsertEmailTemplate(orgId, validatedForm.data)
  revalidatePath("/settings")
  return { success: true }
}

export async function editEmailTemplateAction(orgId: string, id: string, data: any) {
  const { emailTemplateFormSchema } = await import("@/lib/schemas/settings")
  const validatedForm = emailTemplateFormSchema.safeParse({ ...data, id })

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const { upsertEmailTemplate } = await import("@/lib/services/email-templates")
  await upsertEmailTemplate(orgId, validatedForm.data)
  revalidatePath("/settings")
  return { success: true }
}

export async function deleteEmailTemplateAction(orgId: string, id: string) {
  const { deleteEmailTemplate } = await import("@/lib/services/email-templates")
  await deleteEmailTemplate(id, orgId)
  revalidatePath("/settings")
  return { success: true }
}

export async function sendTestEmailAction(orgId: string, data: { subject: string; greeting?: string; body: string; footer?: string; variables?: Record<string, any> }) {
  const user = await getCurrentUser()
  const { GenericEmail } = await import("@/components/emails/generic-email")
  const { interpolate } = await import("@/lib/services/email-templates")
  const { sendEmail } = await import("@/lib/integrations/email")
  const { getSettings } = await import("@/lib/services/settings")
  const React = await import("react")

  const emailSettings = await getSettings(orgId)
  const vars = data.variables || {}

  const subject = interpolate(data.subject, vars)
  const greeting = interpolate(data.greeting || "", vars)
  const body = interpolate(data.body, vars)
  const footer = interpolate(data.footer || "", vars)

  await (sendEmail as any)({
    to: user.email,
    subject: `[TEST] ${subject}`,
    react: React.createElement(GenericEmail, {
      subject,
      greeting,
      body,
      footer,
      globalFooterText: emailSettings.email_footer_text,
    }),
    replyTo: emailSettings.email_reply_to || undefined,
  })

  return { success: true }
}

// --- Invoice Settings Actions ---

export async function saveInvoiceSettingsAction(
  _prevState: ActionState<SettingsMap> | null,
  formData: FormData
): Promise<ActionState<SettingsMap>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const validatedForm = invoiceSettingsSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  for (const key in validatedForm.data) {
    const value = validatedForm.data[key as keyof typeof validatedForm.data]
    if (value !== undefined) {
      await updateSettings(org.id, key, value)
    }
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function addInvoiceTemplateAction(data: any) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { getAppData, setAppData } = await import("@/lib/services/apps")
  const appData = (await getAppData(org.id, "invoices")) as any || { templates: [] }
  const templates = appData.templates || []
  
  const { randomUUID } = await import("crypto")
  const newTemplate = {
    id: randomUUID(),
    name: data.name || "New Template",
    formData: data.formData,
  }

  await setAppData(org.id, "invoices", { ...appData, templates: [...templates, newTemplate] })
  revalidatePath("/settings")
  return { success: true, template: newTemplate }
}

export async function editInvoiceTemplateAction(id: string, data: any) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { getAppData, setAppData } = await import("@/lib/services/apps")
  const appData = (await getAppData(org.id, "invoices")) as any || { templates: [] }
  const templates = appData.templates || []

  const updatedTemplates = templates.map((t: any) => 
    t.id === id ? { ...t, name: data.name, formData: data.formData } : t
  )

  await setAppData(org.id, "invoices", { ...appData, templates: updatedTemplates })
  revalidatePath("/settings")
  return { success: true }
}

export async function deleteInvoiceTemplateAction(id: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { getAppData, setAppData } = await import("@/lib/services/apps")
  const appData = (await getAppData(org.id, "invoices")) as any || { templates: [] }
  const templates = appData.templates || []

  await setAppData(org.id, "invoices", { 
    ...appData, 
    templates: templates.filter((t: any) => t.id !== id) 
  })
  revalidatePath("/settings")
  return { success: true }
}

// --- Estimate Settings Actions ---

export async function saveEstimateSettingsAction(
  _prevState: ActionState<SettingsMap> | null,
  formData: FormData
): Promise<ActionState<SettingsMap>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const validatedForm = estimateSettingsSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  for (const key in validatedForm.data) {
    const value = validatedForm.data[key as keyof typeof validatedForm.data]
    if (value !== undefined) {
      await updateSettings(org.id, key, value)
    }
  }

  revalidatePath("/settings")
  return { success: true }
}

// --- Schedule Actions ---

export async function addScheduleAction(data: any) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  try {
    const { createSchedule } = await import("@/lib/services/schedules")
    await createSchedule(org.id, user.id, {
      module: data.module,
      name: data.name,
      frequency: data.frequency,
      interval: data.interval ? Number(data.interval) : 1,
      startAt: new Date(data.startAt),
      limitBy: data.limitBy || null,
      limitCount: data.limitCount ? Number(data.limitCount) : null,
      limitDate: data.limitDate ? new Date(data.limitDate) : null,
      autoSend: data.autoSend === true || data.autoSend === "true",
      templateData: data.templateData || {},
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create schedule" }
  }
}

export async function editScheduleAction(id: string, data: any) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  try {
    const { updateSchedule } = await import("@/lib/services/schedules")
    await updateSchedule(id, org.id, {
      name: data.name,
      frequency: data.frequency,
      interval: data.interval ? Number(data.interval) : undefined,
      limitBy: data.limitBy,
      limitCount: data.limitCount ? Number(data.limitCount) : undefined,
      limitDate: data.limitDate ? new Date(data.limitDate) : undefined,
      autoSend: data.autoSend === true || data.autoSend === "true",
      templateData: data.templateData,
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update schedule" }
  }
}

export async function pauseScheduleAction(id: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  try {
    const { pauseSchedule } = await import("@/lib/services/schedules")
    await pauseSchedule(id, org.id)
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to pause schedule" }
  }
}

export async function resumeScheduleAction(id: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  try {
    const { resumeSchedule } = await import("@/lib/services/schedules")
    await resumeSchedule(id, org.id)
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to resume schedule" }
  }
}

export async function deleteScheduleAction(id: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  try {
    const { deleteSchedule } = await import("@/lib/services/schedules")
    await deleteSchedule(id, org.id)
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete schedule" }
  }
}

// --- Migration Actions ---

export async function migrateLegacyDataAction(orgId: string) {
  try {
    await migrateLegacyCategoryTypes(orgId)
    revalidatePath("/settings")
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to migrate legacy data" }
  }
}
