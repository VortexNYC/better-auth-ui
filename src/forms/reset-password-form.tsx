import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Link } from "@cloudflare/kumo/components/link";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const createResetPasswordSchema = (minPasswordLength: number) =>
  z
    .object({
      password: z
        .string()
        .min(
          minPasswordLength,
          `Password must be at least ${minPasswordLength} characters`,
        ),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

type ResetPasswordValues = {
  password?: string;
  confirmPassword?: string;
};

export interface ResetPasswordFormProps extends AuthFormBaseProps {
  /**
   * Better Auth reset token. When omitted, the form parses
   * `window.location.search` itself — Better Auth lands users on the
   * `redirectTo` URL with either `?token=` (valid) or `?error=INVALID_TOKEN`.
   */
  token?: string;
  title?: string;
  description?: string;
  /**
   * Client-side minimum password length. Should mirror the Better Auth
   * `emailAndPassword.minPasswordLength` configured on the server.
   */
  minPasswordLength?: number;
  /** Link target for the invalid/expired-link state (e.g. "/forgot-password"). */
  forgotPasswordHref?: string;
  /** Link target shown after a successful reset (e.g. "/sign-in"). */
  signInUrl?: string;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
  invalidTokenMessage?: string;
}

/**
 * Parses the Better Auth reset redirect: `?token=` marks a valid link,
 * `?error=` (e.g. INVALID_TOKEN) or a missing token marks an invalid one.
 */
export function readResetPasswordSearch(search: string): {
  token: string | null;
  invalid: boolean;
} {
  const params = new URLSearchParams(search);
  if (params.get("error") !== null) {
    return { token: null, invalid: true };
  }
  const token = params.get("token");
  return { token: token === null || token.length === 0 ? null : token, invalid: false };
}

/**
 * Password reset completion form built on Kumo UI.
 */
export function ResetPasswordForm({
  token,
  title = "Reset password",
  description = "Choose a new password for your account.",
  minPasswordLength = 8,
  forgotPasswordHref,
  signInUrl,
  className,
  errorClassName,
  submitLabel = "Reset password",
  submittingLabel = "Resetting...",
  successMessage = "Password updated. You can now sign in.",
  invalidTokenMessage = "This reset link is invalid or has expired.",
  onSuccess,
}: ResetPasswordFormProps) {
  const client = useAuth();

  const resolved =
    token !== undefined
      ? { token, invalid: false }
      : typeof window === "undefined"
        ? { token: null, invalid: false }
        : readResetPasswordSearch(window.location.search);
  const linkInvalid = resolved.invalid || resolved.token === null;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<ResetPasswordValues>>(
    {},
  );
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    const validation = createResetPasswordSchema(minPasswordLength).safeParse({
      password,
      confirmPassword,
    });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      });
      return;
    }

    if (client.resetPassword === undefined) {
      setError("Password reset is not available.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.resetPassword({
        newPassword: validation.data.password,
        token: resolved.token ?? "",
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Password reset failed.");
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {linkInvalid ? (
          <>
            <p className="text-center text-sm text-kumo-subtle">
              {invalidTokenMessage}
            </p>
            {forgotPasswordHref ? (
              <p className="text-center text-sm text-kumo-subtle">
                <Link href={forgotPasswordHref} variant="inline">
                  Request a new reset link
                </Link>
              </p>
            ) : null}
          </>
        ) : success ? (
          <>
            <p className="text-center text-sm text-kumo-subtle">
              {successMessage}
            </p>
            {signInUrl ? (
              <p className="text-center text-sm text-kumo-subtle">
                <Link href={signInUrl} variant="inline">
                  Sign in
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <Input
              label="New password"
              type="password"
              value={password}
              onValueChange={setPassword}
              error={fieldErrors.password}
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onValueChange={setConfirmPassword}
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
              required
            />

            <AuthSubmitButton loading={isSubmitting} className="w-full">
              {isSubmitting ? submittingLabel : submitLabel}
            </AuthSubmitButton>
          </>
        )}
      </form>
    </AuthCard>
  );
}
