import { createContext, useContext, type ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import type { ButtonProps } from "@cloudflare/kumo/components/button";
import { Button } from "@cloudflare/kumo/components/button";
import { Banner } from "@cloudflare/kumo/components/banner";
import { Text } from "@cloudflare/kumo/components/text";

const SettingsStackContext = createContext(false);

export interface AuthProviderOption {
  provider: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface AuthProviderButtonsProps {
  providers: readonly AuthProviderOption[];
  onSelect: (providerId: string) => void | Promise<void>;
  isSubmitting?: boolean;
  className?: string;
  providerButtonClassName?: string;
}

/**
 * Renders a stack of social/provider sign-in buttons.
 */
export function AuthProviderButtons({
  providers,
  onSelect,
  isSubmitting,
  className,
  providerButtonClassName,
}: AuthProviderButtonsProps) {
  return (
    <div
      className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}
    >
      {providers.map((provider) => (
        <Button
          key={provider.provider}
          type="button"
          variant="secondary"
          className={providerButtonClassName}
          disabled={isSubmitting || provider.disabled}
          icon={provider.icon}
          onClick={() => {
            void onSelect(provider.provider);
          }}
        >
          {provider.label}
        </Button>
      ))}
    </div>
  );
}

export interface AuthDividerProps {
  label?: string;
  className?: string;
}

/**
 * A centered divider with optional label (e.g. "or").
 */
export function AuthDivider({ label = "or", className }: AuthDividerProps) {
  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <div className="absolute inset-0 flex items-center">
        <span className="border-kumo-line w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs tracking-wide uppercase">
        <span className="bg-kumo-base text-kumo-subtle px-2">{label}</span>
      </div>
    </div>
  );
}

export interface AuthCardProps {
  children: ReactNode;
  className?: string;
  title: ReactNode;
  description?: ReactNode;
  /**
   * `auth` — centered standalone card (sign-in / sign-up).
   * `settings` — dense left-aligned section for in-app account/org settings.
   *              Compose with {@link SettingsStack} for a single hairline surface.
   */
  variant?: "auth" | "settings";
}

/**
 * Surface for auth + account forms.
 * Auth: single flat card (Clerk/AuthKit shape).
 * Settings: dense section — border alone, or a row inside SettingsStack.
 */
export function AuthCard({
  children,
  className,
  title,
  description,
  variant = "auth",
}: AuthCardProps) {
  const inSettingsStack = useContext(SettingsStackContext);

  if (variant === "settings") {
    return (
      <section
        data-baui-settings-card=""
        className={[
          "flex w-full flex-col gap-3 p-4",
          // Solo: bordered card. Inside SettingsStack: hairline row only.
          inSettingsStack
            ? "border-kumo-line border-b bg-transparent last:border-b-0"
            : "border-kumo-line bg-kumo-base rounded-xl border",
          // Actions hug content — not full-bleed CTA bars in settings.
          "[&_button[type=submit]]:w-auto [&_button[type=submit]]:self-start",
          "[&_button[data-variant=destructive]]:w-auto [&_button[data-variant=destructive]]:self-start",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="flex flex-col gap-0.5 text-left">
          <h2 className="text-kumo-default m-0 text-[0.9375rem] leading-snug font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <Text as="p" variant="secondary" size="sm">
              {description}
            </Text>
          ) : null}
        </header>
        <div className="flex flex-col gap-3">{children}</div>
      </section>
    );
  }

  return (
    <section
      className={[
        "border-kumo-line bg-kumo-base mx-auto flex w-full max-w-md flex-col gap-5 rounded-xl border",
        "shadow-[0_1px_2px_color-mix(in_oklch,var(--color-kumo-default)_4%,transparent),0_12px_40px_color-mix(in_oklch,var(--color-kumo-default)_6%,transparent)]",
        "p-6 sm:p-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="flex flex-col gap-1.5 text-center">
        <h1 className="text-kumo-default m-0 text-xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-kumo-subtle m-0 text-sm leading-relaxed text-balance">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export interface SettingsStackProps {
  children: ReactNode;
  className?: string;
}

/**
 * Groups settings AuthCards into one dense surface with hairline dividers.
 * AuthCard settings rows read this context and drop solo card chrome.
 */
export function SettingsStack({ children, className }: SettingsStackProps) {
  return (
    <SettingsStackContext.Provider value={true}>
      <div
        data-baui-settings-stack=""
        className={[
          "border-kumo-line bg-kumo-base flex w-full max-w-lg flex-col overflow-hidden rounded-xl border",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </SettingsStackContext.Provider>
  );
}

export interface AuthErrorProps {
  message?: string | null;
  className?: string;
}

/**
 * Error banner for auth-level messages.
 */
export function AuthError({ message, className }: AuthErrorProps) {
  if (!message) return null;

  return (
    <Banner
      className={className}
      variant="error"
      icon={<WarningCircle weight="fill" />}
      title="Error"
      description={message}
    />
  );
}

export type AuthSubmitButtonProps = ButtonProps;

/**
 * Primary submit button wired to a loading state.
 */
export function AuthSubmitButton({
  loading,
  children,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button type="submit" variant="primary" loading={loading} {...props}>
      {children}
    </Button>
  );
}
