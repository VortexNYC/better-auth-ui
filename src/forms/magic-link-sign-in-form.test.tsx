import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { MagicLinkSignInForm } from "./magic-link-sign-in-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = {} as unknown as AnyAuthClient,
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("MagicLinkSignInForm", () => {
  it("calls signIn.magicLink with email and callbackURL", async () => {
    const magicLink = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(<MagicLinkSignInForm redirectTo="/dashboard" />, {
      signIn: { magicLink },
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => magicLink.mock.calls.length).toBe(1);
    expect(magicLink).toHaveBeenCalledWith({
      email: "user@example.com",
      callbackURL: "/dashboard",
    });
    expect(
      await screen.findByText("Check your email for a sign-in link."),
    ).toBeDefined();
  });

  it("shows an unavailable message when magicLink is missing", () => {
    renderWithAuth(<MagicLinkSignInForm />);

    expect(
      screen.getByText("Magic link sign-in is not available."),
    ).toBeDefined();
  });

  it("validates the email address", async () => {
    const magicLink = vi.fn().mockResolvedValue({ error: null });

    renderWithAuth(<MagicLinkSignInForm />, {
      signIn: { magicLink },
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => magicLink.mock.calls.length).toBe(0);
    expect(
      screen.getByText("Please enter a valid email address"),
    ).toBeDefined();
  });
});
