import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { ChangePasswordForm } from "./change-password-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = {
    changePassword: vi.fn(),
  } as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("ChangePasswordForm", () => {
  it("calls changePassword with matching new passwords", async () => {
    const changePassword = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(<ChangePasswordForm onSuccess={onSuccess} />, {
      changePassword,
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "oldpass" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "newpass123" },
    });

    fireEvent.submit(getForm());

    await expect.poll(() => changePassword.mock.calls.length).toBe(1);
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "oldpass",
      newPassword: "newpass123",
      revokeOtherSessions: true,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows an error when new passwords do not match", async () => {
    renderWithAuth(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different" },
    });

    fireEvent.submit(getForm());

    expect(await screen.findByText("Passwords do not match.")).toBeDefined();
  });

  it("shows unavailable message when changePassword is missing", async () => {
    renderWithAuth(<ChangePasswordForm />, {} as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "newpass123" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText("Password change is not available."),
    ).toBeDefined();
  });
});
