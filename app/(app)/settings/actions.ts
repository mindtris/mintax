"use server"

import {
  categoryFormSchema,
  currencyFormSchema,
  fieldFormSchema,
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
  const validatedForm = userFormSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  // Upload avatar
  let avatarUrl = user.avatar
  const avatarFile = formData.get("avatar") as File | null
  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      const uploadedAvatarPath = await uploadStaticImage(user, avatarFile, "avatar.webp", 500, 500)
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

  revalidatePath("/settings/profile")
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
      const uploadedLogoPath = await uploadStaticImage(user, logoFile, "businessLogo.png", 500, 500)
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

  revalidatePath("/settings/business")
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
  revalidatePath("/settings/projects")

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
  revalidatePath("/settings/projects")

  return { success: true, project }
}

export async function deleteProjectAction(orgId: string, code: string) {
  try {
    await deleteProject(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete project" + error }
  }
  revalidatePath("/settings/projects")
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
  revalidatePath("/settings/currencies")

  return { success: true, currency }
}

export async function editCurrencyAction(orgId: string, code: string, data: Prisma.CurrencyUpdateInput) {
  const validatedForm = currencyFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const currency = await updateCurrency(orgId, code, { name: validatedForm.data.name })
  revalidatePath("/settings/currencies")
  return { success: true, currency }
}

export async function deleteCurrencyAction(orgId: string, code: string) {
  try {
    await deleteCurrency(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete currency" + error }
  }
  revalidatePath("/settings/currencies")
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
      llm_prompt: validatedForm.data.llm_prompt,
      color: validatedForm.data.color || "",
    })
    revalidatePath("/settings/categories")

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
    llm_prompt: validatedForm.data.llm_prompt,
    color: validatedForm.data.color || "",
  })
  revalidatePath("/settings/categories")

  return { success: true, category }
}

export async function deleteCategoryAction(orgId: string, code: string) {
  try {
    await deleteCategory(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete category" + error }
  }
  revalidatePath("/settings/categories")
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
  revalidatePath("/settings/fields")

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
  revalidatePath("/settings/fields")

  return { success: true, field }
}

export async function deleteFieldAction(orgId: string, code: string) {
  try {
    await deleteField(orgId, code)
  } catch (error) {
    return { success: false, error: "Failed to delete field" + error }
  }
  revalidatePath("/settings/fields")
  return { success: true }
}

// --- Tax Actions ---

export async function addTaxAction(orgId: string, data: any) {
  try {
    await createTax(orgId, data)
    revalidatePath("/settings/taxes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to add tax" }
  }
}

export async function editTaxAction(orgId: string, id: string, data: any) {
  try {
    await updateTax(id, orgId, data)
    revalidatePath("/settings/taxes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update tax" }
  }
}

export async function deleteTaxAction(orgId: string, id: string) {
  try {
    await deleteTax(id, orgId)
    revalidatePath("/settings/taxes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete tax" }
  }
}

// --- Item Actions ---

export async function addItemAction(orgId: string, data: any) {
  try {
    await createItem(orgId, data)
    revalidatePath("/settings/items")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to add item" }
  }
}

export async function editItemAction(orgId: string, id: string, data: any) {
  try {
    await updateItem(id, orgId, data)
    revalidatePath("/settings/items")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update item" }
  }
}

export async function deleteItemAction(orgId: string, id: string) {
  try {
    await deleteItem(id, orgId)
    revalidatePath("/settings/items")
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
    revalidatePath("/settings/llm")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to add prompt" }
  }
}

export async function editLlmPromptAction(orgId: string, id: string, data: any) {
  try {
    const { updateLlmPrompt } = await import("@/lib/services/llm-prompts")
    await updateLlmPrompt(id, orgId, data)
    revalidatePath("/settings/llm")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update prompt" }
  }
}

export async function deleteLlmPromptAction(orgId: string, id: string) {
  try {
    const { deleteLlmPrompt } = await import("@/lib/services/llm-prompts")
    await deleteLlmPrompt(id, orgId)
    revalidatePath("/settings/llm")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete prompt" }
  }
}

// --- Migration Actions ---

export async function migrateLegacyDataAction(orgId: string) {
  try {
    await migrateLegacyCategoryTypes(orgId)
    revalidatePath("/settings")
    revalidatePath("/settings/categories")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to migrate legacy data" }
  }
}
