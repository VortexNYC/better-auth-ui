import { SettingsStack } from "../auth-primitives";
import { AccountSecurity } from "./account-security";
import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { ConnectedAccounts } from "./connected-accounts";
import { DeleteAccountForm } from "./delete-account-form";
import { UserProfileForm } from "./user-profile-form";

export interface AccountSettingsProps {
  className?: string;
  currentSessionToken?: string | null;
  emailCallbackURL?: string;
  /** Show the set-password form for accounts that signed in without a password. */
  showSetPassword?: boolean;
  /** Sessions, two-factor, passkeys, and the set-password form. */
  includeSecurityForms?: boolean;
  issuer?: string;
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
  issuer,
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
      {includeSecurityForms ? null : <ChangePasswordForm />}
      {includeSecurityForms ? (
        <AccountSecurity
          currentSessionToken={currentSessionToken}
          showSetPassword={showSetPassword}
          issuer={issuer}
        />
      ) : null}
      <ConnectedAccounts onUnlinked={onAccountUnlinked} />
      <DeleteAccountForm onSuccess={onAccountDeleted} />
    </SettingsStack>
  );
}
