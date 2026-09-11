import type { ReactNode } from "react";

import { useAuth } from "./auth-provider";

export interface AuthenticatedProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

/**
 * Renders `children` only when the user is signed in.
 */
export function Authenticated({
  children,
  fallback = null,
  loading = null,
}: AuthenticatedProps) {
  const client = useAuth();
  const session = client.useSession();

  if (session.isPending) {
    return loading;
  }

  return session.data?.user ? children : fallback;
}

export interface UnauthenticatedProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

/**
 * Renders `children` only when the user is signed out.
 */
export function Unauthenticated({
  children,
  fallback = null,
  loading = null,
}: UnauthenticatedProps) {
  const client = useAuth();
  const session = client.useSession();

  if (session.isPending) {
    return loading;
  }

  return session.data?.user ? fallback : children;
}

export interface AuthLoadingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders `children` only while the auth session is still loading.
 */
export function AuthLoading({ children, fallback = null }: AuthLoadingProps) {
  const client = useAuth();
  const session = client.useSession();

  return session.isPending ? children : fallback;
}
