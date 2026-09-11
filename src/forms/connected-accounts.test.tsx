import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { ConnectedAccounts } from "./connected-accounts";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = { listAccounts: vi.fn() } as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("ConnectedAccounts", () => {
  it("renders linked accounts and allows unlinking", async () => {
    const listAccounts = vi.fn().mockResolvedValue({
      data: [
        { id: "acc_1", providerId: "google", accountId: "123", userId: "u1" },
      ],
      error: null,
    });
    const unlinkAccount = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(<ConnectedAccounts />, {
      listAccounts,
      unlinkAccount,
    } as unknown as AnyAuthClient);

    expect(await screen.findByText("google")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));

    await expect.poll(() => unlinkAccount.mock.calls.length).toBe(1);
    expect(unlinkAccount).toHaveBeenCalledWith({
      providerId: "google",
      accountId: "123",
    });
  });

  it("calls linkSocial when a linkable provider is selected", async () => {
    const listAccounts = vi.fn().mockResolvedValue({ data: [], error: null });
    const linkSocial = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(
      <ConnectedAccounts
        callbackURL="/settings"
        linkableProviders={[{ provider: "github", label: "Link GitHub" }]}
      />,
      { listAccounts, linkSocial } as unknown as AnyAuthClient,
    );

    expect(await screen.findByText("No connected accounts.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Link GitHub" }));

    await expect.poll(() => linkSocial.mock.calls.length).toBe(1);
    expect(linkSocial).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/settings",
      errorCallbackURL: undefined,
    });
  });
});
