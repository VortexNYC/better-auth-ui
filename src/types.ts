import type { BetterAuthClientOptions } from "better-auth/client";
import type { createAuthClient } from "better-auth/react";

/**
 * A generic Better Auth client produced by `createAuthClient` from
 * `better-auth/react`. This keeps the library type-safe while working with any
 * plugin combination the consumer installs.
 */
export type AnyAuthClient = ReturnType<
  typeof createAuthClient<BetterAuthClientOptions>
>;

/**
 * Shape of a Better Auth user exposed by the default session payload.
 * Consumers with custom user fields can narrow this via the generic client.
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Shared form props for all auth forms.
 */
export interface AuthFormBaseProps {
  className?: string;
  errorClassName?: string;
  onSuccess?: () => void;
}
