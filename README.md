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
  <SignInForm redirectTo="/dashboard" forgotPasswordHref="/forgot-password" />
</AuthProvider>;
```

## Components

| Component                                   | Status  |
| ------------------------------------------- | ------- |
| `AuthProvider` / `useAuth`                  | Ready   |
| `AuthCard`, `AuthError`, `AuthSubmitButton` | Ready   |
| `SignInForm`                                | Ready   |
| `SignUpForm`                                | Planned |
| `ForgotPasswordForm`                        | Planned |
| `ResetPasswordForm`                         | Planned |
| `VerifyEmailForm`                           | Planned |
| `TwoFactorForm`                             | Planned |
| `SessionList`                               | Planned |
| `UserProfileForm`                           | Planned |

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm run test
pnpm run lint
```

## License

MIT © Vortex NYC
