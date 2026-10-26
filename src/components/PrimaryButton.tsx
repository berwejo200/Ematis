// Large, touch-first button. Minimum touch target >=60x60 CSS px (from data/levels.ts UI
// constant). Pointer/click only — no hover/dblclick/rightclick/keyboard dependence for
// activation beyond native button behavior. See design §6.5.

import type { ReactNode } from "react";
import { UI } from "../data/levels";

export type ButtonTone = "primary" | "secondary" | "success" | "danger";

export interface PrimaryButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: ButtonTone;
  /** Optional leading icon node (e.g. a lucide icon). */
  icon?: ReactNode;
  /** Accessible label when the visible text is not descriptive enough. */
  ariaLabel?: string;
  /** Full-width within its container. */
  fullWidth?: boolean;
}

const TONES: Record<ButtonTone, string> = {
  primary: "bg-azul text-white",
  secondary: "bg-white text-azul ring-2 ring-azul/40",
  success: "bg-verde text-white",
  danger: "bg-rojo text-white",
};

/**
 * A big, rounded, high-contrast button sized for small fingers. Activation goes through
 * the native button click (works for touch and pointer); disabled state blocks it.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  tone = "primary",
  icon,
  ariaLabel,
  fullWidth = false,
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      style={{
        minWidth: UI.MIN_TOUCH_TARGET_PX,
        minHeight: UI.MIN_TOUCH_TARGET_PX,
      }}
      className={[
        "inline-flex select-none items-center justify-center gap-2 rounded-card px-6 py-4",
        "text-xl font-extrabold shadow-suave transition-transform",
        "active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        fullWidth ? "w-full" : "",
        TONES[tone],
      ].join(" ")}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

export default PrimaryButton;
