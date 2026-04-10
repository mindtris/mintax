"use server"

import { prisma } from "@/lib/core/db"
import {
  BUSINESS_DEFAULTS,
  PERSONAL_DEFAULTS,
  DEFAULT_CURRENCIES,
  DEFAULT_FIELDS,
  DEFAULT_SETTINGS,
  seedDefaultTaxes,
} from "@/lib/services/defaults"
import { Organization } from "@/lib/prisma/client"
import { redirect } from "next/navigation"

export async function resetLLMSettings(org: Organization) {
  const llmSettings = DEFAULT_SETTINGS.filter((setting) => setting.code === "prompt_analyse_new_file")

  for (const setting of llmSettings) {
    await prisma.setting.upsert({
      where: { organizationId_code: { code: setting.code, organizationId: org.id } },
      update: { value: setting.value },
      create: { ...setting, organizationId: org.id },
    })
  }

  redirect("/settings/llm")
}

export async function resetFieldsAndCategories(org: Organization) {
  const defaults = org.type === "personal" ? PERSONAL_DEFAULTS : BUSINESS_DEFAULTS

  // Reset categories — flatten all typed groups
  const allCategories: { code: string; name: string; color: string; llm?: string; type: string }[] = []
  for (const [type, list] of Object.entries(defaults.categories)) {
    for (const cat of list) {
      allCategories.push({ ...cat, type, llm: (cat as any).llm })
    }
  }

  for (const category of allCategories) {
    await prisma.category.upsert({
      where: { organizationId_code: { code: category.code, organizationId: org.id } },
      update: { name: category.name, color: category.color, llm_prompt: category.llm, type: category.type, createdAt: new Date() },
      create: { code: category.code, name: category.name, color: category.color, llm_prompt: category.llm, type: category.type, organizationId: org.id, createdAt: new Date() },
    })
  }
  await prisma.category.deleteMany({
    where: { organizationId: org.id, code: { notIn: allCategories.map((c) => c.code) } },
  })

  // Reset currencies
  for (const currency of DEFAULT_CURRENCIES) {
    await prisma.currency.upsert({
      where: { organizationId_code: { code: currency.code, organizationId: org.id } },
      update: { name: currency.name },
      create: { ...currency, organizationId: org.id },
    })
  }
  await prisma.currency.deleteMany({
    where: { organizationId: org.id, code: { notIn: DEFAULT_CURRENCIES.map((currency) => currency.code) } },
  })

  // Reset fields
  for (const field of DEFAULT_FIELDS) {
    await prisma.field.upsert({
      where: { organizationId_code: { code: field.code, organizationId: org.id } },
      update: {
        name: field.name,
        type: field.type,
        llm_prompt: field.llm_prompt,
        createdAt: new Date(),
        isVisibleInList: field.isVisibleInList,
        isVisibleInAnalysis: field.isVisibleInAnalysis,
        isRequired: field.isRequired,
        isExtra: field.isExtra,
      },
      create: { ...field, organizationId: org.id, createdAt: new Date() },
    })
  }
  await prisma.field.deleteMany({
    where: { organizationId: org.id, code: { notIn: DEFAULT_FIELDS.map((field) => field.code) } },
  })

  // Reset taxes
  await seedDefaultTaxes(org.id, org.baseCurrency)

  redirect("/settings/fields")
}
