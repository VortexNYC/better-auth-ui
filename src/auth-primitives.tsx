import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import type { ButtonProps } from "@cloudflare/kumo/components/button";
import { Button } from "@cloudflare/kumo/components/button";
import { Banner } from "@cloudflare/kumo/components/banner";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Text } from "@cloudflare/kumo/components/text";

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
        <span className="w-full border-t border-kumo-hairline" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-kumo-base px-2 text-kumo-subtle">{label}</span>
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
 * Page-level card for auth forms using Kumo `LayerCard`.
 */
export function AuthCard({
  children,
  className,
  title,
  description,
}: AuthCardProps) {
  return (
    <LayerCard className={className}>
      <LayerCard.Secondary>
        <Text as="h1" variant="heading">
          {title}
        </Text>
        {description ? <Text variant="secondary">{description}</Text> : null}
      </LayerCard.Secondary>
      <LayerCard.Primary>{children}</LayerCard.Primary>
    </LayerCard>
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
