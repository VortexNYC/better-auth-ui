import type { ReactNode } from "react";

export interface AuthShellProps {
  logo?: ReactNode;
  /** Decorative layer behind the form. The host owns brand-specific glow. */
  atmosphere?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Centered signed-out page. The host supplies the mark and the form.
 */
export function AuthShell({
  logo,
  atmosphere,
  className,
  children,
}: AuthShellProps) {
  return (
    <div
      data-auth-shell
      className={[
        "bg-kumo-canvas relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {atmosphere}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-6">
        {logo}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
