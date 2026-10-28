import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { SignInForm } from "./sign-in-form";
import { SsoSignInForm } from "./sso-sign-in-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(sso: NonNullable<AnyAuthClient["signIn"]["sso"]>) {
  return {
    signIn: { sso },
  } as unknown as AnyAuthClient;
}

function renderWithAuth(ui: React.ReactElement, client: AnyAuthClient) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("SsoSignInForm", () => {
  it("renders the work email field and a submit button", () => {
    renderWithAuth(<SsoSignInForm />, createMockClient(vi.fn()));

    expect(screen.getByLabelText("Work email")).toBeDefined();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDefined();
  });

  it("shows a validation error for an invalid email", () => {
    renderWithAuth(<SsoSignInForm />, createMockClient(vi.fn()));

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(getForm());

    expect(
      screen.getByText("Please enter a valid email address"),
    ).toBeDefined();
  });

  it("calls signIn.sso with the email, callbackURL, and login hint", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: { url: "https://idp.example.com/authorize", redirect: true },
      error: null,
    });
    const onSuccess = vi.fn();

    renderWithAuth(
      <SsoSignInForm callbackURL="/dashboard" onSuccess={onSuccess} />,
      createMockClient(sso),
    );

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => sso.mock.calls.length).toBe(1);
    expect(sso).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@acme.com",
        callbackURL: "/dashboard",
        loginHint: "test@acme.com",
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("defaults callbackURL to /", async () => {
    const sso = vi.fn().mockResolvedValue({ data: {}, error: null });

    renderWithAuth(<SsoSignInForm />, createMockClient(sso));

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => sso.mock.calls.length).toBe(1);
    expect(sso).toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: "/" }),
    );
  });

  it("shows the no-provider banner when the domain has no SSO (404)", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "No provider found for the issuer",
        status: 404,
        statusText: "Not Found",
      },
    });
    const onNoProvider = vi.fn();

    renderWithAuth(
      <SsoSignInForm onNoProvider={onNoProvider} />,
      createMockClient(sso),
    );

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText("No SSO configured for acme.com."),
    ).toBeDefined();
    expect(onNoProvider).toHaveBeenCalledWith("test@acme.com");
  });

  it("matches the no-provider case on message alone (no status)", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No provider found for the issuer" },
    });

    renderWithAuth(<SsoSignInForm />, createMockClient(sso));

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByText(/No SSO configured/)).toBeDefined();
  });

  it("renders the fallback when the domain has no provider", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No provider found for the issuer", status: 404 },
    });
    const signInEmail = vi.fn();
    const client = {
      signIn: { sso, email: signInEmail },
    } as unknown as AnyAuthClient;

    renderWithAuth(
      <SsoSignInForm
        fallback={(email) => (
          <SignInForm initialEmail={email} redirectTo="/app" />
        )}
      />,
      client,
    );

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    // Falls back to the password form with the email carried over.
    expect(await screen.findByLabelText("Password")).toBeDefined();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe(
      "test@acme.com",
    );
  });

  it("surfaces other errors as regular error messages", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Provider domain has not been verified",
        status: 401,
      },
    });

    renderWithAuth(<SsoSignInForm />, createMockClient(sso));

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText("Provider domain has not been verified"),
    ).toBeDefined();
    expect(screen.queryByText(/No SSO configured/)).toBeNull();
  });

  it("shows the unavailable message when signIn.sso is missing", () => {
    const client = {
      signIn: { email: vi.fn() },
    } as unknown as AnyAuthClient;

    renderWithAuth(<SsoSignInForm />, client);

    expect(screen.getByText("SSO sign-in is not available.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
  });

  it("hides the email field and submits directly with providerId", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: { url: "https://idp.example.com/authorize", redirect: true },
      error: null,
    });

    renderWithAuth(
      <SsoSignInForm providerId="acme-okta" callbackURL="/app" />,
      createMockClient(sso),
    );

    expect(screen.queryByLabelText("Work email")).toBeNull();

    fireEvent.submit(getForm());

    await expect.poll(() => sso.mock.calls.length).toBe(1);
    expect(sso).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "acme-okta",
        callbackURL: "/app",
      }),
    );
    // No email was typed — no email or loginHint resolved.
    const args = sso.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.email).toBeUndefined();
    expect(args.loginHint).toBeUndefined();
  });

  it("submits with an explicit domain", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: { url: "https://idp.example.com/authorize", redirect: true },
      error: null,
    });

    renderWithAuth(
      <SsoSignInForm domain="acme.com" callbackURL="/app" />,
      createMockClient(sso),
    );

    fireEvent.submit(getForm());

    await expect.poll(() => sso.mock.calls.length).toBe(1);
    expect(sso).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "acme.com" }),
    );
  });

  it("omits loginHint when loginHint is false", async () => {
    const sso = vi.fn().mockResolvedValue({ data: {}, error: null });

    renderWithAuth(<SsoSignInForm loginHint={false} />, createMockClient(sso));

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => sso.mock.calls.length).toBe(1);
    const args = sso.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.loginHint).toBeUndefined();
    expect(args.email).toBe("test@acme.com");
  });

  it("clears the no-provider banner when the email changes", async () => {
    const sso = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No provider found for the issuer", status: 404 },
    });

    renderWithAuth(<SsoSignInForm />, createMockClient(sso));

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByText(/No SSO configured/)).toBeDefined();

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "test@other.com" },
    });

    expect(screen.queryByText(/No SSO configured/)).toBeNull();
  });
});
