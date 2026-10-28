import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient, SsoProviderRecord } from "../types";
import { SsoProviderList } from "./sso-provider-list";

afterEach(() => cleanup());

type SsoClient = NonNullable<AnyAuthClient["sso"]>;

function createMockClient(sso: Partial<SsoClient>): AnyAuthClient {
  return { sso } as unknown as AnyAuthClient;
}

function renderWithAuth(ui: React.ReactElement, client: AnyAuthClient) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

const providers: SsoProviderRecord[] = [
  {
    providerId: "acme-oidc",
    type: "oidc",
    issuer: "https://idp.example.com",
    domain: "acme.com",
    domainVerified: true,
    spMetadataUrl:
      "https://auth.example.com/api/auth/sso/saml2/sp/metadata?providerId=acme-oidc",
  },
  {
    providerId: "beta-saml",
    type: "saml",
    issuer: "https://saml.example.com",
    domain: "beta.com, beta.io",
    domainVerified: false,
    spMetadataUrl:
      "https://auth.example.com/api/auth/sso/saml2/sp/metadata?providerId=beta-saml",
  },
];

describe("SsoProviderList", () => {
  it("loads and renders providers with verification status", async () => {
    const listProviders = vi.fn().mockResolvedValue({
      data: { providers },
      error: null,
    });

    renderWithAuth(
      <SsoProviderList />,
      createMockClient({ providers: listProviders }),
    );

    await expect.poll(() => listProviders.mock.calls.length).toBe(1);
    expect(await screen.findByText("acme-oidc")).toBeDefined();
    expect(screen.getByText("beta-saml")).toBeDefined();
    expect(screen.getByText("OIDC")).toBeDefined();
    expect(screen.getByText("SAML")).toBeDefined();
    expect(screen.getByText("beta.com, beta.io")).toBeDefined();
    expect(screen.getByText("Verified")).toBeDefined();
    expect(screen.getByText("Pending")).toBeDefined();
  });

  it("shows the empty state", async () => {
    const listProviders = vi.fn().mockResolvedValue({
      data: { providers: [] },
      error: null,
    });

    renderWithAuth(
      <SsoProviderList />,
      createMockClient({ providers: listProviders }),
    );

    expect(
      await screen.findByText("No SSO providers configured."),
    ).toBeDefined();
  });

  it("shows the unavailable message when sso.providers is missing", () => {
    renderWithAuth(<SsoProviderList />, createMockClient({}));

    expect(
      screen.getByText("SSO administration is not available."),
    ).toBeDefined();
  });

  it("deletes a provider after confirm", async () => {
    const listProviders = vi.fn().mockResolvedValue({
      data: { providers },
      error: null,
    });
    const deleteProvider = vi.fn().mockResolvedValue({
      data: { success: true },
      error: null,
    });
    const onDeleted = vi.fn();

    renderWithAuth(
      <SsoProviderList onDeleted={onDeleted} />,
      createMockClient({
        providers: listProviders,
        deleteProvider,
      }),
    );

    await screen.findByText("acme-oidc");

    const deleteButtons = screen.getAllByRole("button", {
      name: "Delete",
    });
    fireEvent.click(deleteButtons[0]!);

    const confirm = await screen.findByRole("button", {
      name: "Confirm delete",
    });
    fireEvent.click(confirm);

    await expect.poll(() => deleteProvider.mock.calls.length).toBe(1);
    expect(deleteProvider).toHaveBeenCalledWith({
      providerId: "acme-oidc",
    });
    expect(await screen.findByText("beta-saml")).toBeDefined();
    expect(screen.queryByText("acme-oidc")).toBeNull();
    expect(onDeleted).toHaveBeenCalledWith("acme-oidc");
  });

  it("shows the TXT record and verifies the domain", async () => {
    const listProviders = vi.fn().mockResolvedValue({
      data: { providers },
      error: null,
    });
    const requestDomainVerification = vi.fn().mockResolvedValue({
      data: { domainVerificationToken: "tok-beta" },
      error: null,
    });
    const verifyDomain = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    renderWithAuth(
      <SsoProviderList />,
      createMockClient({
        providers: listProviders,
        requestDomainVerification,
        verifyDomain,
      }),
    );

    await screen.findByText("beta-saml");

    fireEvent.click(screen.getByRole("button", { name: "Verify domain" }));

    await expect
      .poll(() => requestDomainVerification.mock.calls.length)
      .toBe(1);
    expect(requestDomainVerification).toHaveBeenCalledWith({
      providerId: "beta-saml",
    });

    // One TXT row per comma-separated domain.
    expect(
      await screen.findByText("_better-auth-token-beta-saml.beta.com"),
    ).toBeDefined();
    expect(
      screen.getByText("_better-auth-token-beta-saml.beta.io"),
    ).toBeDefined();
    expect(screen.getAllByText("tok-beta").length).toBe(2);

    fireEvent.click(screen.getByRole("button", { name: "Check DNS" }));

    await expect.poll(() => verifyDomain.mock.calls.length).toBe(1);
    expect(verifyDomain).toHaveBeenCalledWith({
      providerId: "beta-saml",
    });
    await expect.poll(() => screen.queryAllByText("Verified").length).toBe(2);
    expect(screen.queryByText("Pending")).toBeNull();
  });

  it("keeps the row pending when verification fails", async () => {
    const listProviders = vi.fn().mockResolvedValue({
      data: { providers },
      error: null,
    });
    const requestDomainVerification = vi.fn().mockResolvedValue({
      data: { domainVerificationToken: "tok-beta" },
      error: null,
    });
    const verifyDomain = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message:
          "Unable to verify domain ownership for beta.com. Try again later",
        status: 502,
      },
    });

    renderWithAuth(
      <SsoProviderList />,
      createMockClient({
        providers: listProviders,
        requestDomainVerification,
        verifyDomain,
      }),
    );

    await screen.findByText("beta-saml");
    fireEvent.click(screen.getByRole("button", { name: "Verify domain" }));
    await screen.findByText("_better-auth-token-beta-saml.beta.com");
    fireEvent.click(screen.getByRole("button", { name: "Check DNS" }));

    expect(
      await screen.findByText(
        "Unable to verify domain ownership for beta.com. Try again later",
      ),
    ).toBeDefined();
    expect(screen.getByText("Pending")).toBeDefined();
  });

  it("calls onEditProvider and onAddProvider", async () => {
    const listProviders = vi.fn().mockResolvedValue({
      data: { providers },
      error: null,
    });
    const onEditProvider = vi.fn();
    const onAddProvider = vi.fn();

    renderWithAuth(
      <SsoProviderList
        onEditProvider={onEditProvider}
        onAddProvider={onAddProvider}
      />,
      createMockClient({ providers: listProviders }),
    );

    await screen.findByText("acme-oidc");

    fireEvent.click(screen.getByRole("button", { name: "Add provider" }));
    expect(onAddProvider).toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onEditProvider).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: "acme-oidc" }),
    );
  });
});
