import { useEffect, useState } from "react";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthOrganization } from "../types";
import { OrganizationChooser } from "./organization-chooser";

export interface PostSignUpProps {
  invitationId?: string;
  onReady: (organization: AuthOrganization) => void;
}

function readActiveOrganizationId(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("session" in data)) {
    return null;
  }
  const session = Reflect.get(data, "session");
  if (
    typeof session !== "object" ||
    session === null ||
    !("activeOrganizationId" in session)
  ) {
    return null;
  }
  const id = Reflect.get(session, "activeOrganizationId");
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * After sign-up: accept an invite, open the only workspace, or ask the person to choose.
 */
export function PostSignUp({ invitationId, onReady }: PostSignUpProps) {
  const client = useAuth();
  const session = client.useSession();
  const [error, setError] = useState<string | null>(null);
  const [choose, setChoose] = useState(false);

  useEffect(() => {
    if (session.isPending || choose) return;

    let cancelled = false;

    async function finish() {
      if (client.organization === undefined) {
        setError("Workspaces are not available.");
        return;
      }

      try {
        if (invitationId && client.organization.acceptInvitation) {
          const accepted = await client.organization.acceptInvitation({
            invitationId,
          });
          if (accepted.error !== null) {
            setError(accepted.error.message ?? "Could not accept the invite.");
            return;
          }
        }

        const listed = await client.organization.list();
        if (cancelled) return;
        if (listed.error !== null) {
          setError(listed.error.message ?? "Could not load workspaces.");
          return;
        }

        const organizations = listed.data ?? [];
        const activeId = readActiveOrganizationId(session.data);
        const active = organizations.find((org) => org.id === activeId);
        const only = organizations.length === 1 ? organizations[0] : undefined;
        const chosen = active ?? only;

        if (chosen) {
          if (!active && client.organization.setActive) {
            const activated = await client.organization.setActive({
              organizationSlug: chosen.slug,
            });
            if (activated.error !== null) {
              setError(
                activated.error.message ?? "Could not open that workspace.",
              );
              return;
            }
          }
          onReady(chosen);
          return;
        }

        setChoose(true);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not finish sign-up.",
        );
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [choose, client, invitationId, onReady, session.data, session.isPending]);

  if (choose) {
    return <OrganizationChooser onOpen={onReady} onCreated={onReady} />;
  }

  return (
    <AuthCard title="Opening your workspace" description="One moment.">
      <AuthError message={error} />
      {error === null ? (
        <Text as="p" variant="secondary" size="sm">
          Loading…
        </Text>
      ) : null}
    </AuthCard>
  );
}
