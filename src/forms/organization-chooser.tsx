import { useEffect, useState } from "react";
import { Building } from "@phosphor-icons/react";
import { Button } from "@cloudflare/kumo/components/button";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthOrganization } from "../types";
import { CreateOrganizationForm } from "./create-organization-form";

export interface OrganizationChooserProps {
  className?: string;
  title?: string;
  description?: string;
  createLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Open the create form immediately, even when workspaces already exist. */
  startCreating?: boolean;
  onOpen: (organization: AuthOrganization) => void;
  onCreated?: (organization: AuthOrganization) => void;
}

/**
 * Pick a workspace or create one, then activate it.
 * The host navigates. This screen does not.
 */
export function OrganizationChooser({
  className,
  title = "Choose a workspace",
  description = "Open an existing workspace, or create a new one.",
  createLabel = "Create a new workspace",
  emptyTitle = "Create your workspace",
  emptyDescription = "One name. Then you are in.",
  startCreating = false,
  onOpen,
  onCreated,
}: OrganizationChooserProps) {
  const client = useAuth();
  const [organizations, setOrganizations] = useState<AuthOrganization[] | null>(
    null,
  );
  const [creating, setCreating] = useState(startCreating);
  const [error, setError] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (client.organization?.list === undefined) {
        setError("Workspace listing is not available.");
        setOrganizations([]);
        return;
      }

      try {
        const response = await client.organization.list();
        if (cancelled) return;
        if (response.error !== null) {
          setError(response.error.message ?? "Could not load workspaces.");
          setOrganizations([]);
          return;
        }
        setOrganizations(response.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not load workspaces.",
        );
        setOrganizations([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  async function activate(organization: AuthOrganization, created: boolean) {
    setError(null);
    setPendingSlug(organization.slug);

    try {
      if (client.organization?.setActive !== undefined) {
        const response = await client.organization.setActive({
          organizationSlug: organization.slug,
        });
        if (response.error !== null) {
          setError(response.error.message ?? "Could not open that workspace.");
          setPendingSlug(null);
          return;
        }
      }

      if (created && onCreated) {
        onCreated(organization);
        return;
      }
      onOpen(organization);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open that workspace.",
      );
      setPendingSlug(null);
    }
  }

  if (organizations === null) {
    return (
      <AuthCard title={title} description={description} className={className}>
        <Text as="p" variant="secondary" size="sm">
          Loading…
        </Text>
      </AuthCard>
    );
  }

  const showCreate = creating || organizations.length === 0;

  if (showCreate) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        {organizations.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => {
              setCreating(false);
            }}
          >
            Back
          </Button>
        ) : null}
        <CreateOrganizationForm
          title={emptyTitle}
          description={emptyDescription}
          showCancel={organizations.length > 0}
          onCancel={() => {
            setCreating(false);
          }}
          onSuccess={(organization) => {
            void activate(organization, true);
          }}
        />
        <AuthError message={error} />
      </div>
    );
  }

  return (
    <AuthCard title={title} description={description} className={className}>
      <AuthError message={error} />
      <div className="flex flex-col gap-2">
        {organizations.map((organization) => (
          <Button
            key={organization.id}
            type="button"
            variant="secondary"
            className="w-full justify-start"
            icon={<Building />}
            disabled={pendingSlug !== null}
            loading={pendingSlug === organization.slug}
            onClick={() => {
              void activate(organization, false);
            }}
          >
            <span className="flex min-w-0 flex-col items-start">
              <span className="truncate">{organization.name}</span>
              <span className="text-kumo-secondary truncate text-xs">
                {organization.slug}
              </span>
            </span>
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setCreating(true);
        }}
      >
        {createLabel}
      </Button>
    </AuthCard>
  );
}
