import { useEffect, useState } from "react";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

type VerifyStatus = "idle" | "verifying" | "verified" | "error";

export interface MagicLinkVerifyProps extends AuthFormBaseProps {
  token?: string;
  callbackURL?: string;
  title?: string;
  description?: string;
  verifyingMessage?: string;
  verifiedMessage?: string;
  missingTokenMessage?: string;
  unavailableMessage?: string;
}

/**
 * Screen that verifies a magic-link token on mount.
 *
 * The user lands here from the magic-link email (token in `?token=…`).
 * On success it optionally redirects to `callbackURL` and calls `onSuccess`.
 */
export function MagicLinkVerify({
  token,
  callbackURL,
  title = "Sign in",
  description = "Verifying your magic link…",
  className,
  errorClassName,
  verifyingMessage = "Verifying your magic link…",
  verifiedMessage = "You are signed in.",
  missingTokenMessage = "This sign-in link is missing or invalid.",
  unavailableMessage = "Magic link verification is not available.",
  onSuccess,
}: MagicLinkVerifyProps) {
  const client = useAuth();
  const resolvedMissingMessage =
    missingTokenMessage ?? "This sign-in link is missing or invalid.";
  const resolvedUnavailableMessage =
    unavailableMessage ?? "Magic link verification is not available.";

  const [status, setStatus] = useState<VerifyStatus>(
    token ? "verifying" : "error",
  );
  const [error, setError] = useState<string | null>(
    token ? null : resolvedMissingMessage,
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError(resolvedMissingMessage);
      return;
    }

    if (client.magicLink?.verify === undefined) {
      setStatus("error");
      setError(resolvedUnavailableMessage);
      return;
    }

    const verificationToken = token;
    let cancelled = false;

    async function verify() {
      const response = await client.magicLink!.verify({
        token: verificationToken,
        callbackURL,
      });

      if (cancelled) return;

      if (response.error !== null) {
        setStatus("error");
        setError(response.error.message ?? "Sign-in failed.");
        return;
      }

      setStatus("verified");
      onSuccess?.();

      if (typeof window !== "undefined" && callbackURL) {
        window.location.assign(callbackURL);
      }
    }

    verify().catch((err: unknown) => {
      if (cancelled) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    });

    return () => {
      cancelled = true;
    };
  }, [
    token,
    callbackURL,
    client,
    onSuccess,
    resolvedMissingMessage,
    resolvedUnavailableMessage,
  ]);

  return (
    <AuthCard className={className} title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {status === "verifying" ? (
          <p className="text-center text-sm text-kumo-subtle">
            {verifyingMessage}
          </p>
        ) : null}

        {status === "verified" ? (
          <p className="text-center text-sm text-kumo-subtle">
            {verifiedMessage}
          </p>
        ) : null}
      </div>
    </AuthCard>
  );
}
