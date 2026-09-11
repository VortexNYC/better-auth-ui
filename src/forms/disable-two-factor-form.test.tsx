import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { DisableTwoFactorForm } from "./disable-two-factor-form";

afterEach(() => cleanup());

function renderWithAuth(ui: React.ReactElement, client: AnyAuthClient) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form;
}

describe("DisableTwoFactorForm", () => {
  it("calls twoFactor.disable and invokes onSuccess", async () => {
    const disable = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    const client = {
      twoFactor: { disable },
    } as unknown as AnyAuthClient;

    renderWithAuth(<DisableTwoFactorForm onSuccess={onSuccess} />, client);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => disable.mock.calls.length).toBe(1);
    expect(disable).toHaveBeenCalledWith({ password: "password123" });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows unavailable message when twoFactor.disable is missing", () => {
    const client = { twoFactor: {} } as unknown as AnyAuthClient;

    renderWithAuth(<DisableTwoFactorForm />, client);

    fireEvent.submit(getForm());

    expect(
      screen.getByText("Two-factor authentication is not available."),
    ).toBeDefined();
  });
});
