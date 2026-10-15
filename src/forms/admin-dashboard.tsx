import { useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Table } from "@cloudflare/kumo/components/table";
import { Tabs } from "@cloudflare/kumo/components/tabs";
import { Text } from "@cloudflare/kumo/components/text";

import {
  SecurityAuditList,
  type SecurityAuditRecord,
} from "./security-audit-list";

export interface AdminUserRecord {
  id: string;
  email: string;
  name?: string | null;
  banned?: boolean;
}

export interface AdminSessionRecord {
  id: string;
  userEmail: string;
  createdAt?: string | null;
}

export interface AdminOrganizationRecord {
  id: string;
  name: string;
  slug: string;
}

export interface AdminDashboardProps {
  users: readonly AdminUserRecord[];
  sessions: readonly AdminSessionRecord[];
  organizations: readonly AdminOrganizationRecord[];
  audit: readonly SecurityAuditRecord[];
  onBanUser?: (userId: string) => Promise<void>;
  onRevokeSession?: (sessionId: string) => Promise<void>;
}

/** Admin view of users, sessions, organizations, and the audit trail. */
export function AdminDashboard({
  users,
  sessions,
  organizations,
  audit,
  onBanUser,
  onRevokeSession,
}: AdminDashboardProps) {
  const [tab, setTab] = useState("users");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "users", label: "Users" },
          { value: "sessions", label: "Sessions" },
          { value: "organizations", label: "Organizations" },
          { value: "audit", label: "Audit" },
        ]}
      />
      {error ? (
        <Text as="p" variant="secondary" size="sm">
          {error}
        </Text>
      ) : null}
      {tab === "users" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Email</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUserId(user.id);
                      }}
                    >
                      {user.name ?? "—"}
                    </Button>
                  </Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {selectedUser ? (
            <aside className="flex flex-col gap-2">
              <Text as="h2" variant="heading">
                {selectedUser.name ?? selectedUser.email}
              </Text>
              <Text as="p" variant="secondary" size="sm">
                {selectedUser.email}
              </Text>
              <Text as="p" variant="secondary" size="sm">
                {selectedUser.banned ? "Banned" : "Active"}
              </Text>
              {onBanUser ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending || selectedUser.banned === true}
                  onClick={() => {
                    void run(() => onBanUser(selectedUser.id));
                  }}
                >
                  Ban user
                </Button>
              ) : null}
            </aside>
          ) : null}
        </div>
      ) : null}
      {tab === "sessions" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>User</Table.Head>
                <Table.Head>Started</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sessions.map((session) => (
                <Table.Row key={session.id}>
                  <Table.Cell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSessionId(session.id);
                      }}
                    >
                      {session.userEmail}
                    </Button>
                  </Table.Cell>
                  <Table.Cell>{session.createdAt ?? "—"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {selectedSession ? (
            <aside className="flex flex-col gap-2">
              <Text as="h2" variant="heading">
                Session
              </Text>
              <Text as="p" variant="secondary" size="sm">
                {selectedSession.userEmail}
              </Text>
              <Text as="p" variant="secondary" size="sm">
                {selectedSession.createdAt ?? "—"}
              </Text>
              {onRevokeSession ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => {
                    void run(() => onRevokeSession(selectedSession.id));
                  }}
                >
                  Revoke session
                </Button>
              ) : null}
            </aside>
          ) : null}
        </div>
      ) : null}
      {tab === "organizations" ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Slug</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {organizations.map((organization) => (
              <Table.Row key={organization.id}>
                <Table.Cell>{organization.name}</Table.Cell>
                <Table.Cell>{organization.slug}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : null}
      {tab === "audit" ? <SecurityAuditList events={audit} /> : null}
    </div>
  );
}
