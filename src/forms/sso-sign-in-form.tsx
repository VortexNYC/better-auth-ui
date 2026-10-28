import { useState, type ReactNode } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Banner } from "@cloudflare/kumo/components/banner";
import { Info } from "@phosphor-icons/react";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import { emailDomain, isNoSsoProviderError } from "../lib/sso";
import type { AuthFormBaseProps } from "../types";

const ssoEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SsoEmailValues = z.infer<typeof ssoEmailSchema>;

export interface SsoSignInFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  /**
   * `callbackURL` sent to `POST /api/auth/sign-in/sso` — required by the
   * Better Auth SSO plugin. Where the user lands after the IdP round-trip.
   */
  callbackURL?: string;
  /** Where the IdP flow sends the user on failure. */
  errorCallbackURL?: string;
  /** Where a newly provisioned SSO user lands instead of `callbackURL`. */
  newUserCallbackURL?: string;
  /**
   * Direct provider identifiers. When any is set the email field is hidden
   * and submit starts the IdP redirect immediately — use for "Sign in with
   * Acme SSO" style buttons on org-branded pages. The server still requires
   * the provider's domain to be verified when `domainVerification` is on.
   */
  providerId?: string;
  domain?: string;
  organizationSlug?: string;
  /** Restrict resolution to one protocol when a provider has both configs. */
  providerType?: "saml" | "oidc";
  /** OIDC scopes to request from the IdP. */
  scopes?: string[];
  /** Extra authorization-URL query params (OIDC providers only). */
  additionalParams?: Record<string, string>;
  /** Explicitly request sign-up — for providers with `disableImplicitSignUp`. */
  requestSignUp?: boolean;
  /**
   * `login_hint` sent to the IdP. `true` (default) forwards the typed email,
   * a string sends an explicit value, `false` omits it. Ignored by SAML
   * providers that don't support it.
   */
  loginHint?: boolean | string;
  emailLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  /** Shown when the client was built without the `sso` plugin. */
  unavailableMessage?: string;
  /**
   * Banner shown when the domain resolves to no verified SSO provider.
   * A function receives the resolved domain so it can name it.
   */
  noProviderMessage?: string | ((domain: string | null) => string);
  /** Called when the domain has no configured/verified SSO provider. */
  onNoProvider?: (email: string) => void;
  /**
   * Replaces the form when the domain has no SSO provider — typically a
   * password sign-in fallback:
   *
   * ```tsx
   * <SsoSignInForm
   *   fallback={(email) => (
   *     <SignInForm initialEmail={email} redirectTo="/app" />
   *   )}
   * />
   * ```
   */
  fallback?: (email: string) => ReactNode;
}

/**
 * SAML/OIDC single sign-on form built on Kumo UI.
 *
 * Reads the typed Better Auth client from `AuthProvider` and calls
 * `client.signIn.sso` (`@better-auth/sso`). The server resolves the provider
 * from the email domain — there is no unauthenticated provider-discovery
 * endpoint, so the sign-in call doubles as the probe: a 404
 * `"No provider found for the issuer"` response renders the
 * `noProviderMessage` banner, fires `onNoProvider`, or swaps to `fallback`.
 * On success the client's default redirect plugin navigates to the IdP
 * authorization URL; `onSuccess` fires right before navigation.
 */
export function SsoSignInForm({
  title = "Sign in with SSO",
  description = "Enter your work email to continue to your identity provider.",
  callbackURL = "/",
  errorCallbackURL,
  newUserCallbackURL,
  providerId,
  domain,
  organizationSlug,
  providerType,
  scopes,
  additionalParams,
  requestSignUp,
  loginHint = true,
  emailLabel = "Work email",
  submitLabel = "Continue",
  submittingLabel = "Redirecting…",
  unavailableMessage = "SSO sign-in is not available.",
  noProviderMessage = (resolvedDomain) =>
    resolvedDomain !== null
      ? `No SSO configured for ${resolvedDomain}.`
      : "No SSO configured for this domain.",
  onNoProvider,
  fallback,
  className,
  errorClassName,
  onSuccess,
}: SsoSignInFormProps) {
  const client = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<SsoEmailValues>>({});
  const [noProvider, setNoProvider] = useState(false);

  const showEmailField =
    providerId === undefined &&
    domain === undefined &&
    organizationSlug === undefined;

  function handleNoProvider() {
    setNoProvider(true);
    onNoProvider?.(email);
  }

  if (client.signIn?.sso === undefined) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <AuthError message={unavailableMessage} className={errorClassName} />
      </AuthCard>
    );
  }

  const signInSso = client.signIn.sso;

  if (noProvider && fallback !== undefined) {
    return <>{fallback(email)}</>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setNoProvider(false);

    let submittedEmail = "";
    if (showEmailField) {
      const validation = ssoEmailSchema.safeParse({ email });
      if (!validation.success) {
        const flattened = validation.error.flatten().fieldErrors;
        setFieldErrors({ email: flattened.email?.[0] });
        return;
      }
      submittedEmail = validation.data.email;
    }

    setIsSubmitting(true);

    const resolvedLoginHint =
      typeof loginHint === "string"
        ? loginHint
        : loginHint === false
          ? undefined
          : showEmailField
            ? submittedEmail
            : undefined;

    try {
      const response = await signInSso({
        email: showEmailField ? submittedEmail : undefined,
        providerId,
        domain,
        organizationSlug,
        callbackURL,
        errorCallbackURL,
        newUserCallbackURL,
        providerType,
        scopes,
        additionalParams,
        requestSignUp,
        loginHint: resolvedLoginHint,
      });

      if (response.error !== null) {
        if (isNoSsoProviderError(response.error)) {
          handleNoProvider();
          return;
        }
        setError(response.error.message ?? "SSO sign-in failed.");
        return;
      }

      onSuccess?.();
    } catch (err) {
      if (isNoSsoProviderError(err)) {
        handleNoProvider();
        return;
      }
      setError(err instanceof Error ? err.message : "SSO sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const resolvedDomain = domain ?? emailDomain(email);

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthError message={error} className={errorClassName} />

        {noProvider ? (
          <Banner
            variant="default"
            icon={<Info weight="fill" />}
            title="SSO not configured"
            description={
              typeof noProviderMessage === "function"
                ? noProviderMessage(resolvedDomain)
                : noProviderMessage
            }
          />
        ) : null}

        {showEmailField ? (
          <Input
            label={emailLabel}
            type="email"
            value={email}
            onValueChange={(value) => {
              setEmail(value);
              setNoProvider(false);
            }}
            error={fieldErrors.email}
            autoComplete="email"
            required
          />
        ) : null}

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
