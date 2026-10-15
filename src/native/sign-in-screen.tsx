import { useState } from "react";
import { Pressable, Text } from "react-native";

import { useAuth } from "../auth-provider";
import {
  NativeButton,
  NativeError,
  NativeField,
  NativeScreen,
  useNativePalette,
} from "./ui";

export interface NativeSignInScreenProps {
  title?: string;
  description?: string;
  redirectTo?: string;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
}

function needsTwoFactor(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "twoFactorRedirect" in data &&
    (data as { twoFactorRedirect?: unknown }).twoFactorRedirect === true
  );
}

export function NativeSignInScreen({
  title = "Sign in",
  description = "Access your workspace.",
  redirectTo,
  onSuccess,
  onForgotPassword,
  onSignUp,
}: NativeSignInScreenProps) {
  const client = useAuth();
  const palette = useNativePalette();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      if (challenge) {
        if (client.twoFactor?.verifyTotp === undefined) {
          setError("Two-factor verification is not available.");
          return;
        }
        const response = await client.twoFactor.verifyTotp({ code });
        if (response.error !== null) {
          setError(response.error.message ?? "That code was not accepted.");
          return;
        }
        onSuccess?.();
        return;
      }

      const response = await client.signIn.email({
        email,
        password,
        callbackURL: redirectTo,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not sign in.");
        return;
      }
      if (needsTwoFactor(response.data)) {
        setChallenge(true);
        return;
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen
      title={challenge ? "Two-factor code" : title}
      description={
        challenge ? "Enter the code from your authenticator." : description
      }
    >
      <NativeError message={error} />
      {challenge ? (
        <NativeField
          label="Code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
      ) : (
        <>
          <NativeField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <NativeField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </>
      )}
      <NativeButton
        label={challenge ? "Verify" : "Sign in"}
        pending={pending}
        onPress={() => {
          void submit();
        }}
      />
      {onForgotPassword ? (
        <Pressable
          accessibilityLabel="Forgot password"
          onPress={onForgotPassword}
        >
          <Text style={{ color: palette.muted, fontSize: 14 }}>
            Forgot password
          </Text>
        </Pressable>
      ) : null}
      {onSignUp ? (
        <Pressable accessibilityLabel="Create an account" onPress={onSignUp}>
          <Text style={{ color: palette.text, fontSize: 14 }}>
            Create an account
          </Text>
        </Pressable>
      ) : null}
    </NativeScreen>
  );
}
