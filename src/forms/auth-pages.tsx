import type { ReactNode } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard } from "../auth-primitives";
import {
  AcceptInviteScreen,
  type AcceptInviteScreenProps,
} from "./accept-invite-screen";
import { SignInForm, type SignInFormProps } from "./sign-in-form";
import { SignUpForm, type SignUpFormProps } from "./sign-up-form";

export interface AuthStatusCardProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AuthLoadingCard({
  title = "Checking your session",
  description = "This takes a moment.",
}: AuthStatusCardProps) {
  return (
    <AuthCard title={title} description={description}>
      <Text as="p" variant="secondary" size="sm">
        {description}
      </Text>
    </AuthCard>
  );
}

export function AuthUnavailableCard({
  title = "Sign-in is unavailable",
  description = "The auth service did not respond. Try again in a moment.",
  actionLabel = "Try again",
  onAction,
}: AuthStatusCardProps) {
  return (
    <AuthCard title={title} description={description}>
      {onAction ? (
        <Button type="button" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </AuthCard>
  );
}

export interface AuthPageFrameProps {
  logo?: ReactNode;
  loading?: boolean;
  unavailable?: boolean;
  onRetry?: () => void;
  children: ReactNode;
}

export function AuthPageFrame({
  logo,
  loading = false,
  unavailable = false,
  onRetry,
  children,
}: AuthPageFrameProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      {logo}
      {loading ? <AuthLoadingCard /> : null}
      {!loading && unavailable ? (
        <AuthUnavailableCard onAction={onRetry} />
      ) : null}
      {!loading && !unavailable ? children : null}
    </div>
  );
}

export interface SignInPageProps extends SignInFormProps {
  logo?: ReactNode;
  loading?: boolean;
  unavailable?: boolean;
  onRetry?: () => void;
}

export function SignInPage({
  logo,
  loading,
  unavailable,
  onRetry,
  ...form
}: SignInPageProps) {
  return (
    <AuthPageFrame
      logo={logo}
      loading={loading}
      unavailable={unavailable}
      onRetry={onRetry}
    >
      <SignInForm {...form} />
    </AuthPageFrame>
  );
}

export interface SignUpPageProps extends SignUpFormProps {
  logo?: ReactNode;
  loading?: boolean;
  unavailable?: boolean;
  onRetry?: () => void;
}

export function SignUpPage({
  logo,
  loading,
  unavailable,
  onRetry,
  ...form
}: SignUpPageProps) {
  return (
    <AuthPageFrame
      logo={logo}
      loading={loading}
      unavailable={unavailable}
      onRetry={onRetry}
    >
      <SignUpForm {...form} />
    </AuthPageFrame>
  );
}

export interface AcceptInvitePageProps extends AcceptInviteScreenProps {
  logo?: ReactNode;
  loading?: boolean;
  unavailable?: boolean;
  onRetry?: () => void;
}

export function AcceptInvitePage({
  logo,
  loading,
  unavailable,
  onRetry,
  ...screen
}: AcceptInvitePageProps) {
  return (
    <AuthPageFrame
      logo={logo}
      loading={loading}
      unavailable={unavailable}
      onRetry={onRetry}
    >
      <AcceptInviteScreen {...screen} />
    </AuthPageFrame>
  );
}
