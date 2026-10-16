export const ORGANIZATION_SECURITY_KEY = "security";
export const ORGANIZATION_BRAND_KEY = "brand";

export const SESSION_TIMEOUT_MIN = 15;
export const SESSION_TIMEOUT_MAX = 1440;

export interface OrganizationSecurityPolicy {
  requireMfa: boolean;
  sessionTimeoutMinutes: number | null;
}

export interface OrganizationBrand {
  primaryColor: string;
  accentColor: string;
  website: string;
  emailFromName: string;
  emailReplyTo: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Better Auth returns organization metadata as a JSON string. Spreading that string writes one key per character. */
export function organizationMetadataRecord(
  metadata: unknown,
): Record<string, unknown> {
  if (typeof metadata === "string") {
    try {
      const parsed: unknown = JSON.parse(metadata);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return isRecord(metadata) ? metadata : {};
}

export function readOrganizationSecurity(
  metadata: unknown,
): OrganizationSecurityPolicy {
  const raw = organizationMetadataRecord(metadata)[ORGANIZATION_SECURITY_KEY];
  if (!isRecord(raw)) {
    return { requireMfa: false, sessionTimeoutMinutes: null };
  }
  const minutes = raw.sessionTimeoutMinutes;
  return {
    requireMfa: raw.requireMfa === true,
    sessionTimeoutMinutes:
      typeof minutes === "number" &&
      Number.isFinite(minutes) &&
      minutes >= SESSION_TIMEOUT_MIN &&
      minutes <= SESSION_TIMEOUT_MAX
        ? Math.round(minutes)
        : null,
  };
}

export function readOrganizationBrand(metadata: unknown): OrganizationBrand {
  const raw = organizationMetadataRecord(metadata)[ORGANIZATION_BRAND_KEY];
  const record = isRecord(raw) ? raw : {};
  const text = (key: string) =>
    typeof record[key] === "string" ? record[key] : "";
  return {
    primaryColor: text("primaryColor"),
    accentColor: text("accentColor"),
    website: text("website"),
    emailFromName: text("emailFromName"),
    emailReplyTo: text("emailReplyTo"),
  };
}

/** Patch one metadata key and leave every other key, including product fields, in place. */
export function mergeMetadataKey(
  metadata: unknown,
  key: string,
  value: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const next = { ...organizationMetadataRecord(metadata) };
  if (value === undefined || Object.keys(value).length === 0) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
}

export function securityMetadataValue(
  policy: OrganizationSecurityPolicy,
): Record<string, unknown> | undefined {
  const value: Record<string, unknown> = {};
  if (policy.requireMfa) value.requireMfa = true;
  if (policy.sessionTimeoutMinutes !== null) {
    if (
      policy.sessionTimeoutMinutes < SESSION_TIMEOUT_MIN ||
      policy.sessionTimeoutMinutes > SESSION_TIMEOUT_MAX
    ) {
      throw new Error(
        `Session timeout must be between ${SESSION_TIMEOUT_MIN} and ${SESSION_TIMEOUT_MAX} minutes.`,
      );
    }
    value.sessionTimeoutMinutes = policy.sessionTimeoutMinutes;
  }
  return Object.keys(value).length > 0 ? value : undefined;
}

export function brandMetadataValue(
  brand: OrganizationBrand,
): Record<string, unknown> | undefined {
  const value: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(brand)) {
    const trimmed = field.trim();
    if (trimmed.length > 0) value[key] = trimmed;
  }
  return Object.keys(value).length > 0 ? value : undefined;
}

export interface OrganizationAccessValue {
  allowApiAccess: boolean;
  ssoEnforced: boolean;
  /** One CIDR per line. Empty means no limit. */
  ipAllowlist: string;
  delegateOwnership: boolean;
}

export interface OrganizationRegional {
  timezone: string;
  currency: string;
  currencyKind: string;
}

export function readOrganizationRegional(
  metadata: unknown,
  defaults: OrganizationRegional = {
    timezone: "UTC",
    currency: "USD",
    currencyKind: "normal",
  },
): OrganizationRegional {
  const record = organizationMetadataRecord(metadata);
  const text = (key: keyof OrganizationRegional) =>
    typeof record[key] === "string" && record[key].length > 0
      ? record[key]
      : defaults[key];
  return {
    timezone: text("timezone"),
    currency: text("currency"),
    currencyKind: text("currencyKind"),
  };
}

/** Write regional fields and leave security, brand, and every other key in place. */
export function mergeOrganizationRegional(
  metadata: unknown,
  regional: OrganizationRegional,
): Record<string, unknown> {
  return {
    ...organizationMetadataRecord(metadata),
    timezone: regional.timezone.trim(),
    currency: regional.currency.trim(),
    currencyKind: regional.currencyKind.trim(),
  };
}

export function invitationAcceptHref(args: {
  origin: string;
  path: string;
  invitationId: string;
  param?: string;
}): string {
  const url = new URL(args.path, args.origin);
  url.searchParams.set(args.param ?? "token", args.invitationId);
  return url.toString();
}
