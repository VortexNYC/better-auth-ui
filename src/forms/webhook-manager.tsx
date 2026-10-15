import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Empty } from "@cloudflare/kumo/components/empty";
import { Input } from "@cloudflare/kumo/components/input";
import { Select } from "@cloudflare/kumo/components/select";
import { Table } from "@cloudflare/kumo/components/table";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthError } from "../auth-primitives";

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
}

export interface WebhookManagerProps {
  endpoints: readonly WebhookEndpointRecord[];
  deliveries: readonly WebhookDeliveryRecord[];
  eventOptions: readonly string[];
  canManage?: boolean;
  onCreate: (input: {
    name: string;
    url: string;
    events: string[];
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Webhook endpoints and delivery history. The host owns the API.
 */
export function WebhookManager({
  endpoints,
  deliveries,
  eventOptions,
  canManage = true,
  onCreate,
  onDelete,
}: WebhookManagerProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState(eventOptions[0] ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const statuses = [
    "all",
    ...new Set(deliveries.map((delivery) => delivery.status)),
  ];
  const visible = useMemo(
    () =>
      deliveries.filter(
        (delivery) =>
          statusFilter === "all" || delivery.status === statusFilter,
      ),
    [deliveries, statusFilter],
  );

  async function handleCreate(formEvent: FormEvent) {
    formEvent.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), url: url.trim(), events: [event] });
      setName("");
      setUrl("");
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
            <Select
              aria-label="Event"
              value={event}
              onValueChange={(value) => {
                if (value) setEvent(value);
              }}
              items={Object.fromEntries(
                eventOptions.map((item) => [item, item]),
              )}
            />
            <Button type="submit" variant="primary" disabled={pending}>
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
                <Table.Head>Status</Table.Head>
                <Table.Head>Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {endpoints.map((endpoint) => (
                <Table.Row key={endpoint.id}>
                  <Table.Cell>{endpoint.name}</Table.Cell>
                  <Table.Cell>{endpoint.url}</Table.Cell>
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
            if (value) setStatusFilter(value);
          }}
          items={Object.fromEntries(statuses.map((item) => [item, item]))}
        />
        {visible.length === 0 ? (
          <Empty
            title="No deliveries"
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
              {visible.map((delivery) => (
                <Table.Row key={delivery.id}>
                  <Table.Cell>{delivery.event}</Table.Cell>
                  <Table.Cell>{delivery.status}</Table.Cell>
                  <Table.Cell>{delivery.createdAt ?? "—"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </section>
    </div>
  );
}
