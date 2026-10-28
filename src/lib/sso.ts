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
