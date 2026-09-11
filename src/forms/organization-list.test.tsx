import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient, AuthOrganization } from "../types";
import { OrganizationList } from "./organization-list";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = { organization: {} } as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("OrganizationList", () => {
  it("shows loading and then the list of organizations", async () => {
    const organizations: AuthOrganization[] = [
      { id: "org_1", name: "Acme", slug: "acme" },
      { id: "org_2", name: "Globex", slug: "globex" },
    ];

    const client = {
      organization: {
        list: vi.fn().mockResolvedValue({ data: organizations, error: null }),
        listUserInvitations: vi
          .fn()
          .mockResolvedValue({ data: [], error: null }),
      },
    } as unknown as AnyAuthClient;

    renderWithAuth(<OrganizationList />, client);

    expect(screen.getByText("Loading…")).toBeDefined();
    expect(await screen.findByText("Acme")).toBeDefined();
    expect(screen.getByText("Globex")).toBeDefined();
  });

  it("calls setActive when selecting an organization", async () => {
    const setActive = vi.fn().mockResolvedValue({ error: null });
    const onSelectOrganization = vi.fn();

    const client = {
      organization: {
        list: vi.fn().mockResolvedValue({
          data: [{ id: "org_1", name: "Acme", slug: "acme" }],
          error: null,
        }),
        listUserInvitations: vi
          .fn()
          .mockResolvedValue({ data: [], error: null }),
        setActive,
      },
    } as unknown as AnyAuthClient;

    renderWithAuth(
      <OrganizationList onSelectOrganization={onSelectOrganization} />,
      client,
    );

    const button = await screen.findByRole("button", { name: "Open" });
    fireEvent.click(button);

    await expect.poll(() => setActive.mock.calls.length).toBe(1);
    expect(setActive).toHaveBeenCalledWith({ organizationId: "org_1" });
    expect(onSelectOrganization).toHaveBeenCalledWith({
      id: "org_1",
      name: "Acme",
      slug: "acme",
    });
  });
});
