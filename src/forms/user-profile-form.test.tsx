import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { UserProfileForm } from "./user-profile-form";

afterEach(() => cleanup());

function renderWithAuth(ui: React.ReactElement, client: AnyAuthClient) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("UserProfileForm", () => {
  it("pre-fills from the current session and updates the user", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    const client = {
      useSession: vi.fn().mockReturnValue({
        data: {
          user: {
            id: "u1",
            email: "ada@example.com",
            name: "Ada",
            image: null,
          },
        },
        isPending: false,
      }),
      updateUser,
    } as unknown as AnyAuthClient;

    renderWithAuth(<UserProfileForm onSuccess={onSuccess} />, client);

    const nameInput = (await screen.findByLabelText(
      "Name",
    )) as HTMLInputElement;
    expect(nameInput.value).toBe("Ada");

    fireEvent.change(nameInput, { target: { value: "Ada Lovelace" } });
    fireEvent.submit(document.querySelector("form")!);

    await expect.poll(() => updateUser.mock.calls.length).toBe(1);
    expect(updateUser).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      image: null,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows unavailable message when updateUser is missing", async () => {
    const client = {
      useSession: vi.fn().mockReturnValue({
        data: { user: { id: "u1", email: "ada@example.com", name: "" } },
        isPending: false,
      }),
    } as unknown as AnyAuthClient;

    renderWithAuth(<UserProfileForm />, client);

    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Ada" },
    });
    fireEvent.submit(document.querySelector("form")!);

    expect(
      await screen.findByText("Profile update is not available."),
    ).toBeDefined();
  });
});
