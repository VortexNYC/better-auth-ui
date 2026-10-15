import { SettingsStack } from "../auth-primitives";
import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { ConnectedAccounts } from "./connected-accounts";
import { DeleteAccountForm } from "./delete-account-form";
import { DisableTwoFactorForm } from "./disable-two-factor-form";
import { EnableTwoFactorForm } from "./enable-two-factor-form";
import { GenerateBackupCodesForm } from "./generate-backup-codes-form";
import { PasskeyList } from "./passkey-list";
import { SessionList } from "./session-list";
import { SetPasswordForm } from "./set-password-form";
import { UserProfileForm } from "./user-profile-form";

export interface AccountSettingsProps {
  className?: string;
  currentSessionToken?: string | null;
  emailCallbackURL?: string;
  /** Show the set-password form for accounts that signed in without a password. */
  showSetPassword?: boolean;
  /**
   * Sessions, two-factor, and passkeys. Turn off when the host already has a
   * dedicated security route.
   */
  includeSecurityForms?: boolean;
  onUploadImage?: (file: File) => Promise<string>;
  onProfileSaved?: () => void;
  onEmailChangeRequested?: () => void;
  onAccountUnlinked?: () => void;
  onAccountDeleted?: () => void;
}

/**
 * One account screen: profile, email, password, sessions, two-factor, passkeys, connected accounts, delete.
 */
export function AccountSettings({
  className,
  currentSessionToken,
  emailCallbackURL,
  showSetPassword = false,
  includeSecurityForms = true,
  onUploadImage,
  onProfileSaved,
  onEmailChangeRequested,
  onAccountUnlinked,
  onAccountDeleted,
}: AccountSettingsProps) {
  return (
    <SettingsStack className={className}>
      <UserProfileForm
        onSuccess={onProfileSaved}
        onUploadImage={onUploadImage}
      />
      <ChangeEmailForm
        callbackURL={emailCallbackURL}
        onSuccess={onEmailChangeRequested}
      />
      <ChangePasswordForm />
      {showSetPassword ? <SetPasswordForm /> : null}
      {includeSecurityForms ? (
        <>
          <SessionList currentSessionToken={currentSessionToken} />
          <EnableTwoFactorForm />
          <DisableTwoFactorForm />
          <GenerateBackupCodesForm />
          <PasskeyList />
        </>
      ) : null}
      <ConnectedAccounts onUnlinked={onAccountUnlinked} />
      <DeleteAccountForm onSuccess={onAccountDeleted} />
    </SettingsStack>
  );
}
