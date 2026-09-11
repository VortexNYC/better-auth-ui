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
    social?(args: {
      provider: string;
      callbackURL?: string;
    }): Promise<AuthResult>;
    magicLink?(args: {
      email: string;
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

  /** Magic link sign-in and verification. */
  magicLink?: {
    verify(args: { token: string; callbackURL?: string }): Promise<AuthResult>;
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
  updateUser?: (args: {
    name?: string;
    image?: string | null;
  }) => Promise<AuthResult>;
  changePassword?: (args: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  }) => Promise<AuthResult>;
  deleteUser?: (args: {
    password?: string;
    callbackURL?: string;
    token?: string;
  }) => Promise<AuthResult>;
  setPassword?: (args: { newPassword: string }) => Promise<AuthResult>;
  listSessions?: () => Promise<{
    data?: unknown[] | null;
    error: AuthResult["error"];
  }>;
  revokeSession?: (args: { token: string }) => Promise<AuthResult>;
  revokeOtherSessions?: () => Promise<AuthResult>;

  /** Social account linking. */
  listAccounts?: () => Promise<{
    data?: AuthAccount[] | null;
    error: AuthResult["error"];
  }>;
  linkSocial?: (args: {
    provider: string;
    callbackURL?: string;
    errorCallbackURL?: string;
  }) => Promise<AuthResult>;
  unlinkAccount?: (args: {
    providerId: string;
    accountId?: string;
  }) => Promise<AuthResult>;

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
      keepCurrentActiveOrganization?: boolean;
    }): Promise<{ data?: AuthOrganization | null; error: AuthResult["error"] }>;
    delete(args: { organizationId: string }): Promise<AuthResult>;
    update(args: {
      data: {
        name?: string;
        slug?: string;
        logo?: string | null;
        metadata?: Record<string, unknown>;
      };
      organizationId?: string;
    }): Promise<{ data?: AuthOrganization | null; error: AuthResult["error"] }>;
    setActive(args: {
      organizationId?: string | null;
      organizationSlug?: string;
    }): Promise<AuthResult>;
    getFullOrganization(args?: {
      query?: {
        organizationId?: string;
        organizationSlug?: string;
        membersLimit?: number;
      };
    }): Promise<{
      data?: AuthOrganizationFull | null;
      error: AuthResult["error"];
    }>;
    checkSlug(args: { slug: string }): Promise<{
      data?: { status: boolean } | null;
      error: AuthResult["error"];
    }>;
    listInvitations(args?: {
      query?: { organizationId?: string };
    }): Promise<{ data?: AuthInvitation[] | null; error: AuthResult["error"] }>;
    listUserInvitations(): Promise<{
      data?: AuthInvitation[] | null;
      error: AuthResult["error"];
    }>;
    inviteMember(args: {
      email: string;
      role: string;
      organizationId?: string;
    }): Promise<{ data?: AuthInvitation | null; error: AuthResult["error"] }>;
    acceptInvitation(args: { invitationId: string }): Promise<AuthResult>;
    rejectInvitation(args: { invitationId: string }): Promise<AuthResult>;
    cancelInvitation(args: { invitationId: string }): Promise<AuthResult>;
    getInvitation(args: { query?: { id?: string } }): Promise<{
      data?: AuthInvitation | null;
      error: AuthResult["error"];
    }>;
    listMembers(args?: {
      query?: { organizationId?: string; limit?: number };
    }): Promise<{ data?: AuthMember[] | null; error: AuthResult["error"] }>;
    removeMember(args: {
      memberId: string;
      organizationId?: string;
    }): Promise<AuthResult>;
    updateMemberRole(args: {
      memberId: string;
      role: string;
      organizationId?: string;
    }): Promise<AuthResult>;
    leave(args?: { organizationId?: string }): Promise<AuthResult>;
    getActiveMember(): Promise<{
      data?: AuthMember | null;
      error: AuthResult["error"];
    }>;
    getActiveMemberRole(): Promise<{
      data?: { role: string } | null;
      error: AuthResult["error"];
    }>;
  };
}

export interface AuthAccount {
  id: string;
  providerId: string;
  accountId?: string;
  userId: string;
  scopes?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | Date;
}

export interface AuthOrganizationFull extends AuthOrganization {
  members: AuthMember[];
  invitations: AuthInvitation[];
}

export interface AuthMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  } | null;
}

export interface AuthInvitation {
  id: string;
  organizationId?: string;
  email: string;
  role?: string;
  status?: "pending" | "accepted" | "rejected" | "canceled";
  inviterId?: string;
  expiresAt?: string | Date;
  createdAt?: string | Date;
}

export interface AuthSession {
  id: string;
  token: string;
  userId?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  expiresAt?: string | Date;
}

/**
 * Shared form props for all auth forms.
 */
export interface AuthFormBaseProps {
  className?: string;
  errorClassName?: string;
  onSuccess?: () => void;
}
