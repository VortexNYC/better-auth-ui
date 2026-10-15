import { useMemo, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Empty } from "@cloudflare/kumo/components/empty";
import { Input } from "@cloudflare/kumo/components/input";
import { Table } from "@cloudflare/kumo/components/table";
import { Text } from "@cloudflare/kumo/components/text";

import { pageSlice, withinDates } from "../lib/page-window";

export interface SecurityAuditRecord {
  id: string;
  action: string;
  actor: string;
  target?: string;
  createdAt?: string | null;
}

export interface SecurityAuditListProps {
  events: readonly SecurityAuditRecord[];
  pageSize?: number;
}

/** Security event trail. The host owns the query. */
export function SecurityAuditList({
  events,
  pageSize = 25,
}: SecurityAuditListProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => events.filter((event) => withinDates(event.createdAt, from, to)),
    [events, from, to],
  );
  const window = pageSlice(filtered, page, pageSize);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Input
          label="From"
          type="date"
          value={from}
          onValueChange={(value) => {
            setFrom(value);
            setPage(1);
          }}
        />
        <Input
          label="To"
          type="date"
          value={to}
          onValueChange={(value) => {
            setTo(value);
            setPage(1);
          }}
        />
      </div>
      {window.items.length === 0 ? (
        <Empty
          title="No security events"
          description="Sign-ins, role changes, and key actions show up here."
        />
      ) : (
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
            {window.items.map((event) => (
              <Table.Row key={event.id}>
                <Table.Cell>{event.createdAt ?? "—"}</Table.Cell>
                <Table.Cell>{event.action}</Table.Cell>
                <Table.Cell>{event.actor}</Table.Cell>
                <Table.Cell>{event.target ?? "—"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      {window.pages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={window.page <= 1}
            onClick={() => {
              setPage(window.page - 1);
            }}
          >
            Previous
          </Button>
          <Text as="span" variant="secondary" size="sm">
            {window.page} / {window.pages}
          </Text>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={window.page >= window.pages}
            onClick={() => {
              setPage(window.page + 1);
            }}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
