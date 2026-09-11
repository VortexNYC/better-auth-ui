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
});
