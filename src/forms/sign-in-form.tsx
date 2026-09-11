import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Link } from "@cloudflare/kumo/components/link";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

export interface SignInFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  redirectTo?: string;
  forgotPasswordHref?: string;
  signUpUrl?: string;
  submitLabel?: string;
  submittingLabel?: string;
}

/**
 * Email/password sign-in form built on Kumo UI.
 *
 * Reads the typed Better Auth client from `AuthProvider`, validates input with
 * Zod, and calls `client.signIn.email`.
 */
export function SignInForm({
  title = "Sign in",
  description = "Access your workspace.",
  redirectTo,
  forgotPasswordHref,
  signUpUrl,
  className,
  errorClassName,
  submitLabel = "Sign in",
  submittingLabel = "Signing in...",
  onSuccess,
}: SignInFormProps) {
  const client = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<SignInValues>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.signIn.email({
        email: validation.data.email,
        password: validation.data.password,
        callbackURL: redirectTo,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Sign-in failed.");
        return;
      }

      if (
        response.data &&
        "twoFactorRedirect" in response.data &&
        response.data.twoFactorRedirect === true
      ) {
        // Two-factor is handled by a separate form surface. Surface a message
        // so callers know to redirect or render the TOTP step.
        setError("Two-factor authentication required.");
        return;
      }

      onSuccess?.();

      if (typeof window !== "undefined" && redirectTo) {
        window.location.assign(redirectTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <Input
          label="Email"
          type="email"
          value={email}
          onValueChange={setEmail}
          error={fieldErrors.email}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onValueChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
        />

        {forgotPasswordHref ? (
          <div className="flex justify-end">
            <Link href={forgotPasswordHref} variant="plain" className="text-sm">
              Forgot password?
            </Link>
          </div>
        ) : null}

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>

        {signUpUrl ? (
          <p className="text-center text-sm text-kumo-subtle">
            Don&apos;t have an account?{" "}
            <Link href={signUpUrl} variant="inline">
              Sign up
            </Link>
          </p>
        ) : null}
      </form>
    </AuthCard>
  );
}
