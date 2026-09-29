import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import type { ButtonProps } from "@cloudflare/kumo/components/button";
import { Button } from "@cloudflare/kumo/components/button";
import { Banner } from "@cloudflare/kumo/components/banner";

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
    <div className={className}>
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
    <div className={`relative ${className ?? ""}`}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[color:var(--color-kumo-border)]" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-[color:var(--color-kumo-background)] px-2 text-[color:var(--color-kumo-foreground-100)]">
          {label}
        </span>
      </div>
    </div>
  );
}

export interface AuthCardProps {
  children: ReactNode;
  className?: string;
  title: ReactNode;
  description?: ReactNode;
}

/**
 * Page-level card for auth forms — single surface (Clerk/AuthKit shape),
 * not a Secondary/Primary LayerCard split that reads as a Kumo demo.
 */
export function AuthCard({
  children,
  className = "mx-auto w-full max-w-md",
  title,
  description,
}: AuthCardProps) {
  return (
    <section
      className={[
        "rounded-xl border border-[color:var(--color-kumo-border)]",
        "bg-[color:var(--color-kumo-background)]",
        "shadow-[0_1px_2px_color-mix(in_oklch,var(--color-kumo-foreground)_4%,transparent),0_12px_40px_color-mix(in_oklch,var(--color-kumo-foreground)_6%,transparent)]",
        "space-y-6 p-6 sm:p-8",
        className,
      ].join(" ")}
    >
      <header className="space-y-1.5 text-center">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-[color:var(--color-kumo-foreground)]">
          {title}
        </h1>
        {description ? (
          <p className="m-0 text-sm leading-relaxed text-balance text-[color:var(--color-kumo-foreground-100)]">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
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
