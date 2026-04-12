export const ORGANIZATION_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "accountant", label: "Accountant" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
] as const

export type OrganizationRole = typeof ORGANIZATION_ROLES[number]["value"]
