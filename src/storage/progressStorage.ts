// LocalStorage persistence with versioning + corrupt/old/partial guards.
// Only persistence lives here; `unlocked` is NEVER persisted (derived on load).
// See design §5.2.

import type {
  GameProgress,
  PersistedState,
  SubnivelProgress,
  WorldId,
  WorldProgress,
} from "../game/types";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  WORLDS,
  getExerciseCount,
} from "../data/levels";

export { STORAGE_KEY, STORAGE_VERSION };

/** A fresh default SubnivelProgress. */
function defaultSubnivel(): SubnivelProgress {
  return { completed: false, exercisesCleared: 0, stars: 0 };
}

/** Empty per-world progress for every world declared in levels.ts. */
export function defaultProgress(): GameProgress {
  return { sumas: {}, restas: {} };
}

/** A fresh default PersistedState (used on first run / after a reset/discard). */
export function defaultPersistedState(): PersistedState {
  return {
    version: STORAGE_VERSION,
    playerName: "",
    progress: defaultProgress(),
    audioEnabled: true,
  };
}

/**
 * Serialize the PersistedState into the storage key. Wrapped in try/catch so a
 * Safari private-mode / quota throw never crashes the game — it logs a single
 * console.warn and the game continues in-memory. Only the PersistedState shape is
 * written; `unlocked` is never serialized.
 */
export function saveState(state: PersistedState): void {
  try {
    const payload: PersistedState = {
      version: STORAGE_VERSION,
      playerName: state.playerName,
      progress: state.progress,
      audioEnabled: state.audioEnabled,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage unavailable (Safari private mode). Continue in-memory.
    console.warn("ematis: no se pudo guardar el progreso; se continúa en memoria.");
  }
}

/** Clamp an integer to [min, max]; non-finite values clamp to min. */
function clamp(value: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

/**
 * Backfill every subnivel index declared in levels.ts with a default entry, then
 * clamp exercisesCleared to [0, exerciseCount] and stars to [0, 3]. Runs BEFORE
 * computeUnlocks is ever called so a completed later level can never be relocked
 * by a missing earlier entry.
 */
function backfillWorld(
  worldId: WorldId,
  loaded: WorldProgress,
): WorldProgress {
  const world = WORLDS.find((w) => w.id === worldId);
  const repaired: WorldProgress = {};
  if (!world) return repaired;

  for (const sub of world.subniveles) {
    const exerciseCount = getExerciseCount(worldId, sub.index);
    const entry = loaded[sub.index];
    if (isPlainObject(entry)) {
      const completed = entry.completed === true;
      const exercisesCleared = clamp(
        typeof entry.exercisesCleared === "number" ? entry.exercisesCleared : 0,
        0,
        exerciseCount,
      );
      const stars = clamp(
        typeof entry.stars === "number" ? entry.stars : 0,
        0,
        3,
      );
      repaired[sub.index] = { completed, exercisesCleared, stars };
    } else {
      repaired[sub.index] = defaultSubnivel();
    }
  }

  return repaired;
}

/**
 * Read + repair persisted state. Returns null on absent/corrupt/old data (and clears
 * the key on corruption). On a valid envelope it backfills missing subniveles and
 * clamps counts before returning. See design §5.2.
 */
export function loadState(): PersistedState | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (Safari private mode). Treat as fresh start.
    return null;
  }

  // 1) Absent -> null (fresh start).
  if (raw === null) return null;

  // 2) Parse error -> corrupt: clear key, return null.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearKey();
    return null;
  }

  // 3) Shape validation.
  if (!isPlainObject(parsed)) {
    clearKey();
    return null;
  }
  const { version, playerName, progress, audioEnabled } = parsed;
  if (
    typeof version !== "number" ||
    typeof playerName !== "string" ||
    typeof audioEnabled !== "boolean" ||
    !isPlainObject(progress) ||
    !isPlainObject((progress as Record<string, unknown>).sumas) ||
    !isPlainObject((progress as Record<string, unknown>).restas)
  ) {
    clearKey();
    return null;
  }

  // 4) Version migration: currently v1 is the only version; older/unknown -> discard.
  if (version < STORAGE_VERSION) {
    clearKey();
    return null;
  }

  // 5) Backfill + clamp BEFORE any computeUnlocks runs.
  const loadedProgress = progress as unknown as GameProgress;
  const repaired: GameProgress = {
    sumas: backfillWorld("sumas", loadedProgress.sumas),
    restas: backfillWorld("restas", loadedProgress.restas),
  };

  return {
    version: STORAGE_VERSION,
    playerName,
    progress: repaired,
    audioEnabled,
  };
}

function clearKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing more we can do if removal throws.
  }
}
