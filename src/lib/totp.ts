/**
 * Extract the base32 shared secret from an `otpauth://` URI so the
 * enrollment UI can offer manual entry as a fallback to scanning a QR.
 * Returns null if the URI has no `secret` param.
 */
export function extractTotpSecret(totpURI: string): string | null {
  try {
    const url = new URL(totpURI);
    return url.searchParams.get("secret");
  } catch {
    const match = totpURI.match(/[?&]secret=([^&]+)/i);
    const secret = match?.[1];
    return secret === undefined ? null : decodeURIComponent(secret);
  }
}
