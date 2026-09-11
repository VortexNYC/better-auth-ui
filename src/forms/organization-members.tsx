import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Select } from "@cloudflare/kumo/components/select";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type {
  AuthInvitation,
  AuthMember,
  AuthOrganizationFull,
} from "../types";

const defaultRoleOptions = ["owner", "admin", "member"];

export interface InviteMemberFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  emailLabel?: string;
  roleLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  roleOptions?: readonly string[];
  defaultRole?: string;
  onInvite?: (invitation: AuthInvitation) => void;
}

/**
 * Invite a member to the active organization.
 */
export function InviteMemberForm({
  className,
  errorClassName,
  title = "Invite member",
  description = "Add a teammate to this workspace.",
  emailLabel = "Email",
  roleLabel = "Role",
  submitLabel = "Send invite",
  submittingLabel = "Sending…",
  roleOptions = defaultRoleOptions,
  defaultRole = "member",
  onInvite,
}: InviteMemberFormProps) {
  const client = useAuth();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (client.organization?.inviteMember === undefined) {
      setError("Inviting members is not available.");
      return;
    }

    if (email.length === 0 || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.organization.inviteMember({ email, role });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not send invitation.");
      } else {
        onInvite?.(response.data as AuthInvitation);
        setEmail("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <Input
          label={emailLabel}
          type="email"
          value={email}
          onValueChange={setEmail}
          placeholder="teammate@example.com"
          required
        />

        <Select
          label={roleLabel}
          value={role}
          onValueChange={(value) => setRole(value ?? defaultRole)}
          items={Object.fromEntries(roleOptions.map((r) => [r, r]))}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isSubmitting}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </form>
    </AuthCard>
  );
}

export interface OrganizationMembersProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  membersLabel?: string;
  invitationsLabel?: string;
  removeLabel?: string;
  cancelLabel?: string;
  updateRoleLabel?: string;
  roleOptions?: readonly string[];
  canManageMembers?: boolean;
  onMemberRemoved?: () => void;
  onInvitationCancelled?: () => void;
}

/**
 * List, edit, and manage members of the active organization.
 *
 * Loads the current full organization and shows members plus pending
 * invitations. Use with `InviteMemberForm` to add people.
 */
export function OrganizationMembers({
  className,
  errorClassName,
  title = "Members",
  description = "Manage workspace members.",
  loadingLabel = "Loading members…",
  emptyLabel = "No members found.",
  membersLabel = "Members",
  invitationsLabel = "Pending invitations",
  removeLabel = "Remove",
  cancelLabel = "Cancel",
  updateRoleLabel = "Update role",
  roleOptions = defaultRoleOptions,
  canManageMembers = true,
  onMemberRemoved,
  onInvitationCancelled,
}: OrganizationMembersProps) {
  const client = useAuth();
  const session = client.useSession?.();
  const currentUserId = session?.data?.user?.id;

  const [fullOrg, setFullOrg] = useState<AuthOrganizationFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (client.organization?.getFullOrganization === undefined) {
      setError("Member management is not available.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.organization.getFullOrganization();
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load members.");
        return;
      }
      setFullOrg(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load members.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [client]);

  async function handleUpdateRole(member: AuthMember) {
    if (client.organization?.updateMemberRole === undefined) {
      setError("Updating roles is not available.");
      return;
    }

    setError(null);

    try {
      const response = await client.organization.updateMemberRole({
        memberId: member.id,
        role: member.role,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not update role.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role.");
    }
  }

  async function handleRemove(member: AuthMember) {
    if (client.organization?.removeMember === undefined) {
      setError("Removing members is not available.");
      return;
    }

    setError(null);

    try {
      const response = await client.organization.removeMember({
        memberId: member.id,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not remove member.");
      } else {
        onMemberRemoved?.();
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove member.");
    }
  }

  async function handleCancelInvitation(invitation: AuthInvitation) {
    if (client.organization?.cancelInvitation === undefined) {
      setError("Cancelling invitations is not available.");
      return;
    }

    setError(null);

    try {
      const response = await client.organization.cancelInvitation({
        invitationId: invitation.id,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not cancel invitation.");
      } else {
        onInvitationCancelled?.();
        await load();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not cancel invitation.",
      );
    }
  }

  if (isLoading) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <Text variant="secondary">{loadingLabel}</Text>
      </AuthCard>
    );
  }

  const members = fullOrg?.members ?? [];
  const invitations = fullOrg?.invitations ?? [];

  return (
    <AuthCard className={className} title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <div>
          <Text as="h3" variant="heading">
            {membersLabel}
          </Text>
          {members.length === 0 ? (
            <Text variant="secondary">{emptyLabel}</Text>
          ) : (
            <ul className="space-y-2">
              {members.map((member) => {
                const isCurrentUser = member.user?.id === currentUserId;
                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <Text truncate>
                        {member.user?.name ?? "Unknown"}
                        {isCurrentUser ? " (you)" : ""}
                      </Text>
                      <Text variant="secondary" size="sm" truncate>
                        {member.user?.email ?? member.userId}
                      </Text>
                    </div>

                    {canManageMembers ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => {
                            const nextRole = value ?? member.role;
                            setFullOrg((org) =>
                              org
                                ? {
                                    ...org,
                                    members: org.members.map((m) =>
                                      m.id === member.id
                                        ? { ...m, role: nextRole }
                                        : m,
                                    ),
                                  }
                                : org,
                            );
                            void handleUpdateRole({
                              ...member,
                              role: nextRole,
                            });
                          }}
                          items={Object.fromEntries(
                            roleOptions.map((r) => [r, r]),
                          )}
                          aria-label={updateRoleLabel}
                        />
                        {!isCurrentUser ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void handleRemove(member)}
                          >
                            {removeLabel}
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <Text variant="secondary" size="sm">
                        {member.role}
                      </Text>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {invitations.length > 0 ? (
          <div>
            <Text as="h3" variant="heading">
              {invitationsLabel}
            </Text>
            <ul className="space-y-2">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <Text truncate>{invitation.email}</Text>
                    <Text variant="secondary" size="sm" truncate>
                      {invitation.role}
                    </Text>
                  </div>
                  {canManageMembers ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void handleCancelInvitation(invitation)}
                    >
                      {cancelLabel}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </AuthCard>
  );
}
