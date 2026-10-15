import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { Input } from "@cloudflare/kumo/components/input";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import {
  mergeMetadataKey,
  ORGANIZATION_SECURITY_KEY,
  readOrganizationSecurity,
  securityMetadataValue,
  type OrganizationSecurityPolicy,
} from "../lib/organization-metadata";
import type { AuthOrganizationFull } from "../types";

export interface OrganizationSecurityFormProps {
  className?: string;
  disabled?: boolean;
  onSaved?: () => void;
}

/**
 * Workspace MFA requirement and session timeout.
 * Stored on organization metadata under `security`. Other metadata keys stay.
 */
export function OrganizationSecurityForm({
  className,
  disabled = false,
  onSaved,
}: OrganizationSecurityFormProps) {
  const client = useAuth();
  const [organization, setOrganization] = useState<AuthOrganizationFull | null>(
    null,
  );
  const [policy, setPolicy] = useState<OrganizationSecurityPolicy>({
    requireMfa: false,
    sessionTimeoutMinutes: null,
  });
  const [timeoutText, setTimeoutText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (client.organization?.getFullOrganization === undefined) {
      setError("Workspace security is not available.");
      return;
    }
    let cancelled = false;
    void client.organization.getFullOrganization().then((response) => {
      if (cancelled || response.error !== null || !response.data) return;
      const next = readOrganizationSecurity(response.data.metadata);
      setOrganization(response.data);
      setPolicy(next);
      setTimeoutText(
        next.sessionTimeoutMinutes === null
          ? ""
          : String(next.sessionTimeoutMinutes),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [client]);

  async function save() {
    if (
      disabled ||
      organization === null ||
      client.organization?.update === undefined
    ) {
      return;
    }
    const minutes =
      timeoutText.trim().length === 0 ? null : Number(timeoutText.trim());
    setPending(true);
    setError(null);
    try {
      const nextPolicy = {
        requireMfa: policy.requireMfa,
        sessionTimeoutMinutes: minutes,
      };
      const metadata = mergeMetadataKey(
        organization.metadata,
        ORGANIZATION_SECURITY_KEY,
        securityMetadataValue(nextPolicy),
      );
      const response = await client.organization.update({
        data: { metadata },
        organizationId: organization.id,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not save security policy.");
        return;
      }
      setOrganization({ ...organization, metadata });
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save security policy.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      variant="settings"
      className={className}
      title="Workspace security"
      description="Require MFA for members, and cap how long a session stays active."
    >
      <div className="flex flex-col gap-4">
        <AuthError message={error} />
        <Checkbox
          label="Require two-factor authentication"
          checked={policy.requireMfa}
          disabled={disabled}
          onCheckedChange={(checked) => {
            setPolicy((current) => ({
              ...current,
              requireMfa: checked === true,
            }));
          }}
        />
        <Input
          label="Session timeout (minutes)"
          value={timeoutText}
          disabled={disabled}
          placeholder="15–1440, or empty for the platform default"
          onValueChange={setTimeoutText}
        />
        <Button
          type="button"
          variant="primary"
          disabled={disabled || pending || organization === null}
          onClick={() => {
            void save();
          }}
        >
          {pending ? "Saving…" : "Save security policy"}
        </Button>
      </div>
    </AuthCard>
  );
}
