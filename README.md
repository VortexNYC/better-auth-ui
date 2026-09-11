# @vortexnyc/better-auth-ui

Kumo-based React components and React Email templates for [Better Auth](https://www.better-auth.com).

## Install

```bash
pnpm add @vortexnyc/better-auth-ui @cloudflare/kumo @phosphor-icons/react better-auth react react-dom react-email zod
```

## Usage

```tsx
import { createAuthClient } from "better-auth/react";
import { AuthProvider, SignInForm } from "@vortexnyc/better-auth-ui";

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
});

<AuthProvider client={authClient}>
  <SignInForm
    redirectTo="/dashboard"
    forgotPasswordHref="/forgot-password"
    providers={[
      { provider: "google", label: "Continue with Google" },
      { provider: "github", label: "Continue with GitHub" },
    ]}
  />
</AuthProvider>;
```

## Components

| Component                                                                         | Status |
| --------------------------------------------------------------------------------- | ------ |
| `AuthProvider` / `useAuth`                                                        | Ready  |
| `Authenticated` / `Unauthenticated` / `AuthLoading`                               | Ready  |
| `AuthCard`, `AuthError`, `AuthSubmitButton`, `AuthProviderButtons`, `AuthDivider` | Ready  |
| `SignOutButton` / `UserButton`                                                    | Ready  |
| `SignInForm` (email + social providers)                                           | Ready  |
| `SignUpForm` (email + social providers)                                           | Ready  |
| `ForgotPasswordForm`                                                              | Ready  |
| `ResetPasswordForm`                                                               | Ready  |
| `VerifyEmailForm`                                                                 | Ready  |
| `EnableTwoFactorForm` / `VerifyTotpForm`                                          | Ready  |
| `SessionList`                                                                     | Ready  |
| `CreateOrganizationForm`                                                          | Ready  |
| `OrganizationList`                                                                | Ready  |
| `OrganizationSwitcher`                                                            | Ready  |
| `OrganizationProfile`                                                             | Ready  |
| `OrganizationMembers` / `InviteMemberForm`                                        | Ready  |
| `AcceptInviteScreen`                                                              | Ready  |
| `UserProfileForm`                                                                 | Ready  |
| `ChangeEmailForm`                                                                 | Ready  |
| `VerifyBackupCodeForm`                                                            | Ready  |
| `DisableTwoFactorForm`                                                            | Ready  |
| `GenerateBackupCodesForm`                                                         | Ready  |
| `ChangePasswordForm`                                                              | Ready  |
| `SetPasswordForm`                                                                 | Ready  |
| `DeleteAccountForm`                                                               | Ready  |
| `ConnectedAccounts`                                                               | Ready  |
| `VerificationEmail`                                                               | Ready  |
| `PasswordResetEmail`                                                              | Ready  |
| `OrganizationInvitationEmail`                                                     | Ready  |
| `ChangeEmailConfirmation`                                                         | Ready  |
| `WelcomeEmail`                                                                    | Ready  |
| `PasswordChangedEmail`                                                            | Ready  |

## Email templates

Render email HTML on the server with `react-email` and pass it to your Better Auth email transport (Cloudflare Email, etc.):

```tsx
import { render, VerificationEmail } from "@vortexnyc/better-auth-ui";

const html = render(
  <VerificationEmail
    brandName="Seal"
    username="Ada"
    verificationUrl={`${origin}/verify-email?token=${token}`}
  />,
);
```

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm run test
pnpm run lint
```

## License

MIT © Vortex
