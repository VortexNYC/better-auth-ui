import { useEffect, useState } from "react";
import { Badge } from "@cloudflare/kumo/components/badge";
import { Button } from "@cloudflare/kumo/components/button";
import { ClipboardText } from "@cloudflare/kumo/components/clipboard-text";
import { Empty } from "@cloudflare/kumo/components/empty";
import { Table } from "@cloudflare/kumo/components/table";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import {
  SSO_DOMAIN_VERIFICATION_DEFAULT_PREFIX,
  ssoDomainVerificationHost,
  ssoProviderDomains,
} from "../lib/sso";
import type { SsoProviderRecord } from "../types";

export interface SsoProviderListProps {
  title?: string;
  description?: string;
  className?: string;
  errorClassName?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  addLabel?: string;
  /** Called when the "Add provider" action is clicked. */
  onAddProvider?: () => void;
  /** Called when a provider's "Edit" action is clicked. */
  onEditProvider?: (provider: SsoProviderRecord) => void;
  /** Called after a provider is deleted. */
  onDeleted?: (providerId: string) => void;
  /**
   * `domainVerification.tokenPrefix` configured on the server — used to
   * render the DNS owner name. Defaults to the plugin's
   * `"better-auth-token"`.
   */
  domainVerificationTokenPrefix?: string;
  /** Shown when the client was built without the `sso` plugin. */
  unavailableMessage?: string;
}

interface VerifyState {
  token?: string;
  loading?: boolean;
  checking?: boolean;
  message?: string | null;
}

/**
 * SSO providers the session user can administer — `GET /sso/providers`
 * (`@better-auth/sso`). The endpoint already filters to providers the
 * caller owns or administers via an organization role. Each row shows the
 * mapped domains and verification status, and supports delete plus the
 * domain-verification flow (`requestDomainVerification` → `verifyDomain`)
 * when those endpoints are enabled server-side.
 */
