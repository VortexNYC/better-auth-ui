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
});
