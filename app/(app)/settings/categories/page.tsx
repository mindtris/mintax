import { addCategoryAction, deleteCategoryAction, editCategoryAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { randomHexColor } from "@/lib/utils"
import { getCategories } from "@/lib/services/categories"
import { Prisma } from "@/lib/prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CategoriesSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
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
        items={filtered}
        columns={[
          { key: "name", label: "Name", editable: true },
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">Categories</h2>
            <div className="bg-secondary text-sm px-2 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
              {categories.length}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Organize transactions and operations with LLM prompts for automated categorization.
          </p>
        </div>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="bg-muted/30 p-1 mb-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="offering">Products & taxes</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-0">
          {renderTable(typeGroups.financial)}
        </TabsContent>
        <TabsContent value="offering" className="mt-0">
          {renderTable(typeGroups.offering)}
        </TabsContent>
        <TabsContent value="operations" className="mt-0">
          {renderTable(typeGroups.operations)}
        </TabsContent>
        <TabsContent value="system" className="mt-0">
          {renderTable(typeGroups.system)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
