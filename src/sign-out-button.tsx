import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@cloudflare/kumo/components/button";

import { useAuth } from "./auth-provider";

export interface SignOutButtonProps {
  children?: ReactNode;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  loading?: boolean;
  disabled?: boolean;
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

/**
 * Button that signs the user out through Better Auth and optionally redirects.
 */
export function SignOutButton({
  redirectTo,
  onSuccess,
  onError,
  children = "Sign out",
  className,
  variant,
  size,
  loading,
  disabled,
}: SignOutButtonProps) {
  const client = useAuth();

  async function handleClick() {
    try {
      const response = await client.signOut();

      if (response.error !== null) {
        onError?.(response.error.message ?? "Sign-out failed.");
        return;
      }

      onSuccess?.();

      if (typeof window !== "undefined" && redirectTo) {
        window.location.assign(redirectTo);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Sign-out failed.");
    }
  }

  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      shape="base"
      loading={loading}
      disabled={disabled}
      onClick={() => {
        void handleClick();
      }}
    >
      {children}
    </Button>
  );
}
