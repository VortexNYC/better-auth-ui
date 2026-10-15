import { useState } from "react";
import { Tabs } from "@cloudflare/kumo/components/tabs";

import {
  SecurityAuditList,
  type SecurityAuditRecord,
} from "./security-audit-list";
import { Table } from "@cloudflare/kumo/components/table";

export interface AdminUserRecord {
  id: string;
  email: string;
  name?: string | null;
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
}

/** Admin view of users, sessions, organizations, and the audit trail. */
export function AdminDashboard({
  users,
  sessions,
  organizations,
  audit,
}: AdminDashboardProps) {
  const [tab, setTab] = useState("users");

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
      {tab === "users" ? (
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
                <Table.Cell>{user.name ?? "—"}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : null}
      {tab === "sessions" ? (
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
                <Table.Cell>{session.userEmail}</Table.Cell>
                <Table.Cell>{session.createdAt ?? "—"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
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
