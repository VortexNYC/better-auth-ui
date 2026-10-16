# @vortex-api/better-auth-ui

Kumo-based React components and React Email templates for [Better Auth](https://www.better-auth.com).

## Install

```bash
pnpm add @vortex-api/better-auth-ui @cloudflare/kumo @phosphor-icons/react better-auth react react-dom react-email zod
```

## Usage

```tsx
import { createAuthClient } from "better-auth/react";
import { AuthProvider, SignInForm } from "@vortex-api/better-auth-ui";

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

## Theming

Forms use Kumo components and `text-kumo-*` / `border-kumo-*` utilities. Import
Kumo styles, then this package's theme bridge, so text and the page canvas
follow the host palette instead of Cloudflare gray, blue, and orange:

```css
@import "@cloudflare/kumo/styles";
@import "@vortex-api/better-auth-ui/theme.css";
```

Import `theme.css` only when the app sets `--kumo-*` or `--color-kumo-*`.
Seal maps those names onto Taupe in `@seal/tokens`.

## Email templates

Render email HTML on the server with `react-email` and pass it to your Better Auth email transport (Cloudflare Email, etc.):

```tsx
import { render, VerificationEmail } from "@vortex-api/better-auth-ui/emails";

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
