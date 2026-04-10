import { addProjectAction, deleteProjectAction, editProjectAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { randomHexColor } from "@/lib/utils"
import { getProjects } from "@/lib/services/projects"
import { Prisma } from "@/lib/prisma/client"

export default async function ProjectsSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
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
