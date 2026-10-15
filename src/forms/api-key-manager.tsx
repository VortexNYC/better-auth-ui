import { useState, type FormEvent } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { ClipboardText } from "@cloudflare/kumo/components/clipboard-text";
import { Dialog } from "@cloudflare/kumo/components/dialog";
import { Empty } from "@cloudflare/kumo/components/empty";
import { Input } from "@cloudflare/kumo/components/input";
import { Table } from "@cloudflare/kumo/components/table";
import { Text } from "@cloudflare/kumo/components/text";
import { Textarea } from "@cloudflare/kumo";

import { AuthError } from "../auth-primitives";

export interface ApiKeyRecord {
  id: string;
  name: string;
  publicId?: string;
  scopes: readonly string[];
  /** Empty means the key is not limited to an IP range. */
  allowedIpRanges?: readonly string[];
  createdAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
}

export interface ApiKeyCreatedSecret {
  name: string;
  secret: string;
}

export interface ApiKeyManagerProps {
  keys: readonly ApiKeyRecord[];
  scopeOptions: readonly string[];
  canManage?: boolean;
  isLoading?: boolean;
  onCreate: (input: {
    name: string;
    scopes: string[];
    allowedIpRanges: string[];
  }) => Promise<ApiKeyCreatedSecret>;
  onRevoke: (id: string) => Promise<void>;
  formatTimestamp?: (value: string | null | undefined) => string;
}

/** One range per line or comma. Blank lines are dropped. */
export function parseApiKeyAllowedIpRanges(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

/**
 * API keys with a one-time secret reveal. The host owns the API.
 */
export function ApiKeyManager({
  keys,
  scopeOptions,
  canManage = true,
  isLoading = false,
  onCreate,
  onRevoke,
  formatTimestamp: format = formatTimestamp,
}: ApiKeyManagerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(
    scopeOptions[0] ? [scopeOptions[0]] : [],
  );
  const [ipRanges, setIpRanges] = useState("");
  const [created, setCreated] = useState<ApiKeyCreatedSecret | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || scopes.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const secret = await onCreate({
        name: name.trim(),
        scopes,
        allowedIpRanges: parseApiKeyAllowedIpRanges(ipRanges),
      });
      setCreated(secret);
      setName("");
      setIpRanges("");
      setScopes(scopeOptions[0] ? [scopeOptions[0]] : []);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the key.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          disabled={!canManage}
          onClick={() => {
            setOpen(true);
          }}
        >
          Create API key
        </Button>
      </div>
      <AuthError message={error} />
      {isLoading ? (
        <Text variant="secondary">Loading…</Text>
      ) : keys.length === 0 ? (
        <Empty title="No API keys" description="Create a key to get started." />
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Public ID</Table.Head>
              <Table.Head>Scopes</Table.Head>
              <Table.Head>Allowed IPs</Table.Head>
              <Table.Head>Created</Table.Head>
              <Table.Head>Last used</Table.Head>
              <Table.Head>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {keys.map((key) => (
              <Table.Row key={key.id}>
                <Table.Cell>{key.name}</Table.Cell>
                <Table.Cell>{key.publicId ?? "—"}</Table.Cell>
                <Table.Cell>{key.scopes.join(", ")}</Table.Cell>
                <Table.Cell>
                  {key.allowedIpRanges && key.allowedIpRanges.length > 0
                    ? key.allowedIpRanges.join(", ")
                    : "Any"}
                </Table.Cell>
                <Table.Cell>{format(key.createdAt)}</Table.Cell>
                <Table.Cell>{format(key.lastUsedAt)}</Table.Cell>
                <Table.Cell>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={!canManage || Boolean(key.revokedAt)}
                    onClick={() => {
                      void onRevoke(key.id).catch((err: unknown) => {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Could not revoke the key.",
                        );
                      });
                    }}
                  >
                    Revoke
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog size="sm" className="flex flex-col gap-4 p-6">
          <Dialog.Title>Create API key</Dialog.Title>
          <Dialog.Description>
            Name the key and choose what it can do. The secret is shown once.
          </Dialog.Description>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <Input label="Name" value={name} onValueChange={setName} required />
            <div className="flex flex-col gap-2">
              <Text as="span" variant="secondary" size="sm">
                Scopes
              </Text>
              {scopeOptions.map((scope) => (
                <Checkbox
                  key={scope}
                  label={scope}
                  checked={scopes.includes(scope)}
                  onCheckedChange={(checked) => {
                    const active = checked === true;
                    setScopes((current) =>
                      active
                        ? [...new Set([...current, scope])]
                        : current.filter((item) => item !== scope),
                    );
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Text as="span" variant="secondary" size="sm">
                Allowed IP ranges
              </Text>
              <Textarea
                aria-label="Allowed IP ranges"
                rows={3}
                value={ipRanges}
                placeholder={"One CIDR per line. Empty means any address."}
                onChange={(event) => {
                  setIpRanges(event.target.value);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={pending || !name.trim() || scopes.length === 0}
              >
                {pending ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root
        open={created !== null}
        onOpenChange={(next) => {
          if (!next) setCreated(null);
        }}
      >
        <Dialog size="sm" className="flex flex-col gap-4 p-6">
          <Dialog.Title>API key created</Dialog.Title>
          <Dialog.Description>
            Copy {created?.name ?? "this key"} now. It will not be shown again.
          </Dialog.Description>
          {created ? (
            <ClipboardText
              size="base"
              text={created.secret}
              tooltip={{
                text: "Copy token",
                copiedText: "Copied",
                side: "top",
              }}
            />
          ) : null}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreated(null);
              }}
            >
              Close
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  );
}
