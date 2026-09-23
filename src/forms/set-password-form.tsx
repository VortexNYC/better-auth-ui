import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const createSetPasswordSchema = (minPasswordLength: number) =>
  z
    .object({
      newPassword: z
        .string()
        .min(
          minPasswordLength,
          `Password must be at least ${minPasswordLength} characters`,
        ),
      confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

type SetPasswordValues = {
  newPassword?: string;
  confirmPassword?: string;
};

export interface SetPasswordFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  passwordLabel?: string;
  confirmLabel?: string;
  /**
   * Client-side minimum password length. Should mirror the Better Auth
   * `emailAndPassword.minPasswordLength` configured on the server.
   */
  minPasswordLength?: number;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
  unavailableMessage?: string;
}

/**
 * Form for setting a password on accounts that signed up without one
 * (e.g. via OAuth).
 */
export function SetPasswordForm({
  title = "Set password",
  description = "Create a password so you can sign in with your email next time.",
  minPasswordLength = 8,
  className,
  errorClassName,
  passwordLabel = "New password",
  confirmLabel = "Confirm password",
  submitLabel = "Set password",
  submittingLabel = "Saving…",
  successMessage = "Your password has been set.",
  unavailableMessage = "Setting a password is not available.",
  onSuccess,
}: SetPasswordFormProps) {
  const client = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<SetPasswordValues>>(
    {},
  );

  if (client.setPassword === undefined) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <AuthError message={unavailableMessage} className={errorClassName} />
      </AuthCard>
    );
  }

  const setPassword = client.setPassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    const validation = createSetPasswordSchema(minPasswordLength).safeParse({
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({
        newPassword: flattened.newPassword?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await setPassword({
        newPassword: validation.data.newPassword,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not set password.");
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <p className="text-center text-sm text-kumo-subtle">{successMessage}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <Input
          label={passwordLabel}
          type="password"
          value={newPassword}
          onValueChange={setNewPassword}
          error={fieldErrors.newPassword}
          autoComplete="new-password"
          required
        />

        <Input
          label={confirmLabel}
          type="password"
          value={confirmPassword}
          onValueChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <AuthSubmitButton
          loading={isSubmitting}
          className="w-full"
          shape="base"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
