// Subtraction exercise generation. Pure given an injected rng. See design §3.2.

import type { Exercise, GenerationParams, NumberOption, WorldId } from "./types";
import { type Rng, partition, randInt, shuffle } from "./rng";
import { nextExerciseId } from "./exerciseSeq";
import { enumerateSolutions } from "./solutions";
import { buildHints } from "./hints";
import { tokenPhrase } from "./validation";
import { TOKENS } from "../data/levels";

/**
 * generateSubtractionExercise — board shows an initialQuantity; child removes cards so
 * that `target` objects REMAIN. removeTotal = initialQuantity - target. See design §3.2.
 */
export function generateSubtractionExercise(
  params: GenerationParams,
  subnivel: number,
  rng: Rng = Math.random,
): Exercise {
  const world: WorldId = "restas";

  // 1. Feasible target draw. minRemoveTotal = max(1, minAddends).
  const minRemoveTotal = Math.max(1, params.minAddends);
  const targetHigh = Math.min(params.maxResult, params.maxInitial - minRemoveTotal);
  const target = randInt(rng, params.minResult, targetHigh);

  // 2. removeTotal in [minRemoveTotal, maxInitial - target]; initialQuantity = target + removeTotal.
  const removeTotal = randInt(rng, minRemoveTotal, params.maxInitial - target);
  const initialQuantity = target + removeTotal;

  // 3. k removals in [minAddends, min(maxAddends, removeTotal)] partitioning removeTotal.
  const kHigh = Math.min(params.maxAddends, removeTotal);
  const k = randInt(rng, params.minAddends, kHigh);
  const removals = partition(rng, removeTotal, k);

  // 4. Distractors (values 1..initialQuantity) up to a count in [minOptions, maxOptions], >= k.
  const values: number[] = [...removals];
  const optionCountLow = Math.max(params.minOptions, k);
  const optionCountHigh = Math.max(params.maxOptions, optionCountLow);
  const optionCount = randInt(rng, optionCountLow, optionCountHigh);
  while (values.length < optionCount) {
    values.push(randInt(rng, 1, initialQuantity));
  }

  shuffle(rng, values);
  const options: NumberOption[] = values.map((value, i) => ({
    id: `opt-${i}`,
    value,
  }));

  // 5. validAnswers = subsets summing to removeTotal (at most 8 minimal).
  const validAnswers = enumerateSolutions(options, removeTotal, 8);

  // 6. Hints, instruction, token.
  const token = TOKENS[randInt(rng, 0, TOKENS.length - 1)];
  const highlight = validAnswers[0] ?? [];
  const hints = buildHints(removeTotal, token.singular, token.plural, highlight);
  const instruction =
    target === 0
      ? "¡Quítalas todas!"
      : `¡Quita hasta que ${target === 1 ? "quede" : "queden"} ${tokenPhrase(
          target,
          token.singular,
          token.plural,
        )}!`;

  return {
    id: nextExerciseId(),
    operation: "subtraction",
    world,
    subnivel,
    difficulty: subnivel,
    target,
    initialQuantity,
    options,
    validAnswers,
    hints,
    instruction,
    tokenEmoji: token.emoji,
    tokenNoun: token.plural,
    tokenNounSingular: token.singular,
  };
}
