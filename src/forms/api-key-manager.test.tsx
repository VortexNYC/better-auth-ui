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
    expect(onCreate).toHaveBeenCalledWith({
      name: "CI",
      scopes: ["read"],
      allowedIpRanges: [],
    });
  });

  it("shows allowed IP ranges and sends them on create", async () => {
    const onCreate = vi.fn().mockResolvedValue({
      name: "CI",
      secret: "shown-once",
    });
    render(
      <ApiKeyManager
        keys={[
          {
            id: "key_1",
            name: "Office",
            scopes: ["read"],
            allowedIpRanges: ["192.168.1.0/24"],
          },
        ]}
        scopeOptions={["read"]}
        onCreate={onCreate}
        onRevoke={vi.fn()}
      />,
    );

    expect(screen.getByText("192.168.1.0/24")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Create API key" }));
    fireEvent.input(screen.getByLabelText("Name"), {
      target: { value: "CI" },
    });
    fireEvent.input(screen.getByLabelText("Allowed IP ranges"), {
      target: { value: "10.0.0.0/8\n203.0.113.4" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Create" }).closest("form")!,
    );

    expect(onCreate).toHaveBeenCalledWith({
      name: "CI",
      scopes: ["read"],
      allowedIpRanges: ["10.0.0.0/8", "203.0.113.4"],
    });
  });
});
