import { useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";

export interface GenerateBackupCodesFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  passwordLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  doneLabel?: string;
  savedWarning?: string;
  unavailableMessage?: string;
  onSuccess?: (codes: string[]) => void;
}

/**
 * Form for generating new two-factor backup codes.
 */
export function GenerateBackupCodesForm({
  className,
  errorClassName,
  title = "Regenerate backup codes",
  description = "Generate a fresh set of recovery codes. Any old codes will stop working.",
  passwordLabel = "Password (if required)",
  submitLabel = "Generate codes",
  submittingLabel = "Generating…",
  doneLabel = "Done",
  savedWarning = "Save these somewhere safe. They won't be shown again.",
  unavailableMessage = "Backup code generation is not available.",
  onSuccess,
}: GenerateBackupCodesFormProps) {
  const client = useAuth();

  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCodes(null);

    if (client.twoFactor?.generateBackupCodes === undefined) {
      setError(unavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.twoFactor.generateBackupCodes({
        password,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not generate backup codes.");
      } else {
        const backupCodes = response.data?.backupCodes ?? [];
        setCodes(backupCodes);
        onSuccess?.(backupCodes);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate backup codes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      {codes !== null ? (
        <div className="space-y-4">
          <Text variant="secondary" size="sm">
            {savedWarning}
          </Text>

          <ul className="grid grid-cols-2 gap-2">
            {codes.map((code) => (
              <li key={code}>
                <Text as="code" variant="mono" DANGEROUS_className="break-all">
                  {code}
                </Text>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setCodes(null)}
          >
            {doneLabel}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthError message={error} className={errorClassName} />

          <Input
            label={passwordLabel}
            type="password"
            value={password}
            onValueChange={setPassword}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isSubmitting}
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
