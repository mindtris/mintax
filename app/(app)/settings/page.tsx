import ProfileSettingsForm from "@/components/settings/profile-settings-form"
import BusinessSettingsForm from "@/components/settings/business-settings-form"
import EmailTemplateSettingsForm from "@/components/settings/email-template-settings-form"
import EstimateSettingsForm from "@/components/settings/estimate-settings-form"
import InvoiceSettingsForm from "@/components/settings/invoice-settings-form"
import PayablesSettingsForm from "@/components/settings/payables-settings-form"
import ScheduleSettingsView from "@/components/settings/schedule-settings-view"
import { LLMProvidersGrid } from "@/components/settings/llm-providers-grid"
import { CrudTable } from "@/components/settings/crud"
import { SocialAccountsList } from "@/components/settings/social-list"
import { ConnectAccountButton } from "@/components/settings/connect-button"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSettings } from "@/lib/services/settings"
import { getCurrencies } from "@/lib/services/currencies"
import { getCategories } from "@/lib/services/categories"
import { getTaxes } from "@/lib/services/taxes"
import { getItems } from "@/lib/services/items"
import { getFields } from "@/lib/services/fields"
import { getProjects } from "@/lib/services/projects"
import { getSocialAccounts } from "@/lib/services/social-accounts"
import { getSchedules } from "@/lib/services/schedules"
import { getLlmPrompts, ensureDefaultPrompts, LLM_MODULES } from "@/lib/services/llm-prompts"
import { PROVIDERS } from "@/lib/integrations/llm-providers"
import { randomHexColor } from "@/lib/utils"
import { Prisma } from "@/lib/prisma/client"

import {
  addTaxAction, editTaxAction, deleteTaxAction,
  addItemAction, editItemAction, deleteItemAction,
  addCategoryAction, editCategoryAction, deleteCategoryAction,
  addProjectAction, editProjectAction, deleteProjectAction,
  addCurrencyAction, editCurrencyAction, deleteCurrencyAction,
  addFieldAction, editFieldAction, deleteFieldAction,
  addLlmPromptAction, editLlmPromptAction, deleteLlmPromptAction,
} from "@/app/(app)/settings/actions"
import { resetLLMSettings, resetFieldsAndCategories } from "@/app/(app)/settings/danger/actions"
import BackupSettingsPage from "@/app/(app)/settings/backups/page"

