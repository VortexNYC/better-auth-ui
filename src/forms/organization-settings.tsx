import { SettingsStack } from "../auth-primitives";
import { InviteMemberForm } from "./organization-members";
import { OrganizationMembers } from "./organization-members";
import { OrganizationProfile } from "./organization-profile";

export interface OrganizationSettingsProps {
  className?: string;
  canInvite?: boolean;
}

/**
 * One workspace screen: profile, members, and invites.
 */
export function OrganizationSettings({
  className,
  canInvite = true,
}: OrganizationSettingsProps) {
  return (
    <SettingsStack className={className}>
      <OrganizationProfile />
      <OrganizationMembers />
      {canInvite ? <InviteMemberForm /> : null}
    </SettingsStack>
  );
}
