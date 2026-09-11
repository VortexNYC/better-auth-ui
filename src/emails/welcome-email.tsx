import { Button, Heading, Text } from "react-email";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export interface WelcomeEmailProps extends Omit<
  EmailLayoutProps,
  "children" | "previewText"
> {
  username?: string;
  getStartedUrl: string;
  previewText?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
}

export function WelcomeEmail({
  username,
  getStartedUrl,
  previewText = "Welcome — let's get you started.",
  heading = "Welcome aboard",
  message = "Thanks for joining. Click the button below to get started with your account.",
  buttonText = "Get started",
  ...layoutProps
}: WelcomeEmailProps) {
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
        href={getStartedUrl}
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
    </EmailLayout>
  );
}
