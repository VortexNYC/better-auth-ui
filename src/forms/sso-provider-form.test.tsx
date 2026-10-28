import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient, SsoProviderRecord } from "../types";
import { SsoProviderForm } from "./sso-provider-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form as HTMLFormElement;
}

type SsoClient = NonNullable<AnyAuthClient["sso"]>;

function createMockClient(sso: Partial<SsoClient>): AnyAuthClient {
  return { sso } as unknown as AnyAuthClient;
}

function renderWithAuth(ui: React.ReactElement, client: AnyAuthClient) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

const registeredOidcProvider: SsoProviderRecord = {
  providerId: "acme-oidc",
  issuer: "https://idp.example.com",
  domain: "acme.com",
  domainVerified: false,
  domainVerificationToken: "txt-token-123",
  redirectURI: "https://auth.example.com/api/auth/sso/callback/acme-oidc",
  oidcConfig: {
    issuer: "https://idp.example.com",
    clientId: "client-1",
    discoveryEndpoint:
      "https://idp.example.com/.well-known/openid-configuration",
  },
  samlConfig: null,
};

function fillCommonFields() {
  fireEvent.change(screen.getByLabelText("Provider ID"), {
    target: { value: "acme-oidc" },
  });
  fireEvent.change(screen.getByLabelText("Issuer URL"), {
    target: { value: "https://idp.example.com" },
  });
  fireEvent.change(screen.getByLabelText("Domain"), {
    target: { value: "acme.com" },
  });
}