import { Metadata } from "next"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab || "business"

  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  // Profile tab
  if (tab === "profile") {
    return <ProfileTab user={user} />
  }

  // Business tab
  if (tab === "business") {
    const [settings, currencies, categories] = await Promise.all([
      getSettings(org.id),
      getCurrencies(org.id),
      getCategories(org.id),
    ])
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Business details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your organization structure, fiscal year, and default currency.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <BusinessSettingsForm org={org} user={user} settings={settings} currencies={currencies} categories={categories} />
        </div>
      </div>
    )
  }

  // LLM tab
  if (tab === "llm") {
    const settings = await getSettings(org.id)
    await ensureDefaultPrompts(org.id)
    const prompts = await getLlmPrompts(org.id)
    const promptsWithActions = prompts.map((p) => ({
      ...p,
      isEditable: true,
      isDeletable: true,
    }))
    const moduleOptions = LLM_MODULES.map((m) => ({ label: m.label, value: m.value }))
    const providerOptions = [
      { label: "Default", value: "default" },
      ...PROVIDERS.map((p) => ({ label: p.label, value: p.key })),
    ]

    return (
      <div className="flex flex-col gap-10">
        <LLMProvidersGrid settings={settings} />
        <CrudTable
          title="Prompts"
          description="Configure AI prompts for each module. Each module uses its own prompt for LLM analysis."
          items={promptsWithActions}
          columns={[
            { key: "name", label: "Name", editable: true },
            { key: "module", label: "Module", type: "select", complexOptions: moduleOptions, editable: true, filterable: true },
            { key: "provider", label: "Provider", type: "select", complexOptions: providerOptions, editable: true, filterable: true },
            { key: "model", label: "Model override", editable: true },
            { key: "enabled", label: "Active", type: "checkbox", defaultValue: true, editable: true },
          ]}
          searchPlaceholder="Search prompts..."
          onDelete={async (id) => {
            "use server"
            return await deleteLlmPromptAction(org.id, id)
          }}
          onAdd={async (data) => {
            "use server"
            return await addLlmPromptAction(org.id, data)
          }}
          onEdit={async (id, data) => {
            "use server"
            return await editLlmPromptAction(org.id, id, data)
          }}
        />
      </div>
    )
  }

  // Schedule tab
  if (tab === "schedule") {
    const schedules = await getSchedules(org.id)
    return <ScheduleSettingsView schedules={schedules} />
  }

  // Invoice tab
  if (tab === "invoice") {
    const settings = await getSettings(org.id)
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Invoice settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure invoice numbering, defaults, appearance, and column labels.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <InvoiceSettingsForm settings={settings} orgName={org.name} />
        </div>
      </div>
    )
  }

  // Estimate tab
  if (tab === "estimate") {
    const settings = await getSettings(org.id)
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Estimate settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure estimate numbering, defaults, appearance, and column labels.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <EstimateSettingsForm settings={settings} orgName={org.name} />
        </div>
      </div>
    )
  }

  // Taxes tab
  if (tab === "taxes") {
    const taxes = await getTaxes(org.id)
    const taxesWithActions = taxes.map((tax) => ({
      ...tax,
      isEditable: true,
      isDeletable: true,
    }))

    return (
      <CrudTable
        title="Taxes"
        description="Manage regional tax rates (GST, VAT, Sales Tax) for your organization."
        items={taxesWithActions}
        columns={[
          { key: "name", label: "Tax name", editable: true, type: "text" },
          { key: "rate", label: "Rate (%)", editable: true, type: "number" },
          { key: "type", label: "Type", editable: true, type: "select", options: ["normal", "inclusive"], filterable: true },
          { key: "enabled", label: "Active", editable: true, type: "checkbox", defaultValue: true },
        ]}
        onDelete={async (id) => {
          "use server"
          return await deleteTaxAction(org.id, id)
        }}
        onAdd={async (data) => {
          "use server"
          return await addTaxAction(org.id, data)
        }}
        onEdit={async (id, data) => {
          "use server"
          return await editTaxAction(org.id, id, data)
        }}
      />
    )
  }

  // Items tab
  if (tab === "items") {
    const [items, categories, taxes] = await Promise.all([
      getItems(org.id),
      getCategories(org.id),
      getTaxes(org.id),
    ])
    const itemCategories = categories.filter(c => c.type === "item").map(c => ({ label: c.name, value: c.id }))
    const taxOptions = taxes.map(t => ({ label: `${t.name} (${t.rate}%)`, value: t.id }))
    const itemsWithActions = items.map((item) => ({
      ...item,
      isEditable: true,
      isDeletable: true,
    }))

    return (
      <CrudTable
        title="Products & services"
        description="Define the items you sell or purchase with tax rates and categories for automated bookkeeping."
        items={itemsWithActions}
        columns={[
          { key: "name", label: "Name", editable: true, type: "text" },
          { key: "sku", label: "SKU", editable: true, type: "text" },
          { key: "type", label: "Type", editable: true, type: "select", options: ["product", "service"], filterable: true },
          { key: "salePrice", label: "Sale price", editable: true, type: "number" },
          { key: "categoryId", label: "Category", editable: true, type: "select", complexOptions: itemCategories, filterable: true },
          { key: "taxId", label: "Default tax", editable: true, type: "select", complexOptions: taxOptions },
          { key: "enabled", label: "Active", editable: true, type: "checkbox", defaultValue: true },
        ]}
        onDelete={async (id) => {
          "use server"
          return await deleteItemAction(org.id, id)
        }}
        onAdd={async (data) => {
          "use server"
          return await addItemAction(org.id, data)
        }}
        onEdit={async (id, data) => {
          "use server"
          return await editItemAction(org.id, id, data)
        }}
      />
    )
  }

  // Categories tab
  if (tab === "categories") {
    const categories = await getCategories(org.id)
    const categoriesWithActions = categories.map((category) => ({
      ...category,
      isEditable: true,
      isDeletable: true,
    }))

    const typeGroups = {
      financial: ["expense", "income"],
      offering: ["item", "tax", "cogs"],
      operations: ["sales", "hire", "engage"],
      system: ["quicklink", "post"],
    }

    const renderTable = (types: string[]) => {
      const filtered = categoriesWithActions.filter(c => types.includes(c.type))
      return (
        <CrudTable
          title="Categories"
          description="Organize transactions and operations with LLM prompts for automated categorization."
          items={filtered}
          columns={[
            { key: "name", label: "Name", editable: true },
            {
              key: "parentId",
              label: "Parent Category",
              type: "select",
              complexOptions: [
                { label: "None", value: "none" },
                ...filtered.map(c => ({ label: c.name, value: c.id }))
              ],
              editable: true,
            },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: [
                "expense", "income", "tax", "cogs", "item",
                "sales", "hire", "engage", "quicklink", "post"
              ],
              defaultValue: types[0],
              editable: true,
              filterable: true,
            },
            { key: "llm_prompt", label: "LLM prompt", editable: true },
            { key: "color", label: "Color", type: "color", defaultValue: randomHexColor(), editable: true },
          ]}
          onDelete={async (code) => {
            "use server"
            return await deleteCategoryAction(org.id, code)
          }}
          onAdd={async (data) => {
            "use server"
            return await addCategoryAction(org.id, data as Prisma.CategoryCreateInput)
          }}
          onEdit={async (code, data) => {
            "use server"
            return await editCategoryAction(org.id, code, data as Prisma.CategoryUpdateInput)
          }}
        />
      )
    }

    return (
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="bg-muted/30 p-1 mb-4">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="offering">Products & taxes</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          <TabsContent value="financial" className="mt-0">{renderTable(typeGroups.financial)}</TabsContent>
          <TabsContent value="offering" className="mt-0">{renderTable(typeGroups.offering)}</TabsContent>
          <TabsContent value="operations" className="mt-0">{renderTable(typeGroups.operations)}</TabsContent>
          <TabsContent value="system" className="mt-0">{renderTable(typeGroups.system)}</TabsContent>
        </Tabs>
      </div>
    )
  }

  // Projects tab
  if (tab === "projects") {
    const projects = await getProjects(org.id)
    const projectsWithActions = projects.map((project) => ({
      ...project,
      isEditable: true,
      isDeletable: true,
    }))

    return (
      <CrudTable
        title="Projects"
        description="Segment your activities (e.g., Freelancing, Consulting) for organized reporting and analytics."
        items={projectsWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          { key: "llm_prompt", label: "LLM prompt", editable: true },
          { key: "color", label: "Color", type: "color", defaultValue: randomHexColor(), editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteProjectAction(org.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addProjectAction(org.id, data as Prisma.ProjectCreateInput)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editProjectAction(org.id, code, data as Prisma.ProjectUpdateInput)
        }}
      />
    )
  }

  // Currencies tab
  if (tab === "currencies") {
    const currencies = await getCurrencies(org.id)
    const currenciesWithActions = currencies.map((currency) => ({
      ...currency,
      isEditable: true,
      isDeletable: true,
    }))

    return (
      <CrudTable
        title="Currencies"
        description="Custom currencies for unique transaction requirements."
        items={currenciesWithActions}
        columns={[
          { key: "code", label: "Code", editable: true },
          { key: "name", label: "Name", editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteCurrencyAction(org.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addCurrencyAction(org.id, data as { code: string; name: string })
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editCurrencyAction(org.id, code, data as { name: string })
        }}
      />
    )
  }

  // Email templates tab
  if (tab === "email-templates") {
    const settings = await getSettings(org.id)
    return <EmailTemplateSettingsForm settings={settings} orgName={org.name} />
  }

  // Social tab
  if (tab === "social") {
    const accounts = await getSocialAccounts(org.id)
    const rows = accounts.map((a) => ({
      id: a.id,
      name: a.name,
      provider: a.provider,
      username: a.username,
      disabled: a.disabled,
    }))

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Social accounts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your social media accounts to publish and schedule posts.
            </p>
          </div>
          <ConnectAccountButton />
        </div>
        <SocialAccountsList accounts={rows} />
      </div>
    )
  }

  // Fields tab
  if (tab === "fields") {
    const fields = await getFields(org.id)
    const fieldsWithActions = fields.map((field) => ({
      ...field,
      isEditable: true,
      isDeletable: field.isExtra,
    }))

    return (
      <CrudTable
        title="Custom fields"
        description="Define extra transaction fields for AI analysis or manual entry."
        items={fieldsWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: ["string", "number", "boolean"],
            defaultValue: "string",
            editable: true,
            filterable: true,
          },
          { key: "llm_prompt", label: "LLM prompt", editable: true },
          { key: "isVisibleInList", label: "Show in transactions table", type: "checkbox", defaultValue: false, editable: true },
          { key: "isVisibleInAnalysis", label: "Show in analysis form", type: "checkbox", defaultValue: false, editable: true },
          { key: "isRequired", label: "Is required", type: "checkbox", defaultValue: false, editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteFieldAction(org.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addFieldAction(org.id, data as Prisma.FieldCreateInput)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editFieldAction(org.id, code, data as Prisma.FieldUpdateInput)
        }}
      />
    )
  }

  // Payables tab
  if (tab === "payables") {
    const [settings, categories] = await Promise.all([
      getSettings(org.id),
      getCategories(org.id),
    ])

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Payables</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure bill prefixes, payment terms, and payable defaults.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <PayablesSettingsForm settings={settings} categories={categories} />
        </div>
      </div>
    )
  }

  // Backups tab
  if (tab === "backups") {
    return <BackupSettingsPage />
  }

  // Danger tab
  if (tab === "danger") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These actions will overwrite existing fields, categories, and prompts. Use only if something is broken.
          </p>
        </div>
        <div className="space-y-8">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">LLM settings</h3>
            <p className="text-sm text-muted-foreground">
              Reset the system prompt and other LLM settings to their default values.
            </p>
            <form action={async () => {
              "use server"
              await resetLLMSettings(org)
            }}>
              <Button variant="destructive" type="submit">Reset main LLM prompt</Button>
            </form>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Fields, currencies and categories</h3>
            <p className="text-sm text-muted-foreground">
              Reset all fields, currencies, and categories to their default values.
            </p>
            <form action={async () => {
              "use server"
              await resetFieldsAndCategories(org)
            }}>
              <Button variant="destructive" type="submit">Reset fields, currencies and categories</Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Default fallback to business
  return null
}

function ProfileTab({ user }: { user: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile details.
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <ProfileSettingsForm user={user} />
      </div>
    </div>
  )
}
