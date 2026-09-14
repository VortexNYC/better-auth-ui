import { createContext, useContext, type ReactNode } from "react";

import type { AnyAuthClient } from "./types";

const AuthContext = createContext<AnyAuthClient | null>(null);

export interface AuthProviderProps {
  client: AnyAuthClient;
  children: ReactNode;
}

/**
 * Provides the typed Better Auth client to all `@vortex-api/better-auth-ui`
 * components through React context.
 */
export function AuthProvider({ client, children }: AuthProviderProps) {
  return <AuthContext.Provider value={client}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the auth client inside `AuthProvider`.
 * Throws if called outside the provider.
 */
export function useAuth(): AnyAuthClient {
  const client = useContext(AuthContext);

  if (client === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return client;
}
