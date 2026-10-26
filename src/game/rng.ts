// Deterministic-under-test RNG helpers. All randomness in generators is injected
// via an `Rng` parameter (defaults to Math.random). No React, no DOM.

export type Rng = () => number;

/** Random integer in [min, max] inclusive. */
export function randInt(rng: Rng, min: number, max: number): number {
  if (max < min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

/** In-place Fisher-Yates shuffle using the injected rng. Returns the same array. */
export function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Partition `total` into `k` positive integers (each >= 1), chosen randomly.
 * Precondition: total >= k >= 1. Uses the stars-and-bars style random composition.
 */
export function partition(rng: Rng, total: number, k: number): number[] {
  // Give each part 1, then distribute the remaining (total - k) units randomly.
  const parts = new Array<number>(k).fill(1);
  let remaining = total - k;
  while (remaining > 0) {
    const idx = Math.floor(rng() * k);
    parts[idx] += 1;
    remaining -= 1;
  }
  return parts;
}
