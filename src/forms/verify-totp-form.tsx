import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

export interface VerifyTotpFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
  unavailableMessage?: string;
  showTrustDevice?: boolean;
  trustDeviceLabel?: string;
  /** When provided, renders a "use a backup code" toggle (e.g. sign-in 2FA). */
  onUseBackupCode?: () => void;
  backupCodeLabel?: string;
}

/**
 * TOTP verification step, used to finish 2FA enrollment or satisfy a sign-in
 * step-up after the primary password challenge.
 */
export function VerifyTotpForm({
  title = "Two-factor authentication",
  description = "Enter the 6-digit code from your authenticator app.",
  className,
  errorClassName,
  submitLabel = "Verify",
  submittingLabel = "Verifying…",
  unavailableMessage = "Two-factor authentication is not available.",
  showTrustDevice = false,
  trustDeviceLabel = "Trust this device",
  onUseBackupCode,
  backupCodeLabel = "Use a backup code",
  onSuccess,
}: VerifyTotpFormProps) {
  const client = useAuth();

  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAvailable = client.twoFactor?.verifyTotp !== undefined;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = code.trim();
    if (trimmed.length === 0) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    if (client.twoFactor?.verifyTotp === undefined) {
      setError(unavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.twoFactor.verifyTotp({
        code: trimmed,
        trustDevice,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Invalid code.");
        return;
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAvailable) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <AuthError message={unavailableMessage} className={errorClassName} />
      </AuthCard>
    );
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <Input
          label="6-digit code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onValueChange={setCode}
          required
        />

        {showTrustDevice ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(event) => setTrustDevice(event.target.checked)}
            />
            {trustDeviceLabel}
          </label>
        ) : null}

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>

        {onUseBackupCode !== undefined ? (
          <p className="text-center text-sm text-kumo-subtle">
            <button
              type="button"
              onClick={onUseBackupCode}
              className="underline hover:text-kumo-default"
            >
              {backupCodeLabel}
            </button>
          </p>
        ) : null}
      </form>
    </AuthCard>
  );
}
