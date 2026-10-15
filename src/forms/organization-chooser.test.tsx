import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { OrganizationChooser } from "./organization-chooser";

afterEach(() => cleanup());

const acme = { id: "org_1", name: "Acme", slug: "acme" };

function clientWith(orgs = [acme]): AnyAuthClient {
  return {
    useSession: () => ({ data: null, isPending: false }),
    signOut: vi.fn(),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    organization: {
      list: vi.fn().mockResolvedValue({ data: orgs, error: null }),
      setActive: vi.fn().mockResolvedValue({ data: null, error: null }),
      create: vi.fn().mockResolvedValue({
        data: { id: "org_2", name: "New", slug: "new" },
        error: null,
      }),
    },
  } as unknown as AnyAuthClient;
}

describe("OrganizationChooser", () => {
  it("activates the workspace the person picks", async () => {
    const client = clientWith();
    const onOpen = vi.fn();
    render(
      <AuthProvider client={client}>
        <OrganizationChooser onOpen={onOpen} />
      </AuthProvider>,
    );

    expect(await screen.findByText("Acme")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Acme/ }));

    expect(client.organization?.setActive).toHaveBeenCalledWith({
      organizationSlug: "acme",
    });
    expect(await screen.findByText("Acme")).toBeDefined();
    await vi.waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith(acme);
    });
  });

  it("shows the create form when there are no workspaces", async () => {
    render(
      <AuthProvider client={clientWith([])}>
        <OrganizationChooser onOpen={vi.fn()} />
      </AuthProvider>,
    );

    expect(await screen.findByText("Create your workspace")).toBeDefined();
  });
});