describe("SsoProviderForm", () => {
  it("renders the OIDC fields by default", () => {
    renderWithAuth(
      <SsoProviderForm />,
      createMockClient({ register: vi.fn() }),
    );

    expect(screen.getByLabelText("Provider ID")).toBeDefined();
    expect(screen.getByLabelText("Issuer URL")).toBeDefined();
    expect(screen.getByLabelText("Domain")).toBeDefined();
    expect(screen.getByLabelText("Client ID")).toBeDefined();
    expect(screen.getByLabelText("Client secret")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Register provider" }),
    ).toBeDefined();
  });

  it("shows validation errors for an empty submit", () => {
    renderWithAuth(
      <SsoProviderForm />,
      createMockClient({ register: vi.fn() }),
    );

    fireEvent.submit(getForm());

    expect(screen.getByText("Provider ID is required.")).toBeDefined();
    expect(screen.getByText("Issuer must be a valid URL.")).toBeDefined();
    expect(screen.getByText("Domain is required.")).toBeDefined();
    expect(screen.getByText("Client ID is required.")).toBeDefined();
    expect(screen.getByText("Client secret is required.")).toBeDefined();
  });

  it("registers an OIDC provider with the mapped payload", async () => {
    const register = vi.fn().mockResolvedValue({
      data: registeredOidcProvider,
      error: null,
    });
    const onSaved = vi.fn();

    renderWithAuth(
      <SsoProviderForm organizationId="org_1" onSaved={onSaved} />,
      createMockClient({ register }),
    );

    fillCommonFields();
    fireEvent.change(screen.getByLabelText("Client ID"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText("Client secret"), {
      target: { value: "secret-1" },
    });
    fireEvent.change(screen.getByLabelText("Scopes"), {
      target: { value: "openid, email, profile" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => register.mock.calls.length).toBe(1);
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "acme-oidc",
        issuer: "https://idp.example.com",
        domain: "acme.com",
        organizationId: "org_1",
        oidcConfig: expect.objectContaining({
          clientId: "client-1",
          clientSecret: "secret-1",
          scopes: ["openid", "email", "profile"],
        }),
      }),
    );
    const args = register.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.samlConfig).toBeUndefined();
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: "acme-oidc" }),
    );
  });

  it("shows the redirect URI and domain verification token after register", async () => {
    const register = vi.fn().mockResolvedValue({
      data: registeredOidcProvider,
      error: null,
    });

    renderWithAuth(<SsoProviderForm />, createMockClient({ register }));

    fillCommonFields();
    fireEvent.change(screen.getByLabelText("Client ID"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText("Client secret"), {
      target: { value: "secret-1" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByText("OIDC provider saved")).toBeDefined();
    expect(
      screen.getByText("Redirect URI — register at your identity provider"),
    ).toBeDefined();
    expect(
      screen.getByText(
        "https://auth.example.com/api/auth/sso/callback/acme-oidc",
      ),
    ).toBeDefined();
    expect(
      screen.getByText("_better-auth-token-acme-oidc.acme.com"),
    ).toBeDefined();
    expect(screen.getByText("txt-token-123")).toBeDefined();
    expect(screen.getByText("Pending verification")).toBeDefined();
  });

  it("registers a SAML provider with entryPoint/cert/entityID", async () => {
    const register = vi.fn().mockResolvedValue({
      data: {
        providerId: "acme-saml",
        issuer: "https://idp.example.com",
        domain: "acme.com",
        redirectURI: "https://auth.example.com/api/auth/sso/callback/acme-saml",
        samlConfig: { entryPoint: "https://idp.example.com/sso/saml" },
        oidcConfig: null,
      },
      error: null,
    });

    renderWithAuth(
      <SsoProviderForm providerType="saml" />,
      createMockClient({ register }),
    );

    fireEvent.change(screen.getByLabelText("Provider ID"), {
      target: { value: "acme-saml" },
    });
    fireEvent.change(screen.getByLabelText("Issuer URL"), {
      target: { value: "https://idp.example.com" },
    });
    fireEvent.change(screen.getByLabelText("Domain"), {
      target: { value: "acme.com" },
    });
    fireEvent.change(screen.getByLabelText("IdP SSO URL (entry point)"), {
      target: { value: "https://idp.example.com/sso/saml" },
    });
    fireEvent.change(screen.getByLabelText("IdP entity ID"), {
      target: { value: "https://idp.example.com/entity" },
    });
    fireEvent.change(screen.getByLabelText("IdP signing certificate (PEM)"), {
      target: { value: "-----BEGIN CERTIFICATE-----abc" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => register.mock.calls.length).toBe(1);
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "acme-saml",
        samlConfig: {
          entryPoint: "https://idp.example.com/sso/saml",
          cert: "-----BEGIN CERTIFICATE-----abc",
          idpMetadata: { entityID: "https://idp.example.com/entity" },
        },
      }),
    );
    const args = register.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.oidcConfig).toBeUndefined();

    // SAML success shows the ACS URL derived from the redirect URI.
    expect(await screen.findByText("SAML provider saved")).toBeDefined();
    expect(
      screen.getByText(
        "https://auth.example.com/api/auth/sso/saml2/sp/acs/acme-saml",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "https://auth.example.com/api/auth/sso/saml2/sp/metadata?providerId=acme-saml",
      ),
    ).toBeDefined();
  });

  it("sends IdP metadata XML as idpMetadata.metadata", async () => {
    const register = vi.fn().mockResolvedValue({
      data: { providerId: "acme-saml", samlConfig: {} },
      error: null,
    });

    renderWithAuth(
      <SsoProviderForm providerType="saml" />,
      createMockClient({ register }),
    );

    fireEvent.change(screen.getByLabelText("Provider ID"), {
      target: { value: "acme-saml" },
    });
    fireEvent.change(screen.getByLabelText("Issuer URL"), {
      target: { value: "https://idp.example.com" },
    });
    fireEvent.change(screen.getByLabelText("Domain"), {
      target: { value: "acme.com" },
    });
    fireEvent.change(screen.getByLabelText("IdP SSO URL (entry point)"), {
      target: { value: "https://idp.example.com/sso/saml" },
    });
    fireEvent.change(screen.getByLabelText("IdP metadata XML"), {
      target: { value: "<EntityDescriptor /> " },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => register.mock.calls.length).toBe(1);
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        samlConfig: {
          entryPoint: "https://idp.example.com/sso/saml",
          idpMetadata: { metadata: "<EntityDescriptor />" },
        },
      }),
    );
  });

  it("requires entityID and cert when no SAML metadata XML is given", () => {
    renderWithAuth(
      <SsoProviderForm providerType="saml" />,
      createMockClient({ register: vi.fn() }),
    );

    fireEvent.submit(getForm());

    expect(
      screen.getByText(
        "IdP entity ID is required when metadata XML is not provided.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "IdP signing certificate is required when metadata XML is not provided.",
      ),
    ).toBeDefined();
    expect(screen.getByText("IdP SSO URL is required.")).toBeDefined();
  });

  it("updates an existing provider instead of registering", async () => {
    const updateProvider = vi.fn().mockResolvedValue({
      data: {
        providerId: "acme-oidc",
        type: "oidc",
        issuer: "https://idp.example.com",
        domain: "acme.com",
        domainVerified: true,
        spMetadataUrl:
          "https://auth.example.com/api/auth/sso/saml2/sp/metadata?providerId=acme-oidc",
      },
      error: null,
    });
    const register = vi.fn();
    const existing: SsoProviderRecord = {
      providerId: "acme-oidc",
      type: "oidc",
      issuer: "https://idp.example.com",
      domain: "acme.com",
      domainVerified: true,
    };

    renderWithAuth(
      <SsoProviderForm provider={existing} />,
      createMockClient({ register, updateProvider }),
    );

    // Edit mode: provider ID/type are fixed, secrets stay blank = keep.
    expect(screen.queryByLabelText("Provider ID")).toBeNull();
    expect(screen.getByText(/acme-oidc/)).toBeDefined();

    fireEvent.change(screen.getByLabelText("Domain"), {
      target: { value: "acme.com,subsidiary.com" },
    });
    fireEvent.submit(getForm());

    await expect.poll(() => updateProvider.mock.calls.length).toBe(1);
    expect(register).not.toHaveBeenCalled();
    expect(updateProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "acme-oidc",
        issuer: "https://idp.example.com",
        domain: "acme.com,subsidiary.com",
      }),
    );
    expect(await screen.findByText("Verified")).toBeDefined();
  });

  it("omits untouched config on update when no fields are filled", async () => {
    const updateProvider = vi.fn().mockResolvedValue({
      data: {
        providerId: "acme-oidc",
        type: "oidc",
        domainVerified: true,
      },
      error: null,
    });
    const existing: SsoProviderRecord = {
      providerId: "acme-oidc",
      type: "oidc",
      issuer: "https://idp.example.com",
      domain: "acme.com",
    };

    renderWithAuth(
      <SsoProviderForm provider={existing} />,
      createMockClient({ updateProvider }),
    );

    fireEvent.submit(getForm());

    await expect.poll(() => updateProvider.mock.calls.length).toBe(1);
    const args = updateProvider.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.oidcConfig).toBeUndefined();
    expect(args.samlConfig).toBeUndefined();
  });

  it("surfaces server errors", async () => {
    const register = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "SSO provider with this providerId already exists",
        status: 422,
      },
    });

    renderWithAuth(<SsoProviderForm />, createMockClient({ register }));

    fillCommonFields();
    fireEvent.change(screen.getByLabelText("Client ID"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText("Client secret"), {
      target: { value: "secret-1" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText(
        "SSO provider with this providerId already exists",
      ),
    ).toBeDefined();
  });

  it("shows the unavailable message when sso.register is missing", () => {
    renderWithAuth(<SsoProviderForm />, createMockClient({}));

    expect(
      screen.getByText("SSO administration is not available."),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Register provider" }),
    ).toBeNull();
  });

  it("verifies the domain via sso.verifyDomain", async () => {
    const register = vi.fn().mockResolvedValue({
      data: registeredOidcProvider,
      error: null,
    });
    const verifyDomain = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    renderWithAuth(
      <SsoProviderForm />,
      createMockClient({ register, verifyDomain }),
    );

    fillCommonFields();
    fireEvent.change(screen.getByLabelText("Client ID"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText("Client secret"), {
      target: { value: "secret-1" },
    });
    fireEvent.submit(getForm());

    const verifyButton = await screen.findByRole("button", {
      name: "Verify domain",
    });
    fireEvent.click(verifyButton);

    await expect.poll(() => verifyDomain.mock.calls.length).toBe(1);
    expect(verifyDomain).toHaveBeenCalledWith({
      providerId: "acme-oidc",
    });
    expect(await screen.findByText("Verified")).toBeDefined();
  });
});
