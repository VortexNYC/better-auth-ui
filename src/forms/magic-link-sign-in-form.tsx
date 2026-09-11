import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type MagicLinkValues = z.infer<typeof magicLinkSchema>;

export interface MagicLinkSignInFormProps extends AuthFormBaseProps {
  redirectTo?: string;
  title?: string;
  description?: string;
  emailLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
  unavailableMessage?: string;
}

/**
 * Form for signing in with a magic link.
 *
 * Requires the Better Auth `magicLink` plugin. After submission the user
 * receives an email with a sign-in link.
 */
export function MagicLinkSignInForm({
  redirectTo,
  title = "Sign in with magic link",
  description = "Enter your email and we'll send you a sign-in link.",
  className,
  errorClassName,
  emailLabel = "Email",
  submitLabel = "Send magic link",
  submittingLabel = "Sending…",
  successMessage = "Check your email for a sign-in link.",
  unavailableMessage = "Magic link sign-in is not available.",
}: MagicLinkSignInFormProps) {
  const client = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<MagicLinkValues>>({});

  if (client.signIn?.magicLink === undefined) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <AuthError message={unavailableMessage} className={errorClassName} />
      </AuthCard>
    );
  }

  const signInMagicLink = client.signIn.magicLink;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    const validation = magicLinkSchema.safeParse({ email });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({ email: flattened.email?.[0] });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signInMagicLink({
        email: validation.data.email,
        callbackURL: redirectTo,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not send magic link.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send magic link.",
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
          label={emailLabel}
          type="email"
          value={email}
          onValueChange={setEmail}
          error={fieldErrors.email}
          autoComplete="email"
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
