import { useEffect, useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const sendEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SendEmailValues = z.infer<typeof sendEmailSchema>;

type VerifyStatus = "idle" | "verifying" | "verified" | "error";

export interface VerifyEmailFormProps extends AuthFormBaseProps {
  token?: string;
  userEmail?: string | null;
  callbackUrl?: string;
  title?: string;
  description?: string;
  verifiedMessage?: string;
  sendLabel?: string;
  sendingLabel?: string;
}

/**
 * Email verification screen built on Kumo UI.
 *
 * If `token` is provided, the form attempts to verify it automatically on
 * mount. If no token is provided, it offers a send-verification-email flow.
 */
export function VerifyEmailForm({
  token,
  userEmail,
  callbackUrl,
  title = "Verify your email",
  description = "Confirm your email address to continue.",
  className,
  errorClassName,
  verifiedMessage = "Your email has been verified.",
  sendLabel = "Send verification email",
  sendingLabel = "Sending...",
  onSuccess,
}: VerifyEmailFormProps) {
  const client = useAuth();

  const [status, setStatus] = useState<VerifyStatus>(
    token ? "verifying" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState(userEmail ?? "");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<SendEmailValues>>({});

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

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(null);
    setSendSuccess(false);
    setFieldErrors({});

    const validation = sendEmailSchema.safeParse({ email });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({ email: flattened.email?.[0] });
      return;
    }

    if (client.sendVerificationEmail === undefined) {
      setSendError("Sending verification email is not available.");
      return;
    }

    setIsSending(true);

    try {
      const response = await client.sendVerificationEmail({
        email: validation.data.email,
        callbackURL: callbackUrl,
      });

      if (response.error !== null) {
        setSendError(response.error.message ?? "Could not send email.");
        return;
      }

      setSendSuccess(true);
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Could not send email.",
      );
    } finally {
      setIsSending(false);
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
          <form onSubmit={handleSend} className="space-y-4">
            <AuthError message={sendError} className={errorClassName} />

            {sendSuccess ? (
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

                <AuthSubmitButton loading={isSending} className="w-full">
                  {isSending ? sendingLabel : sendLabel}
                </AuthSubmitButton>
              </>
            )}
          </form>
        ) : null}
      </div>
    </AuthCard>
  );
}
