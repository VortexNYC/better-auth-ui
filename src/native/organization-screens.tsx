import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";

import { useAuth } from "../auth-provider";
import type { AuthOrganization } from "../types";
import {
  NativeButton,
  NativeError,
  NativeField,
  NativeScreen,
  useNativePalette,
} from "./ui";

export function NativeOrganizationChooserScreen({
  onOpen,
  onCreated,
}: {
  onOpen: (organization: AuthOrganization) => void;
  onCreated?: (organization: AuthOrganization) => void;
}) {
  const client = useAuth();
  const [organizations, setOrganizations] = useState<AuthOrganization[] | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client.organization?.list === undefined) {
      setError("Workspaces are not available.");
      setOrganizations([]);
      return;
    }
    void client.organization.list().then((response) => {
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load workspaces.");
        setOrganizations([]);
        return;
      }
      const next = response.data ?? [];
      setOrganizations(next);
      if (next.length === 0) setCreating(true);
    });
  }, [client]);

  async function activate(organization: AuthOrganization, created: boolean) {
    if (client.organization?.setActive === undefined) {
      setError("Switching workspaces is not available.");
      return;
    }
    const response = await client.organization.setActive({
      organizationId: organization.id,
    });
    if (response.error !== null) {
      setError(response.error.message ?? "Could not open the workspace.");
      return;
    }
    if (created && onCreated) onCreated(organization);
    else onOpen(organization);
  }

  if (organizations === null) {
    return <NativeScreen title="Choose a workspace" description="Loading…" />;
  }

  if (creating) {
    return (
      <NativeCreateOrganizationScreen
        onCreated={(organization) => {
          void activate(organization, true);
        }}
      />
    );
  }

  return (
    <NativeScreen
      title="Choose a workspace"
      description="Open one, or create a new one."
    >
      <NativeError message={error} />
      {organizations.map((organization) => (
        <NativeButton
          key={organization.id}
          label={organization.name}
          onPress={() => {
            void activate(organization, false);
          }}
        />
      ))}
      <NativeButton
        label="Create a new workspace"
        onPress={() => {
          setCreating(true);
        }}
      />
    </NativeScreen>
  );
}

export function NativeCreateOrganizationScreen({
  onCreated,
}: {
  onCreated: (organization: AuthOrganization) => void;
}) {
  const client = useAuth();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (client.organization?.create === undefined) {
      setError("Creating a workspace is not available.");
      return;
    }
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setPending(true);
    setError(null);
    try {
      const response = await client.organization.create({
        name: name.trim(),
        slug,
      });
      if (response.error !== null || !response.data) {
        setError(response.error?.message ?? "Could not create the workspace.");
        return;
      }
      onCreated(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the workspace.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen
      title="Create your workspace"
      description="One name. Then you are in."
    >
      <NativeError message={error} />
      <NativeField label="Name" value={name} onChangeText={setName} />
      <NativeButton
        label="Continue"
        pending={pending}
        onPress={() => {
          void submit();
        }}
      />
    </NativeScreen>
  );
}

export function NativeOrganizationSwitcher({
  onChange,
}: {
  onChange?: (organization: AuthOrganization) => void;
}) {
  const client = useAuth();
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
    onChange?.(organization);
  }

  return (
    <NativeScreen title="Workspace">
      <NativeError message={error} />
      {organizations.map((organization) => (
        <NativeButton
          key={organization.id}
          label={organization.name}
          onPress={() => {
            void select(organization);
          }}
        />
      ))}
    </NativeScreen>
  );
}

export function NativeMembersScreen() {
  const client = useAuth();
  const palette = useNativePalette();
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (client.organization?.getFullOrganization === undefined) return;
    void client.organization.getFullOrganization().then((response) => {
      const roster = response.data?.members ?? [];
      setMembers(roster.map((member) => member.user?.email ?? member.userId));
    });
  }, [client]);

  async function invite() {
    if (client.organization?.inviteMember === undefined) {
      setError("Inviting members is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.organization.inviteMember({
        email,
        role: "member",
      });
      if (response.error !== null || !response.data) {
        setError(response.error?.message ?? "Could not send the invitation.");
        return;
      }
      setLink(response.data.id);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send the invitation.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen title="Members" description="Invite a teammate.">
      <NativeError message={error} />
      {members.map((member) => (
        <Text key={member} style={{ color: palette.text, fontSize: 15 }}>
          {member}
        </Text>
      ))}
      <NativeField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <NativeButton
        label="Send invite"
        pending={pending}
        onPress={() => {
          void invite();
        }}
      />
      {link ? (
        <Text style={{ color: palette.text, fontSize: 15 }}>
          Invitation {link}
        </Text>
      ) : null}
    </NativeScreen>
  );
}

export function NativePostSignUpScreen({
  invitationId,
  onReady,
  onChoose,
}: {
  invitationId?: string | null;
  onReady: (organization: AuthOrganization) => void;
  onChoose: (organization: AuthOrganization) => void;
}) {
  const client = useAuth();
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [error, setError] = useState<string | null>(null);
  const [chooser, setChooser] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (invitationId && client.organization?.acceptInvitation) {
        await client.organization.acceptInvitation({ invitationId });
      }
      if (client.organization?.list === undefined) {
        setError("Workspaces are not available.");
        return;
      }
      const response = await client.organization.list();
      if (cancelled) return;
      if (response.error !== null) {
        setError(response.error.message ?? "Could not load workspaces.");
        return;
      }
      const organizations = response.data ?? [];
      if (organizations.length === 1) {
        const only = organizations[0];
        if (!only) return;
        await client.organization.setActive?.({ organizationId: only.id });
        onReadyRef.current(only);
        return;
      }
      setChooser(true);
    }
    void start();
    return () => {
      cancelled = true;
    };
  }, [client, invitationId]);

  if (error) {
    return (
      <NativeScreen title="Finish setting up">
        <NativeError message={error} />
      </NativeScreen>
    );
  }
  if (!chooser) {
    return <NativeScreen title="Finish setting up" description="One moment." />;
  }
  return (
    <NativeOrganizationChooserScreen onOpen={onChoose} onCreated={onReady} />
  );
}

export function NativeAcceptInviteScreen({
  invitationId,
  onAccepted,
  onSignIn,
}: {
  invitationId: string;
  onAccepted?: () => void;
  onSignIn?: () => void;
}) {
  const client = useAuth();
  const session = client.useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function accept() {
    if (!session.data?.user) {
      onSignIn?.();
      return;
    }
    if (client.organization?.acceptInvitation === undefined) {
      setError("Invitation acceptance is not available.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await client.organization.acceptInvitation({
        invitationId,
      });
      if (response.error !== null) {
        setError(response.error.message ?? "Could not accept the invitation.");
        return;
      }
      onAccepted?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not accept the invitation.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <NativeScreen
      title="Accept invitation"
      description="Join the workspace you were invited to."
    >
      <NativeError message={error} />
      <NativeButton
        label={session.data?.user ? "Accept" : "Sign in to accept"}
        pending={pending}
        onPress={() => {
          void accept();
        }}
      />
    </NativeScreen>
  );
}

export function NativeLoadingScreen() {
  return (
    <NativeScreen
      title="Checking your session"
      description="This takes a moment."
    />
  );
}

export function NativeUnavailableScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <NativeScreen
      title="Sign-in is unavailable"
      description="The auth service did not respond."
    >
      {onRetry ? <NativeButton label="Try again" onPress={onRetry} /> : null}
    </NativeScreen>
  );
}
