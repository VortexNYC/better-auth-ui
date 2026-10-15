import { Empty } from "@cloudflare/kumo/components/empty";
import { Table } from "@cloudflare/kumo/components/table";

export interface SecurityAuditRecord {
  id: string;
  action: string;
  actor: string;
  target?: string;
  createdAt?: string | null;
}

export interface SecurityAuditListProps {
  events: readonly SecurityAuditRecord[];
}

/** Security event trail. The host owns the query. */
export function SecurityAuditList({ events }: SecurityAuditListProps) {
  if (events.length === 0) {
    return (
      <Empty
        title="No security events"
        description="Sign-ins, role changes, and key actions show up here."
      />
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>When</Table.Head>
          <Table.Head>Action</Table.Head>
          <Table.Head>Actor</Table.Head>
          <Table.Head>Target</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {events.map((event) => (
          <Table.Row key={event.id}>
            <Table.Cell>{event.createdAt ?? "—"}</Table.Cell>
            <Table.Cell>{event.action}</Table.Cell>
            <Table.Cell>{event.actor}</Table.Cell>
            <Table.Cell>{event.target ?? "—"}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
