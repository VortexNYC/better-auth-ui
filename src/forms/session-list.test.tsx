import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient, AuthSession } from "../types";
import { SessionList } from "./session-list";

afterEach(() => cleanup());

function createMockClient(
  listSessions: AnyAuthClient["listSessions"] = vi
    .fn()
    .mockResolvedValue({ data: [], error: null }),
  revokeSession: AnyAuthClient["revokeSession"] = vi
    .fn()
    .mockResolvedValue({ error: null }),
  revokeOtherSessions: AnyAuthClient["revokeOtherSessions"] = vi
    .fn()
    .mockResolvedValue({ error: null }),
) {
  return {
    listSessions,
    revokeSession,
    revokeOtherSessions,
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

const mockSession: AuthSession = {
  id: "sess_1",
  token: "token_1",
  userAgent: "Mozilla/5.0",
  ipAddress: "127.0.0.1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 100000).toISOString(),
};

describe("SessionList", () => {
  it("renders a loading state then empty state", async () => {
    renderWithAuth(<SessionList />);

    expect(screen.getByText("Loading sessions…")).toBeDefined();
    expect(await screen.findByText("No active sessions found.")).toBeDefined();
  });

  it("renders sessions and a revoke button", async () => {
    renderWithAuth(
      <SessionList />,
      createMockClient(
        vi.fn().mockResolvedValue({
          data: [mockSession],
          error: null,
        }),
      ),
    );

    expect(await screen.findByText("Mozilla/5.0")).toBeDefined();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeDefined();
  });

  it("revokes a session and reloads", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      data: [mockSession],
      error: null,
    });
    const revokeSession = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(
      <SessionList />,
      createMockClient(listSessions, revokeSession),
    );

    await screen.findByText("Mozilla/5.0");

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await expect.poll(() => revokeSession.mock.calls.length).toBe(1);
    expect(revokeSession).toHaveBeenCalledWith({ token: "token_1" });
    expect(listSessions.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
