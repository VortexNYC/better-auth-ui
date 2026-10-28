import { useState } from "react";
import { Badge } from "@cloudflare/kumo/components/badge";
import { Banner } from "@cloudflare/kumo/components/banner";
import { Button } from "@cloudflare/kumo/components/button";
import { ClipboardText } from "@cloudflare/kumo/components/clipboard-text";
import { Input, Textarea } from "@cloudflare/kumo/components/input";
import { Select } from "@cloudflare/kumo/components/select";
import { Text } from "@cloudflare/kumo/components/text";
import { Info } from "@phosphor-icons/react";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import {
  SSO_DOMAIN_VERIFICATION_DEFAULT_PREFIX,
  ssoDomainVerificationHost,
  ssoOidcRedirectUrl,
  ssoProviderDomains,
  ssoSamlAcsUrl,
  ssoSpMetadataUrl,
} from "../lib/sso";
import type {
  AuthFormBaseProps,
  SsoOidcConfigInput,
  SsoProviderRecord,
  SsoProviderType,
  SsoSamlConfigInput,
} from "../types";

const ssoProviderBaseSchema = z.object({
  providerId: z.string().min(1, "Provider ID is required."),
  issuer: z.string().url("Issuer must be a valid URL."),
  domain: z
    .string()
    .min(1, "Domain is required.")
    .refine(
      (value) =>
        value
          .split(",")
          .map((item) => item.trim())
          .every((item) => item.length > 0),
      "Domains must be a comma-separated list without empty entries.",
    ),
});

interface SsoProviderFieldErrors {
  providerId?: string;
  issuer?: string;
  domain?: string;
  clientId?: string;
  clientSecret?: string;
  discoveryEndpoint?: string;
  entryPoint?: string;
  entityId?: string;
  cert?: string;
}

const urlSchema = z.string().url();

export interface SsoProviderFormProps extends AuthFormBaseProps {
  title?: string;
  description?: string;
  /**
   * Links the provider to an organization — sent as `organizationId` to
   * `POST /sso/register`. The session user must be an owner/admin of that
   * organization when the organization plugin is enabled.
   */
  organizationId?: string;
  /**
   * Existing provider to edit. When set the form is prefilled and submit
   * calls `sso.updateProvider` instead of `sso.register`; the protocol and
   * provider ID stay fixed (the update endpoint cannot change them).
   * Sanitized responses never return secrets — blank secret fields mean
   * "keep the stored value".
   */
  provider?: SsoProviderRecord;
  /** Initial protocol for a new provider. Ignored when `provider` is set. */
  providerType?: SsoProviderType;
  /**
   * `domainVerification.tokenPrefix` configured on the server — used to
   * render the DNS owner name `_​{prefix}-{providerId}`. Defaults to the
   * plugin's `"better-auth-token"`.
   */
  domainVerificationTokenPrefix?: string;
  /** Called with the server-returned provider after register/update. */
  onSaved?: (provider: SsoProviderRecord) => void;
  /** Shown when the client was built without the `sso` plugin methods. */
  unavailableMessage?: string;
  submitLabel?: string;
  submittingLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
}

/**
 * Org-admin SSO provider configuration form (`@better-auth/sso`).
 *
 * Registers a new SAML/OIDC provider via `sso.register`
 * (`POST /sso/register`) — or updates an existing one via
 * `sso.updateProvider` when `provider` is given. After save, the card shows
 * the URLs the IdP needs (OIDC redirect URI, or the SAML ACS + SP metadata
 * URLs derived from the response) and the domain-verification TXT record
 * when `domainVerification` is enabled server-side.
 */
