import { Button, Heading, Text } from "react-email";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export interface PasswordResetEmailProps extends Omit<
  EmailLayoutProps,
  "children" | "previewText"
> {
  username?: string;
  resetUrl: string;
  previewText?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  fallbackMessage?: string;
  expiryMessage?: string;
}

export function PasswordResetEmail({
  username,
  resetUrl,
  previewText = "Reset your password.",
  heading = "Reset your password",
  message = "We received a request to reset your password. Click the button below to choose a new one.",
  buttonText = "Reset password",
  fallbackMessage = "If the button doesn't work, copy and paste this link into your browser:",
  expiryMessage = "This link will expire in a short while for your security.",
  ...layoutProps
}: PasswordResetEmailProps) {
  return (
    <EmailLayout previewText={previewText} {...layoutProps}>
      <Heading
        as="h1"
        style={{ color: "#111827", fontSize: "24px", fontWeight: 700 }}
      >
        {heading}
      </Heading>

      {username ? (
        <Text style={{ color: "#374151", fontSize: "16px" }}>
          Hi {username},
        </Text>
      ) : null}

      <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.5" }}>
        {message}
      </Text>

      <Button
        href={resetUrl}
        style={{
          backgroundColor: layoutProps.brandColor ?? "#0052cc",
          color: "#ffffff",
          borderRadius: "6px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
          marginTop: "8px",
          marginBottom: "8px",
        }}
      >
        {buttonText}
      </Button>

      <Text style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
        {fallbackMessage}
        <br />
        <a
          href={resetUrl}
          style={{ color: layoutProps.brandColor ?? "#0052cc" }}
        >
          {resetUrl}
        </a>
      </Text>

      <Text style={{ color: "#6b7280", fontSize: "14px" }}>
        {expiryMessage}
      </Text>
    </EmailLayout>
  );
}
