// A big selectable number card: large number + quantity glyphs. Toggles on tap via
// pointer/click (not hover). Selection signaled by icon + shape + label, not color alone.
// Touch target >=60x60 CSS px. See design §6.5 and the exercise rules §3.1/§3.2.

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { UI } from "../data/levels";

export interface NumberCardProps {
  /** The option id (used by the parent to toggle selection). */
  optionId: string;
  value: number;
  /** Emoji/glyph used to visualize the quantity. */
  tokenEmoji: string;
  selected: boolean;
  /** Emphasize this card (hint «highlight-options»). */
  highlighted?: boolean;
  /** Briefly shake/grey when a subtraction removal was rejected. */
  rejected?: boolean;
  /** Show the object glyphs under the number (strong-visual early levels / hints). */
  showObjects?: boolean;
  disabled?: boolean;
  onToggle: (optionId: string) => void;
}

/** Render `value` object glyphs (capped so the card never overflows). */
function Glyphs({ value, emoji }: { value: number; emoji: string }) {
  const count = Math.min(value, 10);
  return (
    <span className="mt-1 flex max-w-[6.5rem] flex-wrap justify-center gap-0.5 text-lg leading-none">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} aria-hidden="true">
          {emoji}
        </span>
      ))}
    </span>
  );
}

/**
 * A tappable card. The selected state is conveyed by a check badge + a thick ring +
 * a scale change + the `aria-pressed` label — never by color alone.
 */
export function NumberCard({
  optionId,
  value,
  tokenEmoji,
  selected,
  highlighted = false,
  rejected = false,
  showObjects = false,
  disabled = false,
  onToggle,
}: NumberCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      aria-label={`Caja con el número ${value}${selected ? ", seleccionada" : ""}`}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onToggle(optionId);
      }}
      style={{
        minWidth: UI.MIN_TOUCH_TARGET_PX,
        minHeight: UI.MIN_TOUCH_TARGET_PX,
      }}
      animate={
        reduce
          ? undefined
          : rejected
            ? { x: [0, -6, 6, -4, 4, 0] }
            : { scale: selected ? 1.06 : 1 }
      }
      transition={reduce ? undefined : { duration: rejected ? 0.4 : 0.18 }}
      className={[
        "relative flex select-none flex-col items-center justify-center rounded-card p-4",
        "bg-white font-extrabold text-slate-800 shadow-suave transition-shadow",
        "disabled:cursor-not-allowed",
        selected ? "ring-4 ring-verde" : "ring-2 ring-slate-200",
        highlighted && !selected ? "ring-4 ring-amarillo" : "",
        rejected ? "opacity-60 ring-4 ring-rojo" : "",
      ].join(" ")}
    >
      {selected ? (
        <span
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-verde text-white shadow"
          aria-hidden="true"
        >
          <Check size={20} strokeWidth={3} />
        </span>
      ) : null}
      <span className="text-5xl leading-none sm:text-6xl">{value}</span>
      {showObjects ? <Glyphs value={value} emoji={tokenEmoji} /> : null}
    </motion.button>
  );
}

export default NumberCard;
