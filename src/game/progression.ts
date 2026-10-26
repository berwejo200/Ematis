// Unlock rules, star computation, completion checks. Pure. No React, no DOM. See design §4.

import type {
  GameProgress,
  GameProgressView,
  SubnivelProgress,
  WorldId,
  WorldProgress,
  WorldView,
} from "./types";
import { WORLDS, getWorld } from "../data/levels";

const DEFAULT_SUBNIVEL: SubnivelProgress = {
  completed: false,
  exercisesCleared: 0,
  stars: 0,
};

function readSubnivel(
  worldProgress: WorldProgress,
  index: number,
): SubnivelProgress {
  return worldProgress[index] ?? DEFAULT_SUBNIVEL;
}

/** Is a specific subnivel completed? */
export function isSubnivelComplete(
  progress: GameProgress,
  world: WorldId,
  subnivel: number,
): boolean {
  return readSubnivel(progress[world], subnivel).completed;
}

/** Is every subnivel of a world completed? */
export function isWorldComplete(
  progress: GameProgress,
  world: WorldId,
): boolean {
  const config = getWorld(world);
  if (!config) return false;
  return config.subniveles.every((s) =>
    readSubnivel(progress[world], s.index).completed,
  );
}

const FINAL_SUMAS_SUBNIVEL = (() => {
  const sumas = getWorld("sumas");
  return sumas ? sumas.subniveles[sumas.subniveles.length - 1].index : 6;
})();

/**
 * Derive the `unlocked` flag for every subnivel from persisted `completed` facts plus
 * the subtraction gate. Pure and idempotent. See design §4.
 */
export function computeUnlocks(progress: GameProgress): GameProgressView {
  const view: Partial<Record<WorldId, WorldView>> = {};

  for (const world of WORLDS) {
    const worldProgress = progress[world.id];
    const worldView: WorldView = {};

    for (const sub of world.subniveles) {
      const facts = readSubnivel(worldProgress, sub.index);

      let unlocked: boolean;
      if (world.id === "restas" && sub.index === 1) {
        // Subtraction gate: restas Puerta 1 unlocked iff sumas final Isla is completed.
        unlocked = isSubnivelComplete(progress, "sumas", FINAL_SUMAS_SUBNIVEL);
      } else if (sub.index === 1) {
        // World entry (sumas Isla 1) is always unlocked.
        unlocked = true;
      } else {
        // n unlocked iff n-1 completed.
        unlocked = readSubnivel(worldProgress, sub.index - 1).completed;
      }

      worldView[sub.index] = { ...facts, unlocked };
    }

    view[world.id] = worldView;
  }

  return {
    sumas: view.sumas ?? {},
    restas: view.restas ?? {},
  };
}

/** The next subnivel index within the same world, or null if this is the last. */
export function nextSubnivel(world: WorldId, subnivel: number): number | null {
  const config = getWorld(world);
  if (!config) return null;
  const exists = config.subniveles.some((s) => s.index === subnivel + 1);
  return exists ? subnivel + 1 : null;
}

/**
 * Participation-based stars, never zero once cleared. Keyed ONLY on the subnivel-
 * cumulative hint counter; `attempts` is intentionally not a parameter. See design §4.
 */
export function computeStars(
  subnivelHintsUsed: number,
  exerciseCount: number,
): 1 | 2 | 3 {
  if (exerciseCount < 1) return 1;
  const hintsPerExercise = subnivelHintsUsed / exerciseCount;
  if (hintsPerExercise <= 0.5) return 3;
  if (hintsPerExercise <= 1.5) return 2;
  return 1;
}
