import { Button, Heading, Text } from "react-email";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export interface VerificationEmailProps extends Omit<
  EmailLayoutProps,
  "children" | "previewText"
> {
  username?: string;
  verificationUrl: string;
  previewText?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  fallbackMessage?: string;
}

export function VerificationEmail({
  username,
  verificationUrl,
  previewText = "Verify your email address to get started.",
  heading = "Verify your email",
  message = "Thanks for signing up. Click the button below to verify your email address.",
  buttonText = "Verify email",
  fallbackMessage = "If the button doesn't work, copy and paste this link into your browser:",
  ...layoutProps
}: VerificationEmailProps) {
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
        href={verificationUrl}
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
          href={verificationUrl}
          style={{ color: layoutProps.brandColor ?? "#0052cc" }}
        >
          {verificationUrl}
        </a>
      </Text>
    </EmailLayout>
  );
}
