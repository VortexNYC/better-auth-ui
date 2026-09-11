import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Select } from "@cloudflare/kumo/components/select";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthOrganization } from "../types";

export interface OrganizationSwitcherProps {
  className?: string;
  errorClassName?: string;
  currentOrganizationId?: string | null;
  title?: string;
  description?: string;
  placeholder?: string;
  createLabel?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  personalAccountLabel?: string;
  showPersonalAccount?: boolean;
  showCreateButton?: boolean;
  onChange?: (organization: AuthOrganization | null) => void;
  onCreateOrganization?: () => void;
}

/**
 * Dropdown-style workspace switcher backed by Better Auth.
 *
 * Uses Kumo `Select` so the consumer does not need to build a custom popover.
 */
export function OrganizationSwitcher({
  className,
  errorClassName,
  currentOrganizationId,
  title = "Workspace",
  description = "Switch the active workspace.",
  placeholder = "Select a workspace…",
  createLabel = "Create workspace",
  loadingLabel = "Loading workspaces…",
  emptyLabel = "No workspaces found.",
  personalAccountLabel = "Personal account",
  showPersonalAccount = false,
  showCreateButton = true,
  onChange,
  onCreateOrganization,
}: OrganizationSwitcherProps) {
  const client = useAuth();

  const [organizations, setOrganizations] = useState<AuthOrganization[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    if (client.organization?.list === undefined) {
      setError("Workspace switching is not available.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await client.organization.list();
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load workspaces.");
        return;
      }
      setOrganizations(response.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load workspaces.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [client]);

  async function handleValueChange(value: string | null) {
    if (value === null) return;

    if (client.organization?.setActive === undefined) {
      setError("Set active workspace is not available.");
      return;
    }

    if (value === "__personal__") {
      const response = await client.organization.setActive({
        organizationId: null,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not switch workspace.");
        return;
      }
      onChange?.(null);
      return;
    }

    const organization = organizations?.find((o) => o.id === value);
    if (!organization) return;

    const response = await client.organization.setActive({
      organizationId: organization.id,
    });

    if (response.error !== null) {
      setError(response.error.message ?? "Could not switch workspace.");
      return;
    }

    onChange?.(organization);
  }

  if (isLoading) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <Text variant="secondary">{loadingLabel}</Text>
      </AuthCard>
    );
  }

  const items: Record<string, string> = {};
  if (showPersonalAccount) {
    items.__personal__ = personalAccountLabel;
  }
  for (const organization of organizations ?? []) {
    items[organization.id] = organization.name;
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        {(organizations ?? []).length === 0 ? (
          <Text variant="secondary">{emptyLabel}</Text>
        ) : (
          <Select
            value={currentOrganizationId ?? "__personal__"}
            onValueChange={handleValueChange}
            items={items}
            placeholder={placeholder}
          />
        )}

        {showCreateButton ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => onCreateOrganization?.()}
          >
            {createLabel}
          </Button>
        ) : null}
      </div>
    </AuthCard>
  );
}
