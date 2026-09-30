import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthSession } from "../types";

export interface SessionListProps {
  title?: string;
  description?: string;
  className?: string;
  errorClassName?: string;
  currentSessionToken?: string | null;
  showRevokeOthersAction?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  revokeLabel?: string;
  revokingLabel?: string;
  revokeOthersLabel?: string;
  revokingOthersLabel?: string;
  currentBadgeLabel?: string;
  lastActivePrefix?: string;
  formatTimestamp?: (value: string | Date) => string;
  onRevoke?: () => void;
}

function defaultFormatTimestamp(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

/** Clerk/AuthKit-style short label — never dump the raw UA into the row. */
function summarizeUserAgent(userAgent: string | null | undefined): string {
  if (userAgent === null || userAgent === undefined || userAgent.length === 0) {
    return "Device";
  }

  const ua = userAgent;
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/") && !ua.includes("Chrome/")
          ? "Safari"
          : ua.startsWith("curl/")
            ? "curl"
            : "Browser";

  const os = ua.includes("Android")
    ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad")
      ? "iOS"
      : ua.includes("Mac OS X") || ua.includes("Macintosh")
        ? "macOS"
        : ua.includes("Windows")
          ? "Windows"
          : ua.includes("Linux")
            ? "Linux"
            : null;

  return os === null ? browser : `${browser} on ${os}`;
}

/**
 * List active Better Auth sessions with per-session and bulk revoke actions.
 */
export function SessionList({
  title = "Active sessions",
  description = "Devices currently signed in to this account.",
  className,
  errorClassName,
  currentSessionToken,
  showRevokeOthersAction = true,
  loadingLabel = "Loading sessions…",
  emptyLabel = "No active sessions found.",
  revokeLabel = "Revoke",
  revokingLabel = "Revoking…",
  revokeOthersLabel = "Revoke other sessions",
  revokingOthersLabel = "Revoking…",
  currentBadgeLabel = "Current",
  lastActivePrefix = "Last active",
  formatTimestamp = defaultFormatTimestamp,
  onRevoke,
}: SessionListProps) {
  const client = useAuth();

  const [sessions, setSessions] = useState<AuthSession[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  async function load() {
    setError(null);

    if (client.listSessions === undefined) {
      setError("Session listing is not available.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await client.listSessions();
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load sessions.");
        return;
      }
      const data = Array.isArray(response.data) ? response.data : [];
      setSessions(data as AuthSession[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sessions.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [client]);

  const otherSessionCount =
    sessions?.filter((session) => session.token !== currentSessionToken)
      .length ?? 0;

  async function handleRevoke(session: AuthSession) {
    if (client.revokeSession === undefined) {
      setError("Session revocation is not available.");
      return;
    }

    setRevokingToken(session.token);
    setError(null);

    try {
      const response = await client.revokeSession({ token: session.token });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not revoke session.");
        return;
      }
      onRevoke?.();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not revoke session.",
      );
    } finally {
      setRevokingToken(null);
    }
  }

  async function handleRevokeOthers() {
    if (client.revokeOtherSessions === undefined) {
      setError("Revoking other sessions is not available.");
      return;
    }

    setIsRevokingOthers(true);
    setError(null);

    try {
      const response = await client.revokeOtherSessions();
      if (response.error !== null) {
        setError(response.error.message ?? "Could not revoke other sessions.");
        return;
      }
      onRevoke?.();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not revoke other sessions.",
      );
    } finally {
      setIsRevokingOthers(false);
    }
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

        {showRevokeOthersAction && otherSessionCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleRevokeOthers()}
            loading={isRevokingOthers}
          >
            {isRevokingOthers ? revokingOthersLabel : revokeOthersLabel}
          </Button>
        ) : null}

        {isLoading ? (
          <Text variant="secondary">{loadingLabel}</Text>
        ) : sessions === null || sessions.length === 0 ? (
          <Text variant="secondary">{emptyLabel}</Text>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map((session) => {
              const isCurrent = session.token === currentSessionToken;
              return (
                <SessionRow
                  key={session.id}
                  session={session}
                  isCurrent={isCurrent}
                  isRevoking={revokingToken === session.token}
                  currentBadgeLabel={currentBadgeLabel}
                  lastActivePrefix={lastActivePrefix}
                  formatTimestamp={formatTimestamp}
                  revokeLabel={revokeLabel}
                  revokingLabel={revokingLabel}
                  onRevoke={() => void handleRevoke(session)}
                />
              );
            })}
          </ul>
        )}
      </div>
    </AuthCard>
  );
}

interface SessionRowProps {
  session: AuthSession;
  isCurrent: boolean;
  isRevoking: boolean;
  currentBadgeLabel: string;
  lastActivePrefix: string;
  formatTimestamp: (value: string | Date) => string;
  revokeLabel: string;
  revokingLabel: string;
  onRevoke: () => void;
}

function SessionRow({
  session,
  isCurrent,
  isRevoking,
  currentBadgeLabel,
  lastActivePrefix,
  formatTimestamp,
  revokeLabel,
  revokingLabel,
  onRevoke,
}: SessionRowProps): ReactNode {
  const updatedAt =
    session.updatedAt !== undefined ? formatTimestamp(session.updatedAt) : "";

  return (
    <li className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-foreground min-w-0 truncate text-sm font-medium">
            {isCurrent
              ? currentBadgeLabel
              : summarizeUserAgent(session.userAgent)}
          </span>
          {isCurrent || !session.ipAddress ? null : (
            <span className="text-muted-foreground text-xs">
              {session.ipAddress}
            </span>
          )}
        </div>
        {updatedAt.length > 0 ? (
          <div className="text-muted-foreground text-xs">
            {lastActivePrefix}: {updatedAt}
          </div>
        ) : null}
      </div>

      {isCurrent ? null : (
        <Button
          type="button"
          variant="ghost"
          onClick={onRevoke}
          loading={isRevoking}
        >
          {isRevoking ? revokingLabel : revokeLabel}
        </Button>
      )}
    </li>
  );
}
