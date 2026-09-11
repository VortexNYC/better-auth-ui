import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import { extractTotpSecret } from "../lib/totp";
import type { AuthFormBaseProps } from "../types";

type Step = "password" | "verify" | "backup";

export interface EnableTwoFactorFormProps extends AuthFormBaseProps {
  issuer?: string;
  qrCode?: (totpURI: string) => ReactNode;
  title?: string;
  description?: string;
  passwordLabel?: string;
  codeLabel?: string;
  secretLabel?: string;
  verifyTitle?: string;
  verifyDescription?: string;
  backupTitle?: string;
  backupDescription?: string;
  submitLabel?: string;
  verifyLabel?: string;
  doneLabel?: string;
  submittingLabel?: string;
  verifyingLabel?: string;
  unavailableMessage?: string;
}

/**
 * TOTP enrollment flow built on Kumo UI.
 *
 * Three steps:
 * 1. Re-authenticate with password and call `twoFactor.enable`.
 * 2. Display the TOTP secret / optional QR code and collect a 6-digit code.
 * 3. Confirm enrollment and show one-time backup codes.
 *
 * The component deliberately does not bundle a QR library. Pass `qrCode` to
 * render a QR code from the `otpauth://` URI (e.g. with `react-qr-code`).
 */
export function EnableTwoFactorForm({
  issuer,
  qrCode,
  title = "Enable two-factor authentication",
  description = "Add an authenticator app for an extra layer of security.",
  className,
  errorClassName,
  passwordLabel = "Confirm your password",
  codeLabel = "6-digit code",
  secretLabel = "Setup key",
  verifyTitle = "Scan the QR code",
  verifyDescription = "Scan the code with your authenticator app, or enter the setup key manually, then enter the 6-digit code.",
  backupTitle = "Save your backup codes",
  backupDescription = "Store these somewhere safe. Each code works once if you lose access to your authenticator. They won't be shown again.",
  submitLabel = "Continue",
  verifyLabel = "Verify & enable",
  doneLabel = "Done",
  submittingLabel = "Working…",
  verifyingLabel = "Verifying…",
  unavailableMessage = "Two-factor authentication is not available.",
  onSuccess,
}: EnableTwoFactorFormProps) {
  const client = useAuth();

  const isAvailable = client.twoFactor?.enable !== undefined;

  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const secret = useMemo(
    () => (totpURI === null ? null : extractTotpSecret(totpURI)),
    [totpURI],
  );

  const header = useMemo(() => {
    if (step === "backup") {
      return { title: backupTitle, description: backupDescription };
    }
    if (step === "verify") {
      return { title: verifyTitle, description: verifyDescription };
    }
    return { title, description };
  }, [
    step,
    title,
    description,
    verifyTitle,
    verifyDescription,
    backupTitle,
    backupDescription,
  ]);

  async function handleEnable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length === 0) {
      setError("Password is required.");
      return;
    }

    if (client.twoFactor?.enable === undefined) {
      setError(unavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.twoFactor.enable({ password, issuer });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not enable two-factor.");
        return;
      }

      setTotpURI(response.data?.totpURI ?? null);
      setBackupCodes(response.data?.backupCodes ?? []);
      setStep("verify");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not enable two-factor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
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
      const response = await client.twoFactor.verifyTotp({ code: trimmed });

      if (response.error !== null) {
        setError(response.error.message ?? "Invalid code.");
        return;
      }

      setStep("backup");
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
    <AuthCard
      className={className}
      title={header.title}
      description={header.description}
    >
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {step === "password" ? (
          <form onSubmit={handleEnable} className="space-y-4">
            <Input
              label={passwordLabel}
              type="password"
              value={password}
              onValueChange={setPassword}
              autoComplete="current-password"
              required
            />
            <AuthSubmitButton loading={isSubmitting} className="w-full">
              {isSubmitting ? submittingLabel : submitLabel}
            </AuthSubmitButton>
          </form>
        ) : null}

        {step === "verify" ? (
          <form onSubmit={handleVerify} className="space-y-4">
            {totpURI !== null && qrCode !== undefined ? (
              <div className="flex justify-center">{qrCode(totpURI)}</div>
            ) : null}

            {secret !== null ? (
              <Input
                label={secretLabel}
                value={secret}
                readOnly
                onValueChange={() => {}}
              />
            ) : null}

            <Input
              label={codeLabel}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onValueChange={setCode}
              required
            />

            <AuthSubmitButton loading={isSubmitting} className="w-full">
              {isSubmitting ? verifyingLabel : verifyLabel}
            </AuthSubmitButton>
          </form>
        ) : null}

        {step === "backup" ? (
          <div className="space-y-4">
            <ul className="grid grid-cols-2 gap-2">
              {backupCodes.map((backupCode) => (
                <li key={backupCode}>
                  <Text
                    as="code"
                    variant="mono"
                    DANGEROUS_className="break-all"
                  >
                    {backupCode}
                  </Text>
                </li>
              ))}
            </ul>
            <AuthSubmitButton
              type="button"
              className="w-full"
              onClick={() => onSuccess?.()}
            >
              {doneLabel}
            </AuthSubmitButton>
          </div>
        ) : null}
      </div>
    </AuthCard>
  );
}
