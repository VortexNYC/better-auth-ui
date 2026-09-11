import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";

export interface AcceptInviteScreenProps {
  token: string;
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  successMessage?: string;
  unavailableMessage?: string;
  onSuccess?: () => void;
  onSignIn?: () => void;
  signInLabel?: string;
}

type InviteStatus = "idle" | "accepting" | "accepted" | "error";

/**
 * Screen that accepts a Better Auth organization invitation.
 *
 * If no session exists, `onSignIn` is called so the consumer can redirect to
 * sign-in. On a successful accept, `onSuccess` is invoked.
 */
export function AcceptInviteScreen({
  token,
  className,
  errorClassName,
  title = "Accept invitation",
  description = "Join the workspace you were invited to.",
  successMessage = "You're now a member of the workspace.",
  unavailableMessage = "Invitation acceptance is not available.",
  onSuccess,
  onSignIn,
  signInLabel = "Sign in to accept",
}: AcceptInviteScreenProps) {
  const client = useAuth();
  const session = client.useSession?.();

  const [status, setStatus] = useState<InviteStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.isPending) return;

    if (!session?.data?.user) {
      return;
    }

    if (client.organization?.acceptInvitation === undefined) {
      setError(unavailableMessage);
      setStatus("error");
      return;
    }

    let cancelled = false;

    async function accept() {
      setStatus("accepting");
      setError(null);

      try {
        const response = await client.organization!.acceptInvitation({
          invitationId: token,
        });

        if (cancelled) return;

        if (response.error !== null) {
          setError(response.error.message ?? "Could not accept invitation.");
          setStatus("error");
          return;
        }

        setStatus("accepted");
        onSuccess?.();
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not accept invitation.",
        );
        setStatus("error");
      }
    }

    void accept();

    return () => {
      cancelled = true;
    };
  }, [token, client, session, onSuccess, unavailableMessage]);

  if (session?.isPending ?? true) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <Text variant="secondary">Loading…</Text>
      </AuthCard>
    );
  }

  if (!session?.data?.user) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <AuthError
          message="Sign in or create an account to accept this invitation."
          className={errorClassName}
        />
        {onSignIn ? (
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={onSignIn}
          >
            {signInLabel}
          </Button>
        ) : null}
      </AuthCard>
    );
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {status === "accepted" ? (
          <Text variant="secondary">{successMessage}</Text>
        ) : (
          <Text variant="secondary">
            {status === "accepting"
              ? "Accepting your invitation…"
              : "Ready to accept."}
          </Text>
        )}
      </div>
    </AuthCard>
  );
}
