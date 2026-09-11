import type { BetterAuthClientOptions } from "better-auth/client";
import type { createAuthClient } from "better-auth/react";

export interface AuthResult {
  data?: unknown;
  error: { message?: string } | null;
}

/**
 * A generic Better Auth client produced by `createAuthClient` from
 * `better-auth/react`. This keeps the library type-safe while working with any
 * plugin combination the consumer installs.
 *
 * Optional methods are declared explicitly because not every consumer enables
 * email/password recovery or verification.
 */
export type AnyAuthClient = ReturnType<
  typeof createAuthClient<BetterAuthClientOptions>
> & {
  forgetPassword?: (args: {
    email: string;
    redirectTo?: string;
  }) => Promise<AuthResult>;
  resetPassword?: (args: {
    newPassword: string;
    token: string;
  }) => Promise<AuthResult>;
  sendVerificationEmail?: (args: {
    email: string;
    callbackURL?: string;
  }) => Promise<AuthResult>;
  verifyEmail?: (args: {
    query: { token: string };
    callbackURL?: string;
  }) => Promise<AuthResult>;
};

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
