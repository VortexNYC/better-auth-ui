import { useEffect, useState } from "react";
import { Text } from "react-native";

import { useAuth } from "../auth-provider";
import type { AuthSession } from "../types";
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

export function NativeAccountScreen({ onSaved }: { onSaved?: () => void }) {
  const client = useAuth();
  const palette = useNativePalette();
  const session = client.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const user = session.data?.user;
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email);
    }
  }, [session.data?.user]);

  useEffect(() => {
    if (client.listSessions === undefined) return;
    void client.listSessions().then((response) => {
      if (response.error === null) setSessions(asSessions(response.data));
    });
  }, [client]);

  async function saveProfile() {
    if (client.updateUser === undefined) {
      setError("Profile update is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.updateUser({ name });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not update profile.");
        return;
      }
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update profile.",
      );
    } finally {
      setPending(false);
    }
  }

  async function saveEmail() {
    if (client.changeEmail === undefined) {
      setError("Email change is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.changeEmail({ newEmail: email });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not change email.");
        return;
      }
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change email.");
    } finally {
      setPending(false);
    }
  }

  async function savePassword() {
    if (client.changePassword === undefined) {
      setError("Password change is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.changePassword({
        currentPassword,
        newPassword,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not change password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not change password.",
      );
    } finally {
      setPending(false);
    }
  }

  async function enableTwoFactor() {
    if (client.twoFactor?.enable === undefined) {
      setError("Two-factor setup is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.twoFactor.enable({
        password: twoFactorPassword,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not enable two-factor.");
        return;
      }
      setBackupCodes(response.data?.backupCodes ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not enable two-factor.",
      );
    } finally {
      setPending(false);
    }
  }

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
    <NativeScreen
      title="Account"
      description="Profile, password, sessions, and two-factor."
    >
      <NativeError message={error} />
      <NativeField label="Name" value={name} onChangeText={setName} />
      <NativeButton
        label="Save profile"
        pending={pending}
        onPress={() => void saveProfile()}
      />
      <NativeField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <NativeButton
        label="Change email"
        pending={pending}
        onPress={() => void saveEmail()}
      />
      <NativeField
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <NativeField
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <NativeButton
        label="Change password"
        pending={pending}
        onPress={() => void savePassword()}
      />
      <Text style={{ color: palette.text, fontSize: 16, fontWeight: "600" }}>
        Sessions
      </Text>
      {sessions.map((item) => (
        <NativeButton
          key={item.id}
          label={`Revoke ${item.userAgent ?? "device"}`}
          onPress={() => void revoke(item.token)}
        />
      ))}
      <NativeField
        label="Password to enable two-factor"
        value={twoFactorPassword}
        onChangeText={setTwoFactorPassword}
        secureTextEntry
      />
      <NativeButton
        label="Enable two-factor"
        pending={pending}
        onPress={() => void enableTwoFactor()}
      />
      {backupCodes.map((code) => (
        <Text key={code} style={{ color: palette.text, fontSize: 15 }}>
          {code}
        </Text>
      ))}
    </NativeScreen>
  );
}
