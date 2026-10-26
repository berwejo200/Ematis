// The useReducer store: a PURE gameReducer, an initialState factory, and the
// useGameState hook. All randomness (exercise generation) happens OUTSIDE the
// reducer — exercises are injected via LOAD_EXERCISE / NEXT_EXERCISE. See design §5.1.

import { useReducer } from "react";
import type { Dispatch } from "react";
import type {
  Exercise,
  GameAction,
  GameProgress,
  GameState,
  Operation,
  SubnivelProgress,
  WorldId,
} from "../game/types";
import { calculateSelectedTotal, checkAnswer } from "../game/validation";
import {
  computeStars,
  computeUnlocks,
  isWorldComplete,
} from "../game/progression";

/** Actions ignored while the transition lock is held (double-tap / double-advance guard). */
const LOCKED_ACTIONS = new Set<GameAction["type"]>([
  "SELECT_OPTION",
  "DESELECT_OPTION",
  "CHECK_ANSWER",
  "NEXT_EXERCISE",
  "SELECT_SUBNIVEL",
]);

/** A fresh, empty persisted progress for every world. */
function emptyProgress(): GameProgress {
  return { sumas: {}, restas: {} };
}

/** Default persisted subnivel facts. */
function defaultSubnivel(): SubnivelProgress {
  return { completed: false, exercisesCleared: 0, stars: 0 };
}

/** Read a subnivel's persisted facts (defaulting when missing). */
function readSubnivel(
  progress: GameProgress,
  world: WorldId,
  subnivel: number,
): SubnivelProgress {
  return progress[world][subnivel] ?? defaultSubnivel();
}

/** The required amount for the current exercise (target for additions, removal total for subtractions). */
function requiredFor(exercise: Exercise): number {
  return exercise.operation === "addition"
    ? exercise.target
    : (exercise.initialQuantity ?? 0) - exercise.target;
}

/** Reclassify validation after any selection change: over when total > required, else idle. */
function reclassify(total: number, required: number): GameState["validation"] {
  return total > required ? "over" : "idle";
}

/** Immutably write one subnivel's facts and recompute the derived view. */
function withProgress(
  state: GameState,
  world: WorldId,
  subnivel: number,
  facts: SubnivelProgress,
): Pick<GameState, "progress" | "progressView"> {
  const progress: GameProgress = {
    sumas: { ...state.progress.sumas },
    restas: { ...state.progress.restas },
  };
  progress[world] = { ...progress[world], [subnivel]: facts };
  return { progress, progressView: computeUnlocks(progress) };
}

/** A fresh initial GameState. */
export function initialState(): GameState {
  const progress = emptyProgress();
  return {
    screen: "welcome",
    playerName: "",
    selectedWorld: null,
    selectedSubnivel: null,
    currentExercise: null,
    selectedOptionIds: [],
    provisionalTotal: 0,
    validation: "idle",
    attempts: 0,
    currentExerciseHintIndex: 0,
    subnivelHintsUsed: 0,
    activeHint: null,
    exercisesClearedThisSubnivel: 0,
    introsSeen: [],
    progress,
    progressView: computeUnlocks(progress),
    audioEnabled: true,
    rejectedOptionId: null,
    transitionLock: false,
    celebration: "none",
  };
}

