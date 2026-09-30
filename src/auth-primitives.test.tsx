import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthCard, SettingsStack } from "./auth-primitives";

describe("AuthCard settings", () => {
  it("renders a dense left-aligned settings section", () => {
    const { container } = render(
      <AuthCard variant="settings" title="Profile" description="Your name.">
        <button type="submit">Save</button>
      </AuthCard>,
    );

    const card = container.querySelector("[data-baui-settings-card]");
    expect(card).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Profile" }),
    ).toBeTruthy();
    expect(screen.getByText("Your name.")).toBeTruthy();
    expect(card?.querySelector("header")?.className).toContain("text-left");
    expect(card?.className).not.toContain("mx-auto");
    expect(card?.className).toContain("rounded-xl");
  });
});

describe("SettingsStack", () => {
  it("flattens nested settings cards into one hairline surface", () => {
    const { container } = render(
      <SettingsStack>
        <AuthCard variant="settings" title="One">
          a
        </AuthCard>
        <AuthCard variant="settings" title="Two">
          b
        </AuthCard>
      </SettingsStack>,
    );

    const stack = container.querySelector("[data-baui-settings-stack]");
    expect(stack).not.toBeNull();
    expect(stack?.className).toContain("rounded-xl");
    expect(stack?.className).toContain("border");

    const cards = container.querySelectorAll("[data-baui-settings-card]");
    expect(cards).toHaveLength(2);
    // Context drops solo card chrome on each row.
    expect(cards[0]?.className).toContain("border-b");
    expect(cards[0]?.className).not.toContain("rounded-xl");
    expect(cards[0]?.className.split(/\s+/)).not.toContain("border");
  });
});
