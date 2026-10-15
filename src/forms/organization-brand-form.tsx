import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import {
  brandMetadataValue,
  mergeMetadataKey,
  ORGANIZATION_BRAND_KEY,
  readOrganizationBrand,
  type OrganizationBrand,
} from "../lib/organization-metadata";
import type { AuthOrganizationFull } from "../types";

export interface OrganizationBrandFormProps {
  className?: string;
  disabled?: boolean;
  onSaved?: () => void;
}

const emptyBrand: OrganizationBrand = {
  primaryColor: "",
  accentColor: "",
  website: "",
  emailFromName: "",
  emailReplyTo: "",
};

/**
 * Workspace brand stored on organization metadata under `brand`.
 * Product chrome stays with the host.
 */
export function OrganizationBrandForm({
  className,
  disabled = false,
  onSaved,
}: OrganizationBrandFormProps) {
  const client = useAuth();
  const [organization, setOrganization] = useState<AuthOrganizationFull | null>(
    null,
  );
  const [brand, setBrand] = useState<OrganizationBrand>(emptyBrand);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (client.organization?.getFullOrganization === undefined) {
      setError("Workspace brand is not available.");
      return;
    }
    let cancelled = false;
    void client.organization.getFullOrganization().then((response) => {
      if (cancelled || response.error !== null || !response.data) return;
      setOrganization(response.data);
      setBrand(readOrganizationBrand(response.data.metadata));
    });
    return () => {
      cancelled = true;
    };
  }, [client]);

  function setField(key: keyof OrganizationBrand, value: string) {
    setBrand((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (
      disabled ||
      organization === null ||
      client.organization?.update === undefined
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const metadata = mergeMetadataKey(
        organization.metadata,
        ORGANIZATION_BRAND_KEY,
        brandMetadataValue(brand),
      );
      const response = await client.organization.update({
        data: { metadata },
        organizationId: organization.id,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not save brand.");
        return;
      }
      setOrganization({ ...organization, metadata });
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save brand.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      variant="settings"
      className={className}
      title="Brand"
      description="Colors and the name recipients see on email from this workspace."
    >
      <div className="flex flex-col gap-4">
        <AuthError message={error} />
        <Input
          label="Primary color"
          value={brand.primaryColor}
          disabled={disabled}
          placeholder="#111111"
          onValueChange={(value) => {
            setField("primaryColor", value);
          }}
        />
        <Input
          label="Accent color"
          value={brand.accentColor}
          disabled={disabled}
          placeholder="#0052cc"
          onValueChange={(value) => {
            setField("accentColor", value);
          }}
        />
        <Input
          label="Website"
          value={brand.website}
          disabled={disabled}
          placeholder="https://"
          onValueChange={(value) => {
            setField("website", value);
          }}
        />
        <Input
          label="Email from name"
          value={brand.emailFromName}
          disabled={disabled}
          onValueChange={(value) => {
            setField("emailFromName", value);
          }}
        />
        <Input
          label="Reply-to"
          type="email"
          value={brand.emailReplyTo}
          disabled={disabled}
          onValueChange={(value) => {
            setField("emailReplyTo", value);
          }}
        />
        <Button
          type="button"
          variant="primary"
          disabled={disabled || pending || organization === null}
          onClick={() => {
            void save();
          }}
        >
          {pending ? "Saving…" : "Save brand"}
        </Button>
      </div>
    </AuthCard>
  );
}
