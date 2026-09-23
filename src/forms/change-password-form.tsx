import { useState } from "react";
import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { Input } from "@cloudflare/kumo/components/input";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";

export interface ChangePasswordFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  currentPasswordLabel?: string;
  newPasswordLabel?: string;
  confirmPasswordLabel?: string;
  revokeOtherSessionsLabel?: string;
  /**
   * Client-side minimum password length. Should mirror the Better Auth
   * `emailAndPassword.minPasswordLength` configured on the server.
   */
  minPasswordLength?: number;
  submitLabel?: string;
  submittingLabel?: string;
  unavailableMessage?: string;
  onSuccess?: () => void;
}

/**
 * Form for changing the current user's password via Better Auth.
 */
export function ChangePasswordForm({
  className,
  errorClassName,
  title = "Change password",
  description = "Update the password for this account.",
  currentPasswordLabel = "Current password",
  newPasswordLabel = "New password",
  confirmPasswordLabel = "Confirm new password",
  revokeOtherSessionsLabel = "Sign out other sessions",
  minPasswordLength = 8,
  submitLabel = "Update password",
  submittingLabel = "Updating…",
  unavailableMessage = "Password change is not available.",
  onSuccess,
}: ChangePasswordFormProps) {
  const client = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters.`);
      return;
    }

    if (client.changePassword === undefined) {
      setError(unavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not change password.");
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onSuccess?.();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not change password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <Input
          label={currentPasswordLabel}
          type="password"
          value={currentPassword}
          onValueChange={setCurrentPassword}
          autoComplete="current-password"
          required
        />

        <Input
          label={newPasswordLabel}
          type="password"
          value={newPassword}
          onValueChange={setNewPassword}
          autoComplete="new-password"
          required
        />

        <Input
          label={confirmPasswordLabel}
          type="password"
          value={confirmPassword}
          onValueChange={setConfirmPassword}
          autoComplete="new-password"
          required
        />

        <Checkbox
          label={revokeOtherSessionsLabel}
          checked={revokeOtherSessions}
          onCheckedChange={(checked) =>
            setRevokeOtherSessions(checked === true)
          }
        />

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
