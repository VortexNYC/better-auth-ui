import type { ReactNode } from "react";

import { isOrganizationAdminRole } from "./organization-role";

export interface OrganizationAdminGateProps {
  /** Active membership role from the host (e.g. organization.userRole). */
  role: string | null | undefined;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only for organization owner/admin.
 * Host passes membership role — this package does not fetch it.
 */
export function OrganizationAdminGate({
  role,
  children,
  fallback = null,
}: OrganizationAdminGateProps): ReactNode {
  return isOrganizationAdminRole(role) ? children : fallback;
}
