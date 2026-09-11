import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { SetPasswordForm } from "./set-password-form";

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

describe("SetPasswordForm", () => {
  it("calls setPassword with the new password", async () => {
    const setPassword = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(<SetPasswordForm onSuccess={onSuccess} />, {
      setPassword,
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password-123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "new-password-123" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => setPassword.mock.calls.length).toBe(1);
    expect(setPassword).toHaveBeenCalledWith({
      newPassword: "new-password-123",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows an error when passwords do not match", async () => {
    const setPassword = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(<SetPasswordForm />, {
      setPassword,
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "password-one" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password-two" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => setPassword.mock.calls.length).toBe(0);
    expect(screen.getByText("Passwords do not match")).toBeDefined();
  });

  it("shows an unavailable message when setPassword is missing", () => {
    renderWithAuth(<SetPasswordForm />);

    expect(
      screen.getByText("Setting a password is not available."),
    ).toBeDefined();
  });
});
