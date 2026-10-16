import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import { useAuth } from "../auth-provider";
import {
  brandMetadataValue,
  mergeMetadataKey,
  mergeOrganizationRegional,
  ORGANIZATION_BRAND_KEY,
  ORGANIZATION_SECURITY_KEY,
  readOrganizationBrand,
  readOrganizationRegional,
  readOrganizationSecurity,
  securityMetadataValue,
  type OrganizationAccessValue,
  type OrganizationBrand,
  type OrganizationRegional,
  type OrganizationSecurityPolicy,
} from "../lib/organization-metadata";
import type { AuthOrganizationFull } from "../types";
import {
  NativeButton,
  NativeError,
  NativeField,
  NativeScreen,
  NativeToggle,
  useNativePalette,
} from "./ui";

export type { OrganizationAccessValue } from "../lib/organization-metadata";

function useWorkspace(unavailable: string): {
  organization: AuthOrganizationFull | null;
  setOrganization: (organization: AuthOrganizationFull) => void;
  error: string | null;
  setError: (message: string | null) => void;
} {
  const client = useAuth();
  const [organization, setOrganization] = useState<AuthOrganizationFull | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client.organization?.getFullOrganization === undefined) {
      setError(unavailable);
      return;
    }
    let cancelled = false;
    void client.organization.getFullOrganization().then((response) => {
      if (cancelled || response.error !== null || !response.data) return;
      setOrganization(response.data);
    });
    return () => {
      cancelled = true;
    };
  }, [client, unavailable]);

  return { organization, setOrganization, error, setError };
}

export function NativeChangeEmailScreen({
  callbackURL,
  onSuccess,
}: {
  callbackURL?: string;
  onSuccess?: () => void;
}) {
  const client = useAuth();
  const palette = useNativePalette();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (client.changeEmail === undefined) {
      setError("Email change is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.changeEmail({
        newEmail: email.trim(),
        callbackURL,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not change email.");
        return;
      }
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change email.");
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen
      title="Change email"
      description="A verification link goes to the new address."
    >
      <NativeError message={error} />
      {sent ? (
        <Text style={{ color: palette.muted, fontSize: 15 }}>
          Check the new address for a verification link.
        </Text>
      ) : (
        <>
          <NativeField
            label="New email"
            value={email}
            keyboardType="email-address"
            placeholder="ada@example.com"
            onChangeText={setEmail}
          />
          <NativeButton
            label="Send verification"
            pending={pending}
            onPress={() => {
              void submit();
            }}
          />
        </>
      )}
    </NativeScreen>
  );
}

export function NativeOrganizationSecurityScreen({
  disabled = false,
  onSaved,
}: {
  disabled?: boolean;
  onSaved?: () => void;
}) {
  const client = useAuth();
  const { organization, setOrganization, error, setError } = useWorkspace(
    "Workspace security is not available.",
  );
  const [policy, setPolicy] = useState<OrganizationSecurityPolicy>({
    requireMfa: false,
    sessionTimeoutMinutes: null,
  });
  const [timeoutText, setTimeoutText] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (organization === null) return;
    const next = readOrganizationSecurity(organization.metadata);
    setPolicy(next);
    setTimeoutText(
      next.sessionTimeoutMinutes === null
        ? ""
        : String(next.sessionTimeoutMinutes),
    );
  }, [organization]);

  async function save() {
    if (
      disabled ||
      organization === null ||
      client.organization?.update === undefined
    ) {
      return;
    }
    const trimmed = timeoutText.trim();
    const minutes = trimmed.length === 0 ? null : Number(trimmed);
    if (minutes !== null && !Number.isFinite(minutes)) {
      setError("Session timeout must be a number of minutes.");
      return;
    }
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
    <NativeScreen
      title="Workspace security"
      description="Require MFA, and cap how long a session stays active."
    >
      <NativeError message={error} />
      <NativeToggle
        label="Require two-factor authentication"
        checked={policy.requireMfa}
        disabled={disabled}
        onChange={(checked) => {
          setPolicy((current) => ({ ...current, requireMfa: checked }));
        }}
      />
      <NativeField
        label="Session timeout (minutes)"
        value={timeoutText}
        keyboardType="number-pad"
        placeholder="15–1440, or empty"
        onChangeText={setTimeoutText}
      />
      <NativeButton
        label="Save security policy"
        pending={pending}
        disabled={disabled || organization === null}
        onPress={() => {
          void save();
        }}
      />
    </NativeScreen>
  );
}

const BRAND_FIELDS: ReadonlyArray<{
  key: keyof OrganizationBrand;
  label: string;
  placeholder?: string;
}> = [
  { key: "primaryColor", label: "Primary color", placeholder: "#2c271f" },
  { key: "accentColor", label: "Accent color", placeholder: "#867865" },
  { key: "website", label: "Website", placeholder: "https://" },
  { key: "emailFromName", label: "Email from name" },
  { key: "emailReplyTo", label: "Reply-to" },
];

