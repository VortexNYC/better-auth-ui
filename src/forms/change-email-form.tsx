import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ChangeEmailValues = z.infer<typeof emailSchema>;

export interface ChangeEmailFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  emailLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
  unavailableMessage?: string;
  callbackURL?: string;
  onSuccess?: () => void;
}

/**
 * Form for changing the current user's email address via Better Auth.
 *
 * When email verification is required, Better Auth will send a confirmation link
 * to the new address using `callbackURL` as the redirect target.
 */
export function ChangeEmailForm({
  className,
  errorClassName,
  title = "Change email",
  description = "Update the email address for this account.",
  emailLabel = "New email",
  submitLabel = "Send verification",
  submittingLabel = "Sending…",
  successMessage = "Check your new email address for a verification link.",
  unavailableMessage = "Email change is not available.",
  callbackURL,
  onSuccess,
}: ChangeEmailFormProps) {
  const client = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.flatten().fieldErrors.email?.[0] ?? "");
      return;
    }

    if (client.changeEmail === undefined) {
      setError(unavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.changeEmail({
        newEmail: validation.data.email,
        callbackURL,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not change email.");
      } else {
        setSuccess(true);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {success ? (
          <Text variant="secondary">{successMessage}</Text>
        ) : (
          <>
            <Input
              label={emailLabel}
              type="email"
              value={email}
              onValueChange={setEmail}
              placeholder="ada@example.com"
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
