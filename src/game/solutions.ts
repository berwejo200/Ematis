// Subset-sum enumeration used to precompute validAnswers. Pure. See design §3.1 step 5.

import type { NumberOption } from "./types";

/**
 * Enumerate subsets of `options` whose VALUES sum to `target`, returning at most
 * `cap` distinct minimal solutions (smallest subsets first). Each solution is a
 * list of option ids. Options.length is capped at 8 upstream, so this is cheap.
 */
export function enumerateSolutions(
  options: NumberOption[],
  target: number,
  cap = 8,
): string[][] {
  const solutions: string[][] = [];
  const n = options.length;

  // All 2^n subsets, collected with their size so we can sort smallest-first.
  const found: Array<{ ids: string[]; size: number }> = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    let sum = 0;
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += options[i].value;
        ids.push(options[i].id);
      }
    }
    if (sum === target) {
      found.push({ ids, size: ids.length });
    }
  }

  found.sort((a, b) => a.size - b.size);
  for (const f of found) {
    solutions.push(f.ids);
    if (solutions.length >= cap) break;
  }
  return solutions;
}
