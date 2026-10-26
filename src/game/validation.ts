// Pure validation core. No React, no DOM. See design §3.3 and §3.4.

import type { Exercise, GenerationParams } from "./types";

/**
 * Spanish agreement helper. Returns "1 estrella" when count === 1, else "{count} {plural}".
 * See design §3.4.
 */
export function tokenPhrase(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

/**
 * Sums the VALUES of selected options by id lookup. Positions irrelevant.
 * For subtraction this is the removed total.
 */
export function calculateSelectedTotal(
  exercise: Exercise,
  selectedOptionIds: string[],
): number {
  const byId = new Map(exercise.options.map((o) => [o.id, o.value]));
  let total = 0;
  for (const id of selectedOptionIds) {
    const value = byId.get(id);
    if (value !== undefined) {
      total += value;
    }
  }
  return total;
}

/**
 * Acceptance decided PURELY by the running sum — NEVER consults validAnswers.
 * Empty selection is never passed here (the «Comprobar» button is disabled when empty).
 * See design §3.3.
 */
export function checkAnswer(
  exercise: Exercise,
  selectedOptionIds: string[],
): "correct" | "over" | "incorrect" {
  const total = calculateSelectedTotal(exercise, selectedOptionIds);
  const required =
    exercise.operation === "addition"
      ? exercise.target
      : (exercise.initialQuantity ?? 0) - exercise.target;

  if (total === required) return "correct";
  if (total > required) return "over";
  return "incorrect";
}

/** Enumerate subset sums reachable from the option values. */
function reachableSums(values: number[]): Set<number> {
  const sums = new Set<number>([0]);
  for (const value of values) {
    for (const existing of Array.from(sums)) {
      sums.add(existing + value);
    }
  }
  return sums;
}

/**
 * Generation-time guard asserting the exercise is solvable and sane.
 * Returns false → generator discards and regenerates. See design §3.3.
 *
 * The optional `params` lets the generator run the additions config sanity
 * check (minResult >= minAddends). When omitted, that row-level check is skipped.
 */
export function validateExercise(
  exercise: Exercise,
  params?: GenerationParams,
): boolean {
  // difficulty is a pure display alias of subnivel; they must never drift.
  if (exercise.difficulty !== exercise.subnivel) return false;

  // Unique, non-empty option ids; hard cap of 8 options.
  const ids = exercise.options.map((o) => o.id);
  if (ids.length === 0) return false;
  if (ids.length > 8) return false;
  if (new Set(ids).size !== ids.length) return false;

  // validAnswers non-empty, and each listed set sums (by value) to the required amount.
  if (exercise.validAnswers.length === 0) return false;

  const byId = new Map(exercise.options.map((o) => [o.id, o.value]));
  const required =
    exercise.operation === "addition"
      ? exercise.target
      : (exercise.initialQuantity ?? 0) - exercise.target;

  for (const set of exercise.validAnswers) {
    if (set.length === 0) return false;
    let sum = 0;
    for (const id of set) {
      const value = byId.get(id);
      if (value === undefined) return false; // references a non-existent option
      sum += value;
    }
    if (sum !== required) return false;
  }

  const optionValues = exercise.options.map((o) => o.value);

  if (exercise.operation === "addition") {
    // Config sanity: minResult >= minAddends (per row).
    if (params && params.minResult < params.minAddends) return false;
    // Per-exercise: target >= minAddends (a solution of minAddends positive cards is otherwise impossible).
    if (params && exercise.target < params.minAddends) return false;
    // target reachable by some subset.
    if (!reachableSums(optionValues).has(exercise.target)) return false;
    return true;
  }

  // subtraction
  const initial = exercise.initialQuantity;
  if (initial === null) return false;
  // initialQuantity >= target + 1 (strictly greater).
  if (initial < exercise.target + 1) return false;
  // initialQuantity <= maxInitial.
  if (params && initial > params.maxInitial) return false;
  // Every option value <= initialQuantity.
  for (const value of optionValues) {
    if (value > initial) return false;
  }
  // initialQuantity - target reachable by some subset.
  if (!reachableSums(optionValues).has(initial - exercise.target)) return false;
  return true;
}
