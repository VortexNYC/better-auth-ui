import { describe, expect, it } from "vitest";

import { expoSecureStorage, readAuthDeepLink } from "./session";

describe("expoSecureStorage", () => {
  it("forwards reads and writes to the secure store", async () => {
    const memory = new Map<string, string>();
    const storage = expoSecureStorage({
      getItemAsync: async (key) => memory.get(key) ?? null,
      setItemAsync: async (key, value) => {
        memory.set(key, value);
      },
    });
    await storage.setItem("session", "token");
    expect(await storage.getItem("session")).toBe("token");
  });
});

describe("readAuthDeepLink", () => {
  it("reads tokens from https and app-scheme links", () => {
    expect(
      readAuthDeepLink("https://app.seal.nyc/reset-password?token=abc"),
    ).toEqual({
      path: "/reset-password",
      token: "abc",
      invitationId: null,
      email: null,
    });
    expect(
      readAuthDeepLink("seal://accept-invite?invitation_token=inv_1"),
    ).toEqual({
      path: "/accept-invite",
      token: null,
      invitationId: "inv_1",
      email: null,
    });
    expect(readAuthDeepLink("not a url")).toBeNull();
  });
});
