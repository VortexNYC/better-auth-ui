import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { ChangeEmailForm } from "./change-email-form";

afterEach(() => cleanup());

function renderWithAuth(ui: React.ReactElement, client: AnyAuthClient) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("ChangeEmailForm", () => {
  it("validates the email and calls changeEmail", async () => {
    const changeEmail = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    const client = { changeEmail } as unknown as AnyAuthClient;

    renderWithAuth(
      <ChangeEmailForm callbackURL="/profile" onSuccess={onSuccess} />,
      client,
    );

    fireEvent.change(screen.getByLabelText("New email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.submit(document.querySelector("form")!);

    await expect.poll(() => changeEmail.mock.calls.length).toBe(1);
    expect(changeEmail).toHaveBeenCalledWith({
      newEmail: "new@example.com",
      callbackURL: "/profile",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const client = {} as unknown as AnyAuthClient;

    renderWithAuth(<ChangeEmailForm />, client);

    fireEvent.change(screen.getByLabelText("New email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(document.querySelector("form")!);

    expect(
      await screen.findByText("Please enter a valid email address."),
    ).toBeDefined();
  });

  it("shows unavailable message when changeEmail is missing", async () => {
    const client = {} as unknown as AnyAuthClient;

    renderWithAuth(<ChangeEmailForm />, client);

    fireEvent.change(screen.getByLabelText("New email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.submit(document.querySelector("form")!);

    expect(
      await screen.findByText("Email change is not available."),
    ).toBeDefined();
  });
});
