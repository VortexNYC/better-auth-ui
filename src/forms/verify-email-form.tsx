import { useEffect, useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const resendSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResendValues = z.infer<typeof resendSchema>;

type VerifyStatus = "idle" | "verifying" | "verified" | "error";

export interface VerifyEmailFormProps extends AuthFormBaseProps {
  token?: string;
  userEmail?: string | null;
  resendCallbackUrl?: string;
  title?: string;
  description?: string;
  verifiedMessage?: string;
  resendLabel?: string;
  resendingLabel?: string;
}

/**
 * Email verification screen built on Kumo UI.
 *
 * If `token` is provided, the form attempts to verify it automatically on
 * mount. If no token is provided, it offers a resend-verification-email flow.
 */
export function VerifyEmailForm({
  token,
  userEmail,
  resendCallbackUrl,
  title = "Verify your email",
  description = "Confirm your email address to continue.",
  className,
  errorClassName,
  verifiedMessage = "Your email has been verified.",
  resendLabel = "Resend verification email",
  resendingLabel = "Sending...",
  onSuccess,
}: VerifyEmailFormProps) {
  const client = useAuth();

  const [status, setStatus] = useState<VerifyStatus>(
    token ? "verifying" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState(userEmail ?? "");
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<ResendValues>>({});

  useEffect(() => {
    if (!token) {
      return;
    }

    if (client.verifyEmail === undefined) {
      setStatus("error");
      setError("Email verification is not available.");
      return;
    }

    const verificationToken = token;
    let cancelled = false;

    async function verify() {
      const response = await client.verifyEmail!({
        query: { token: verificationToken },
      });

      if (cancelled) return;

      if (response.error !== null) {
        setStatus("error");
        setError(response.error.message ?? "Verification failed.");
        return;
      }

      setStatus("verified");
      onSuccess?.();
    }

    verify().catch((err: unknown) => {
      if (cancelled) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Verification failed.");
    });

    return () => {
      cancelled = true;
    };
  }, [token, client, onSuccess]);

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendError(null);
    setResendSuccess(false);
    setFieldErrors({});

    const validation = resendSchema.safeParse({ email });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({ email: flattened.email?.[0] });
      return;
    }

    if (client.sendVerificationEmail === undefined) {
      setResendError("Resend is not available.");
      return;
    }

    setIsResending(true);

    try {
      const response = await client.sendVerificationEmail({
        email: validation.data.email,
        callbackURL: resendCallbackUrl,
      });

      if (response.error !== null) {
        setResendError(response.error.message ?? "Resend failed.");
        return;
      }

      setResendSuccess(true);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Resend failed.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {status === "verifying" ? (
          <p className="text-center text-sm text-kumo-subtle">
            Verifying your email…
          </p>
        ) : null}

        {status === "verified" ? (
          <p className="text-center text-sm text-kumo-subtle">
            {verifiedMessage}
          </p>
        ) : null}

        {status === "error" || !token ? (
          <form onSubmit={handleResend} className="space-y-4">
            <AuthError message={resendError} className={errorClassName} />

            {resendSuccess ? (
              <p className="text-center text-sm text-kumo-subtle">
                Check your inbox for a new verification link.
              </p>
            ) : (
              <>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                  error={fieldErrors.email}
                  autoComplete="email"
                  required
                />

                <AuthSubmitButton loading={isResending} className="w-full">
                  {isResending ? resendingLabel : resendLabel}
                </AuthSubmitButton>
              </>
            )}
          </form>
        ) : null}
      </div>
    </AuthCard>
  );
}
