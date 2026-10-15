import { describe, expect, it } from "vitest";

import {
  brandMetadataValue,
  invitationAcceptHref,
  mergeMetadataKey,
  readOrganizationSecurity,
  securityMetadataValue,
} from "./organization-metadata";

describe("organization metadata", () => {
  it("patches security without dropping product fields", () => {
    const next = mergeMetadataKey(
      { timezone: "UTC", security: { requireMfa: false } },
      "security",
      securityMetadataValue({ requireMfa: true, sessionTimeoutMinutes: 60 }),
    );
    expect(next).toEqual({
      timezone: "UTC",
      security: { requireMfa: true, sessionTimeoutMinutes: 60 },
    });
  });

  it("reads a missing policy as off", () => {
    expect(readOrganizationSecurity({ timezone: "UTC" })).toEqual({
      requireMfa: false,
      sessionTimeoutMinutes: null,
    });
  });

  it("drops an empty brand object", () => {
    expect(
      brandMetadataValue({
        primaryColor: "  ",
        accentColor: "",
        website: "",
        emailFromName: "",
        emailReplyTo: "",
      }),
    ).toBeUndefined();
  });

  it("rejects a timeout outside 15–1440 minutes", () => {
    expect(() =>
      securityMetadataValue({ requireMfa: false, sessionTimeoutMinutes: 5 }),
    ).toThrow(/15/);
  });
});

describe("invitationAcceptHref", () => {
  it("builds an absolute accept link", () => {
    expect(
      invitationAcceptHref({
        origin: "https://app.seal.nyc",
        path: "/accept-invite",
        invitationId: "inv_1",
      }),
    ).toBe("https://app.seal.nyc/accept-invite?token=inv_1");
  });
});
