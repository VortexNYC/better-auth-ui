import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { VerifyTotpForm } from "./verify-totp-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

function createMockClient(
  verifyTotp: NonNullable<AnyAuthClient["twoFactor"]>["verifyTotp"] = vi
    .fn()
    .mockResolvedValue({ error: null }),
) {
  return {
    twoFactor: { verifyTotp },
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("VerifyTotpForm", () => {
  it("renders the code input", () => {
    renderWithAuth(<VerifyTotpForm />);

    expect(screen.getByLabelText("6-digit code")).toBeDefined();
    expect(screen.getByRole("button", { name: "Verify" })).toBeDefined();
  });

  it("shows unavailable message when twoFactor.verifyTotp is missing", () => {
    renderWithAuth(<VerifyTotpForm />, {
      twoFactor: {},
    } as unknown as AnyAuthClient);

    expect(
      screen.getByText("Two-factor authentication is not available."),
    ).toBeDefined();
  });

  it("calls verifyTotp and invokes onSuccess", async () => {
    const verifyTotp = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    renderWithAuth(
      <VerifyTotpForm showTrustDevice onSuccess={onSuccess} />,
      createMockClient(verifyTotp),
    );

    fireEvent.change(screen.getByLabelText("6-digit code"), {
      target: { value: "123456" },
    });

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Trust this device" }),
    );

    fireEvent.submit(getForm());

    await expect.poll(() => verifyTotp.mock.calls.length).toBe(1);
    expect(verifyTotp).toHaveBeenCalledWith({
      code: "123456",
      trustDevice: true,
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
