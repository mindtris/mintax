import { prisma } from "@/lib/core/db"
import { codeFromName } from "@/lib/utils"
import { formatDate } from "date-fns"
import { createCategory, getCategoryByCode } from "./categories"
import { createProject, getProjectByCode } from "./projects"
import { TransactionFilters } from "./transactions"

export type ExportFilters = TransactionFilters

export type ExportFields = string[]

export type ExportImportFieldSettings = {
  code: string
  type: string
  export?: (orgId: string, value: any) => Promise<any>
  import?: (orgId: string, value: any) => Promise<any>
}

export const EXPORT_AND_IMPORT_FIELD_MAP: Record<string, ExportImportFieldSettings> = {
  name: {
    code: "name",
    type: "string",
  },
  description: {
    code: "description",
    type: "string",
  },
  merchant: {
    code: "merchant",
    type: "string",
  },
  total: {
    code: "total",
    type: "number",
    export: async function (_orgId: string, value: number) {
      return value / 100
    },
    import: async function (_orgId: string, value: string) {
      const num = parseFloat(value)
      return isNaN(num) ? 0.0 : num * 100
    },
  },
  currencyCode: {
    code: "currencyCode",
    type: "string",
  },
  convertedTotal: {
    code: "convertedTotal",
    type: "number",
    export: async function (_orgId: string, value: number | null) {
      if (!value) {
        return null
      }
      return value / 100
    },
    import: async function (_orgId: string, value: string) {
      const num = parseFloat(value)
      return isNaN(num) ? 0.0 : num * 100
    },
  },
  convertedCurrencyCode: {
    code: "convertedCurrencyCode",
    type: "string",
  },
  type: {
    code: "type",
    type: "string",
    export: async function (_orgId: string, value: string | null) {
      return value ? value.toLowerCase() : ""
    },
    import: async function (_orgId: string, value: string) {
      return value.toLowerCase()
    },
  },
  note: {
    code: "note",
    type: "string",
  },
  categoryCode: {
    code: "categoryCode",
    type: "string",
    export: async function (orgId: string, value: string | null) {
      if (!value) {
        return null
      }
      const category = await getCategoryByCode(orgId, value)
      return category?.name
    },
    import: async function (orgId: string, value: string) {
      const category = await importCategory(orgId, value)
      return category?.code
    },
  },
  projectCode: {
    code: "projectCode",
    type: "string",
    export: async function (orgId: string, value: string | null) {
      if (!value) {
        return null
      }
      const project = await getProjectByCode(orgId, value)
      return project?.name
    },
    import: async function (orgId: string, value: string) {
      const project = await importProject(orgId, value)
      return project?.code
    },
  },
  issuedAt: {
    code: "issuedAt",
    type: "date",
    export: async function (_orgId: string, value: Date | null) {
      if (!value || isNaN(value.getTime())) {
        return null
      }

      try {
        return formatDate(value, "yyyy-MM-dd")
      } catch (error) {
        return null
      }
    },
    import: async function (_orgId: string, value: string) {
      try {
        return new Date(value)
      } catch (error) {
        return null
      }
    },
  },
}

export const importProject = async (orgId: string, name: string) => {
  const code = codeFromName(name)

  const existingProject = await prisma.project.findFirst({
    where: {
      organizationId: orgId,
      OR: [{ code }, { name }],
    },
  })

  if (existingProject) {
    return existingProject
  }

  return await createProject(orgId, { code, name })
}

export const importCategory = async (orgId: string, name: string) => {
  const code = codeFromName(name)

  const existingCategory = await prisma.category.findFirst({
    where: {
      organizationId: orgId,
      OR: [{ code }, { name }],
    },
  })

  if (existingCategory) {
    return existingCategory
  }

  return await createCategory(orgId, { code, name })
}
