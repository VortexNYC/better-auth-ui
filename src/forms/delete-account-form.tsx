import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password"),
});

type DeleteAccountFieldErrors = {
  password?: string;
  confirm?: string;
};

export interface DeleteAccountFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  passwordLabel?: string;
  confirmationLabel?: string;
  confirmationPlaceholder?: string;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
  unavailableMessage?: string;
  mismatchMessage?: string;
  onSuccess?: () => void;
}

/**
 * Destructive form for deleting the current account.
 *
 * Requires the user to type "delete my account" before submitting.
 */
export function DeleteAccountForm({
  title = "Delete account",
  description = "This action cannot be undone. To confirm, type delete my account below and enter your password.",
  className,
  errorClassName,
  passwordLabel = "Password",
  confirmationLabel = "Confirm deletion",
  confirmationPlaceholder = "delete my account",
  submitLabel = "Delete account",
  submittingLabel = "Deleting…",
  successMessage = "Your account has been deleted.",
  unavailableMessage = "Account deletion is not available.",
  mismatchMessage = "Type the exact phrase to confirm.",
  onSuccess,
}: DeleteAccountFormProps) {
  const client = useAuth();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<DeleteAccountFieldErrors>({});

  if (client.deleteUser === undefined) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <AuthError message={unavailableMessage} className={errorClassName} />
      </AuthCard>
    );
  }

  const deleteUser = client.deleteUser;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    if (confirmation !== "delete my account") {
      setFieldErrors({ confirm: mismatchMessage });
      return;
    }

    const validation = deleteAccountSchema.safeParse({ password });

    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({
        password: flattened.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await deleteUser({
        password: validation.data.password,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not delete account.");
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete account.",
      );
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
          value={password}
          onValueChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
        />

        <Input
          label={confirmationLabel}
          value={confirmation}
          onValueChange={setConfirmation}
          placeholder={confirmationPlaceholder}
          error={fieldErrors.confirm}
          required
        />

        <AuthSubmitButton
          loading={isSubmitting}
          className="w-full"
          variant="destructive"
          shape="base"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
