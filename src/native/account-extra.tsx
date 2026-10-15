import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { useAuth } from "../auth-provider";
import type { AuthOrganization, AuthPasskey, AuthSession } from "../types";
import {
  NativeButton,
  NativeError,
  NativeField,
  NativeScreen,
  useNativePalette,
} from "./ui";

function asSessions(data: unknown): AuthSession[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is AuthSession =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "token" in item,
  );
}

export function NativeOrganizationProfileScreen({
  onDeleted,
}: {
  onDeleted?: () => void;
}) {
  const client = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (client.organization?.getFullOrganization === undefined) return;
    void client.organization.getFullOrganization().then((response) => {
      if (response.error !== null || !response.data) return;
      setOrganizationId(response.data.id);
      setName(response.data.name);
      setSlug(response.data.slug);
      setLogo(response.data.logo ?? "");
    });
  }, [client]);

  async function save() {
    if (client.organization?.update === undefined || organizationId === null)
      return;
    setPending(true);
    setError(null);
    try {
      const response = await client.organization.update({
        data: { name, slug, logo: logo.length > 0 ? logo : null },
        organizationId,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not update the workspace.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update the workspace.",
      );
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (client.organization?.delete === undefined || organizationId === null)
      return;
    setPending(true);
    setError(null);
    try {
      const response = await client.organization.delete({ organizationId });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not delete the workspace.");
        return;
      }
      onDeleted?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the workspace.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen title="Workspace" description="Name, slug, and logo.">
      <NativeError message={error} />
      <NativeField label="Name" value={name} onChangeText={setName} />
      <NativeField label="Slug" value={slug} onChangeText={setSlug} />
      <NativeField label="Logo URL" value={logo} onChangeText={setLogo} />
      <NativeButton
        label="Save"
        pending={pending}
        onPress={() => void save()}
      />
      <NativeButton
        label="Delete workspace"
        pending={pending}
        onPress={() => void remove()}
      />
    </NativeScreen>
  );
}

export function NativeSessionListScreen() {
  const client = useAuth();
  const palette = useNativePalette();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client.listSessions === undefined) return;
    void client.listSessions().then((response) => {
      if (response.error === null) setSessions(asSessions(response.data));
    });
  }, [client]);

  async function revoke(token: string) {
    if (client.revokeSession === undefined) return;
    const response = await client.revokeSession({ token });
    if (response.error !== null) {
      setError(response.error.message ?? "Could not revoke the session.");
      return;
    }
    setSessions((current) => current.filter((item) => item.token !== token));
  }

  return (
    <NativeScreen title="Sessions">
      <NativeError message={error} />
      {sessions.length === 0 ? (
        <Text style={{ color: palette.muted, fontSize: 15 }}>
          No other sessions.
        </Text>
      ) : (
        sessions.map((item) => (
          <NativeButton
            key={item.id}
            label={`Revoke ${item.userAgent ?? "device"}`}
            onPress={() => void revoke(item.token)}
          />
        ))
      )}
    </NativeScreen>
  );
}