export function NativeOrganizationBrandScreen({
  disabled = false,
  onSaved,
}: {
  disabled?: boolean;
  onSaved?: () => void;
}) {
  const client = useAuth();
  const { organization, setOrganization, error, setError } = useWorkspace(
    "Workspace brand is not available.",
  );
  const [brand, setBrand] = useState<OrganizationBrand>(
    readOrganizationBrand(undefined),
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (organization === null) return;
    setBrand(readOrganizationBrand(organization.metadata));
  }, [organization]);

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
    <NativeScreen
      title="Brand"
      description="Colors and the name people see on email from this workspace."
    >
      <NativeError message={error} />
      {BRAND_FIELDS.map((field) => (
        <NativeField
          key={field.key}
          label={field.label}
          value={brand[field.key]}
          placeholder={field.placeholder}
          onChangeText={(value) => {
            setBrand((current) => ({ ...current, [field.key]: value }));
          }}
        />
      ))}
      <NativeButton
        label="Save brand"
        pending={pending}
        disabled={disabled || organization === null}
        onPress={() => {
          void save();
        }}
      />
    </NativeScreen>
  );
}

export function NativeOrganizationRegionalScreen({
  disabled = false,
  defaults,
  onSaved,
}: {
  disabled?: boolean;
  defaults?: OrganizationRegional;
  onSaved?: () => void;
}) {
  const client = useAuth();
  const { organization, setOrganization, error, setError } = useWorkspace(
    "Workspace settings are not available.",
  );
  const [regional, setRegional] = useState<OrganizationRegional>(
    readOrganizationRegional(undefined, defaults),
  );
  const [pending, setPending] = useState(false);
  const defaultTimezone = defaults?.timezone;
  const defaultCurrency = defaults?.currency;
  const defaultKind = defaults?.currencyKind;

  useEffect(() => {
    if (organization === null) return;
    setRegional(
      readOrganizationRegional(organization.metadata, {
        timezone: defaultTimezone ?? "UTC",
        currency: defaultCurrency ?? "USD",
        currencyKind: defaultKind ?? "normal",
      }),
    );
  }, [organization, defaultTimezone, defaultCurrency, defaultKind]);

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
    <NativeScreen
      title="Regional defaults"
      description="Timezone and currency for this workspace."
    >
      <NativeError message={error} />
      <NativeField
        label="Timezone"
        value={regional.timezone}
        onChangeText={(timezone) => {
          setRegional((current) => ({ ...current, timezone }));
        }}
      />
      <NativeField
        label="Currency"
        value={regional.currency}
        onChangeText={(currency) => {
          setRegional((current) => ({ ...current, currency }));
        }}
      />
      <NativeField
        label="Currency kind"
        value={regional.currencyKind}
        onChangeText={(currencyKind) => {
          setRegional((current) => ({ ...current, currencyKind }));
        }}
      />
      <NativeButton
        label="Save regional defaults"
        pending={pending}
        disabled={disabled || organization === null}
        onPress={() => {
          void save();
        }}
      />
    </NativeScreen>
  );
}

export function NativeOrganizationAccessScreen({
  value,
  canEdit = true,
  canEditOwnership = canEdit,
  pending = false,
  ownershipPending = false,
  notice,
  onChange,
  onSubmit,
  onDelegateOwnershipChange,
}: {
  value: OrganizationAccessValue;
  canEdit?: boolean;
  canEditOwnership?: boolean;
  pending?: boolean;
  ownershipPending?: boolean;
  notice?: ReactNode;
  onChange: (value: OrganizationAccessValue) => void;
  onSubmit: () => void;
  onDelegateOwnershipChange?: (checked: boolean) => void;
}) {
  return (
    <NativeScreen
      title="Access"
      description="API access, company SSO, and the IP allowlist."
    >
      {notice}
      <NativeToggle
        label="Allow API access"
        checked={value.allowApiAccess}
        disabled={!canEdit}
        onChange={(allowApiAccess) => {
          onChange({ ...value, allowApiAccess });
        }}
      />
      <NativeToggle
        label="Require company SSO"
        checked={value.ssoEnforced}
        disabled={!canEdit}
        onChange={(ssoEnforced) => {
          onChange({ ...value, ssoEnforced });
        }}
      />
      <NativeField
        label="IP allowlist"
        value={value.ipAllowlist}
        multiline
        placeholder="One CIDR per line. Empty means no limit."
        onChangeText={(ipAllowlist) => {
          onChange({ ...value, ipAllowlist });
        }}
      />
      {onDelegateOwnershipChange ? (
        <NativeToggle
          label="Enable ownership transfer"
          checked={value.delegateOwnership}
          disabled={!canEditOwnership || ownershipPending}
          onChange={onDelegateOwnershipChange}
        />
      ) : null}
      <NativeButton
        label="Save changes"
        pending={pending}
        disabled={!canEdit}
        onPress={onSubmit}
      />
    </NativeScreen>
  );
}
