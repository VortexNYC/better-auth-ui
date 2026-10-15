import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { PasswordField } from "./password-field";

function Harness() {
  const [value, setValue] = useState("");
  return (
    <PasswordField
      label="Password"
      value={value}
      onValueChange={setValue}
      autoComplete="current-password"
    />
  );
}

describe("PasswordField", () => {
  it("keeps the password masked and offers no copy control", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Password");
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("Password field did not render an input");
    }
    expect(input.getAttribute("type")).toBe("password");
    await user.type(input, "overlay-check");
    expect(input.getAttribute("type")).toBe("password");
    expect(input.value).toBe("overlay-check");
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input.getAttribute("type")).toBe("text");
  });
});