export function NativePasskeyScreen() {
  const client = useAuth();
  const palette = useNativePalette();
  const [passkeys, setPasskeys] = useState<AuthPasskey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (client.passkey?.listUserPasskeys === undefined) return;
    void client.passkey.listUserPasskeys().then((response) => {
      if (response.error === null) setPasskeys(response.data ?? []);
    });
  }, [client]);

  async function add() {
    if (client.passkey?.addPasskey === undefined) {
      setError("Passkeys are not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.passkey.addPasskey();
      if (response.error !== null) {
        setError(response.error.message ?? "Could not add the passkey.");
        return;
      }
      const listed = await client.passkey.listUserPasskeys();
      if (listed.error === null) setPasskeys(listed.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add the passkey.",
      );
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (client.passkey?.deletePasskey === undefined) return;
    const response = await client.passkey.deletePasskey({ id });
    if (response.error !== null) {
      setError(response.error.message ?? "Could not delete the passkey.");
      return;
    }
    setPasskeys((current) => current.filter((item) => item.id !== id));
  }

  return (
    <NativeScreen title="Passkeys" description="Sign in with this device.">
      <NativeError message={error} />
      {passkeys.map((passkey) => (
        <NativeButton
          key={passkey.id}
          label={`Remove ${passkey.name ?? "passkey"}`}
          onPress={() => void remove(passkey.id)}
        />
      ))}
      {passkeys.length === 0 ? (
        <Text style={{ color: palette.muted, fontSize: 15 }}>
          No passkeys yet.
        </Text>
      ) : null}
      <NativeButton
        label="Add passkey"
        pending={pending}
        onPress={() => void add()}
      />
    </NativeScreen>
  );
}

export function NativeEnableTwoFactorScreen() {
  const client = useAuth();
  const palette = useNativePalette();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function enable() {
    if (client.twoFactor?.enable === undefined) {
      setError("Two-factor setup is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.twoFactor.enable({ password });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not start two-factor setup.");
        return;
      }
      setTotpUri(response.data?.totpURI ?? null);
      setBackupCodes(response.data?.backupCodes ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start two-factor setup.",
      );
    } finally {
      setPending(false);
    }
  }

  async function verify() {
    if (client.twoFactor?.verifyTotp === undefined) return;
    setPending(true);
    setError(null);
    try {
      const response = await client.twoFactor.verifyTotp({ code });
      if (response.error !== null) {
        setError(response.error.message ?? "That code was not accepted.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That code was not accepted.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen
      title="Two-factor"
      description="Password, then the authenticator code."
    >
      <NativeError message={error} />
      <NativeField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <NativeButton
        label="Start setup"
        pending={pending}
        onPress={() => void enable()}
      />
      {totpUri ? (
        <Text style={{ color: palette.text, fontSize: 14 }}>{totpUri}</Text>
      ) : null}
      {backupCodes.map((item) => (
        <Text key={item} style={{ color: palette.text, fontSize: 15 }}>
          {item}
        </Text>
      ))}
      {totpUri ? (
        <>
          <NativeField
            label="Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <NativeButton
            label="Verify"
            pending={pending}
            onPress={() => void verify()}
          />
        </>
      ) : null}
    </NativeScreen>
  );
}

export function NativeProfileImageScreen({
  onPickImage,
}: {
  /** Host opens the image picker and returns a URL to store on the user. */
  onPickImage: () => Promise<string>;
}) {
  const client = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function pick() {
    if (client.updateUser === undefined) {
      setError("Profile update is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const image = await onPickImage();
      const response = await client.updateUser({ image });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not save the photo.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the photo.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen title="Profile photo">
      <NativeError message={error} />
      <NativeButton
        label="Choose photo"
        pending={pending}
        onPress={() => void pick()}
      />
    </NativeScreen>
  );
}

export function NativeUserMenu({
  currentOrganizationId,
  onOrganizationChange,
  onSignedOut,
}: {
  currentOrganizationId?: string | null;
  onOrganizationChange?: (organization: AuthOrganization) => void;
  onSignedOut?: () => void;
}) {
  const client = useAuth();
  const palette = useNativePalette();
  const session = client.useSession();
  const [organizations, setOrganizations] = useState<AuthOrganization[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client.organization?.list === undefined) return;
    void client.organization.list().then((response) => {
      if (response.error === null) setOrganizations(response.data ?? []);
    });
  }, [client]);

  async function select(organization: AuthOrganization) {
    if (client.organization?.setActive === undefined) return;
    const response = await client.organization.setActive({
      organizationId: organization.id,
    });
    if (response.error !== null) {
      setError(response.error.message ?? "Could not switch workspace.");
      return;
    }
    onOrganizationChange?.(organization);
  }

  async function signOut() {
    const response = await client.signOut();
    if (response.error !== null) {
      setError(response.error.message ?? "Could not sign out.");
      return;
    }
    onSignedOut?.();
  }

  const user = session.data?.user;
  if (!user)
    return <NativeScreen title="Account" description="Sign in to continue." />;

  return (
    <NativeScreen title={user.name ?? user.email} description={user.email}>
      <NativeError message={error} />
      {organizations.map((organization) => (
        <NativeButton
          key={organization.id}
          label={
            organization.id === currentOrganizationId
              ? `${organization.name} · current`
              : organization.name
          }
          onPress={() => void select(organization)}
        />
      ))}
      {organizations.length === 0 ? (
        <Text style={{ color: palette.muted, fontSize: 15 }}>
          No workspaces.
        </Text>
      ) : null}
      <NativeButton label="Sign out" onPress={() => void signOut()} />
    </NativeScreen>
  );
}

export function NativeSignOutButton({
  onSignedOut,
}: {
  onSignedOut?: () => void;
}) {
  const client = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={{ gap: 8 }}>
      <NativeError message={error} />
      <NativeButton
        label="Sign out"
        onPress={() => {
          void client.signOut().then((response) => {
            if (response.error !== null) {
              setError(response.error.message ?? "Could not sign out.");
              return;
            }
            onSignedOut?.();
          });
        }}
      />
    </View>
  );
}
