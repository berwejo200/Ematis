// Module-level monotonic counter for globally-unique exercise ids per run.
// Not reset between exercises so ids stay unique. See design §2 (finding #7, 3rd pass).

let exerciseSeq = 0;

/** Returns the next unique exercise id, e.g. "ex-1". Collision-free in tight loops. */
export function nextExerciseId(): string {
  return `ex-${++exerciseSeq}`;
}
