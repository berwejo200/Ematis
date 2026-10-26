// A friendly mascot that explains activities and celebrates. Presentational, prop-driven.
// Uses motion from 'motion/react' with a reduced-motion fallback. See design §6.

import { motion, useReducedMotion } from "motion/react";

export type MascotMood = "happy" | "cheer" | "think" | "gentle";

export interface MascotProps {
  /** Short Spanish line the mascot says. */
  message?: string;
  /** Drives the face/animation intensity. */
  mood?: MascotMood;
  /** Larger presentation for the Welcome/intro screens. */
  size?: "md" | "lg";
}

const FACE: Record<MascotMood, string> = {
  happy: "🦊",
  cheer: "🦊",
  think: "🦊",
  gentle: "🦊",
};

const BADGE: Record<MascotMood, string> = {
  happy: "😊",
  cheer: "🎉",
  think: "💭",
  gentle: "🤗",
};

/**
 * The game mascot (a friendly fox, «Zorro») with an optional speech line. State is
 * conveyed by face + badge glyph + text, never color alone.
 */
export function Mascot({ message, mood = "happy", size = "md" }: MascotProps) {
  const reduce = useReducedMotion();
  const faceSize = size === "lg" ? "text-7xl sm:text-8xl" : "text-5xl sm:text-6xl";

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className={`relative select-none leading-none ${faceSize}`}
        aria-hidden="true"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={
          reduce
            ? undefined
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <span>{FACE[mood]}</span>
        <span className="absolute -right-1 -top-1 text-2xl">{BADGE[mood]}</span>
      </motion.div>
      {message ? (
        <motion.p
          key={message}
          className="max-w-xs rounded-card bg-white px-4 py-3 text-lg font-bold text-slate-700 shadow-suave sm:text-xl"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          role="status"
        >
          {message}
        </motion.p>
      ) : null}
    </div>
  );
}

export default Mascot;
