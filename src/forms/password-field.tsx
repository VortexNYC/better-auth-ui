import { Input } from "@cloudflare/kumo/components/input";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState, type ReactElement } from "react";

export interface PasswordFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
}

export function PasswordField({
  label,
  value,
  onValueChange,
  error,
  autoComplete,
  required,
}: PasswordFieldProps): ReactElement {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative [&_input]:pr-10">
      <Input
        label={label}
        type={visible ? "text" : "password"}
        value={value}
        onValueChange={onValueChange}
        error={error}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        className="text-kumo-secondary absolute right-2 bottom-2"
        onClick={() => {
          setVisible((current) => !current);
        }}
      >
        {visible ? (
          <EyeSlash className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
