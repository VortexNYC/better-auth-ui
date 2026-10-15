import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";
import { useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";

export interface OrganizationRoleRecord {
  id: string;
  name: string;
  permissions: readonly string[];
  system?: boolean;
}

export interface RoleManagerProps {
  roles: readonly OrganizationRoleRecord[];
  permissions: readonly string[];
  canManage?: boolean;
  onCreate: (input: { name: string; permissions: string[] }) => Promise<void>;
}

/** Custom workspace roles and the permissions on each one. */
export function RoleManager({
  roles,
  permissions,
  canManage = true,
  onCreate,
}: RoleManagerProps) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {roles.map((role) => (
          <li key={role.id} className="flex flex-col gap-1">
            <Text as="span">{role.name}</Text>
            <Text variant="secondary" size="sm">
              {role.system ? "Built in. " : ""}
              {role.permissions.join(", ") || "No permissions"}
            </Text>
          </li>
        ))}
      </ul>
      {canManage ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            void onCreate({ name: name.trim(), permissions: selected })
              .then(() => {
                setName("");
                setSelected([]);
              })
              .catch((err: unknown) => {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Could not create the role.",
                );
              })
              .finally(() => {
                setPending(false);
              });
          }}
        >
          <Input
            label="Role name"
            value={name}
            onValueChange={setName}
            required
          />
          <div className="flex flex-col gap-2">
            {permissions.map((permission) => (
              <Checkbox
                key={permission}
                label={permission}
                checked={selected.includes(permission)}
                onCheckedChange={(checked) => {
                  const active = checked === true;
                  setSelected((current) =>
                    active
                      ? [...current, permission]
                      : current.filter((item) => item !== permission),
                  );
                }}
              />
            ))}
          </div>
          {error ? (
            <Text variant="error" size="sm">
              {error}
            </Text>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            disabled={pending || !name.trim()}
          >
            {pending ? "Creating…" : "Create role"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
