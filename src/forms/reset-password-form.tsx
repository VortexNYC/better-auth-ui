import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
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
  token: string;
  title?: string;
  description?: string;
  /**
   * Client-side minimum password length. Should mirror the Better Auth
   * `emailAndPassword.minPasswordLength` configured on the server.
   */
  minPasswordLength?: number;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
}

/**
 * Password reset completion form built on Kumo UI.
 */
export function ResetPasswordForm({
  token,
  title = "Reset password",
  description = "Choose a new password for your account.",
  minPasswordLength = 8,
  className,
  errorClassName,
  submitLabel = "Reset password",
  submittingLabel = "Resetting...",
  successMessage = "Password updated. You can now sign in.",
  onSuccess,
}: ResetPasswordFormProps) {
  const client = useAuth();

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
        token,
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

        {success ? (
          <p className="text-center text-sm text-kumo-subtle">
            {successMessage}
          </p>
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
