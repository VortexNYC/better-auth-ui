import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { ForgotPasswordForm } from "./forgot-password-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(
  forgetPassword: AnyAuthClient["forgetPassword"] = vi.fn(),
) {
  return {
    forgetPassword,
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("ForgotPasswordForm", () => {
  it("renders email field", () => {
    renderWithAuth(<ForgotPasswordForm />);

    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeDefined();
  });

  it("shows validation error for invalid email", async () => {
    renderWithAuth(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeDefined();
  });

  it("calls forgetPassword and shows success message", async () => {
    const forgetPassword = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(
      <ForgotPasswordForm
        resetPasswordUrl="https://app.example.com/reset-password"
        onSuccess={onSuccess}
      />,
      createMockClient(forgetPassword),
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });

    fireEvent.submit(getForm());

    await expect.poll(() => forgetPassword.mock.calls.length).toBe(1);
    expect(forgetPassword).toHaveBeenCalledWith({
      email: "ada@example.com",
      redirectTo: "https://app.example.com/reset-password",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(
      await screen.findByText("Check your email for a reset link."),
    ).toBeDefined();
  });
});
