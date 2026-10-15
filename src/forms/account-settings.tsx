import { SettingsStack } from "../auth-primitives";
import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { ConnectedAccounts } from "./connected-accounts";
import { DeleteAccountForm } from "./delete-account-form";
import { EnableTwoFactorForm } from "./enable-two-factor-form";
import { PasskeyList } from "./passkey-list";
import { SessionList } from "./session-list";
import { UserProfileForm } from "./user-profile-form";

export interface AccountSettingsProps {
  className?: string;
  currentSessionToken?: string | null;
}

/**
 * One account screen: profile, email, password, sessions, two-factor, passkeys, connected accounts, delete.
 */
export function AccountSettings({
  className,
  currentSessionToken,
}: AccountSettingsProps) {
  return (
    <SettingsStack className={className}>
      <UserProfileForm />
      <ChangeEmailForm />
      <ChangePasswordForm />
      <SessionList currentSessionToken={currentSessionToken} />
      <EnableTwoFactorForm />
      <PasskeyList />
      <ConnectedAccounts />
      <DeleteAccountForm />
    </SettingsStack>
  );
}
