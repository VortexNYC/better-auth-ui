import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import {
  ResetPasswordForm,
  readResetPasswordSearch,
} from "./reset-password-form";

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

  it("enforces a custom minPasswordLength", async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(
      <ResetPasswordForm token="abc123" minPasswordLength={12} />,
      createMockClient(resetPassword),
    );

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "short" },
    });

    fireEvent.submit(getForm());

    expect(
      await screen.findByText("Password must be at least 12 characters"),
    ).toBeDefined();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("parses the token from the URL when no token prop is given", async () => {
    window.history.pushState({}, "", "/reset-password?token=url-token-9");
    const resetPassword = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(<ResetPasswordForm />, createMockClient(resetPassword));

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
      token: "url-token-9",
    });
  });

  it("shows the invalid-link state for ?error=INVALID_TOKEN", () => {
    window.history.pushState({}, "", "/reset-password?error=INVALID_TOKEN");

    renderWithAuth(<ResetPasswordForm forgotPasswordHref="/forgot-password" />);

    expect(
      screen.getByText("This reset link is invalid or has expired."),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Request a new reset link" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("links back to sign in after a successful reset", async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(
      <ResetPasswordForm token="abc123" signInUrl="/sign-in" />,
      createMockClient(resetPassword),
    );

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByRole("link", { name: "Sign in" })).toBeDefined();
  });
});

describe("readResetPasswordSearch", () => {
  it("returns the token for a valid link", () => {
    expect(readResetPasswordSearch("?token=abc")).toEqual({
      token: "abc",
      invalid: false,
    });
  });

  it("flags an error redirect as invalid", () => {
    expect(readResetPasswordSearch("?error=INVALID_TOKEN")).toEqual({
      token: null,
      invalid: true,
    });
  });

  it("treats a missing token as invalid", () => {
    expect(readResetPasswordSearch("")).toEqual({
      token: null,
      invalid: false,
    });
  });
});
