import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Link } from "@cloudflare/kumo/components/link";
import { z } from "zod";

import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthProviderButtons,
  AuthSubmitButton,
  type AuthProviderOption,
} from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthFormBaseProps } from "../types";

const createSignUpSchema = (minPasswordLength: number) =>
  z
    .object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Please enter a valid email address"),
      password: z
        .string()
        .min(
          minPasswordLength,
          `Password must be at least ${minPasswordLength} characters`,
        ),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

type SignUpValues = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export interface SignUpFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  redirectTo?: string;
  signInUrl?: string;
  /**
   * Client-side minimum password length. Should mirror the Better Auth
   * `emailAndPassword.minPasswordLength` configured on the server.
   */
  minPasswordLength?: number;
  submitLabel?: string;
  submittingLabel?: string;
  providers?: readonly AuthProviderOption[];
  onProviderSelect?: (providerId: string) => void | Promise<void>;
  dividerLabel?: string;
}

/**
 * Email/password sign-up form built on Kumo UI.
 */
export function SignUpForm({
  title = "Create account",
  description = "Get started with your workspace.",
  redirectTo,
  signInUrl,
  minPasswordLength = 8,
  className,
  errorClassName,
  submitLabel = "Create account",
  submittingLabel = "Creating account...",
  providers,
  onProviderSelect,
  dividerLabel = "or",
  onSuccess,
}: SignUpFormProps) {
  const client = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<SignUpValues>>({});

  async function handleProviderSelect(providerId: string) {
    if (onProviderSelect) {
      await onProviderSelect(providerId);
      return;
    }

    setError(null);

    if (client.signIn.social === undefined) {
      setError("Social sign-up is not available.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.signIn.social({
        provider: providerId,
        callbackURL: redirectTo,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Social sign-up failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Social sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = createSignUpSchema(minPasswordLength).safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.signUp.email({
        name: validation.data.name,
        email: validation.data.email,
        password: validation.data.password,
        callbackURL: redirectTo,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Sign-up failed.");
        return;
      }

      onSuccess?.();

      if (typeof window !== "undefined" && redirectTo) {
        window.location.assign(redirectTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {providers !== undefined && providers.length > 0 ? (
          <>
            <AuthProviderButtons
              providers={providers}
              onSelect={handleProviderSelect}
              isSubmitting={isSubmitting}
              className="space-y-2"
              providerButtonClassName="w-full"
            />
            <AuthDivider label={dividerLabel} />
          </>
        ) : null}

        <Input
          label="Name"
          type="text"
          value={name}
          onValueChange={setName}
          error={fieldErrors.name}
          autoComplete="name"
          required
        />

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
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onValueChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>

        {signInUrl ? (
          <p className="text-center text-sm text-kumo-subtle">
            Already have an account?{" "}
            <Link href={signInUrl} variant="inline">
              Sign in
            </Link>
          </p>
        ) : null}
      </form>
    </AuthCard>
  );
}
