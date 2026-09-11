import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { EnableTwoFactorForm } from "./enable-two-factor-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(
  twoFactor: AnyAuthClient["twoFactor"] = {
    enable: vi.fn().mockResolvedValue({
      data: {
        totpURI:
          "otpauth://totp/Seal:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Seal",
        backupCodes: ["code1", "code2"],
      },
      error: null,
    }),
    verifyTotp: vi.fn().mockResolvedValue({ error: null }),
    verifyBackupCode: vi.fn(),
    disable: vi.fn(),
    generateBackupCodes: vi.fn(),
  },
) {
  return { twoFactor } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("EnableTwoFactorForm", () => {
  it("renders the password step", () => {
    renderWithAuth(<EnableTwoFactorForm issuer="Seal" />);

    expect(screen.getByLabelText("Confirm your password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDefined();
  });

  it("shows unavailable message when twoFactor.enable is missing", () => {
    renderWithAuth(<EnableTwoFactorForm />, {
      twoFactor: {},
    } as unknown as AnyAuthClient);

    expect(
      screen.getByText("Two-factor authentication is not available."),
    ).toBeDefined();
  });

  it("advances to verify step after enabling", async () => {
    renderWithAuth(<EnableTwoFactorForm issuer="Seal" />);

    fireEvent.change(screen.getByLabelText("Confirm your password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByText("Scan the QR code")).toBeDefined();
    expect(screen.getByLabelText("6-digit code")).toBeDefined();
    expect(screen.getByLabelText("Setup key")).toBeDefined();
  });

  it("completes enrollment after verifying a TOTP code", async () => {
    const onSuccess = vi.fn();
    renderWithAuth(<EnableTwoFactorForm issuer="Seal" onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("Confirm your password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(getForm());

    await screen.findByLabelText("6-digit code");

    fireEvent.change(screen.getByLabelText("6-digit code"), {
      target: { value: "123456" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByText("Save your backup codes")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onSuccess).toHaveBeenCalled();
  });
});
