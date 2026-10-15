import { useState } from "react";

import { useAuth } from "../auth-provider";
import { NativeButton, NativeError, NativeField, NativeScreen } from "./ui";

export interface NativeSignUpScreenProps {
  title?: string;
  description?: string;
  redirectTo?: string;
  minPasswordLength?: number;
  onSuccess?: () => void;
}

export function NativeSignUpScreen({
  title = "Create your account",
  description = "Then choose a workspace.",
  redirectTo,
  minPasswordLength = 8,
  onSuccess,
}: NativeSignUpScreenProps) {
  const client = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters.`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.signUp.email({
        name,
        email,
        password,
        callbackURL: redirectTo,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not create the account.");
        return;
      }
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the account.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen title={title} description={description}>
      <NativeError message={error} />
      <NativeField label="Name" value={name} onChangeText={setName} />
      <NativeField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <NativeField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <NativeButton
        label="Create account"
        pending={pending}
        onPress={() => {
          void submit();
        }}
      />
    </NativeScreen>
  );
}