export function SsoProviderList({
  title = "SSO providers",
  description = "SAML and OIDC single sign-on configured for this workspace.",
  className,
  errorClassName,
  loadingLabel = "Loading providers…",
  emptyLabel = "No SSO providers configured.",
  addLabel = "Add provider",
  onAddProvider,
  onEditProvider,
  onDeleted,
  domainVerificationTokenPrefix = SSO_DOMAIN_VERIFICATION_DEFAULT_PREFIX,
  unavailableMessage = "SSO administration is not available.",
}: SsoProviderListProps) {
  const client = useAuth();

  const [providers, setProviders] = useState<SsoProviderRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verifyState, setVerifyState] = useState<Record<string, VerifyState>>(
    {},
  );

  const sso = client.sso;
  const canVerify =
    sso?.requestDomainVerification !== undefined &&
    sso?.verifyDomain !== undefined;

  async function load() {
    setError(null);

    if (sso?.providers === undefined) {
      setError(unavailableMessage);
      setIsLoading(false);
      return;
    }

    try {
      const response = await sso.providers();
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load SSO providers.");
        setProviders([]);
        return;
      }
      const list = response.data?.providers;
      setProviders(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load SSO providers.",
      );
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [client]);

  async function handleDelete(providerId: string) {
    if (sso?.deleteProvider === undefined) {
      setError("Deleting SSO providers is not available.");
      return;
    }
    setDeletingId(providerId);
    setError(null);
    try {
      const response = await sso.deleteProvider({ providerId });
      if (response.error !== null) {
        setError(
          response.error.message ?? "Could not delete the SSO provider.",
        );
        return;
      }
      setProviders(
        (current) =>
          current?.filter((item) => item.providerId !== providerId) ?? [],
      );
      onDeleted?.(providerId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete the SSO provider.",
      );
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleShowVerification(provider: SsoProviderRecord) {
    if (sso?.requestDomainVerification === undefined) return;
    setExpandedId(provider.providerId);
    setVerifyState((current) => ({
      ...current,
      [provider.providerId]: { ...current[provider.providerId], loading: true },
    }));
    setError(null);
    try {
      const response = await sso.requestDomainVerification({
        providerId: provider.providerId,
      });
      if (response.error !== null) {
        setVerifyState((current) => ({
          ...current,
          [provider.providerId]: {
            loading: false,
            message:
              response.error?.message ??
              "Could not load the domain verification token.",
          },
        }));
        return;
      }
      setVerifyState((current) => ({
        ...current,
        [provider.providerId]: {
          loading: false,
          token: response.data?.domainVerificationToken,
        },
      }));
    } catch (err) {
      setVerifyState((current) => ({
        ...current,
        [provider.providerId]: {
          loading: false,
          message:
            err instanceof Error
              ? err.message
              : "Could not load the domain verification token.",
        },
      }));
    }
  }

  async function handleVerifyDomain(provider: SsoProviderRecord) {
    if (sso?.verifyDomain === undefined) return;
    setVerifyState((current) => ({
      ...current,
      [provider.providerId]: {
        ...current[provider.providerId],
        checking: true,
        message: null,
      },
    }));
    try {
      const response = await sso.verifyDomain({
        providerId: provider.providerId,
      });
      if (response.error !== null) {
        setVerifyState((current) => ({
          ...current,
          [provider.providerId]: {
            ...current[provider.providerId],
            checking: false,
            message:
              response.error?.message ??
              "Verification failed — check the TXT record and try again.",
          },
        }));
        return;
      }
      setProviders(
        (current) =>
          current?.map((item) =>
            item.providerId === provider.providerId
              ? { ...item, domainVerified: true }
              : item,
          ) ?? [],
      );
      setExpandedId(null);
      setVerifyState((current) => ({
        ...current,
        [provider.providerId]: { checking: false },
      }));
    } catch (err) {
      setVerifyState((current) => ({
        ...current,
        [provider.providerId]: {
          ...current[provider.providerId],
          checking: false,
          message:
            err instanceof Error
              ? err.message
              : "Verification failed — check the TXT record and try again.",
        },
      }));
    }
  }

  if (sso?.providers === undefined) {
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

  return (
    <AuthCard
      variant="settings"
      className={className}
      title={title}
      description={description}
    >
      <div className="flex flex-col gap-4">
        <AuthError message={error} className={errorClassName} />

        {onAddProvider !== undefined ? (
          <div className="flex justify-end">
            <Button type="button" variant="primary" onClick={onAddProvider}>
              {addLabel}
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <Text variant="secondary">{loadingLabel}</Text>
        ) : providers === null || providers.length === 0 ? (
          <Empty title={emptyLabel} />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Provider</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Domains</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {providers.map((provider) => {
                const domains = ssoProviderDomains(provider.domain);
                const verified = provider.domainVerified === true;
                const state = verifyState[provider.providerId];
                return (
                  <ProviderRow
                    key={provider.providerId}
                    provider={provider}
                    domains={domains}
                    verified={verified}
                    expanded={expandedId === provider.providerId}
                    verifyState={state}
                    identifier={ssoDomainVerificationHost(
                      provider.providerId,
                      domainVerificationTokenPrefix,
                    )}
                    canVerify={canVerify}
                    canDelete={sso.deleteProvider !== undefined}
                    canEdit={onEditProvider !== undefined}
                    isDeleting={deletingId === provider.providerId}
                    confirmDelete={confirmDeleteId === provider.providerId}
                    onEdit={() => onEditProvider?.(provider)}
                    onToggleVerify={() => {
                      if (expandedId === provider.providerId) {
                        setExpandedId(null);
                      } else {
                        void handleShowVerification(provider);
                      }
                    }}
                    onVerify={() => void handleVerifyDomain(provider)}
                    onDelete={() => {
                      if (confirmDeleteId === provider.providerId) {
                        void handleDelete(provider.providerId);
                      } else {
                        setConfirmDeleteId(provider.providerId);
                      }
                    }}
                  />
                );
              })}
            </Table.Body>
          </Table>
        )}
      </div>
    </AuthCard>
  );
}

interface ProviderRowProps {
  provider: SsoProviderRecord;
  domains: string[];
  verified: boolean;
  expanded: boolean;
  verifyState: VerifyState | undefined;
  identifier: string;
  canVerify: boolean;
  canDelete: boolean;
  canEdit: boolean;
  isDeleting: boolean;
  confirmDelete: boolean;
  onEdit: () => void;
  onToggleVerify: () => void;
  onVerify: () => void;
  onDelete: () => void;
}

function ProviderRow({
  provider,
  domains,
  verified,
  expanded,
  verifyState,
  identifier,
  canVerify,
  canDelete,
  canEdit,
  isDeleting,
  confirmDelete,
  onEdit,
  onToggleVerify,
  onVerify,
  onDelete,
}: ProviderRowProps) {
  return (
    <Table.Row>
      <Table.Cell>{provider.providerId}</Table.Cell>
      <Table.Cell>{(provider.type ?? "oidc").toUpperCase()}</Table.Cell>
      <Table.Cell>
        {domains.length > 0 ? domains.join(", ") : (provider.domain ?? "—")}
      </Table.Cell>
      <Table.Cell>
        {provider.domainVerified === undefined ? (
          "—"
        ) : verified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        )}
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {canVerify && !verified ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onToggleVerify}
              >
                {expanded ? "Hide verification" : "Verify domain"}
              </Button>
            ) : null}
            {canEdit ? (
              <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                size="sm"
                variant={confirmDelete ? "destructive" : "ghost"}
                loading={isDeleting}
                onClick={onDelete}
              >
                {isDeleting
                  ? "Deleting…"
                  : confirmDelete
                    ? "Confirm delete"
                    : "Delete"}
              </Button>
            ) : null}
          </div>

          {expanded && !verified ? (
            <div className="flex flex-col gap-2">
              {verifyState?.loading ? (
                <Text variant="secondary" size="sm">
                  Loading verification record…
                </Text>
              ) : verifyState?.message ? (
                <Text variant="secondary" size="sm">
                  {verifyState.message}
                </Text>
              ) : verifyState?.token ? (
                <>
                  <Text variant="secondary" size="sm">
                    Add a TXT record
                    {domains.length > 1 ? " for each domain" : ""}:
                  </Text>
                  {(domains.length > 0 ? domains : [""]).map((domainName) => (
                    <div
                      key={domainName || "root"}
                      className="flex flex-col gap-1"
                    >
                      <Text variant="secondary" size="sm">
                        {domainName.length > 0
                          ? `${identifier}.${domainName}`
                          : `${identifier}.<your-domain>`}
                      </Text>
                      <ClipboardText
                        size="sm"
                        text={verifyState.token ?? ""}
                        tooltip={{
                          text: "Copy TXT value",
                          copiedText: "Copied",
                          side: "top",
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      loading={verifyState.checking}
                      onClick={onVerify}
                    >
                      {verifyState.checking ? "Checking…" : "Check DNS"}
                    </Button>
                  </div>
                </>
              ) : (
                <Text variant="secondary" size="sm">
                  No pending verification token was returned.
                </Text>
              )}
            </div>
          ) : null}
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
