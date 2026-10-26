// Ordered hint construction, progressively more helpful. Pure, Spanish copy. See design §6.3.

import type { Hint } from "./types";
import { tokenPhrase } from "./validation";

/**
 * Build the four ordered hint tiers for an exercise.
 * @param amount the amount the child must build (addition target, or removal total for subtraction)
 * @param singular/plural Spanish token nouns
 * @param highlightOptionIds ids of one valid solution to point at (tier 3)
 */
export function buildHints(
  amount: number,
  singular: string,
  plural: string,
  highlightOptionIds: string[],
): Hint[] {
  const phrase = tokenPhrase(amount, singular, plural);
  return [
    {
      kind: "show-objects",
      message: `Mira los objetos de cada caja.`,
      highlightOptionIds: [],
    },
    {
      kind: "animate-counting",
      message: `Vamos a contar hasta ${phrase}.`,
      highlightOptionIds: [],
    },
    {
      kind: "highlight-options",
      message: `Fíjate en estas cajas.`,
      highlightOptionIds,
    },
    {
      kind: "guided-demo",
      message: `Te enseño una forma de conseguir ${phrase}.`,
      highlightOptionIds,
    },
  ];
}
