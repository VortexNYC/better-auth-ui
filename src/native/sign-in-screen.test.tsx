import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { NativeSignInScreen } from "./sign-in-screen";

describe("NativeSignInScreen", () => {
  it("signs in with email and password", async () => {
    const user = userEvent.setup();
    const email = vi.fn().mockResolvedValue({ data: {}, error: null });
    const client = {
      useSession: () => ({ data: null, isPending: false }),
      signOut: vi.fn(),
      signIn: { email },
      signUp: { email: vi.fn() },
    } as unknown as AnyAuthClient;

    render(
      <AuthProvider client={client}>
        <NativeSignInScreen />
      </AuthProvider>,
    );

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "ada@example.com",
    );
    const password = document.querySelector("input[type=password]");
    if (!(password instanceof HTMLInputElement)) {
      throw new Error("password field missing");
    }
    await user.type(password, "secret-secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(email).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "secret-secret",
      callbackURL: undefined,
    });
  });
});
