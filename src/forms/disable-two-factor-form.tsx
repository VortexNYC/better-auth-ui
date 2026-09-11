import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";

export interface DisableTwoFactorFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  passwordLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  unavailableMessage?: string;
  onSuccess?: () => void;
}

/**
 * Form for disabling two-factor authentication.
 */
export function DisableTwoFactorForm({
  className,
  errorClassName,
  title = "Disable two-factor authentication",
  description = "Confirm your password to turn off 2FA.",
  passwordLabel = "Password",
  submitLabel = "Disable 2FA",
  submittingLabel = "Disabling…",
  unavailableMessage = "Two-factor authentication is not available.",
  onSuccess,
}: DisableTwoFactorFormProps) {
  const client = useAuth();

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (client.twoFactor?.disable === undefined) {
      setError(unavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.twoFactor.disable({ password });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not disable 2FA.");
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable 2FA.");
    } finally {
      setIsSubmitting(false);
    }
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
          autoComplete="current-password"
        />

        <AuthSubmitButton
          loading={isSubmitting}
          className="w-full"
          variant="destructive"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
