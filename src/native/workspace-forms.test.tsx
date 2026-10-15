import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient, AuthOrganizationFull } from "../types";
import {
  NativeChangeEmailScreen,
  NativeOrganizationAccessScreen,
  NativeOrganizationSecurityScreen,
} from "./workspace-forms";

const organization: AuthOrganizationFull = {
  id: "org_1",
  name: "Acme",
  slug: "acme",
  members: [],
  invitations: [],
  metadata: { brand: { primaryColor: "#111111" } },
};

function clientWith(update: ReturnType<typeof vi.fn>): {
  client: AnyAuthClient;
  getFullOrganization: ReturnType<typeof vi.fn>;
} {
  const getFullOrganization = vi.fn().mockResolvedValue({
    data: organization,
    error: null,
  });
  return {
    getFullOrganization,
    client: {
      useSession: () => ({ data: null, isPending: false }),
      signOut: vi.fn(),
      signIn: { email: vi.fn() },
      signUp: { email: vi.fn() },
      organization: { getFullOrganization, update },
    } as unknown as AnyAuthClient,
  };
}

describe("native workspace forms", () => {
  it("sends a change-email verification", async () => {
    const user = userEvent.setup();
    const changeEmail = vi.fn().mockResolvedValue({ data: {}, error: null });
    const client = {
      useSession: () => ({ data: null, isPending: false }),
      signOut: vi.fn(),
      signIn: { email: vi.fn() },
      signUp: { email: vi.fn() },
      changeEmail,
    } as unknown as AnyAuthClient;

    render(
      <AuthProvider client={client}>
        <NativeChangeEmailScreen callbackURL="https://app.example/account" />
      </AuthProvider>,
    );

    await user.type(
      screen.getByPlaceholderText("ada@example.com"),
      "ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send verification" }));

    expect(changeEmail).toHaveBeenCalledWith({
      newEmail: "ada@example.com",
      callbackURL: "https://app.example/account",
    });
  });

  it("saves MFA without dropping brand metadata", async () => {
    const user = userEvent.setup();
    const update = vi
      .fn()
      .mockResolvedValue({ data: organization, error: null });
    const { client, getFullOrganization } = clientWith(update);
    render(
      <AuthProvider client={client}>
        <NativeOrganizationSecurityScreen />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(getFullOrganization).toHaveBeenCalled();
    });

    await user.click(
      await screen.findByRole("button", {
        name: "Require two-factor authentication",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Save security policy" }),
    );

    expect(update).toHaveBeenCalledWith({
      organizationId: "org_1",
      data: {
        metadata: {
          brand: { primaryColor: "#111111" },
          security: { requireMfa: true },
        },
      },
    });
  });

  it("asks the host to save access changes", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(
      <NativeOrganizationAccessScreen
        value={{
          allowApiAccess: true,
          ssoEnforced: false,
          ipAllowlist: "",
          delegateOwnership: false,
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
