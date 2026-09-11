import { useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";

import { useAuth } from "./auth-provider";

export interface UserButtonProps {
  className?: string;
  redirectTo?: string;
  onSignOut?: () => void;
  onSignOutError?: (message: string) => void;
}

/**
 * Compact user menu with sign-out.
 *
 * Renders the current user's name/image as a trigger and drops down a
 * sign-out action. Returns null while session is loading or unavailable.
 */
export function UserButton({
  className,
  redirectTo,
  onSignOut,
  onSignOutError,
}: UserButtonProps) {
  const client = useAuth();
  const session = client.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (session.isPending || !session.data?.user) {
    return null;
  }

  const user = session.data.user;
  const displayName = user.name ?? user.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const response = await client.signOut();

      if (response.error !== null) {
        onSignOutError?.(response.error.message ?? "Sign-out failed.");
        return;
      }

      onSignOut?.();

      if (typeof window !== "undefined" && redirectTo) {
        window.location.assign(redirectTo);
      }
    } catch (err) {
      onSignOutError?.(err instanceof Error ? err.message : "Sign-out failed.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <Button
          variant="ghost"
          shape="base"
          className={className}
          loading={isSigningOut}
          aria-label={displayName}
        >
          {user.image ? (
            <img
              src={user.image}
              alt=""
              width={28}
              height={28}
              style={{ borderRadius: "9999px", marginRight: "8px" }}
            />
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "9999px",
                backgroundColor: "#0052cc",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                marginRight: "8px",
              }}
            >
              {initials}
            </span>
          )}
          {displayName}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Label>{user.email}</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onClick={() => {
            void handleSignOut();
          }}
        >
          Sign out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
