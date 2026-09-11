/**
 * Result shape returned by Better Auth client actions.
 */
export interface AuthResult {
  data?: unknown;
  error: { message?: string } | null;
}

/**
 * A generic Better Auth session state.
 */
export interface AuthSessionState {
  data?: { user?: AuthUser | null } | null;
  error?: { message?: string } | null;
  isPending?: boolean;
}

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
 * Generic Better Auth client contract.
 *
 * This is intentionally a hand-written shape rather than a deep inference of
 * `createAuthClient` so the package can work across any plugin combination
 * without coupling to Better Auth's internal method overloads.
 */
export interface AnyAuthClient {
  useSession(): AuthSessionState;
  signOut(args?: { fetchOptions?: unknown }): Promise<AuthResult>;

  signIn: {
    email(args: {
      email: string;
      password: string;
      callbackURL?: string;
    }): Promise<AuthResult>;
    social(args: {
      provider: string;
      callbackURL?: string;
    }): Promise<AuthResult>;
  };

  signUp: {
    email(args: {
      name: string;
      email: string;
      password: string;
      callbackURL?: string;
    }): Promise<AuthResult>;
  };

  /** Password recovery. */
  forgetPassword?: (args: {
    email: string;
    redirectTo?: string;
  }) => Promise<AuthResult>;
  resetPassword?: (args: {
    newPassword: string;
    token: string;
  }) => Promise<AuthResult>;

  /** Email verification and change. */
  sendVerificationEmail?: (args: {
    email: string;
    callbackURL?: string;
  }) => Promise<AuthResult>;
  verifyEmail?: (args: { query: { token: string } }) => Promise<AuthResult>;
  changeEmail?: (args: {
    newEmail: string;
    callbackURL?: string;
  }) => Promise<AuthResult>;

  /** Profile and session management. */
  updateUser?: (args: { name?: string; image?: string }) => Promise<AuthResult>;
  listSessions?: () => Promise<{
    data?: unknown[] | null;
    error: AuthResult["error"];
  }>;
  revokeSession?: (args: { token: string }) => Promise<AuthResult>;
  revokeOtherSessions?: () => Promise<AuthResult>;

  /** Two-factor authentication (TOTP + backup codes). */
  twoFactor?: {
    enable(args: { password: string; issuer?: string }): Promise<{
      data?: { totpURI?: string; backupCodes?: string[] } | null;
      error: AuthResult["error"];
    }>;
    verifyTotp(args: {
      code: string;
      trustDevice?: boolean;
    }): Promise<AuthResult>;
    verifyBackupCode(args: {
      code: string;
      trustDevice?: boolean;
    }): Promise<AuthResult>;
    disable(args: { password: string }): Promise<AuthResult>;
    generateBackupCodes(args: { password: string }): Promise<{
      data?: { backupCodes?: string[] } | null;
      error: AuthResult["error"];
    }>;
  };

  /** Organizations (Better Auth organization plugin). */
  organization?: {
    list(): Promise<{
      data?: AuthOrganization[] | null;
      error: AuthResult["error"];
    }>;
    create(args: {
      name: string;
      slug: string;
      logo?: string;
      metadata?: Record<string, unknown>;
    }): Promise<{ data?: AuthOrganization | null; error: AuthResult["error"] }>;
    setActive(args: {
      organizationId?: string;
      organizationSlug?: string;
    }): Promise<AuthResult>;
    acceptInvitation(args: { invitationId: string }): Promise<AuthResult>;
    rejectInvitation(args: { invitationId: string }): Promise<AuthResult>;
    cancelInvitation(args: { invitationId: string }): Promise<AuthResult>;
    invitations(args?: {
      query?: { organizationId?: string };
    }): Promise<{ data?: AuthInvitation[] | null; error: AuthResult["error"] }>;
    createInvitation(args: {
      email: string;
      role?: string;
      organizationId?: string;
    }): Promise<{ data?: AuthInvitation | null; error: AuthResult["error"] }>;
    updateMemberRole(args: {
      memberId: string;
      role: string;
      organizationId?: string;
    }): Promise<AuthResult>;
    removeMember(args: {
      memberId: string;
      organizationId?: string;
    }): Promise<AuthResult>;
  };
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuthInvitation {
  id: string;
  email: string;
  role?: string;
  status?: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt?: Date;
}

/**
 * Shared form props for all auth forms.
 */
export interface AuthFormBaseProps {
  className?: string;
  errorClassName?: string;
  onSuccess?: () => void;
}
