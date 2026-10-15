import { SettingsStack } from "../auth-primitives";
import { ChangePasswordForm } from "./change-password-form";
import { DisableTwoFactorForm } from "./disable-two-factor-form";
import { EnableTwoFactorForm } from "./enable-two-factor-form";
import { GenerateBackupCodesForm } from "./generate-backup-codes-form";
import { PasskeyList } from "./passkey-list";
import { SessionList } from "./session-list";
import { SetPasswordForm } from "./set-password-form";

export interface AccountSecurityProps {
  className?: string;
  currentSessionToken?: string | null;
  showSetPassword?: boolean;
  issuer?: string;
  onSessionRevoked?: () => void;
  onTwoFactorEnabled?: () => void;
  onBackupCodesGenerated?: () => void;
  onTwoFactorDisabled?: () => void;
  onPasswordChanged?: () => void;
  onPasswordSet?: () => void;
}

/** Sessions, two-factor, passkeys, and password. Shared by every product account. */
export function AccountSecurity({
  className,
  currentSessionToken,
  showSetPassword = true,
  issuer,
  onSessionRevoked,
  onTwoFactorEnabled,
  onBackupCodesGenerated,
  onTwoFactorDisabled,
  onPasswordChanged,
  onPasswordSet,
}: AccountSecurityProps) {
  return (
    <SettingsStack className={className}>
      <SessionList
        className="w-full"
        currentSessionToken={currentSessionToken}
        showRevokeOthersAction
        onRevoke={onSessionRevoked}
      />
      <EnableTwoFactorForm
        className="w-full"
        issuer={issuer}
        onSuccess={onTwoFactorEnabled}
      />
      <GenerateBackupCodesForm
        className="w-full"
        onSuccess={onBackupCodesGenerated}
      />
      <DisableTwoFactorForm
        className="w-full"
        onSuccess={onTwoFactorDisabled}
      />
      <ChangePasswordForm className="w-full" onSuccess={onPasswordChanged} />
      {showSetPassword ? (
        <SetPasswordForm className="w-full" onSuccess={onPasswordSet} />
      ) : null}
      <PasskeyList className="w-full" />
    </SettingsStack>
  );
}
