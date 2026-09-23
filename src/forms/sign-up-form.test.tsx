import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { SignUpForm } from "./sign-up-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(
  signUpEmail: AnyAuthClient["signUp"]["email"] = vi.fn(),
) {
  return {
    signUp: { email: signUpEmail },
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("SignUpForm", () => {
  it("renders sign-up fields", () => {
    renderWithAuth(<SignUpForm />);

    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByLabelText("Confirm password")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeDefined();
  });

  it("shows validation errors for empty fields", async () => {
    renderWithAuth(<SignUpForm />);

    fireEvent.submit(getForm());

    expect(await screen.findByText("Name is required")).toBeDefined();
    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeDefined();
  });

  it("rejects mismatched passwords", async () => {
    renderWithAuth(<SignUpForm />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different" },
    });

    fireEvent.submit(getForm());

    expect(await screen.findByText("Passwords do not match")).toBeDefined();
  });

  it("calls signUp.email with valid values and invokes onSuccess", async () => {
    const signUpEmail = vi.fn().mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    const onSuccess = vi.fn();

    renderWithAuth(
      <SignUpForm redirectTo="/dashboard" onSuccess={onSuccess} />,
      createMockClient(signUpEmail),
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });

    fireEvent.submit(getForm());

    await expect.poll(() => signUpEmail.mock.calls.length).toBe(1);
    expect(signUpEmail).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
      callbackURL: "/dashboard",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows the check-your-email state when sign-up returns no session", async () => {
    const signUpEmail = vi
      .fn()
      .mockResolvedValue({ data: { token: null, user: {} }, error: null });
    const sendVerificationEmail = vi
      .fn()
      .mockResolvedValue({ data: {}, error: null });
    const client = {
      signUp: { email: signUpEmail },
      sendVerificationEmail,
    } as unknown as AnyAuthClient;

    renderWithAuth(
      <SignUpForm redirectTo="/dashboard" signInUrl="/sign-in" />,
      client,
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByText("Check your email")).toBeDefined();
    expect(await screen.findByText("ada@example.com")).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: "Resend verification email" }),
    );
    await expect.poll(() => sendVerificationEmail.mock.calls.length).toBe(1);
    expect(sendVerificationEmail).toHaveBeenCalledWith({
      email: "ada@example.com",
      callbackURL: "/dashboard",
    });
    expect(await screen.findByText("Verification email resent.")).toBeDefined();
  });

  it("sends the captcha token on x-captcha-response when configured", async () => {
    const signUpEmail = vi.fn().mockResolvedValue({
      data: { token: "session-token", user: {} },
      error: null,
    });
    const renderWidget = vi.fn((_el, options) => {
      options.callback("turnstile-token-123");
      return "widget-1";
    });
    window.turnstile = {
      render: renderWidget,
      remove: vi.fn(),
    };

    renderWithAuth(
      <SignUpForm redirectTo="/dashboard" captchaSiteKey="site-key" />,
      createMockClient(signUpEmail),
    );
    await expect.poll(() => renderWidget.mock.calls.length).toBe(1);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => signUpEmail.mock.calls.length).toBe(1);
    expect(signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchOptions: {
          headers: { "x-captcha-response": "turnstile-token-123" },
        },
      }),
    );
    delete window.turnstile;
  });

  it("blocks submit when captcha is configured but unsolved", async () => {
    const signUpEmail = vi.fn();
    window.turnstile = {
      render: vi.fn(() => "widget-1"),
      remove: vi.fn(),
    };

    renderWithAuth(
      <SignUpForm captchaSiteKey="site-key" />,
      createMockClient(signUpEmail),
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText("Complete the verification check."),
    ).toBeDefined();
    expect(signUpEmail).not.toHaveBeenCalled();
    delete window.turnstile;
  });

  it("redirects as before when sign-up returns a session", async () => {
    const signUpEmail = vi.fn().mockResolvedValue({
      data: { token: "session-token", user: {} },
      error: null,
    });

    renderWithAuth(
      <SignUpForm redirectTo="/dashboard" />,
      createMockClient(signUpEmail),
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => signUpEmail.mock.calls.length).toBe(1);
    expect(screen.queryByText("Check your email")).toBeNull();
  });

  it("calls signIn.social when a provider button is clicked", async () => {
    const signInSocial = vi.fn().mockResolvedValue({ error: null });

    const client = {
      signIn: { social: signInSocial },
      signUp: { email: vi.fn() },
    } as unknown as AnyAuthClient;

    renderWithAuth(
      <SignUpForm
        redirectTo="/dashboard"
        providers={[{ provider: "github", label: "Continue with GitHub" }]}
      />,
      client,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with GitHub" }),
    );

    await expect.poll(() => signInSocial.mock.calls.length).toBe(1);
    expect(signInSocial).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/dashboard",
    });
  });
});
