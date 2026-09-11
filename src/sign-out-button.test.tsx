import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "./auth-provider";
import type { AnyAuthClient } from "./types";
import { SignOutButton } from "./sign-out-button";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = { signOut: vi.fn() } as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("SignOutButton", () => {
  it("calls signOut when clicked", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(<SignOutButton onSuccess={onSuccess} />, {
      signOut,
    } as unknown as AnyAuthClient);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await expect.poll(() => signOut.mock.calls.length).toBe(1);
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls onError when signOut fails", async () => {
    const signOut = vi.fn().mockResolvedValue({
      error: { message: "Session expired" },
    });
    const onError = vi.fn();

    renderWithAuth(<SignOutButton onError={onError} />, {
      signOut,
    } as unknown as AnyAuthClient);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await expect.poll(() => onError.mock.calls.length).toBe(1);
    expect(onError).toHaveBeenCalledWith("Session expired");
  });
});
