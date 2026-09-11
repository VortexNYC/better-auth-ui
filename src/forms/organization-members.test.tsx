import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { OrganizationMembers, InviteMemberForm } from "./organization-members";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = { organization: {} } as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("InviteMemberForm", () => {
  it("renders email and role fields and submits invite", async () => {
    const inviteMember = vi.fn().mockResolvedValue({
      data: { id: "inv_1", email: "ada@example.com", role: "member" },
      error: null,
    });
    const onInvite = vi.fn();

    const client = {
      organization: { inviteMember },
    } as unknown as AnyAuthClient;

    renderWithAuth(<InviteMemberForm onInvite={onInvite} />, client);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.submit(document.querySelector("form")!);

    await expect.poll(() => inviteMember.mock.calls.length).toBe(1);
    expect(inviteMember).toHaveBeenCalledWith({
      email: "ada@example.com",
      role: "member",
    });
    expect(onInvite).toHaveBeenCalled();
  });
});

describe("OrganizationMembers", () => {
  it("renders members and handles removal", async () => {
    const removeMember = vi.fn().mockResolvedValue({ error: null });
    const getFullOrganization = vi.fn().mockResolvedValue({
      data: {
        id: "org_1",
        name: "Acme",
        slug: "acme",
        members: [
          {
            id: "mem_1",
            organizationId: "org_1",
            userId: "u1",
            role: "admin",
            user: { id: "u1", email: "ada@example.com", name: "Ada" },
          },
        ],
        invitations: [],
      },
      error: null,
    });

    const client = {
      organization: { getFullOrganization, removeMember },
      useSession: vi.fn().mockReturnValue({
        data: { user: { id: "u2" } },
        isPending: false,
      }),
    } as unknown as AnyAuthClient;

    renderWithAuth(<OrganizationMembers />, client);

    expect(await screen.findByText("Ada")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await expect.poll(() => removeMember.mock.calls.length).toBe(1);
    expect(removeMember).toHaveBeenCalledWith({ memberId: "mem_1" });
  });
});
