import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthPasskey } from "../types";

export interface PasskeyListProps {
  title?: string;
  description?: string;
  className?: string;
  errorClassName?: string;
  showAddAction?: boolean;
  showNameField?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  addLabel?: string;
  addingLabel?: string;
  namePlaceholder?: string;
  deleteLabel?: string;
  deletingLabel?: string;
  syncedBadgeLabel?: string;
  createdPrefix?: string;
  formatTimestamp?: (value: string | Date) => string;
  onChange?: () => void;
}

function defaultFormatTimestamp(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function passkeyLabel(passkey: AuthPasskey): string {
  const name = passkey.name?.trim();
  if (name !== undefined && name !== null && name.length > 0) return name;
  return passkey.deviceType === "singleDevice"
    ? "Device-bound passkey"
    : "Passkey";
}

/**
 * List the account's registered passkeys with add and delete actions.
 * Requires the Better Auth passkey plugin on the client.
 */
export function PasskeyList({
  title = "Passkeys",
  description = "Passkeys let you sign in with a fingerprint, face, or device PIN.",
  className,
  errorClassName,
  showAddAction = true,
  showNameField = true,
  loadingLabel = "Loading passkeys…",
  emptyLabel = "No passkeys registered.",
  addLabel = "Add passkey",
  addingLabel = "Follow the device prompt…",
  namePlaceholder = "Passkey name (optional)",
  deleteLabel = "Remove",
  deletingLabel = "Removing…",
  syncedBadgeLabel = "Synced",
  createdPrefix = "Added",
  formatTimestamp = defaultFormatTimestamp,
  onChange,
}: PasskeyListProps) {
  const client = useAuth();

  const [passkeys, setPasskeys] = useState<AuthPasskey[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setError(null);

    if (client.passkey?.listUserPasskeys === undefined) {
      setError("Passkey listing is not available.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await client.passkey.listUserPasskeys();
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load passkeys.");
        return;
      }
      setPasskeys(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load passkeys.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [client]);

  async function handleAdd() {
    if (client.passkey?.addPasskey === undefined) {
      setError("Passkey registration is not available.");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const trimmed = name.trim();
      const response = await client.passkey.addPasskey(
        trimmed.length > 0 ? { name: trimmed } : {},
      );
      if (response.error !== null) {
        setError(response.error.message ?? "Could not register passkey.");
        return;
      }
      setName("");
      onChange?.();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not register passkey.",
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(passkey: AuthPasskey) {
    if (client.passkey?.deletePasskey === undefined) {
      setError("Passkey deletion is not available.");
      return;
    }

    setDeletingId(passkey.id);
    setError(null);

    try {
      const response = await client.passkey.deletePasskey({
        id: passkey.id,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not remove passkey.");
        return;
      }
      onChange?.();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove passkey.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AuthCard
      variant="settings"
      className={className}
      title={title}
      description={description}
    >
      <div className="flex flex-col gap-4">
        <AuthError message={error} className={errorClassName} />

        {showAddAction ? (
          <div className="flex items-center gap-2">
            {showNameField ? (
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={namePlaceholder}
                aria-label={namePlaceholder}
                disabled={isAdding}
              />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleAdd()}
              loading={isAdding}
            >
              {isAdding ? addingLabel : addLabel}
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <Text variant="secondary">{loadingLabel}</Text>
        ) : passkeys === null || passkeys.length === 0 ? (
          <Text variant="secondary">{emptyLabel}</Text>
        ) : (
          <ul className="flex flex-col gap-3">
            {passkeys.map((passkey) => (
              <PasskeyRow
                key={passkey.id}
                passkey={passkey}
                isDeleting={deletingId === passkey.id}
                syncedBadgeLabel={syncedBadgeLabel}
                createdPrefix={createdPrefix}
                formatTimestamp={formatTimestamp}
                deleteLabel={deleteLabel}
                deletingLabel={deletingLabel}
                onDelete={() => void handleDelete(passkey)}
              />
            ))}
          </ul>
        )}
      </div>
    </AuthCard>
  );
}

interface PasskeyRowProps {
  passkey: AuthPasskey;
  isDeleting: boolean;
  syncedBadgeLabel: string;
  createdPrefix: string;
  formatTimestamp: (value: string | Date) => string;
  deleteLabel: string;
  deletingLabel: string;
  onDelete: () => void;
}

function PasskeyRow({
  passkey,
  isDeleting,
  syncedBadgeLabel,
  createdPrefix,
  formatTimestamp,
  deleteLabel,
  deletingLabel,
  onDelete,
}: PasskeyRowProps): ReactNode {
  const createdAt =
    passkey.createdAt !== undefined ? formatTimestamp(passkey.createdAt) : "";

  return (
    <li className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-foreground min-w-0 truncate text-sm font-medium">
            {passkeyLabel(passkey)}
          </span>
          {passkey.backedUp ? (
            <span className="text-muted-foreground text-xs">
              {syncedBadgeLabel}
            </span>
          ) : null}
        </div>
        {createdAt.length > 0 ? (
          <div className="text-muted-foreground text-xs">
            {createdPrefix}: {createdAt}
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onDelete}
        loading={isDeleting}
      >
        {isDeleting ? deletingLabel : deleteLabel}
      </Button>
    </li>
  );
}
