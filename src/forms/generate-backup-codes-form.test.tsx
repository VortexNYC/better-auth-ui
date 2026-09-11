import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { GenerateBackupCodesForm } from "./generate-backup-codes-form";

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

describe("GenerateBackupCodesForm", () => {
  it("calls twoFactor.generateBackupCodes and displays codes", async () => {
    const generateBackupCodes = vi.fn().mockResolvedValue({
      data: { backupCodes: ["code-1", "code-2"] },
      error: null,
    });
    const onSuccess = vi.fn();

    const client = {
      twoFactor: { generateBackupCodes },
    } as unknown as AnyAuthClient;

    renderWithAuth(<GenerateBackupCodesForm onSuccess={onSuccess} />, client);

    fireEvent.change(screen.getByLabelText("Password (if required)"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => generateBackupCodes.mock.calls.length).toBe(1);
    expect(generateBackupCodes).toHaveBeenCalledWith({
      password: "password123",
    });
    expect(await screen.findByText("code-1")).toBeDefined();
    expect(await screen.findByText("code-2")).toBeDefined();
    await expect.poll(() => onSuccess.mock.calls.length).toBe(1);
    expect(onSuccess).toHaveBeenCalledWith(["code-1", "code-2"]);
  });

  it("shows unavailable message when twoFactor.generateBackupCodes is missing", () => {
    const client = { twoFactor: {} } as unknown as AnyAuthClient;

    renderWithAuth(<GenerateBackupCodesForm />, client);

    fireEvent.submit(getForm());

    expect(
      screen.getByText("Backup code generation is not available."),
    ).toBeDefined();
  });
});
