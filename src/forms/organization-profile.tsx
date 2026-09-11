import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthOrganizationFull } from "../types";

export interface OrganizationProfileProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  nameLabel?: string;
  slugLabel?: string;
  logoLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
  deleteLabel?: string;
  deletingLabel?: string;
  deletedMessage?: string;
  /** Target a specific organization instead of the active session organization. */
  organizationId?: string;
  onUpdated?: (organization: AuthOrganizationFull) => void;
  onDeleted?: () => void;
}

/**
 * Manage the active Better Auth organization: edit name/slug/logo and delete.
 *
 * Loads the current full organization from `getFullOrganization`.
 */
export function OrganizationProfile({
  className,
  errorClassName,
  title = "Workspace settings",
  description = "Manage this workspace.",
  nameLabel = "Workspace name",
  slugLabel = "Slug",
  logoLabel = "Logo URL",
  saveLabel = "Save",
  savingLabel = "Saving…",
  deleteLabel = "Delete workspace",
  deletingLabel = "Deleting…",
  deletedMessage = "Workspace deleted.",
  organizationId: targetOrganizationId,
  onUpdated,
  onDeleted,
}: OrganizationProfileProps) {
  const client = useAuth();

  const [organization, setOrganization] = useState<AuthOrganizationFull | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (client.organization?.getFullOrganization === undefined) {
      setError("Organization profile is not available.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.organization.getFullOrganization({
        query: targetOrganizationId
          ? { organizationId: targetOrganizationId }
          : undefined,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load workspace.");
        return;
      }
      setOrganization(response.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load workspace.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [client]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (organization === null) return;

    if (client.organization?.update === undefined) {
      setError("Organization update is not available.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await client.organization.update({
        data: {
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          metadata: organization.metadata,
        },
        organizationId: targetOrganizationId,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not update workspace.");
      } else if (response.data) {
        onUpdated?.({ ...organization, ...response.data });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update workspace.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (organization === null) return;

    if (client.organization?.["delete"] === undefined) {
      setError("Organization deletion is not available.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await client.organization["delete"]({
        organizationId: targetOrganizationId ?? organization.id,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not delete workspace.");
      } else {
        onDeleted?.();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete workspace.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <Text variant="secondary">Loading…</Text>
      </AuthCard>
    );
  }

  if (organization === null) {
    return (
      <AuthCard className={className} title={title} description={description}>
        <AuthError message={error} className={errorClassName} />
        <Text variant="secondary">No active workspace found.</Text>
      </AuthCard>
    );
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <Input
          label={nameLabel}
          value={organization.name}
          onValueChange={(value) =>
            setOrganization((org) => (org ? { ...org, name: value } : org))
          }
          required
        />

        <Input
          label={slugLabel}
          value={organization.slug}
          onValueChange={(value) =>
            setOrganization((org) => (org ? { ...org, slug: value } : org))
          }
          required
        />

        <Input
          label={logoLabel}
          value={organization.logo ?? ""}
          onValueChange={(value) =>
            setOrganization((org) =>
              org ? { ...org, logo: value.length > 0 ? value : null } : org,
            )
          }
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isSaving}
        >
          {isSaving ? savingLabel : saveLabel}
        </Button>

        <hr className="border-kumo-hairline" />

        <Button
          type="button"
          variant="destructive"
          className="w-full"
          loading={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? deletingLabel : deleteLabel}
        </Button>
      </form>
    </AuthCard>
  );
}
