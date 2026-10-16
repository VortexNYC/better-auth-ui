import { Heading, Text } from "react-email";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export interface PasswordChangedEmailProps extends Omit<
  EmailLayoutProps,
  "children" | "previewText"
> {
  username?: string;
  previewText?: string;
  heading?: string;
  message?: string;
  footerMessage?: string;
}

export function PasswordChangedEmail({
  username,
  previewText = "Your password was changed.",
  heading = "Password changed",
  message = "Your password was successfully changed. If you didn't make this change, contact support immediately.",
  footerMessage = "If you didn't request this change, you should secure your account right away.",
  ...layoutProps
}: PasswordChangedEmailProps) {
  return (
    <EmailLayout previewText={previewText} {...layoutProps}>
      <Heading
        as="h1"
        style={{ color: "#2c271f", fontSize: "24px", fontWeight: 700 }}
      >
        {heading}
      </Heading>

      {username ? (
        <Text style={{ color: "#554b3e", fontSize: "16px" }}>
          Hi {username},
        </Text>
      ) : null}

      <Text style={{ color: "#554b3e", fontSize: "16px", lineHeight: "1.5" }}>
        {message}
      </Text>

      <Text style={{ color: "#867865", fontSize: "14px", lineHeight: "1.5" }}>
        {footerMessage}
      </Text>
    </EmailLayout>
  );
}
