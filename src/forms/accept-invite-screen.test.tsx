import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { AcceptInviteScreen } from "./accept-invite-screen";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = { organization: {} } as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("AcceptInviteScreen", () => {
  it("shows sign in prompt when no session exists", () => {
    const client = {
      useSession: vi.fn().mockReturnValue({
        data: null,
        isPending: false,
      }),
    } as unknown as AnyAuthClient;

    const onSignIn = vi.fn();
    const onSignUp = vi.fn();

    renderWithAuth(
      <AcceptInviteScreen
        token="inv_1"
        onSignIn={onSignIn}
        onSignUp={onSignUp}
      />,
      client,
    );

    expect(
      screen.getByText(
        "Sign in or create an account to accept this invitation.",
      ),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Sign in to accept" }));
    expect(onSignIn).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    expect(onSignUp).toHaveBeenCalled();
  });

  it("auto-accepts the invitation when a session exists", async () => {
    const acceptInvitation = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    const client = {
      useSession: vi.fn().mockReturnValue({
        data: { user: { id: "u1" } },
        isPending: false,
      }),
      organization: { acceptInvitation },
    } as unknown as AnyAuthClient;

    renderWithAuth(
      <AcceptInviteScreen token="inv_1" onSuccess={onSuccess} />,
      client,
    );

    await expect.poll(() => acceptInvitation.mock.calls.length).toBe(1);
    expect(acceptInvitation).toHaveBeenCalledWith({ invitationId: "inv_1" });
    expect(onSuccess).toHaveBeenCalled();
  });
});
