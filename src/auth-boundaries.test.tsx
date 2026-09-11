import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AuthProvider } from "./auth-provider";
import type { AnyAuthClient } from "./types";
import { Authenticated, AuthLoading, Unauthenticated } from "./auth-boundaries";

afterEach(() => cleanup());

function renderWithAuth(
  ui: React.ReactElement,
  session: Partial<ReturnType<AnyAuthClient["useSession"]>> = {},
) {
  const client = {
    useSession: () =>
      ({
        data: null,
        error: null,
        isPending: false,
        ...session,
      }) as ReturnType<AnyAuthClient["useSession"]>,
  } as unknown as AnyAuthClient;

  return render(<AuthProvider client={client}>{ui}</AuthProvider>);
}

describe("Authenticated", () => {
  it("renders children when a user is present", () => {
    renderWithAuth(
      <Authenticated fallback={<div>fallback</div>}>
        <div>signed in</div>
      </Authenticated>,
      {
        data: { user: { id: "u1", email: "user@example.com" } },
      },
    );

    expect(screen.getByText("signed in")).toBeDefined();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  it("renders fallback when no user is present", () => {
    renderWithAuth(
      <Authenticated fallback={<div>fallback</div>}>
        <div>signed in</div>
      </Authenticated>,
    );

    expect(screen.getByText("fallback")).toBeDefined();
    expect(screen.queryByText("signed in")).toBeNull();
  });

  it("renders loading while pending", () => {
    renderWithAuth(
      <Authenticated loading={<div>loading</div>}>
        <div>signed in</div>
      </Authenticated>,
      { isPending: true },
    );

    expect(screen.getByText("loading")).toBeDefined();
  });
});

describe("Unauthenticated", () => {
  it("renders children when no user is present", () => {
    renderWithAuth(
      <Unauthenticated fallback={<div>fallback</div>}>
        <div>sign in</div>
      </Unauthenticated>,
    );

    expect(screen.getByText("sign in")).toBeDefined();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  it("renders fallback when a user is present", () => {
    renderWithAuth(
      <Unauthenticated fallback={<div>fallback</div>}>
        <div>sign in</div>
      </Unauthenticated>,
      {
        data: { user: { id: "u1", email: "user@example.com" } },
      },
    );

    expect(screen.getByText("fallback")).toBeDefined();
    expect(screen.queryByText("sign in")).toBeNull();
  });
});

describe("AuthLoading", () => {
  it("renders children while session is loading", () => {
    renderWithAuth(
      <AuthLoading fallback={<div>not loading</div>}>
        <div>loading</div>
      </AuthLoading>,
      { isPending: true },
    );

    expect(screen.getByText("loading")).toBeDefined();
    expect(screen.queryByText("not loading")).toBeNull();
  });

  it("renders fallback when session is loaded", () => {
    renderWithAuth(
      <AuthLoading fallback={<div>not loading</div>}>
        <div>loading</div>
      </AuthLoading>,
    );

    expect(screen.getByText("not loading")).toBeDefined();
    expect(screen.queryByText("loading")).toBeNull();
  });
});
