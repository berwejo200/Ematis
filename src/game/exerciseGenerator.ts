// Level-driven dispatcher with the generate->validate->discard->regenerate loop and
// the anti-repeat rule. Pure given an injected rng. See design §3.1/§3.2/§3.3.

import type { Exercise, GenerationParams, WorldId } from "./types";
import type { Rng } from "./rng";
import { generateAdditionExercise } from "./addition";
import { generateSubtractionExercise } from "./subtraction";
import { validateExercise } from "./validation";

const MAX_ATTEMPTS = 50;

/** Signature used by the anti-repeat rule: target + sorted option values + operation. */
function signatureOf(exercise: Exercise): string {
  const values = exercise.options
    .map((o) => o.value)
    .slice()
    .sort((a, b) => a - b)
    .join(",");
  return `${exercise.operation}|${exercise.target}|${values}`;
}

/** The very smallest level-1 space where repeats are unavoidable (anti-repeat skipped). */
function repeatsUnavoidable(params: GenerationParams): boolean {
  // Isla 1 / Puerta 1 style: a tiny result range with few options.
  return params.maxResult - params.minResult <= 1 && params.maxOptions <= 4;
}

function generateOnce(
  world: WorldId,
  params: GenerationParams,
  subnivel: number,
  rng: Rng,
): Exercise {
  return world === "sumas"
    ? generateAdditionExercise(params, subnivel, rng)
    : generateSubtractionExercise(params, subnivel, rng);
}

/**
 * Generate a valid exercise for the given world/subnivel. Runs the
 * generate->validateExercise->discard->regenerate loop (bounded ~50 attempts, then
 * relaxes by widening the distractor pool) and applies the anti-repeat rule against
 * `previousSignature`.
 */
export function generateExercise(
  world: WorldId,
  subnivel: number,
  params: GenerationParams,
  rng: Rng = Math.random,
  previousSignature?: string,
): Exercise {
  const skipAntiRepeat = repeatsUnavoidable(params);
  let relaxed = params;

  let lastValid: Exercise | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Relax after half the budget: widen the distractor pool by allowing more options.
    if (attempt === Math.floor(MAX_ATTEMPTS / 2)) {
      relaxed = {
        ...params,
        maxOptions: Math.min(8, params.maxOptions + 1),
      };
    }

    const exercise = generateOnce(world, relaxed, subnivel, rng);
    if (!validateExercise(exercise, relaxed)) {
      continue;
    }

    lastValid = exercise;

    if (
      !skipAntiRepeat &&
      previousSignature !== undefined &&
      signatureOf(exercise) === previousSignature
    ) {
      // Valid but a duplicate signature — try again for variety.
      continue;
    }

    return exercise;
  }

  // Exhausted the budget: return the last valid exercise (even if it repeats) rather
  // than ever shipping an unsolvable one.
  if (lastValid) return lastValid;

  // Final safety net: one more generation (validated ranges make this reachable only
  // under a pathological rng).
  return generateOnce(world, relaxed, subnivel, rng);
}

export { signatureOf };
