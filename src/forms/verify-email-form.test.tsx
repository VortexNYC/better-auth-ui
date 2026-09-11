import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { VerifyEmailForm } from "./verify-email-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(
  verifyEmail: AnyAuthClient["verifyEmail"] = vi.fn(),
  sendVerificationEmail: AnyAuthClient["sendVerificationEmail"] = vi.fn(),
) {
  return {
    verifyEmail,
    sendVerificationEmail,
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("VerifyEmailForm", () => {
  it("verifies automatically when a token is provided", async () => {
    const verifyEmail = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(
      <VerifyEmailForm token="abc123" onSuccess={onSuccess} />,
      createMockClient(verifyEmail),
    );

    await expect.poll(() => verifyEmail.mock.calls.length).toBe(1);
    expect(verifyEmail).toHaveBeenCalledWith({
      query: { token: "abc123" },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(
      await screen.findByText("Your email has been verified."),
    ).toBeDefined();
  });

  it("displays an error when verification fails", async () => {
    const verifyEmail = vi.fn().mockResolvedValue({
      error: { message: "Invalid or expired token" },
    });

    renderWithAuth(
      <VerifyEmailForm token="bad-token" />,
      createMockClient(verifyEmail),
    );

    expect(await screen.findByText("Invalid or expired token")).toBeDefined();
  });

  it("resends verification email when no token is provided", async () => {
    const sendVerificationEmail = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(
      <VerifyEmailForm userEmail="user@example.com" />,
      createMockClient(vi.fn(), sendVerificationEmail),
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });

    fireEvent.submit(getForm());

    await expect.poll(() => sendVerificationEmail.mock.calls.length).toBe(1);
    expect(sendVerificationEmail).toHaveBeenCalledWith({
      email: "user@example.com",
      callbackURL: undefined,
    });
    expect(
      await screen.findByText("Check your inbox for a new verification link."),
    ).toBeDefined();
  });
});
