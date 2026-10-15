import { describe, expect, it } from "vitest";

import { pageSlice, withinDates } from "./page-window";

describe("pageSlice", () => {
  it("returns the requested page and clamps past the end", () => {
    const window = pageSlice(["a", "b", "c"], 2, 2);
    expect(window.page).toBe(2);
    expect(window.pages).toBe(2);
    expect([...window.items]).toEqual(["c"]);
    expect(pageSlice(["a"], 9, 25).page).toBe(1);
  });
});

describe("withinDates", () => {
  it("keeps rows inside the inclusive range", () => {
    expect(
      withinDates("2026-10-15T12:00:00Z", "2026-10-01", "2026-10-15"),
    ).toBe(true);
    expect(withinDates("2026-09-30", "2026-10-01", "")).toBe(false);
    expect(withinDates(null, "", "")).toBe(true);
    expect(withinDates(null, "2026-10-01", "")).toBe(false);
  });
});
