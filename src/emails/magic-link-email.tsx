import { Button, Heading, Text } from "react-email";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export interface MagicLinkEmailProps extends Omit<
  EmailLayoutProps,
  "children" | "previewText"
> {
  username?: string;
  signInUrl: string;
  previewText?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  fallbackMessage?: string;
}

export function MagicLinkEmail({
  username,
  signInUrl,
  previewText = "Sign in to your account.",
  heading = "Sign in to your account",
  message = "Click the button below to sign in. This link will expire shortly.",
  buttonText = "Sign in",
  fallbackMessage = "If the button doesn't work, copy and paste this link into your browser:",
  ...layoutProps
}: MagicLinkEmailProps) {
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
        href={signInUrl}
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
          href={signInUrl}
          style={{ color: layoutProps.brandColor ?? "#0052cc" }}
        >
          {signInUrl}
        </a>
      </Text>
    </EmailLayout>
  );
}
