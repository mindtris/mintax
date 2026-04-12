import { prisma } from "@/lib/core/db"

type BackupSetting = {
  filename: string
  model: any
  backup: (orgId: string, row: any) => Record<string, any>
  restore: (orgId: string, userId: string, json: Record<string, any>) => any
}

// Ordering is important here
export const MODEL_BACKUP: BackupSetting[] = [
  {
    filename: "settings.json",
    model: prisma.setting,
    backup: (_orgId: string, row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      value: row.value,
    }),
    restore: (orgId: string, _userId: string, json: any) => ({
      code: json.code,
      name: json.name,
      description: json.description,
      value: json.value,
      organizationId: orgId,
    }),
  },
  {
    filename: "currencies.json",
    model: prisma.currency,
    backup: (_orgId: string, row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }),
    restore: (orgId: string, _userId: string, json: any) => ({
      code: json.code,
      name: json.name,
      organizationId: orgId,
    }),
  },
  {
    filename: "categories.json",
    model: prisma.category,
    backup: (_orgId: string, row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      color: row.color,
      llm_prompt: row.llm_prompt,
      createdAt: row.createdAt,
    }),
    restore: (orgId: string, _userId: string, json: any) => ({
      code: json.code,
      name: json.name,
      color: json.color,
      llm_prompt: json.llm_prompt,
      createdAt: json.createdAt,
      organizationId: orgId,
    }),
  },
  {
    filename: "projects.json",
    model: prisma.project,
    backup: (_orgId: string, row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      color: row.color,
      llm_prompt: row.llm_prompt,
      createdAt: row.createdAt,
    }),
    restore: (orgId: string, _userId: string, json: any) => ({
      code: json.code,
      name: json.name,
      color: json.color,
      llm_prompt: json.llm_prompt,
      createdAt: json.createdAt,
      organizationId: orgId,
    }),
  },
  {
    filename: "fields.json",
    model: prisma.field,
    backup: (_orgId: string, row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      llm_prompt: row.llm_prompt,
      options: row.options,
      isVisibleInList: row.isVisibleInList,
      isVisibleInAnalysis: row.isVisibleInAnalysis,
      isRequired: row.isRequired,
      isExtra: row.isExtra,
    }),
    restore: (orgId: string, _userId: string, json: any) => ({
      code: json.code,
      name: json.name,
      type: json.type,
      llm_prompt: json.llm_prompt,
      options: json.options,
      isVisibleInList: json.isVisibleInList,
      isVisibleInAnalysis: json.isVisibleInAnalysis,
      isRequired: json.isRequired,
      isExtra: json.isExtra,
      organizationId: orgId,
    }),
  },
  {
    filename: "files.json",
    model: prisma.file,
    backup: (_orgId: string, row: any) => ({
      id: row.id,
      filename: row.filename,
      path: row.path,
      metadata: row.metadata,
      isReviewed: row.isReviewed,
      mimetype: row.mimetype,
      createdAt: row.createdAt,
    }),
    restore: (orgId: string, userId: string, json: any) => ({
      id: json.id,
      filename: json.filename,
      path: json.path ? json.path.replace(/^.*\/uploads\//, "") : "",
      metadata: json.metadata,
      isReviewed: json.isReviewed,
      mimetype: json.mimetype,
      organizationId: orgId,
      userId,
    }),
  },
  {
    filename: "transactions.json",
    model: prisma.transaction,
    backup: (_orgId: string, row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      merchant: row.merchant,
      total: row.total,
      currencyCode: row.currencyCode,
      convertedTotal: row.convertedTotal,
      convertedCurrencyCode: row.convertedCurrencyCode,
      type: row.type,
      note: row.note,
      files: row.files,
      extra: row.extra,
      categoryCode: row.categoryCode,
      projectCode: row.projectCode,
      issuedAt: row.issuedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      text: row.text,
    }),
    restore: (orgId: string, userId: string, json: any) => ({
      id: json.id,
      name: json.name,
      description: json.description,
      merchant: json.merchant,
      total: json.total || 0,
      currencyCode: json.currencyCode,
      convertedTotal: json.convertedTotal,
      convertedCurrencyCode: json.convertedCurrencyCode,
      type: json.type,
      note: json.note,
      files: json.files || [],
      extra: json.extra || {},
      issuedAt: json.issuedAt,
      organizationId: orgId,
      userId,
      categoryCode: json.categoryCode,
      projectCode: json.projectCode,
    }),
  },
]

export async function modelToJSON(orgId: string, backupSettings: BackupSetting): Promise<string> {
  const data = await backupSettings.model.findMany({ where: { organizationId: orgId } })

  if (!data || data.length === 0) {
    return "[]"
  }

  return JSON.stringify(
    data.map((row: any) => backupSettings.backup(orgId, row)),
    null,
    2
  )
}

export async function modelFromJSON(
  orgId: string,
  userId: string,
  backupSettings: BackupSetting,
  jsonContent: string
): Promise<number> {
  if (!jsonContent) return 0

  try {
    const rawRecords = JSON.parse(jsonContent)

    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      return 0
    }

    const records = rawRecords.map((r) => {
      const processed = preprocessRowData(r)
      return backupSettings.restore(orgId, userId, processed)
    })

    // Use createMany for bulk insertion (skipDuplicates true to avoid conflicts if IDs exist)
    const result = await backupSettings.model.createMany({
      data: records,
      skipDuplicates: true,
    })

    return result.count
  } catch (error) {
    console.error(`Error importing records:`, error)
    return 0
  }
}

function preprocessRowData(row: Record<string, any>): Record<string, any> {
  const processedRow: Record<string, any> = {}

  for (const [key, value] of Object.entries(row)) {
    if (value === "" || value === "null" || value === undefined) {
      processedRow[key] = null
      continue
    }

    if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
      try {
        processedRow[key] = JSON.parse(value)
        continue
      } catch (e) {
        // Not valid JSON, continue with normal processing
      }
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
      processedRow[key] = new Date(value)
      continue
    }

    if (typeof value === "string" && !isNaN(Number(value)) && key !== "id" && !key.endsWith("Code")) {
      processedRow[key] = Number(value)
      continue
    }

    processedRow[key] = value
  }

  return processedRow
}
