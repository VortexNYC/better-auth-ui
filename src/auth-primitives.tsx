import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import type { ButtonProps } from "@cloudflare/kumo/components/button";
import { Button } from "@cloudflare/kumo/components/button";
import { Banner } from "@cloudflare/kumo/components/banner";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Text } from "@cloudflare/kumo/components/text";

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