export function SsoProviderForm({
  title = "Single sign-on",
  description = "Connect your identity provider so members can sign in with SSO.",
  organizationId,
  provider,
  providerType: initialProviderType = "oidc",
  domainVerificationTokenPrefix = SSO_DOMAIN_VERIFICATION_DEFAULT_PREFIX,
  onSaved,
  unavailableMessage = "SSO administration is not available.",
  submitLabel = "Register provider",
  submittingLabel = "Registering…",
  saveLabel = "Save provider",
  savingLabel = "Saving…",
  className,
  errorClassName,
  onSuccess,
}: SsoProviderFormProps) {
  const client = useAuth();
  const isEditing = provider !== undefined;

  const [providerType, setProviderType] = useState<SsoProviderType>(
    provider?.type ?? initialProviderType,
  );
  const [providerId, setProviderId] = useState(provider?.providerId ?? "");
  const [issuer, setIssuer] = useState(provider?.issuer ?? "");
  const [domain, setDomain] = useState(provider?.domain ?? "");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [discoveryEndpoint, setDiscoveryEndpoint] = useState(
    provider?.oidcConfig?.discoveryEndpoint ?? "",
  );
  const [scopes, setScopes] = useState(
    provider?.oidcConfig?.scopes?.join(", ") ?? "",
  );
  const [entryPoint, setEntryPoint] = useState(
    provider?.samlConfig?.entryPoint ?? "",
  );
  const [entityId, setEntityId] = useState("");
  const [metadataXml, setMetadataXml] = useState("");
  const [cert, setCert] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SsoProviderFieldErrors>({});
  const [saved, setSaved] = useState<SsoProviderRecord | null>(null);

  const sso = client.sso;
  const canSubmit = isEditing
    ? sso?.updateProvider !== undefined
    : sso?.register !== undefined;

  if (!canSubmit) {
    return (
      <AuthCard
        variant="settings"
        className={className}
        title={title}
        description={description}
      >
        <AuthError message={unavailableMessage} className={errorClassName} />
      </AuthCard>
    );
  }

  function validate(): SsoProviderFieldErrors | null {
    const errors: SsoProviderFieldErrors = {};

    const base = ssoProviderBaseSchema.safeParse({
      providerId: providerId.trim(),
      issuer: issuer.trim(),
      domain: domain.trim(),
    });
    if (!base.success) {
      const flattened = base.error.flatten().fieldErrors;
      errors.providerId = flattened.providerId?.[0];
      errors.issuer = flattened.issuer?.[0];
      errors.domain = flattened.domain?.[0];
    }

    if (providerType === "oidc") {
      if (!isEditing && clientId.trim().length === 0) {
        errors.clientId = "Client ID is required.";
      }
      if (!isEditing && clientSecret.trim().length === 0) {
        errors.clientSecret = "Client secret is required.";
      }
      if (
        discoveryEndpoint.trim().length > 0 &&
        !urlSchema.safeParse(discoveryEndpoint.trim()).success
      ) {
        errors.discoveryEndpoint = "Discovery endpoint must be a valid URL.";
      }
    } else {
      // The register schema requires entryPoint; update accepts a partial
      // samlConfig, so on edit it is validated only when provided.
      if (
        entryPoint.trim().length === 0
          ? !isEditing
          : !urlSchema.safeParse(entryPoint.trim()).success
      ) {
        errors.entryPoint =
          entryPoint.trim().length === 0
            ? "IdP SSO URL is required."
            : "IdP SSO URL must be a valid URL.";
      }
      if (!isEditing && metadataXml.trim().length === 0) {
        // Registering without IdP metadata XML: the register schema needs
        // `idpMetadata.entityID`, and a cert source is required when the
        // XML isn't there to carry certificates.
        if (entityId.trim().length === 0) {
          errors.entityId =
            "IdP entity ID is required when metadata XML is not provided.";
        }
        if (cert.trim().length === 0) {
          errors.cert =
            "IdP signing certificate is required when metadata XML is not provided.";
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  function buildOidcConfig(): SsoOidcConfigInput | undefined {
    const parsedScopes = scopes
      .split(/,|\n/)
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0);
    const config: SsoOidcConfigInput = {};
    if (clientId.trim().length > 0) config.clientId = clientId.trim();
    if (clientSecret.trim().length > 0) config.clientSecret = clientSecret;
    if (discoveryEndpoint.trim().length > 0) {
      config.discoveryEndpoint = discoveryEndpoint.trim();
    }
    if (parsedScopes.length > 0) config.scopes = parsedScopes;
    if (isEditing && Object.keys(config).length === 0) return undefined;
    return config;
  }

  function buildSamlConfig(): SsoSamlConfigInput | undefined {
    const config: SsoSamlConfigInput = {};
    if (entryPoint.trim().length > 0) config.entryPoint = entryPoint.trim();
    if (cert.trim().length > 0) config.cert = cert.trim();
    const metadata = metadataXml.trim();
    const entity = entityId.trim();
    if (metadata.length > 0) {
      config.idpMetadata =
        entity.length > 0 ? { metadata, entityID: entity } : { metadata };
    } else if (entity.length > 0) {
      config.idpMetadata = { entityID: entity };
    }
    if (isEditing && Object.keys(config).length === 0) return undefined;
    return config;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors = validate();
    if (errors !== null) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const savedProviderId = provider?.providerId ?? providerId.trim();
      const response = isEditing
        ? await sso?.updateProvider?.({
            providerId: savedProviderId,
            issuer: issuer.trim(),
            domain: domain.trim(),
            oidcConfig: providerType === "oidc" ? buildOidcConfig() : undefined,
            samlConfig: providerType === "saml" ? buildSamlConfig() : undefined,
          })
        : await sso?.register?.({
            providerId: savedProviderId,
            issuer: issuer.trim(),
            domain: domain.trim(),
            organizationId,
            oidcConfig: providerType === "oidc" ? buildOidcConfig() : undefined,
            samlConfig: providerType === "saml" ? buildSamlConfig() : undefined,
          });

      if (response === undefined || response.error !== null) {
        setError(
          response?.error?.message ??
            (isEditing
              ? "Could not update the SSO provider."
              : "Could not register the SSO provider."),
        );
        return;
      }

      const record = response.data ?? null;
      if (record !== null) setSaved(record);
      onSaved?.(record ?? { providerId: savedProviderId });
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Could not update the SSO provider."
            : "Could not register the SSO provider.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyDomain() {
    if (saved === null || sso?.verifyDomain === undefined) return;
    setIsVerifying(true);
    setError(null);
    try {
      const response = await sso.verifyDomain({
        providerId: saved.providerId,
      });
      if (response.error !== null) {
        setError(
          response.error.message ??
            "Domain verification failed — check the TXT record and try again.",
        );
        return;
      }
      setSaved({ ...saved, domainVerified: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Domain verification failed — check the TXT record and try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleRequestToken() {
    if (saved === null || sso?.requestDomainVerification === undefined) return;
    setIsVerifying(true);
    setError(null);
    try {
      const response = await sso.requestDomainVerification({
        providerId: saved.providerId,
      });
      if (response.error !== null) {
        setError(
          response.error.message ??
            "Could not load the domain verification token.",
        );
        return;
      }
      const token = response.data?.domainVerificationToken;
      if (typeof token === "string" && token.length > 0) {
        setSaved({ ...saved, domainVerificationToken: token });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load the domain verification token.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <AuthCard
      variant="settings"
      className={className}
      title={title}
      description={description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthError message={error} className={errorClassName} />

        {!isEditing ? (
          <Select
            label="Provider type"
            value={providerType}
            onValueChange={(value) => {
              if (value === "oidc" || value === "saml") {
                setProviderType(value);
              }
            }}
            items={{ oidc: "OIDC", saml: "SAML" }}
          />
        ) : null}

        {!isEditing ? (
          <Input
            label="Provider ID"
            value={providerId}
            onValueChange={setProviderId}
            error={fieldErrors.providerId}
            description="Unique identifier used in sign-in and callback URLs."
            required
          />
        ) : (
          <Text variant="secondary" size="sm">
            Provider ID: {provider.providerId} ({provider.type ?? providerType})
          </Text>
        )}

        <Input
          label="Issuer URL"
          value={issuer}
          onValueChange={setIssuer}
          error={fieldErrors.issuer}
          placeholder="https://idp.example.com"
          required
        />

        <Input
          label="Domain"
          value={domain}
          onValueChange={setDomain}
          error={fieldErrors.domain}
          description="Email domains routed to this provider — comma-separated for more than one."
          placeholder="acme.com"
          required
        />

        {providerType === "oidc" ? (
          <>
            <Input
              label="Client ID"
              value={clientId}
              onValueChange={setClientId}
              error={fieldErrors.clientId}
              required={!isEditing}
            />
            <Input
              label="Client secret"
              type="password"
              value={clientSecret}
              onValueChange={setClientSecret}
              error={fieldErrors.clientSecret}
              description={
                isEditing
                  ? "Leave blank to keep the current secret."
                  : undefined
              }
              required={!isEditing}
            />
            <Input
              label="Discovery endpoint"
              value={discoveryEndpoint}
              onValueChange={setDiscoveryEndpoint}
              error={fieldErrors.discoveryEndpoint}
              placeholder="https://idp.example.com/.well-known/openid-configuration"
              description="Optional — defaults to the issuer's well-known configuration."
            />
            <Input
              label="Scopes"
              value={scopes}
              onValueChange={setScopes}
              placeholder="openid, email, profile"
              description="Optional, comma-separated."
            />
          </>
        ) : (
          <>
            <Input
              label="IdP SSO URL (entry point)"
              value={entryPoint}
              onValueChange={setEntryPoint}
              error={fieldErrors.entryPoint}
              placeholder="https://idp.example.com/sso/saml"
              required={!isEditing}
            />
            <Textarea
              label="IdP metadata XML"
              value={metadataXml}
              onValueChange={setMetadataXml}
              rows={4}
              placeholder="<EntityDescriptor …>"
              description="Optional — when pasted, entity ID and certificates are read from the XML."
            />
            <Input
              label="IdP entity ID"
              value={entityId}
              onValueChange={setEntityId}
              error={fieldErrors.entityId}
              placeholder="https://idp.example.com/entity"
              required={!isEditing && metadataXml.trim().length === 0}
            />
            <Textarea
              label="IdP signing certificate (PEM)"
              value={cert}
              onValueChange={setCert}
              error={fieldErrors.cert}
              rows={4}
              placeholder="-----BEGIN CERTIFICATE-----"
              required={
                !isEditing &&
                metadataXml.trim().length === 0 &&
                cert.trim().length === 0
              }
            />
          </>
        )}

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting
            ? isEditing
              ? savingLabel
              : submittingLabel
            : isEditing
              ? saveLabel
              : submitLabel}
        </AuthSubmitButton>
      </form>

      {saved !== null ? (
        <SsoProviderSetupDetails
          provider={saved}
          tokenPrefix={domainVerificationTokenPrefix}
          canRequestToken={sso?.requestDomainVerification !== undefined}
          canVerify={sso?.verifyDomain !== undefined}
          isVerifying={isVerifying}
          onRequestToken={() => void handleRequestToken()}
          onVerify={() => void handleVerifyDomain()}
        />
      ) : null}
    </AuthCard>
  );
}

export interface SsoProviderSetupDetailsProps {
  provider: SsoProviderRecord;
  tokenPrefix?: string;
  canRequestToken?: boolean;
  canVerify?: boolean;
  isVerifying?: boolean;
  onRequestToken?: () => void;
  onVerify?: () => void;
}

/**
 * Post-save provider details: the redirect/ACS + SP-metadata URLs to paste
 * into the IdP, and the domain-verification TXT record when the domain is
 * not yet verified.
 */
export function SsoProviderSetupDetails({
  provider,
  tokenPrefix = SSO_DOMAIN_VERIFICATION_DEFAULT_PREFIX,
  canRequestToken = false,
  canVerify = false,
  isVerifying = false,
  onRequestToken,
  onVerify,
}: SsoProviderSetupDetailsProps) {
  const isSaml = provider.type === "saml" || provider.samlConfig != null;
  const acsUrl = ssoSamlAcsUrl(provider, provider.providerId);
  const spMetadataUrl = ssoSpMetadataUrl(provider, provider.providerId);
  const oidcRedirectUrl = ssoOidcRedirectUrl(provider, provider.providerId);
  const identifier = ssoDomainVerificationHost(
    provider.providerId,
    tokenPrefix,
  );
  const domains = ssoProviderDomains(provider.domain);
  const verified = provider.domainVerified === true;

  return (
    <div className="flex flex-col gap-3">
      <Banner
        variant="default"
        icon={<Info weight="fill" />}
        title={isSaml ? "SAML provider saved" : "OIDC provider saved"}
        description={`Configure these values at your identity provider for ${provider.providerId}.`}
      />

      <div className="flex items-center gap-2">
        <Text variant="secondary" size="sm">
          Domain status
        </Text>
        {provider.domainVerified === undefined ? null : verified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <Badge variant="warning">Pending verification</Badge>
        )}
      </div>

      {isSaml ? (
        <>
          {acsUrl !== null ? (
            <SetupUrlRow
              label="ACS URL — where the IdP posts SAML responses"
              value={acsUrl}
            />
          ) : null}
          {spMetadataUrl !== null ? (
            <SetupUrlRow
              label="SP metadata URL — import into the IdP"
              value={spMetadataUrl}
            />
          ) : null}
        </>
      ) : oidcRedirectUrl !== null ? (
        <SetupUrlRow
          label="Redirect URI — register at your identity provider"
          value={oidcRedirectUrl}
        />
      ) : null}

      {!verified && provider.domainVerificationToken !== undefined ? (
        <div className="flex flex-col gap-2">
          <Text variant="secondary" size="sm">
            Prove domain ownership — add this TXT record
            {domains.length > 1 ? "s" : ""} in DNS:
          </Text>
          {(domains.length > 0 ? domains : [""]).map((domainName) => (
            <div key={domainName || "root"} className="flex flex-col gap-1">
              <Text variant="secondary" size="sm">
                {domainName.length > 0
                  ? `${identifier}.${domainName}`
                  : `${identifier}.<your-domain>`}
              </Text>
              <ClipboardText
                size="sm"
                text={provider.domainVerificationToken ?? ""}
                tooltip={{
                  text: "Copy TXT value",
                  copiedText: "Copied",
                  side: "top",
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {!verified &&
      provider.domainVerificationToken === undefined &&
      canRequestToken ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onRequestToken}
          loading={isVerifying}
        >
          {isVerifying ? "Loading…" : "Show DNS verification record"}
        </Button>
      ) : null}

      {!verified && provider.domainVerificationToken !== undefined ? (
        canVerify ? (
          <Button
            type="button"
            variant="primary"
            onClick={onVerify}
            loading={isVerifying}
          >
            {isVerifying ? "Verifying…" : "Verify domain"}
          </Button>
        ) : null
      ) : null}
    </div>
  );
}

function SetupUrlRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="secondary" size="sm">
        {label}
      </Text>
      <ClipboardText
        size="sm"
        text={value}
        tooltip={{ text: "Copy URL", copiedText: "Copied", side: "top" }}
      />
    </div>
  );
}
