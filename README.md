# @vortexnyc/better-auth-ui

Kumo-based React components for [Better Auth](https://www.better-auth.com).

## Install

```bash
pnpm add @vortexnyc/better-auth-ui @cloudflare/kumo @phosphor-icons/react better-auth react react-dom zod
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
| `AuthCard`, `AuthError`, `AuthSubmitButton`, `AuthProviderButtons`, `AuthDivider` | Ready  |
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
| `ConnectedAccounts`                                                               | Ready  |

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
