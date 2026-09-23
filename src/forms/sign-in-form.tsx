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
import { TurnstileWidget } from "../turnstile";
import type { AuthFormBaseProps } from "../types";
import { VerifyBackupCodeForm } from "./verify-backup-code-form";
import { VerifyTotpForm } from "./verify-totp-form";

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
  /**
   * Show the "trust this device" checkbox on the two-factor step rendered
   * when the server answers sign-in with `twoFactorRedirect`.
   */
  showTrustDevice?: boolean;
  /**
   * Cloudflare Turnstile site key. When set, renders the managed widget and
   * sends the token on `x-captcha-response` — pair with the Better Auth
   * captcha plugin guarding `/sign-in/email`.
   */
  captchaSiteKey?: string;
  submitLabel?: string;
  submittingLabel?: string;
  providers?: readonly AuthProviderOption[];
  onProviderSelect?: (providerId: string) => void | Promise<void>;
  dividerLabel?: string;
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
  showTrustDevice = false,
  captchaSiteKey,
  className,
  errorClassName,
  submitLabel = "Sign in",
  submittingLabel = "Signing in...",
  providers,
  onProviderSelect,
  dividerLabel = "or",
  onSuccess,
}: SignInFormProps) {
  const client = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<SignInValues>>({});
  const [step, setStep] = useState<"credentials" | "totp" | "backup">(
    "credentials",
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  function finishSignIn() {
    onSuccess?.();
    if (typeof window !== "undefined" && redirectTo) {
      window.location.assign(redirectTo);
    }
  }

  async function handleProviderSelect(providerId: string) {
    if (onProviderSelect) {
      await onProviderSelect(providerId);
      return;
    }

    setError(null);

    if (client.signIn.social === undefined) {
      setError("Social sign-in is not available.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.signIn.social({
        provider: providerId,
        callbackURL: redirectTo,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Social sign-in failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Social sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

    if (captchaSiteKey !== undefined && captchaToken === null) {
      setError("Complete the verification check.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.signIn.email({
        email: validation.data.email,
        password: validation.data.password,
        callbackURL: redirectTo,
        ...(captchaToken === null
          ? {}
          : {
              fetchOptions: {
                headers: { "x-captcha-response": captchaToken },
              },
            }),
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Sign-in failed.");
        // Turnstile tokens are single-use — mint a fresh one on failure.
        setCaptchaToken(null);
        setCaptchaResetKey((key) => key + 1);
        return;
      }

      if (
        typeof response.data === "object" &&
        response.data !== null &&
        "twoFactorRedirect" in response.data &&
        (response.data as { twoFactorRedirect?: unknown }).twoFactorRedirect ===
          true
      ) {
        setStep("totp");
        return;
      }

      finishSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "totp") {
    return (
      <VerifyTotpForm
        className={className}
        errorClassName={errorClassName}
        showTrustDevice={showTrustDevice}
        onUseBackupCode={() => setStep("backup")}
        onSuccess={finishSignIn}
      />
    );
  }

  if (step === "backup") {
    return (
      <VerifyBackupCodeForm
        className={className}
        errorClassName={errorClassName}
        onUseTotp={() => setStep("totp")}
        onSuccess={finishSignIn}
      />
    );
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

        {captchaSiteKey !== undefined ? (
          <TurnstileWidget
            siteKey={captchaSiteKey}
            onToken={setCaptchaToken}
            resetKey={captchaResetKey}
          />
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
