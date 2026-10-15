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

export interface SecurityAuditServer {
  action: string;
  resourceType: string;
  actor: string;
  from: string;
  to: string;
  onActionChange: (value: string) => void;
  onResourceTypeChange: (value: string) => void;
  onActorChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  pageLabel: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface SecurityAuditListProps {
  events: readonly SecurityAuditRecord[];
  pageSize?: number;
  /**
   * Host-owned filters and cursor paging. When set, rows are rendered as given
   * and date filtering stays on the server.
   */
  server?: SecurityAuditServer;
}

/** Security event trail. The host owns the query. */
export function SecurityAuditList({
  events,
  pageSize = 25,
  server,
}: SecurityAuditListProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => events.filter((event) => withinDates(event.createdAt, from, to)),
    [events, from, to],
  );
  const window = pageSlice(filtered, page, pageSize);

  const rows = server ? events : window.items;

  return (
    <div className="flex flex-col gap-3">
      {server ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <Input
              label="Action"
              value={server.action}
              onValueChange={server.onActionChange}
            />
            <Input
              label="Resource type"
              value={server.resourceType}
              onValueChange={server.onResourceTypeChange}
            />
            <Input
              label="Actor"
              value={server.actor}
              onValueChange={server.onActorChange}
            />
            <Input
              label="From"
              type="datetime-local"
              value={server.from}
              onValueChange={server.onFromChange}
            />
            <Input
              label="To"
              type="datetime-local"
              value={server.to}
              onValueChange={server.onToChange}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="primary" onClick={server.onApply}>
              Apply filters
            </Button>
            <Button type="button" variant="secondary" onClick={server.onClear}>
              Clear
            </Button>
          </div>
          {server.error ? (
            <Text as="p" variant="secondary" size="sm">
              {server.error}
            </Text>
          ) : null}
        </div>
      ) : (
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
      )}
      {server?.isLoading ? (
        <Text as="p" variant="secondary" size="sm">
          Loading audit events…
        </Text>
      ) : rows.length === 0 ? (
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
            {rows.map((event) => (
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
      {server ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!server.hasPrevious || server.isLoading === true}
            onClick={server.onPrevious}
          >
            Previous
          </Button>
          <Text as="span" variant="secondary" size="sm">
            {server.pageLabel}
          </Text>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!server.hasNext || server.isLoading === true}
            onClick={server.onNext}
          >
            Next
          </Button>
        </div>
      ) : window.pages > 1 ? (
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
