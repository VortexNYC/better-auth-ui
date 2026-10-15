import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiKeyManager } from "./api-key-manager";

afterEach(() => cleanup());

describe("ApiKeyManager", () => {
  it("shows the secret once after create", async () => {
    const onCreate = vi.fn().mockResolvedValue({
      name: "CI",
      secret: "shown-once",
    });
    render(
      <ApiKeyManager
        keys={[]}
        scopeOptions={["read", "write"]}
        onCreate={onCreate}
        onRevoke={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create API key" }));
    fireEvent.input(screen.getByLabelText("Name"), {
      target: { value: "CI" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Create" }).closest("form")!,
    );

    expect(await screen.findByText("shown-once")).toBeDefined();
    expect(onCreate).toHaveBeenCalledWith({ name: "CI", scopes: ["read"] });
  });
});
