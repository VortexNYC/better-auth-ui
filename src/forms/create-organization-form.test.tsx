import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../auth-provider";
import type { AnyAuthClient } from "../types";
import { CreateOrganizationForm } from "./create-organization-form";

afterEach(() => cleanup());

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (form === null) {
    throw new Error("Form not found");
  }
  return form;
}

function createMockClient(
  create: NonNullable<AnyAuthClient["organization"]>["create"] = vi
    .fn()
    .mockResolvedValue({
      data: { id: "org_1", name: "Acme", slug: "acme" },
      error: null,
    }),
) {
  return {
    organization: { create },
  } as unknown as AnyAuthClient;
}

function renderWithAuth(
  ui: React.ReactElement,
  client: AnyAuthClient = createMockClient(),
) {
  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("CreateOrganizationForm", () => {
  it("renders inputs and submit button", () => {
    renderWithAuth(<CreateOrganizationForm />);

    expect(screen.getByLabelText("Workspace name")).toBeDefined();
    expect(screen.getByLabelText("Slug")).toBeDefined();
    expect(screen.getByLabelText("Logo URL (optional)")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Create workspace" }),
    ).toBeDefined();
  });

  it("validates required fields", async () => {
    renderWithAuth(<CreateOrganizationForm />);

    fireEvent.submit(getForm());

    expect(await screen.findByText("Name is required.")).toBeDefined();
    expect(await screen.findByText("Slug is required.")).toBeDefined();
  });

  it("validates slug format", async () => {
    renderWithAuth(<CreateOrganizationForm />);

    fireEvent.input(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme" },
    });
    fireEvent.input(screen.getByLabelText("Slug"), {
      target: { value: "Acme Corp" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText(
        "Slug must contain only lowercase letters, numbers, and hyphens.",
      ),
    ).toBeDefined();
  });

  it("calls organization.create with valid values and invokes onSuccess", async () => {
    const create = vi.fn().mockResolvedValue({
      data: { id: "org_1", name: "Acme", slug: "acme" },
      error: null,
    });
    const onSuccess = vi.fn();

    renderWithAuth(<CreateOrganizationForm onSuccess={onSuccess} />, {
      organization: { create },
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme" },
    });
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "acme" },
    });
    fireEvent.submit(getForm());

    expect(await screen.findByText("Create workspace")).toBeDefined();
    expect(create).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
      logo: undefined,
    });
    expect(onSuccess).toHaveBeenCalledWith({
      id: "org_1",
      name: "Acme",
      slug: "acme",
    });
  });

  it("shows unavailable message when organization.create is missing", async () => {
    renderWithAuth(<CreateOrganizationForm />, {
      organization: {},
    } as unknown as AnyAuthClient);

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme" },
    });
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "acme" },
    });
    fireEvent.submit(getForm());

    expect(
      await screen.findByText("Organization creation is not available."),
    ).toBeDefined();
  });
});
