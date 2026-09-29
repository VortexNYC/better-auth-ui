import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient, AuthPasskey } from "../types";
import { PasskeyList } from "./passkey-list";

afterEach(() => cleanup());

function createMockClient(
  listUserPasskeys = vi.fn().mockResolvedValue({ data: [], error: null }),
  addPasskey = vi.fn().mockResolvedValue({ error: null }),
  deletePasskey = vi.fn().mockResolvedValue({ error: null }),
) {
  return {
    passkey: {
      listUserPasskeys,
      addPasskey,
      deletePasskey,
    },
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

const mockPasskey: AuthPasskey = {
  id: "pk_1",
  name: "MacBook Touch ID",
  publicKey: "pk",
  credentialID: "cred",
  deviceType: "multiDevice",
  backedUp: true,
  createdAt: new Date().toISOString(),
};

describe("PasskeyList", () => {
  it("renders a loading state then empty state", async () => {
    renderWithAuth(<PasskeyList />);

    expect(screen.getByText("Loading passkeys…")).toBeDefined();
    expect(await screen.findByText("No passkeys registered.")).toBeDefined();
  });

  it("renders passkeys with name, synced badge, and a remove button", async () => {
    renderWithAuth(
      <PasskeyList />,
      createMockClient(
        vi.fn().mockResolvedValue({ data: [mockPasskey], error: null }),
      ),
    );

    expect(await screen.findByText("MacBook Touch ID")).toBeDefined();
    expect(screen.getByText("Synced")).toBeDefined();
    expect(screen.getByText(/Added:/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Remove" })).toBeDefined();
  });

  it("falls back to a generic label when the passkey is unnamed", async () => {
    renderWithAuth(
      <PasskeyList />,
      createMockClient(
        vi.fn().mockResolvedValue({
          data: [{ ...mockPasskey, name: null, backedUp: false }],
          error: null,
        }),
      ),
    );

    expect(await screen.findByText("Passkey")).toBeDefined();
    expect(screen.queryByText("Synced")).toBeNull();
  });

  it("registers a passkey with the trimmed name and reloads", async () => {
    const listUserPasskeys = vi
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const addPasskey = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(
      <PasskeyList />,
      createMockClient(listUserPasskeys, addPasskey),
    );

    await screen.findByText("No passkeys registered.");
    fireEvent.change(screen.getByPlaceholderText("Passkey name (optional)"), {
      target: { value: "  Work key  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add passkey" }));

    await screen.findByText("No passkeys registered.");
    expect(addPasskey).toHaveBeenCalledWith({ name: "Work key" });
    expect(listUserPasskeys).toHaveBeenCalledTimes(2);
  });

  it("deletes a passkey and reloads", async () => {
    const listUserPasskeys = vi
      .fn()
      .mockResolvedValue({ data: [mockPasskey], error: null });
    const deletePasskey = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(
      <PasskeyList />,
      createMockClient(listUserPasskeys, undefined, deletePasskey),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));

    await screen.findByText("MacBook Touch ID");
    expect(deletePasskey).toHaveBeenCalledWith({ id: "pk_1" });
    expect(listUserPasskeys).toHaveBeenCalledTimes(2);
  });

  it("surfaces a listing error", async () => {
    renderWithAuth(
      <PasskeyList />,
      createMockClient(
        vi.fn().mockResolvedValue({ error: { message: "Session expired" } }),
      ),
    );

    expect(await screen.findByText("Session expired")).toBeDefined();
  });

  it("surfaces an add error", async () => {
    renderWithAuth(
      <PasskeyList />,
      createMockClient(
        undefined,
        vi.fn().mockResolvedValue({ error: { message: "Cancelled" } }),
      ),
    );

    await screen.findByText("No passkeys registered.");
    fireEvent.click(screen.getByRole("button", { name: "Add passkey" }));

    expect(await screen.findByText("Cancelled")).toBeDefined();
  });

  it("reports when the passkey plugin is unavailable", async () => {
    renderWithAuth(<PasskeyList />, {} as AnyAuthClient);

    expect(
      await screen.findByText("Passkey listing is not available."),
    ).toBeDefined();
  });
});
