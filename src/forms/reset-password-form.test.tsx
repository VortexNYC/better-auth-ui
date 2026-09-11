import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { ResetPasswordForm } from "./reset-password-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(
  resetPassword: AnyAuthClient["resetPassword"] = vi.fn(),
) {
  return {
    resetPassword,
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("ResetPasswordForm", () => {
  it("renders password fields", () => {
    renderWithAuth(<ResetPasswordForm token="abc123" />);

    expect(screen.getByLabelText("New password")).toBeDefined();
    expect(screen.getByLabelText("Confirm password")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Reset password" }),
    ).toBeDefined();
  });

  it("shows validation errors for mismatched passwords", async () => {
    renderWithAuth(<ResetPasswordForm token="abc123" />);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different" },
    });

    fireEvent.submit(getForm());

    expect(await screen.findByText("Passwords do not match")).toBeDefined();
  });

  it("calls resetPassword with the token and invokes onSuccess", async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(
      <ResetPasswordForm token="abc123" onSuccess={onSuccess} />,
      createMockClient(resetPassword),
    );

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });

    fireEvent.submit(getForm());

    await expect.poll(() => resetPassword.mock.calls.length).toBe(1);
    expect(resetPassword).toHaveBeenCalledWith({
      newPassword: "password123",
      token: "abc123",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(
      await screen.findByText("Password updated. You can now sign in."),
    ).toBeDefined();
  });
});
