import { describe, expect, it } from "vitest";

import {
  isOrganizationAdminRole,
  ORGANIZATION_INVITE_ROLE_OPTIONS,
} from "./organization-role";

describe("isOrganizationAdminRole", () => {
  it("accepts owner and admin", () => {
    expect(isOrganizationAdminRole("owner")).toBe(true);
    expect(isOrganizationAdminRole("admin")).toBe(true);
  });

  it("rejects member and empty", () => {
    expect(isOrganizationAdminRole("member")).toBe(false);
    expect(isOrganizationAdminRole(null)).toBe(false);
    expect(isOrganizationAdminRole(undefined)).toBe(false);
    expect(isOrganizationAdminRole("")).toBe(false);
  });
});

describe("ORGANIZATION_INVITE_ROLE_OPTIONS", () => {
  it("does not offer owner as an invite target", () => {
    expect(ORGANIZATION_INVITE_ROLE_OPTIONS).not.toContain("owner");
    expect(ORGANIZATION_INVITE_ROLE_OPTIONS).toContain("admin");
    expect(ORGANIZATION_INVITE_ROLE_OPTIONS).toContain("member");
  });
});
