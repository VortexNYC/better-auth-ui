import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { OrganizationProfile } from "./organization-profile";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = { organization: {} } as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("OrganizationProfile", () => {
  it("loads and updates the active organization", async () => {
    const getFullOrganization = vi.fn().mockResolvedValue({
      data: {
        id: "org_1",
        name: "Acme",
        slug: "acme",
        logo: null,
        members: [],
        invitations: [],
      },
      error: null,
    });
    const update = vi.fn().mockResolvedValue({
      data: { id: "org_1", name: "Acme Inc", slug: "acme-inc" },
      error: null,
    });
    const onUpdated = vi.fn();

    const client = {
      organization: { getFullOrganization, update },
    } as unknown as AnyAuthClient;

    renderWithAuth(<OrganizationProfile onUpdated={onUpdated} />, client);

    expect(await screen.findByDisplayValue("Acme")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme Inc" },
    });
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "acme-inc" },
    });
    fireEvent.submit(document.querySelector("form")!);

    await expect.poll(() => update.mock.calls.length).toBe(1);
    expect(update).toHaveBeenCalledWith({
      data: {
        name: "Acme Inc",
        slug: "acme-inc",
        logo: null,
        metadata: undefined,
      },
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it("calls delete when requested", async () => {
    const getFullOrganization = vi.fn().mockResolvedValue({
      data: {
        id: "org_1",
        name: "Acme",
        slug: "acme",
        members: [],
        invitations: [],
      },
      error: null,
    });
    const deleteOrg = vi.fn().mockResolvedValue({ error: null });
    const onDeleted = vi.fn();

    const client = {
      organization: { getFullOrganization, delete: deleteOrg },
    } as unknown as AnyAuthClient;

    renderWithAuth(<OrganizationProfile onDeleted={onDeleted} />, client);

    expect(await screen.findByDisplayValue("Acme")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Delete workspace" }));

    await expect.poll(() => deleteOrg.mock.calls.length).toBe(1);
    expect(deleteOrg).toHaveBeenCalledWith({ organizationId: "org_1" });
    expect(onDeleted).toHaveBeenCalled();
  });
});
