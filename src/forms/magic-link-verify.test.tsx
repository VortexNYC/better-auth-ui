import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { MagicLinkVerify } from "./magic-link-verify";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = {} as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("MagicLinkVerify", () => {
  it("verifies automatically when a token is provided", async () => {
    const verify = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(<MagicLinkVerify token="abc123" onSuccess={onSuccess} />, {
      magicLink: { verify },
    } as unknown as AnyAuthClient);

    await expect.poll(() => verify.mock.calls.length).toBe(1);
    expect(verify).toHaveBeenCalledWith({
      token: "abc123",
      callbackURL: undefined,
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(await screen.findByText("You are signed in.")).toBeDefined();
  });

  it("shows an error when no token is provided", () => {
    renderWithAuth(<MagicLinkVerify />);

    expect(
      screen.getByText("This sign-in link is missing or invalid."),
    ).toBeDefined();
  });

  it("shows an error when verification fails", async () => {
    const verify = vi.fn().mockResolvedValue({
      error: { message: "Invalid or expired token" },
    });

    renderWithAuth(<MagicLinkVerify token="bad-token" />, {
      magicLink: { verify },
    } as unknown as AnyAuthClient);

    expect(await screen.findByText("Invalid or expired token")).toBeDefined();
  });
});
