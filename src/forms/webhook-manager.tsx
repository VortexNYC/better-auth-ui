import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { ClipboardText } from "@cloudflare/kumo/components/clipboard-text";
import { Empty } from "@cloudflare/kumo/components/empty";
import { Input } from "@cloudflare/kumo/components/input";
import { Select } from "@cloudflare/kumo/components/select";
import { Table } from "@cloudflare/kumo/components/table";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthError } from "../auth-primitives";
import { pageSlice } from "../lib/page-window";

export interface WebhookEndpointRecord {
  id: string;
  name: string;
  url: string;
  events: readonly string[];
  status: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  endpointId: string;
  event: string;
  status: string;
  createdAt?: string | null;
  /** Retries are finished and the delivery will not be attempted again. */
  exhausted?: boolean;
}

export interface WebhookCreatedSecret {
  secret: string;
}

export interface WebhookManagerProps {
  endpoints: readonly WebhookEndpointRecord[];
  deliveries: readonly WebhookDeliveryRecord[];
  eventOptions: readonly string[];
  canManage?: boolean;
  pageSize?: number;
  onCreate: (input: {
    name: string;
    url: string;
    events: string[];
  }) => Promise<void | WebhookCreatedSecret>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Webhook endpoints and delivery history. The host owns the API.
 * A signing secret returned from `onCreate` is shown once.
 */
export function WebhookManager({
  endpoints,
  deliveries,
  eventOptions,
  canManage = true,
  pageSize = 25,
  onCreate,
  onDelete,
}: WebhookManagerProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(
    eventOptions[0] ? [eventOptions[0]] : [],
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const statuses = [
    "all",
    "exhausted",
    ...new Set(deliveries.map((delivery) => delivery.status)),
  ];
  const filtered = useMemo(
    () =>
      deliveries.filter((delivery) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "exhausted") return delivery.exhausted === true;
        return delivery.status === statusFilter;
      }),
    [deliveries, statusFilter],
  );
  const window = pageSlice(filtered, page, pageSize);

  async function handleCreate(formEvent: FormEvent) {
    formEvent.preventDefault();
    setPending(true);
    setError(null);
    setSecret(null);
    try {
      const created = await onCreate({
        name: name.trim(),
        url: url.trim(),
        events,
      });
      setName("");
      setUrl("");
      if (created && "secret" in created && created.secret.length > 0) {
        setSecret(created.secret);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the endpoint.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Text as="h2" variant="heading">
          Endpoints
        </Text>
        <AuthError message={error} />
        {secret ? (
          <div className="flex flex-col gap-2">
            <Text as="p" variant="secondary" size="sm">
              Copy the signing secret now. It will not be shown again.
            </Text>
            <ClipboardText
              size="base"
              text={secret}
              tooltip={{
                text: "Copy signing secret",
                copiedText: "Copied",
                side: "top",
              }}
            />
          </div>
        ) : null}
        {canManage ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input label="Name" value={name} onValueChange={setName} required />
            <Input
              label="URL"
              type="url"
              value={url}
              onValueChange={setUrl}
              required
            />
            <div className="flex flex-col gap-2">
              <Text as="span" variant="secondary" size="sm">
                Events
              </Text>
              {eventOptions.map((option) => (
                <Checkbox
                  key={option}
                  label={option}
                  checked={events.includes(option)}
                  onCheckedChange={(checked) => {
                    const active = checked === true;
                    setEvents((current) =>
                      active
                        ? [...new Set([...current, option])]
                        : current.filter((item) => item !== option),
                    );
                  }}
                />
              ))}
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={pending || events.length === 0}
            >
              {pending ? "Saving…" : "Add endpoint"}
            </Button>
          </form>
        ) : null}
        {endpoints.length === 0 ? (
          <Empty
            title="No webhook endpoints"
            description="Add an HTTPS URL to receive events."
          />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>URL</Table.Head>
                <Table.Head>Events</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {endpoints.map((endpoint) => (
                <Table.Row key={endpoint.id}>
                  <Table.Cell>{endpoint.name}</Table.Cell>
                  <Table.Cell>{endpoint.url}</Table.Cell>
                  <Table.Cell>{endpoint.events.join(", ")}</Table.Cell>
                  <Table.Cell>{endpoint.status}</Table.Cell>
                  <Table.Cell>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={!canManage}
                      onClick={() => {
                        void onDelete(endpoint.id).catch((err: unknown) => {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Could not delete the endpoint.",
                          );
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <Text as="h2" variant="heading">
          Deliveries
        </Text>
        <Select
          aria-label="Delivery status"
          value={statusFilter}
          onValueChange={(value) => {
            if (value) {
              setStatusFilter(value);
              setPage(1);
            }
          }}
          items={Object.fromEntries(statuses.map((item) => [item, item]))}
        />
        {window.items.length === 0 ? (
          <Empty
            title={
              statusFilter === "exhausted"
                ? "No exhausted deliveries"
                : "No deliveries"
            }
            description="Nothing matches this filter."
          />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Event</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>When</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {window.items.map((delivery) => (
                <Table.Row key={delivery.id}>
                  <Table.Cell>{delivery.event}</Table.Cell>
                  <Table.Cell>
                    {delivery.exhausted ? "exhausted" : delivery.status}
                  </Table.Cell>
                  <Table.Cell>{delivery.createdAt ?? "—"}</Table.Cell>
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
      </section>
    </div>
  );
}
