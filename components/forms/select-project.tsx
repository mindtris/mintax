import { Project } from "@/lib/prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { FormSelect } from "./simple"

export const FormSelectProject = ({
  title,
  projects,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  isRequired = false,
  triggerClassName,
  addNewHref,
  addNewLabel,
  ...props
}: {
  title: string
  projects: Project[]
  emptyValue?: string
  placeholder?: string
  hideIfEmpty?: boolean
  isRequired?: boolean
  triggerClassName?: string
  addNewHref?: string
  addNewLabel?: string
} & SelectProps) => {
  return (
    <FormSelect
      title={title}
      items={projects.map((project) => ({ code: project.code, name: project.name, color: project.color }))}
      emptyValue={emptyValue}
      placeholder={placeholder}
      hideIfEmpty={hideIfEmpty}
      isRequired={isRequired}
      triggerClassName={triggerClassName}
      addNewHref={addNewHref}
      addNewLabel={addNewLabel}
      {...props}
    />
  )
}
