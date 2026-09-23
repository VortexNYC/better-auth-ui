import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Link } from "@cloudflare/kumo/components/link";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export interface ForgotPasswordFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  /**
   * Better Auth `redirectTo` for the emailed reset link. Defaults to
   * `${window.location.origin}/reset-password` in the browser.
   */
  resetPasswordUrl?: string;
  signInUrl?: string;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
}

/**
 * Forgot password form built on Kumo UI.
 */
export function ForgotPasswordForm({
  title = "Forgot password",
  description = "Enter your email and we'll send you a reset link.",
  resetPasswordUrl,
  signInUrl,
  className,
  errorClassName,
  submitLabel = "Send reset link",
  submittingLabel = "Sending...",
  successMessage = "Check your email for a reset link.",
  onSuccess,
}: ForgotPasswordFormProps) {
  const client = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<ForgotPasswordValues>>(
    {},
  );
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({ email: flattened.email?.[0] });
      return;
    }

    setIsSubmitting(true);

    if (client.requestPasswordReset === undefined) {
      setError("Password recovery is not available.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await client.requestPasswordReset({
        email: validation.data.email,
        redirectTo:
          resetPasswordUrl ??
          (typeof window === "undefined"
            ? undefined
            : `${window.location.origin}/reset-password`),
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Request failed.");
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {success ? (
          <p className="text-center text-sm text-kumo-subtle">
            {successMessage}
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

            <AuthSubmitButton loading={isSubmitting} className="w-full">
              {isSubmitting ? submittingLabel : submitLabel}
            </AuthSubmitButton>
          </>
        )}

        {signInUrl ? (
          <p className="text-center text-sm text-kumo-subtle">
            Remember your password?{" "}
            <Link href={signInUrl} variant="inline">
              Sign in
            </Link>
          </p>
        ) : null}
      </form>
    </AuthCard>
  );
}
