// Addition exercise generation. Pure given an injected rng. See design §3.1.

import type { Exercise, GenerationParams, NumberOption, WorldId } from "./types";
import { type Rng, partition, randInt, shuffle } from "./rng";
import { nextExerciseId } from "./exerciseSeq";
import { enumerateSolutions } from "./solutions";
import { buildHints } from "./hints";
import { tokenPhrase } from "./validation";
import { TOKENS } from "../data/levels";

/**
 * generateAdditionExercise — child selects cards whose values sum exactly to `target`.
 * `initialQuantity` is null. See design §3.1.
 */
export function generateAdditionExercise(
  params: GenerationParams,
  subnivel: number,
  rng: Rng = Math.random,
): Exercise {
  const world: WorldId = "sumas";

  // 1. Feasible target draw: [max(minResult, minAddends), maxResult].
  const targetLow = Math.max(params.minResult, params.minAddends);
  const target = randInt(rng, targetLow, params.maxResult);

  // 2. Pick an intended solution: k in [minAddends, min(maxAddends, target)].
  const kHigh = Math.min(params.maxAddends, target);
  const k = randInt(rng, params.minAddends, kHigh);
  const addends = partition(rng, target, k);

  // 3. Build option values from addends + distractors in 1..maxResult, up to a count
  //    in [minOptions, maxOptions] and >= k.
  const values: number[] = [...addends];
  const optionCountLow = Math.max(params.minOptions, k);
  const optionCountHigh = Math.max(params.maxOptions, optionCountLow);
  const optionCount = randInt(rng, optionCountLow, optionCountHigh);
  while (values.length < optionCount) {
    values.push(randInt(rng, 1, params.maxResult));
  }

  // 4. Shuffle; assign unique ids opt-0..opt-(n-1) in final order.
  shuffle(rng, values);
  const options: NumberOption[] = values.map((value, i) => ({
    id: `opt-${i}`,
    value,
  }));

  // 5. validAnswers by subset-sum (at most 8 distinct minimal solutions).
  const validAnswers = enumerateSolutions(options, target, 8);

  // 6. Hints, instruction, token.
  const token = TOKENS[randInt(rng, 0, TOKENS.length - 1)];
  const highlight = validAnswers[0] ?? [];
  const hints = buildHints(target, token.singular, token.plural, highlight);
  const instruction = `¡Consigue ${tokenPhrase(target, token.singular, token.plural)}!`;

  return {
    id: nextExerciseId(),
    operation: "addition",
    world,
    subnivel,
    difficulty: subnivel,
    target,
    initialQuantity: null,
    options,
    validAnswers,
    hints,
    instruction,
    tokenEmoji: token.emoji,
    tokenNoun: token.plural,
    tokenNounSingular: token.singular,
  };
}
