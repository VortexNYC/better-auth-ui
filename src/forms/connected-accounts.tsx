import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Text } from "@cloudflare/kumo/components/text";

import {
  AuthCard,
  AuthError,
  AuthProviderButtons,
  type AuthProviderOption,
} from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthAccount } from "../types";

export interface ConnectedAccountsProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  linkableProviders?: readonly AuthProviderOption[];
  linkLabel?: string;
  unlinkLabel?: string;
  unlinkingLabel?: string;
  unavailableMessage?: string;
  callbackURL?: string;
  errorCallbackURL?: string;
  onLinked?: () => void;
  onUnlinked?: () => void;
}

/**
 * Lists the current user's connected social accounts and allows linking/unlinking.
 */
export function ConnectedAccounts({
  className,
  errorClassName,
  title = "Connected accounts",
  description = "Manage the accounts linked to your profile.",
  emptyMessage = "No connected accounts.",
  linkableProviders,
  linkLabel = "Link account",
  unlinkLabel = "Unlink",
  unlinkingLabel = "Unlinking…",
  unavailableMessage = "Connected accounts are not available.",
  callbackURL,
  errorCallbackURL,
  onLinked,
  onUnlinked,
}: ConnectedAccountsProps) {
  const client = useAuth();

  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAccounts() {
    if (client.listAccounts === undefined) {
      setError(unavailableMessage);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.listAccounts();
      setAccounts(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load accounts.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  async function handleLink(providerId: string) {
    if (client.linkSocial === undefined) {
      setError("Account linking is not available.");
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const response = await client.linkSocial({
        provider: providerId,
        callbackURL,
        errorCallbackURL,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not link account.");
      } else {
        onLinked?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link account.");
    } finally {
      setIsLinking(false);
    }
  }

  async function handleUnlink(account: AuthAccount) {
    if (client.unlinkAccount === undefined) {
      setError("Account unlinking is not available.");
      return;
    }

    setUnlinkingId(account.id);
    setError(null);

    try {
      const response = await client.unlinkAccount({
        providerId: account.providerId,
        accountId: account.accountId,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not unlink account.");
      } else {
        setAccounts((prev) => prev.filter((a) => a.id !== account.id));
        onUnlinked?.();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not unlink account.",
      );
    } finally {
      setUnlinkingId(null);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {isLoading ? (
          <Text variant="secondary">Loading…</Text>
        ) : accounts.length === 0 ? (
          <Text variant="secondary">{emptyMessage}</Text>
        ) : (
          <ul className="space-y-2">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between gap-2"
              >
                <Text variant="secondary">{account.providerId}</Text>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={unlinkingId === account.id}
                  onClick={() => handleUnlink(account)}
                >
                  {unlinkingId === account.id ? unlinkingLabel : unlinkLabel}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {linkableProviders !== undefined && linkableProviders.length > 0 ? (
          <AuthProviderButtons
            providers={linkableProviders.map((provider) => ({
              ...provider,
              label: provider.label ?? `${linkLabel} ${provider.provider}`,
            }))}
            onSelect={handleLink}
            isSubmitting={isLinking}
            className="space-y-2"
            providerButtonClassName="w-full"
          />
        ) : null}
      </div>
    </AuthCard>
  );
}
