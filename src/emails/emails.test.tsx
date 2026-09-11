// @vitest-environment node

import { describe, expect, it } from "vitest";
import { render } from "react-email";

import { ChangeEmailConfirmation } from "./change-email-confirmation";
import { OrganizationInvitationEmail } from "./organization-invitation-email";
import { PasswordResetEmail } from "./password-reset-email";
import { VerificationEmail } from "./verification-email";

describe("Email templates", () => {
  it("VerificationEmail renders the verification URL", async () => {
    const html = await render(
      <VerificationEmail
        verificationUrl="https://example.com/verify?token=abc"
        username="Ada"
        brandName="Seal"
      />,
    );

    expect(html).toContain("Verify your email");
    expect(html).toContain("https://example.com/verify?token=abc");
  });

  it("PasswordResetEmail renders the reset URL", async () => {
    const html = await render(
      <PasswordResetEmail
        resetUrl="https://example.com/reset?token=xyz"
        username="Ada"
      />,
    );

    expect(html).toContain("Reset your password");
    expect(html).toContain("https://example.com/reset?token=xyz");
  });

  it("OrganizationInvitationEmail renders the invitation details", async () => {
    const html = await render(
      <OrganizationInvitationEmail
        organizationName="Acme"
        acceptUrl="https://example.com/invite?token=123"
        inviterName="John"
      />,
    );

    expect(html).toContain("Acme");
    expect(html).toContain("https://example.com/invite?token=123");
  });

  it("ChangeEmailConfirmation renders the new email and confirm URL", async () => {
    const html = await render(
      <ChangeEmailConfirmation
        newEmail="new@example.com"
        confirmUrl="https://example.com/change-email?token=def"
        username="Ada"
      />,
    );

    expect(html).toContain("new@example.com");
    expect(html).toContain("https://example.com/change-email?token=def");
  });
});
