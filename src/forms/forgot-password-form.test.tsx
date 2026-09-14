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
  requestPasswordReset: AnyAuthClient["requestPasswordReset"] = vi.fn(),
) {
  return {
    requestPasswordReset,
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

  it("calls requestPasswordReset and shows success message", async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(
      <ForgotPasswordForm
        resetPasswordUrl="https://app.example.com/reset-password"
        onSuccess={onSuccess}
      />,
      createMockClient(requestPasswordReset),
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });

    fireEvent.submit(getForm());

    await expect.poll(() => requestPasswordReset.mock.calls.length).toBe(1);
    expect(requestPasswordReset).toHaveBeenCalledWith({
      email: "ada@example.com",
      redirectTo: "https://app.example.com/reset-password",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(
      await screen.findByText("Check your email for a reset link."),
    ).toBeDefined();
  });
});
