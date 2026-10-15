import type { FormEvent, ReactNode } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { Text } from "@cloudflare/kumo/components/text";
import { Textarea } from "@cloudflare/kumo";

import type { OrganizationAccessValue } from "../lib/organization-metadata";

export type { OrganizationAccessValue } from "../lib/organization-metadata";

export interface OrganizationAccessFormProps {
  value: OrganizationAccessValue;
  canEdit?: boolean;
  canEditOwnership?: boolean;
  pending?: boolean;
  ownershipPending?: boolean;
  notice?: ReactNode;
  onChange: (value: OrganizationAccessValue) => void;
  onSubmit: () => void;
  onDelegateOwnershipChange?: (checked: boolean) => void;
}

/**
 * API access, company SSO, and the IP allowlist.
 * The host stores and enforces the policy. Ownership transfer is optional.
 */
export function OrganizationAccessForm({
  value,
  canEdit = true,
  canEditOwnership = canEdit,
  pending = false,
  ownershipPending = false,
  notice,
  onChange,
  onSubmit,
  onDelegateOwnershipChange,
}: OrganizationAccessFormProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {notice}
      <section className="flex flex-col gap-3">
        <Text as="h2" variant="heading">
          API access
        </Text>
        <Text as="p" variant="secondary" size="sm">
          Programmatic access and company SSO. SSO needs an identity provider
          registered first. Owners can always turn it off.
        </Text>
        <Checkbox
          label="Allow API access"
          checked={value.allowApiAccess}
          disabled={!canEdit}
          onCheckedChange={(checked) => {
            onChange({ ...value, allowApiAccess: checked === true });
          }}
        />
        <Checkbox
          label="Require company SSO"
          checked={value.ssoEnforced}
          disabled={!canEdit}
          onCheckedChange={(checked) => {
            onChange({ ...value, ssoEnforced: checked === true });
          }}
        />
      </section>
      <section className="flex flex-col gap-3">
        <Text as="h2" variant="heading">
          IP allowlist
        </Text>
        <Text as="p" variant="secondary" size="sm">
          Restrict API access. One CIDR per line. Empty means no limit.
        </Text>
        <Textarea
          value={value.ipAllowlist}
          disabled={!canEdit}
          rows={4}
          placeholder={"192.168.1.0/24\n10.0.0.0/8"}
          onChange={(event) => {
            onChange({ ...value, ipAllowlist: event.target.value });
          }}
        />
      </section>
      {onDelegateOwnershipChange ? (
        <section className="flex flex-col gap-3">
          <Text as="h2" variant="heading">
            Ownership transfer
          </Text>
          <Text as="p" variant="secondary" size="sm">
            Let owners reassign records to other members.
          </Text>
          <Checkbox
            label="Enable ownership transfer"
            checked={value.delegateOwnership}
            disabled={!canEditOwnership || ownershipPending}
            onCheckedChange={(checked) => {
              onDelegateOwnershipChange(checked === true);
            }}
          />
        </section>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={!canEdit || pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
