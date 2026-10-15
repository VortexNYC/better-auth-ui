/**
 * Storage shape expected by `@better-auth/expo`'s `expoClient({ storage })`.
 * Pass `expo-secure-store` (or any store with the same async methods).
 */
export function expoSecureStorage(store: {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}): {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
} {
  return {
    getItem: (key) => store.getItemAsync(key),
    setItem: (key, value) => store.setItemAsync(key, value),
  };
}

export interface AuthDeepLink {
  path: string;
  token: string | null;
  invitationId: string | null;
  email: string | null;
}

/** Read a reset, verify, or invitation link from an https URL or an app scheme. */
export function readAuthDeepLink(url: string): AuthDeepLink | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const web = parsed.protocol === "https:" || parsed.protocol === "http:";
  const path = web
    ? parsed.pathname
    : `/${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;

  return {
    path,
    token: parsed.searchParams.get("token"),
    invitationId:
      parsed.searchParams.get("invitationId") ??
      parsed.searchParams.get("invitation_token"),
    email: parsed.searchParams.get("email"),
  };
}
