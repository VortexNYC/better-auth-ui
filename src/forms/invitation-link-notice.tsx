import { ClipboardText } from "@cloudflare/kumo/components/clipboard-text";
import { Text } from "@cloudflare/kumo/components/text";

export interface InvitationLinkNoticeProps {
  href: string;
  email?: string;
  title?: string;
  description?: string;
}

/** Shareable invitation link shown once the invite exists. */
export function InvitationLinkNotice({
  href,
  email,
  title = "Invitation link",
  description = "Send this link if the email does not arrive.",
}: InvitationLinkNoticeProps) {
  return (
    <div className="flex flex-col gap-2">
      <Text as="h3" variant="heading">
        {title}
      </Text>
      <Text as="p" variant="secondary" size="sm">
        {email ? `${description} Invited ${email}.` : description}
      </Text>
      <ClipboardText
        size="base"
        text={href}
        tooltip={{
          text: "Copy invitation link",
          copiedText: "Copied",
          side: "top",
        }}
      />
    </div>
  );
}
