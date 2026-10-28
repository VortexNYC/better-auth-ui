/**
 * Extract the domain part of an email address (lowercased, trimmed).
 * Returns `null` when the input has no usable domain — callers can then
 * fall back to a generic "this domain" message.
 */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return domain.length > 0 ? domain : null;
}

/**
 * True when a `POST /api/auth/sign-in/sso` failure means no SSO provider is
 * configured (and domain-verified) for the resolved domain — the Better Auth
 * SSO plugin answers with a 404 and `"No provider found for the issuer"`.
 * Other failures (unverified domain, IdP errors, bad request) keep their own
 * messages and return `false` here.
 */
export function isNoSsoProviderError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    message?: unknown;
    status?: unknown;
    statusText?: unknown;
  };

  if (candidate.status === 404) return true;

  return (
    typeof candidate.message === "string" &&
    candidate.message.includes("No provider found")
  );
}

/**
 * Default `domainVerification.tokenPrefix` for `@better-auth/sso`. The
 * server option can rename it — callers can pass their own prefix.
 */
export const SSO_DOMAIN_VERIFICATION_DEFAULT_PREFIX = "better-auth-token";

/**
 * DNS owner name of the domain-verification TXT record:
 * `_{tokenPrefix}-{providerId}` (e.g. `_better-auth-token-acme-sso`).
 * The plugin resolves `TXT` at `{identifier}.{domain}` and accepts a value
 * of either the raw verification token or `{identifier}={token}`.
 */
export function ssoDomainVerificationHost(
  providerId: string,
  tokenPrefix: string = SSO_DOMAIN_VERIFICATION_DEFAULT_PREFIX,
): string {
  return `_${tokenPrefix}-${providerId}`;
}

interface SsoUrlsSource {
  redirectURI?: string | null;
  spMetadataUrl?: string | null;
}

/**
 * Recover the auth-server base URL from a provider response.
 *
 * `redirectURI` is `{baseURL}/sso/callback/{providerId}` (register response)
 * and `spMetadataUrl` is `{baseURL}/sso/saml2/sp/metadata?providerId=…`
 * (sanitized provider responses). Returns `null` when neither matches —
 * e.g. when the server sets a shared `redirectURI` option that does not
 * carry the provider id.
 */
export function ssoServerBaseUrl(
  source: SsoUrlsSource,
  providerId: string,
): string | null {
  const { redirectURI, spMetadataUrl } = source;

  if (typeof redirectURI === "string" && redirectURI.length > 0) {
    const suffix = `/sso/callback/${providerId}`;
    if (redirectURI.endsWith(suffix)) {
      return redirectURI.slice(0, -suffix.length);
    }
  }

  if (typeof spMetadataUrl === "string" && spMetadataUrl.length > 0) {
    const marker = "/sso/saml2/sp/metadata";
    const index = spMetadataUrl.indexOf(marker);
    if (index > 0) return spMetadataUrl.slice(0, index);
  }

  return null;
}

/**
 * SAML assertion consumer service (ACS) URL the IdP must post responses to:
 * `{baseURL}/sso/saml2/sp/acs/{providerId}`. Derived from whatever the
 * provider response exposes (`redirectURI` or `spMetadataUrl`); `null` when
 * the base URL cannot be recovered.
 */
export function ssoSamlAcsUrl(
  source: SsoUrlsSource,
  providerId: string,
): string | null {
  const baseUrl = ssoServerBaseUrl(source, providerId);
  return baseUrl === null ? null : `${baseUrl}/sso/saml2/sp/acs/${providerId}`;
}

/**
 * SP metadata URL an IdP can consume to auto-configure the service
 * provider: `{baseURL}/sso/saml2/sp/metadata?providerId={providerId}`.
 * Prefers a server-returned `spMetadataUrl`, else derives it from the base
 * URL; `null` when the base URL cannot be recovered.
 */
export function ssoSpMetadataUrl(
  source: SsoUrlsSource,
  providerId: string,
): string | null {
  if (
    typeof source.spMetadataUrl === "string" &&
    source.spMetadataUrl.length > 0
  ) {
    return source.spMetadataUrl;
  }
  const baseUrl = ssoServerBaseUrl(source, providerId);
  return baseUrl === null
    ? null
    : `${baseUrl}/sso/saml2/sp/metadata?providerId=${encodeURIComponent(providerId)}`;
}

/**
 * OIDC redirect URI to register at the IdP. A `redirectURI` on the provider
 * response wins (it reflects the server's shared-callback option); when
 * absent it is derived as `{baseURL}/sso/callback/{providerId}`.
 */
export function ssoOidcRedirectUrl(
  source: SsoUrlsSource,
  providerId: string,
): string | null {
  if (typeof source.redirectURI === "string" && source.redirectURI.length > 0) {
    return source.redirectURI;
  }
  const baseUrl = ssoServerBaseUrl(source, providerId);
  return baseUrl === null ? null : `${baseUrl}/sso/callback/${providerId}`;
}

/** Split a provider's comma-separated `domain` field into clean domains. */
export function ssoProviderDomains(
  domain: string | null | undefined,
): string[] {
  if (typeof domain !== "string") return [];
  return domain
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}
