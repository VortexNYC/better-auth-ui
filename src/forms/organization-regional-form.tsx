import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import {
  mergeOrganizationRegional,
  readOrganizationRegional,
  type OrganizationRegional,
} from "../lib/organization-metadata";
import type { AuthOrganizationFull } from "../types";

export interface OrganizationRegionalFormProps {
  className?: string;
  disabled?: boolean;
  defaults?: OrganizationRegional;
  onSaved?: () => void;
}

/**
 * Timezone and currency on organization metadata.
 * Any product that shows money or local time can use this.
 */
export function OrganizationRegionalForm({
  className,
  disabled = false,
  defaults,
  onSaved,
}: OrganizationRegionalFormProps) {
  const client = useAuth();
  const [organization, setOrganization] = useState<AuthOrganizationFull | null>(
    null,
  );
  const [regional, setRegional] = useState<OrganizationRegional>(
    readOrganizationRegional(undefined, defaults),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const defaultTimezone = defaults?.timezone;
  const defaultCurrency = defaults?.currency;
  const defaultKind = defaults?.currencyKind;

  useEffect(() => {
    if (client.organization?.getFullOrganization === undefined) {
      setError("Workspace settings are not available.");
      return;
    }
    const fallback = {
      timezone: defaultTimezone ?? "UTC",
      currency: defaultCurrency ?? "USD",
      currencyKind: defaultKind ?? "normal",
    };
    let cancelled = false;
    void client.organization.getFullOrganization().then((response) => {
      if (cancelled || response.error !== null || !response.data) return;
      setOrganization(response.data);
      setRegional(readOrganizationRegional(response.data.metadata, fallback));
    });
    return () => {
      cancelled = true;
    };
  }, [client, defaultTimezone, defaultCurrency, defaultKind]);

  function setField(key: keyof OrganizationRegional, value: string) {
    setRegional((current) => ({ ...current, [key]: value }));
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
      const metadata = mergeOrganizationRegional(
        organization.metadata,
        regional,
      );
      const response = await client.organization.update({
        data: { metadata },
        organizationId: organization.id,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not save regional defaults.");
        return;
      }
      setOrganization({ ...organization, metadata });
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save regional defaults.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}
    >
      <div className="flex flex-col gap-1">
        <Text as="h2" variant="heading">
          Regional defaults
        </Text>
        <Text as="p" variant="secondary" size="sm">
          Timezone and currency for this workspace.
        </Text>
      </div>
      <AuthError message={error} />
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Timezone"
          value={regional.timezone}
          disabled={disabled}
          placeholder="UTC"
          onValueChange={(value) => {
            setField("timezone", value);
          }}
        />
        <Input
          label="Currency"
          value={regional.currency}
          disabled={disabled}
          placeholder="USD"
          onValueChange={(value) => {
            setField("currency", value);
          }}
        />
        <Input
          label="Currency kind"
          value={regional.currencyKind}
          disabled={disabled}
          placeholder="normal"
          onValueChange={(value) => {
            setField("currencyKind", value);
          }}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          disabled={disabled || pending || organization === null}
          onClick={() => {
            void save();
          }}
        >
          {pending ? "Saving…" : "Save regional defaults"}
        </Button>
      </div>
    </section>
  );
}
