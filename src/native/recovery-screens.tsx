import { useState } from "react";
import { Text } from "react-native";

import { useAuth } from "../auth-provider";
import {
  NativeButton,
  NativeError,
  NativeField,
  NativeScreen,
  useNativePalette,
} from "./ui";

export function NativeForgotPasswordScreen({
  redirectTo,
  onSent,
}: {
  redirectTo?: string;
  onSent?: () => void;
}) {
  const client = useAuth();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (client.requestPasswordReset === undefined) {
      setError("Password reset is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.requestPasswordReset({
        email,
        redirectTo,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not send the reset email.");
        return;
      }
      setSent(true);
      onSent?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send the reset email.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen
      title="Reset your password"
      description={
        sent
          ? "Check your email for the reset link."
          : "We will email you a link."
      }
    >
      <NativeError message={error} />
      {sent ? null : (
        <>
          <NativeField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <NativeButton
            label="Send link"
            pending={pending}
            onPress={() => {
              void submit();
            }}
          />
        </>
      )}
    </NativeScreen>
  );
}

export function NativeResetPasswordScreen({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess?: () => void;
}) {
  const client = useAuth();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (client.resetPassword === undefined) {
      setError("Password reset is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.resetPassword({
        newPassword: password,
        token,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not reset the password.");
        return;
      }
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reset the password.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen title="Choose a new password">
      <NativeError message={error} />
      <NativeField
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <NativeButton
        label="Save password"
        pending={pending}
        onPress={() => {
          void submit();
        }}
      />
    </NativeScreen>
  );
}

export function NativeVerifyEmailScreen({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess?: () => void;
}) {
  const client = useAuth();
  const palette = useNativePalette();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (client.verifyEmail === undefined) {
      setError("Email verification is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.verifyEmail({ query: { token } });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not verify the email.");
        return;
      }
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not verify the email.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen title="Verify your email">
      <NativeError message={error} />
      {done ? (
        <Text style={{ color: palette.text, fontSize: 15 }}>
          Email verified.
        </Text>
      ) : (
        <NativeButton
          label="Verify"
          pending={pending}
          onPress={() => {
            void submit();
          }}
        />
      )}
    </NativeScreen>
  );
}

export function NativeVerifyTotpScreen({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const client = useAuth();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (client.twoFactor?.verifyTotp === undefined) {
      setError("Two-factor verification is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.twoFactor.verifyTotp({ code });
      if (response.error !== null) {
        setError(response.error.message ?? "That code was not accepted.");
        return;
      }
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That code was not accepted.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen title="Two-factor code" description="Enter the 6-digit code.">
      <NativeError message={error} />
      <NativeField
        label="Code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
      />
      <NativeButton
        label="Verify"
        pending={pending}
        onPress={() => {
          void submit();
        }}
      />
    </NativeScreen>
  );
}
