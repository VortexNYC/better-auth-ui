import { Button, Heading, Text } from "react-email";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export interface OrganizationInvitationEmailProps extends Omit<
  EmailLayoutProps,
  "children" | "previewText"
> {
  inviterName?: string;
  organizationName: string;
  acceptUrl: string;
  previewText?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  fallbackMessage?: string;
}

export function OrganizationInvitationEmail({
  inviterName,
  organizationName,
  acceptUrl,
  previewText = `You've been invited to join ${organizationName}.`,
  heading = "You're invited to join a workspace",
  message = `You've been invited to join ${organizationName}${inviterName ? ` by ${inviterName}` : ""}. Click the button below to accept the invitation and get started.`,
  buttonText = "Accept invitation",
  fallbackMessage = "If the button doesn't work, copy and paste this link into your browser:",
  ...layoutProps
}: OrganizationInvitationEmailProps) {
  return (
    <EmailLayout previewText={previewText} {...layoutProps}>
      <Heading
        as="h1"
        style={{ color: "#111827", fontSize: "24px", fontWeight: 700 }}
      >
        {heading}
      </Heading>

      <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.5" }}>
        {message}
      </Text>

      <Button
        href={acceptUrl}
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
          href={acceptUrl}
          style={{ color: layoutProps.brandColor ?? "#0052cc" }}
        >
          {acceptUrl}
        </a>
      </Text>
    </EmailLayout>
  );
}
