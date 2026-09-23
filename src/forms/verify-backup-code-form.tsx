import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";

export interface VerifyBackupCodeFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  codeLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  trustDeviceLabel?: string;
  unavailableMessage?: string;
  /** When provided, renders a "use authenticator app" toggle (e.g. sign-in 2FA). */
  onUseTotp?: () => void;
  totpLabel?: string;
  onSuccess?: () => void;
}

/**
 * Form for verifying a two-factor backup code.
 */
export function VerifyBackupCodeForm({
  className,
  errorClassName,
  title = "Use a backup code",
  description = "Enter one of the recovery codes you saved when you enabled two-factor authentication.",
  codeLabel = "Backup code",
  submitLabel = "Verify",
  submittingLabel = "Verifying…",
  trustDeviceLabel = "Trust this device",
  unavailableMessage = "Backup code verification is not available.",
  onUseTotp,
  totpLabel = "Use authenticator app",
  onSuccess,
}: VerifyBackupCodeFormProps) {
  const client = useAuth();

  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (client.twoFactor?.verifyBackupCode === undefined) {
      setError(unavailableMessage);
      return;
    }

    if (code.length === 0) {
      setError("Enter a backup code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.twoFactor.verifyBackupCode({
        code,
        trustDevice,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not verify backup code.");
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not verify backup code.",
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
          label={codeLabel}
          value={code}
          onValueChange={setCode}
          autoComplete="off"
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(event) => setTrustDevice(event.target.checked)}
          />
          {trustDeviceLabel}
        </label>

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>

        {onUseTotp !== undefined ? (
          <p className="text-center text-sm text-kumo-subtle">
            <button
              type="button"
              onClick={onUseTotp}
              className="underline hover:text-kumo-default"
            >
              {totpLabel}
            </button>
          </p>
        ) : null}
      </form>
    </AuthCard>
  );
}