/**
 * The pure reducer. Deterministic — no randomness, no side effects. All generated
 * exercises are injected via action payloads. See design §5.1.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Transition lock: ignore incompatible actions while a transition/celebration runs.
  if (state.transitionLock && LOCKED_ACTIONS.has(action.type)) {
    return state;
  }

  switch (action.type) {
    case "RESTORE_PROGRESS": {
      const { payload } = action;
      return {
        ...state,
        playerName: payload.playerName,
        progress: payload.progress,
        progressView: computeUnlocks(payload.progress),
        audioEnabled: payload.audioEnabled,
      };
    }

    case "START_GAME": {
      return {
        ...state,
        playerName: action.playerName,
        screen: "map",
        progressView: computeUnlocks(state.progress),
      };
    }

    case "CONTINUE_GAME": {
      return {
        ...state,
        screen: "map",
        progressView: computeUnlocks(state.progress),
      };
    }

    case "RESET_PROGRESS": {
      const progress = emptyProgress();
      return {
        ...state,
        playerName: "",
        progress,
        progressView: computeUnlocks(progress),
        selectedWorld: null,
        selectedSubnivel: null,
        currentExercise: null,
        selectedOptionIds: [],
        provisionalTotal: 0,
        validation: "idle",
        attempts: 0,
        currentExerciseHintIndex: 0,
        subnivelHintsUsed: 0,
        activeHint: null,
        exercisesClearedThisSubnivel: 0,
        introsSeen: [],
        rejectedOptionId: null,
        transitionLock: false,
        celebration: "none",
      };
    }

    case "GO_TO_MAP": {
      return {
        ...state,
        screen: "map",
        currentExercise: null,
        selectedOptionIds: [],
        provisionalTotal: 0,
        validation: "idle",
        activeHint: null,
        rejectedOptionId: null,
      };
    }

    case "SELECT_SUBNIVEL": {
      const world = action.world;
      const operation: Operation =
        world === "sumas" ? "addition" : "subtraction";
      const seen = state.introsSeen.includes(operation);
      return {
        ...state,
        selectedWorld: world,
        selectedSubnivel: action.subnivel,
        // Reset per-exercise AND subnivel counters.
        currentExerciseHintIndex: 0,
        subnivelHintsUsed: 0,
        exercisesClearedThisSubnivel: 0,
        attempts: 0,
        currentExercise: null,
        selectedOptionIds: [],
        provisionalTotal: 0,
        validation: "idle",
        activeHint: null,
        rejectedOptionId: null,
        screen: seen ? "exercise" : "intro",
      };
    }

    case "SHOW_INTRO": {
      const operation = introOperation(state);
      return {
        ...state,
        screen: "intro",
        introsSeen: markSeen(state.introsSeen, operation),
      };
    }

    case "SKIP_INTRO": {
      const operation = introOperation(state);
      return {
        ...state,
        screen: "exercise",
        introsSeen: markSeen(state.introsSeen, operation),
      };
    }

    case "LOAD_EXERCISE": {
      return {
        ...state,
        currentExercise: action.exercise,
        selectedOptionIds: [],
        provisionalTotal: 0,
        validation: "idle",
        activeHint: null,
        // Reset the PER-EXERCISE cursor and attempts; do NOT touch subnivelHintsUsed.
        currentExerciseHintIndex: 0,
        attempts: 0,
        rejectedOptionId: null,
        screen: "exercise",
      };
    }

    case "SELECT_OPTION": {
      if (!state.currentExercise) return state;
      const exercise = state.currentExercise;
      const { optionId } = action;
      if (state.selectedOptionIds.includes(optionId)) {
        // Already selected: clear any stale rejection marker and keep state.
        return state.rejectedOptionId
          ? { ...state, rejectedOptionId: null }
          : state;
      }

      const required = requiredFor(exercise);

      if (exercise.operation === "subtraction") {
        // Reject a tap that would push the removed total above initialQuantity.
        const option = exercise.options.find((o) => o.id === optionId);
        const optionValue = option ? option.value : 0;
        const initial = exercise.initialQuantity ?? 0;
        if (state.provisionalTotal + optionValue > initial) {
          return { ...state, rejectedOptionId: optionId };
        }
      }

      const selectedOptionIds = [...state.selectedOptionIds, optionId];
      const total = calculateSelectedTotal(exercise, selectedOptionIds);
      return {
        ...state,
        selectedOptionIds,
        provisionalTotal: total,
        validation: reclassify(total, required),
        rejectedOptionId: null,
      };
    }

    case "DESELECT_OPTION": {
      if (!state.currentExercise) return state;
      const exercise = state.currentExercise;
      const selectedOptionIds = state.selectedOptionIds.filter(
        (id) => id !== action.optionId,
      );
      const total = calculateSelectedTotal(exercise, selectedOptionIds);
      return {
        ...state,
        selectedOptionIds,
        provisionalTotal: total,
        validation: reclassify(total, requiredFor(exercise)),
        rejectedOptionId: null,
      };
    }

    case "RESET_EXERCISE": {
      return {
        ...state,
        selectedOptionIds: [],
        provisionalTotal: 0,
        validation: "idle",
        activeHint: null,
        rejectedOptionId: null,
      };
    }

    case "CHECK_ANSWER": {
      const exercise = state.currentExercise;
      if (!exercise) return state;
      if (state.selectedOptionIds.length === 0) return state;

      const attempts = state.attempts + 1; // debug-only; never affects stars/unlocks.
      const result = checkAnswer(exercise, state.selectedOptionIds);

      if (result !== "correct") {
        return { ...state, attempts, validation: result };
      }

      // Correct: bump cleared count, celebrate, lock, and persist partial progress.
      // The clamp to the real [0, exerciseCount] is enforced authoritatively by
      // COMPLETE_SUBNIVEL (which carries exerciseCount in its payload so the reducer
      // stays config-free). Here exercisesClearedThisSubnivel is monotonic and only
      // ever advances by 1 per correct answer, so it never exceeds exerciseCount in
      // practice (the hook dispatches COMPLETE at the boundary); we persist it as the
      // partial count so in-subnivel progress survives a reload.
      const world = exercise.world;
      const subnivel = exercise.subnivel;
      const exercisesClearedThisSubnivel =
        state.exercisesClearedThisSubnivel + 1;
      const prev = readSubnivel(state.progress, world, subnivel);
      const facts: SubnivelProgress = {
        ...prev,
        exercisesCleared: exercisesClearedThisSubnivel,
      };

      return {
        ...state,
        attempts,
        validation: "correct",
        exercisesClearedThisSubnivel,
        celebration: "exercise",
        transitionLock: true,
        ...withProgress(state, world, subnivel, facts),
      };
    }

    case "SHOW_HINT": {
      const exercise = state.currentExercise;
      if (!exercise) return state;
      // Clamp first: no-op once the per-exercise cursor reaches hints.length.
      if (state.currentExerciseHintIndex >= exercise.hints.length) {
        return state;
      }
      const activeHint = exercise.hints[state.currentExerciseHintIndex];
      return {
        ...state,
        activeHint,
        currentExerciseHintIndex: state.currentExerciseHintIndex + 1,
        subnivelHintsUsed: state.subnivelHintsUsed + 1,
      };
    }

    case "NEXT_EXERCISE": {
      if (action.exercise) {
        return {
          ...state,
          currentExercise: action.exercise,
          selectedOptionIds: [],
          provisionalTotal: 0,
          validation: "idle",
          activeHint: null,
          currentExerciseHintIndex: 0,
          attempts: 0,
          rejectedOptionId: null,
          screen: "exercise",
        };
      }
      // null payload => subnivel finished. The hook follows up with COMPLETE_SUBNIVEL.
      return state;
    }

    case "COMPLETE_SUBNIVEL": {
      const world = state.selectedWorld;
      const subnivel = state.selectedSubnivel;
      if (world === null || subnivel === null) return state;
      const exerciseCount = action.exerciseCount;
      // Guard: never divide by zero; a value < 1 is a no-op completion.
      if (exerciseCount < 1) return state;

      const prev = readSubnivel(state.progress, world, subnivel);
      const stars = Math.max(
        prev.stars,
        computeStars(state.subnivelHintsUsed, exerciseCount),
      );
      const facts: SubnivelProgress = {
        completed: true,
        exercisesCleared: exerciseCount,
        stars,
      };

      return {
        ...state,
        ...withProgress(state, world, subnivel, facts),
      };
    }

    case "UNLOCK_NEXT": {
      const world = state.selectedWorld;
      const progressView = computeUnlocks(state.progress);
      const worldComplete =
        world !== null && isWorldComplete(state.progress, world);
      return {
        ...state,
        progressView,
        screen: worldComplete ? "worldComplete" : "levelComplete",
        celebration: worldComplete ? "world" : "subnivel",
        transitionLock: true,
      };
    }

    case "SET_AUDIO": {
      return { ...state, audioEnabled: action.enabled };
    }

    case "SET_TRANSITION_LOCK": {
      return { ...state, transitionLock: action.locked };
    }

    case "CLEAR_CELEBRATION": {
      // Idempotent: clears celebration and releases the transition lock.
      return { ...state, celebration: "none", transitionLock: false };
    }

    default: {
      // Exhaustiveness guard; unreachable for the typed action union.
      return state;
    }
  }
}

/** The operation of the currently-selected world (for intro bookkeeping). */
function introOperation(state: GameState): Operation {
  return state.selectedWorld === "restas" ? "subtraction" : "addition";
}

/** Add an operation to introsSeen if not already present (idempotent). */
function markSeen(seen: Operation[], operation: Operation): Operation[] {
  return seen.includes(operation) ? seen : [...seen, operation];
}

/** React hook wrapping the reducer. */
export function useGameState(): [GameState, Dispatch<GameAction>] {
  return useReducer(gameReducer, undefined, initialState);
}
