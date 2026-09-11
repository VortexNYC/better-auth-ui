import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthInvitation, AuthOrganization } from "../types";

export interface OrganizationListProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  membershipsLabel?: string;
  invitationsLabel?: string;
  currentLabel?: string;
  selectLabel?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  createLabel?: string;
  noOrganizationsLabel?: string;
  noInvitationsLabel?: string;
  loadingLabel?: string;
  currentOrganizationId?: string | null;
  showCreateButton?: boolean;
  onSelectOrganization?: (organization: AuthOrganization) => void;
  onCreateOrganization?: () => void;
  onAcceptInvitation?: (invitation: AuthInvitation) => void;
  onRejectInvitation?: (invitation: AuthInvitation) => void;
}

/**
 * Card that lists the user's Better Auth organizations and pending invitations.
 */
export function OrganizationList({
  className,
  errorClassName,
  title = "Workspaces",
  description = "Select a workspace or manage invitations.",
  membershipsLabel = "Your workspaces",
  invitationsLabel = "Invitations",
  currentLabel = "Current",
  selectLabel = "Open",
  acceptLabel = "Accept",
  rejectLabel = "Decline",
  createLabel = "Create workspace",
  noOrganizationsLabel = "You are not a member of any workspace.",
  noInvitationsLabel = "No pending invitations.",
  loadingLabel = "Loading…",
  currentOrganizationId,
  showCreateButton = true,
  onSelectOrganization,
  onCreateOrganization,
  onAcceptInvitation,
  onRejectInvitation,
}: OrganizationListProps) {
  const client = useAuth();

  const [organizations, setOrganizations] = useState<AuthOrganization[] | null>(
    null,
  );
  const [invitations, setInvitations] = useState<AuthInvitation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    if (
      client.organization?.list === undefined &&
      client.organization?.listUserInvitations === undefined
    ) {
      setError("Organization listing is not available.");
      setIsLoading(false);
      return;
    }

    try {
      const [orgsResponse, invitesResponse] = await Promise.all([
        client.organization?.list?.() ?? { data: [], error: null },
        client.organization?.listUserInvitations?.() ?? {
          data: [],
          error: null,
        },
      ]);

      if (orgsResponse.error !== null) {
        setError(orgsResponse.error.message ?? "Could not load workspaces.");
      } else {
        setOrganizations(orgsResponse.data ?? []);
      }

      if (invitesResponse.error !== null) {
        setError(
          invitesResponse.error.message ?? "Could not load invitations.",
        );
      } else {
        setInvitations(invitesResponse.data ?? []);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load workspaces.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [client]);

  async function handleAccept(invitation: AuthInvitation) {
    if (client.organization?.acceptInvitation === undefined) {
      setError("Accept invitation is not available.");
      return;
    }

    setError(null);
    const response = await client.organization.acceptInvitation({
      invitationId: invitation.id,
    });

    if (response.error !== null) {
      setError(response.error.message ?? "Could not accept invitation.");
      return;
    }

    onAcceptInvitation?.(invitation);
    await load();
  }

  async function handleReject(invitation: AuthInvitation) {
    if (client.organization?.rejectInvitation === undefined) {
      setError("Reject invitation is not available.");
      return;
    }

    setError(null);
    const response = await client.organization.rejectInvitation({
      invitationId: invitation.id,
    });

    if (response.error !== null) {
      setError(response.error.message ?? "Could not reject invitation.");
      return;
    }

    onRejectInvitation?.(invitation);
    await load();
  }

  async function handleSelect(organization: AuthOrganization) {
    if (client.organization?.setActive === undefined) {
      setError("Set active workspace is not available.");
      return;
    }

    setError(null);
    const response = await client.organization.setActive({
      organizationId: organization.id,
    });

    if (response.error !== null) {
      setError(response.error.message ?? "Could not switch workspace.");
      return;
    }

    onSelectOrganization?.(organization);
    await load();
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {isLoading ? (
          <Text variant="secondary">{loadingLabel}</Text>
        ) : (
          <>
            <div>
              <Text as="h3" variant="heading">
                {membershipsLabel}
              </Text>
              {organizations === null || organizations.length === 0 ? (
                <Text variant="secondary">{noOrganizationsLabel}</Text>
              ) : (
                <ul className="space-y-2">
                  {organizations.map((organization) => {
                    const isCurrent = organization.id === currentOrganizationId;
                    return (
                      <li
                        key={organization.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <Text truncate>{organization.name}</Text>
                        {isCurrent ? (
                          <Text variant="secondary" size="sm">
                            {currentLabel}
                          </Text>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void handleSelect(organization)}
                          >
                            {selectLabel}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {invitations !== null && invitations.length > 0 ? (
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
                      <Text truncate>{invitation.email}</Text>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void handleAccept(invitation)}
                        >
                          {acceptLabel}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void handleReject(invitation)}
                        >
                          {rejectLabel}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Text variant="secondary" size="sm">
                {noInvitationsLabel}
              </Text>
            )}

            {showCreateButton ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => onCreateOrganization?.()}
              >
                {createLabel}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </AuthCard>
  );
}
