import { describe, expect, it } from "vitest";

import {
  brandMetadataValue,
  invitationAcceptHref,
  mergeMetadataKey,
  mergeOrganizationRegional,
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

describe("mergeOrganizationRegional", () => {
  it("sets timezone and currency without dropping security", () => {
    expect(
      mergeOrganizationRegional(
        { security: { requireMfa: true }, timezone: "UTC" },
        {
          timezone: "America/New_York",
          currency: "USD",
          currencyKind: "normal",
        },
      ),
    ).toEqual({
      security: { requireMfa: true },
      timezone: "America/New_York",
      currency: "USD",
      currencyKind: "normal",
    });
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
