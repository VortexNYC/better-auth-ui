/**
 * Organization roles Seal (and other Better Auth org consumers) use.
 * Owner/admin administer the workspace; member does not.
 */
export const ORGANIZATION_ADMIN_ROLES = ["owner", "admin"] as const;

/** Invite targets — do not offer owner; ownership is transferred explicitly. */
export const ORGANIZATION_INVITE_ROLE_OPTIONS = ["admin", "member"] as const;

export type OrganizationAdminRole = (typeof ORGANIZATION_ADMIN_ROLES)[number];

export function isOrganizationAdminRole(
  role: string | null | undefined,
): boolean {
  return role === "owner" || role === "admin";
}
