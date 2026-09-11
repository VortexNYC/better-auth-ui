import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { DeleteAccountForm } from "./delete-account-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = {} as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("DeleteAccountForm", () => {
  it("calls deleteUser with password when confirmed", async () => {
    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(<DeleteAccountForm onSuccess={onSuccess} />, {
      deleteUser,
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "current-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm deletion"), {
      target: { value: "delete my account" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => deleteUser.mock.calls.length).toBe(1);
    expect(deleteUser).toHaveBeenCalledWith({ password: "current-password" });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows an error when deleteUser is missing", () => {
    renderWithAuth(<DeleteAccountForm />);

    expect(
      screen.getByText("Account deletion is not available."),
    ).toBeDefined();
  });

  it("validates the confirmation phrase", async () => {
    const deleteUser = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(<DeleteAccountForm />, {
      deleteUser,
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "current-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm deletion"), {
      target: { value: "wrong phrase" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => deleteUser.mock.calls.length).toBe(0);
    expect(screen.getByText("Type the exact phrase to confirm.")).toBeDefined();
  });
});
