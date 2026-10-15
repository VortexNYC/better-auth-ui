import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WebhookManager } from "./webhook-manager";

describe("WebhookManager", () => {
  it("shows the signing secret once and sends every selected event", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({ secret: "whsec_once" });
    render(
      <WebhookManager
        endpoints={[]}
        deliveries={[
          {
            id: "d1",
            endpointId: "e1",
            event: "document.completed",
            status: "failed",
            exhausted: true,
            createdAt: "2026-10-01",
          },
          {
            id: "d2",
            endpointId: "e1",
            event: "document.sent",
            status: "ok",
            createdAt: "2026-10-02",
          },
        ]}
        eventOptions={["document.sent", "document.completed"]}
        pageSize={1}
        onCreate={onCreate}
        onDelete={vi.fn()}
      />,
    );

    const boxes = screen.getAllByRole("checkbox");
    const completed = boxes[1];
    if (!completed) throw new Error("event checkbox missing");
    await user.click(completed);
    await user.type(screen.getByLabelText("Name"), "Production");
    await user.type(screen.getByLabelText("URL"), "https://example.com/hooks");
    await user.click(screen.getByRole("button", { name: "Add endpoint" }));

    expect(onCreate).toHaveBeenCalledWith({
      name: "Production",
      url: "https://example.com/hooks",
      events: ["document.sent", "document.completed"],
    });
    expect(screen.getByText("whsec_once")).toBeTruthy();
    expect(screen.getByText("exhausted")).toBeTruthy();
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });
});
