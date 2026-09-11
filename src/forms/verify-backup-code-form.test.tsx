import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { VerifyBackupCodeForm } from "./verify-backup-code-form";

afterEach(() => cleanup());

function renderWithAuth(ui: React.ReactElement, client: AnyAuthClient) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form;
}

describe("VerifyBackupCodeForm", () => {
  it("calls verifyBackupCode and invokes onSuccess", async () => {
    const verifyBackupCode = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    const client = {
      twoFactor: { verifyBackupCode },
    } as unknown as AnyAuthClient;

    renderWithAuth(<VerifyBackupCodeForm onSuccess={onSuccess} />, client);

    fireEvent.change(screen.getByLabelText("Backup code"), {
      target: { value: "ABCDE-12345" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Trust this device" }),
    );
    fireEvent.submit(getForm());

    await expect.poll(() => verifyBackupCode.mock.calls.length).toBe(1);
    expect(verifyBackupCode).toHaveBeenCalledWith({
      code: "ABCDE-12345",
      trustDevice: true,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows unavailable message when twoFactor.verifyBackupCode is missing", () => {
    const client = { twoFactor: {} } as unknown as AnyAuthClient;

    renderWithAuth(<VerifyBackupCodeForm />, client);

    fireEvent.submit(getForm());

    expect(
      screen.getByText("Backup code verification is not available."),
    ).toBeDefined();
  });
});
