// Celebration overlay. motion from 'motion/react'. Dispatches CLEAR_CELEBRATION on the
// animation-completion callback AND arms a bounded fallback timer (<= CELEBRATION_FALLBACK_MS)
// that dispatches the same action — the fallback ALWAYS fires (incl. under
// prefers-reduced-motion), so transitionLock is never left stuck. Idempotent. See design §6.2.

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { UI } from "../data/levels";

export type CelebrationTier = "none" | "exercise" | "subnivel" | "world";

export interface CelebrationProps {
  tier: CelebrationTier;
  /** Dispatched once per active celebration (idempotent on the reducer side). */
  onDone: () => void;
}

/** Confetti glyph counts per tier — world completion is the flashiest. */
const CONFETTI: Record<Exclude<CelebrationTier, "none">, number> = {
  exercise: 10,
  subnivel: 18,
  world: 30,
};

const CONFETTI_GLYPHS = ["⭐", "🎉", "✨", "🌟", "🎈"];

/**
 * Renders a transient overlay while `tier !== "none"`. A single fallback timer guarantees
 * `onDone` is called even when no animation-complete event fires (reduced motion).
 */
export function Celebration({ tier, onDone }: CelebrationProps) {
  const reduce = useReducedMotion();
  const firedRef = useRef(false);

  const active = tier !== "none";

  useEffect(() => {
    if (!active) {
      firedRef.current = false;
      return;
    }
    firedRef.current = false;

    // Bounded fallback: ALWAYS fires (including under prefers-reduced-motion) so the
    // transition lock is released even if the animation emits no completion event.
    const timer = window.setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onDone();
      }
    }, UI.CELEBRATION_FALLBACK_MS);

    return () => window.clearTimeout(timer);
  }, [active, tier, onDone]);

  const fire = () => {
    if (!firedRef.current) {
      firedRef.current = true;
      onDone();
    }
  };

  if (!active) return null;

  const count = CONFETTI[tier];

  return (
    <AnimatePresence>
      <motion.div
        key={tier}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
        // Under reduced motion there is no movement to complete, so onAnimationComplete may
        // still fire for the opacity tween; the fallback timer covers the rest.
        onAnimationComplete={reduce ? fire : undefined}
      >
        {reduce ? null : (
          <div className="relative h-full w-full overflow-hidden">
            {Array.from({ length: count }, (_, i) => {
              const left = (i / count) * 100;
              const glyph = CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length];
              const isLast = i === count - 1;
              return (
                <motion.span
                  key={i}
                  className="absolute top-0 text-3xl"
                  style={{ left: `${left}%` }}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: "100vh", opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 1,
                    delay: (i % 6) * 0.05,
                    ease: "easeIn",
                  }}
                  onAnimationComplete={isLast ? fire : undefined}
                >
                  {glyph}
                </motion.span>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default Celebration;
