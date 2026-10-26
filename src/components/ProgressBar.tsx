// The running provisional total shown as accumulating object tokens (not a dry number).
// Additions: tokens collected so far toward target. Subtractions: tokens removed so far.
// See design §6 (running total row).

import { motion, useReducedMotion } from "motion/react";

export interface ProgressBarProps {
  /** The running provisional total (sum selected, or amount removed for subtraction). */
  total: number;
  /** The required amount (target for additions, removal total for subtractions). */
  required: number;
  tokenEmoji: string;
  /** Short Spanish label above the tokens, e.g. «Llevas» / «Has quitado». */
  label: string;
}

/**
 * Accumulating-token progress row. Renders one glyph per unit of `total`, with faint
 * placeholder glyphs for the remaining units up to `required`, so the child sees how far
 * they are from the goal.
 */
export function ProgressBar({
  total,
  required,
  tokenEmoji,
  label,
}: ProgressBarProps) {
  const reduce = useReducedMotion();
  const filled = Math.max(0, Math.min(total, 20));
  const remaining = Math.max(0, Math.min(required - total, 20));

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-base font-bold text-slate-600">
        {label}: <span className="text-azul">{total}</span>
      </p>
      <div
        className="flex min-h-[2.5rem] flex-wrap items-center justify-center gap-1 rounded-card bg-white/70 px-4 py-2 text-2xl leading-none shadow-inner"
        role="status"
        aria-label={`${label}: ${total}`}
      >
        {Array.from({ length: filled }, (_, i) => (
          <motion.span
            key={`f-${i}`}
            aria-hidden="true"
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? undefined : { duration: 0.2 }}
          >
            {tokenEmoji}
          </motion.span>
        ))}
        {Array.from({ length: remaining }, (_, i) => (
          <span key={`r-${i}`} aria-hidden="true" className="opacity-20">
            {tokenEmoji}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProgressBar;
