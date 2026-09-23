import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { SignInForm } from "./sign-in-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(
  signInEmail: AnyAuthClient["signIn"]["email"] = vi.fn(),
) {
  return {
    signIn: { email: signInEmail },
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("SignInForm", () => {
  it("renders email and password fields and a submit button", () => {
    renderWithAuth(<SignInForm />);

    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
  });

  it("shows validation errors for empty fields", async () => {
    renderWithAuth(<SignInForm />);

    fireEvent.submit(getForm());

    expect(await screen.findByText("Password is required")).toBeDefined();
    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeDefined();
  });

  it("calls signIn.email with valid credentials and invokes onSuccess", async () => {
    const signInEmail = vi.fn().mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const onSuccess = vi.fn();

    renderWithAuth(
      <SignInForm redirectTo="/dashboard" onSuccess={onSuccess} />,
      createMockClient(signInEmail),
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.submit(getForm());

    await expect.poll(() => signInEmail.mock.calls.length).toBe(1);
    expect(signInEmail).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      callbackURL: "/dashboard",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("displays an error when signIn.email fails", async () => {
    const signInEmail = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Invalid credentials", status: 401, statusText: "" },
    });

    renderWithAuth(<SignInForm />, createMockClient(signInEmail));

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });

    fireEvent.submit(getForm());

    expect(await screen.findByText("Invalid credentials")).toBeDefined();
  });

  it("calls signIn.social when a provider button is clicked", async () => {
    const signInSocial = vi.fn().mockResolvedValue({ error: null });

    const client = {
      signIn: { email: vi.fn(), social: signInSocial },
    } as unknown as AnyAuthClient;

    renderWithAuth(
      <SignInForm
        redirectTo="/dashboard"
        providers={[{ provider: "google", label: "Continue with Google" }]}
      />,
      client,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    await expect.poll(() => signInSocial.mock.calls.length).toBe(1);
    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/dashboard",
    });
  });

  it("shows unavailable message when signIn.social is missing and a provider is clicked", async () => {
    const client = { signIn: { email: vi.fn() } } as unknown as AnyAuthClient;

    renderWithAuth(
      <SignInForm
        providers={[{ provider: "google", label: "Continue with Google" }]}
      />,
      client,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(
      await screen.findByText("Social sign-in is not available."),
    ).toBeDefined();
  });

  it("moves to the TOTP step when the server requires two-factor", async () => {
    const signInEmail = vi
      .fn()
      .mockResolvedValue({ data: { twoFactorRedirect: true }, error: null });
    const verifyTotp = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();
    const client = {
      signIn: { email: signInEmail },
      twoFactor: { verifyTotp },
    } as unknown as AnyAuthClient;

    renderWithAuth(<SignInForm onSuccess={onSuccess} />, client);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    // Credentials step swaps to the TOTP step.
    expect(
      await screen.findByLabelText(/6-digit|code|Code/i),
    ).toBeDefined();
    expect(screen.queryByLabelText("Email")).toBeNull();

    fireEvent.change(screen.getByLabelText(/code/i), {
      target: { value: "123456" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => verifyTotp.mock.calls.length).toBe(1);
    expect(verifyTotp).toHaveBeenCalledWith({
      code: "123456",
      trustDevice: false,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("can switch from TOTP to the backup-code step and back", async () => {
    const signInEmail = vi
      .fn()
      .mockResolvedValue({ data: { twoFactorRedirect: true }, error: null });
    const verifyBackupCode = vi.fn().mockResolvedValue({ error: null });
    const client = {
      signIn: { email: signInEmail },
      twoFactor: { verifyTotp: vi.fn(), verifyBackupCode },
    } as unknown as AnyAuthClient;

    renderWithAuth(<SignInForm />, client);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    fireEvent.click(
      await screen.findByRole("button", { name: "Use a backup code" }),
    );
    expect(await screen.findByLabelText("Backup code")).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: "Use authenticator app" }),
    );
    expect(await screen.findByLabelText(/code/i)).toBeDefined();
    expect(screen.queryByLabelText("Backup code")).toBeNull();
  });
});
