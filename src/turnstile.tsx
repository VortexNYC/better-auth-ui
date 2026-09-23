import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function ensureTurnstileScript(): Promise<void> {
  if (window.turnstile !== undefined) {
    return Promise.resolve();
  }
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load the Turnstile script"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileWidgetProps {
  /** Cloudflare Turnstile site key. */
  siteKey: string;
  /** Called with the token on success, `null` on expiry/error. */
  onToken: (token: string | null) => void;
  /** Bump to remount the widget (tokens are single-use — reset on submit failure). */
  resetKey?: number;
}

/**
 * Cloudflare Turnstile managed widget. Pairs with the Better Auth captcha
 * plugin: the token travels on `x-captcha-response` via `fetchOptions`.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  resetKey = 0,
}: TurnstileWidgetProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | null = null;
    ensureTurnstileScript()
      .then(() => {
        if (
          cancelled ||
          hostRef.current === null ||
          window.turnstile === undefined
        ) {
          return;
        }
        widgetId = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));
    return () => {
      cancelled = true;
      if (widgetId !== null && window.turnstile !== undefined) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey, resetKey]);

  return <div ref={hostRef} />;
}
