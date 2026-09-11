import { Button, Heading, Text } from "react-email";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export interface ChangeEmailConfirmationProps extends Omit<
  EmailLayoutProps,
  "children" | "previewText"
> {
  username?: string;
  newEmail: string;
  confirmUrl: string;
  previewText?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  fallbackMessage?: string;
}

export function ChangeEmailConfirmation({
  username,
  newEmail,
  confirmUrl,
  previewText = "Confirm your new email address.",
  heading = "Confirm your new email",
  message = `A request was made to change your email address to ${newEmail}. Click the button below to confirm this change.`,
  buttonText = "Confirm email change",
  fallbackMessage = "If the button doesn't work, copy and paste this link into your browser:",
  ...layoutProps
}: ChangeEmailConfirmationProps) {
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
        href={confirmUrl}
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
          href={confirmUrl}
          style={{ color: layoutProps.brandColor ?? "#0052cc" }}
        >
          {confirmUrl}
        </a>
      </Text>
    </EmailLayout>
  );
}
