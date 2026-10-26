// Pure shared types for the game domain. No React, no DOM. See design §2.

// ---------- Operation & identity ----------
export type Operation = "addition" | "subtraction";

export type WorldId = "sumas" | "restas";

/** A single selectable card/box. `id` is globally unique within an exercise even when `value` repeats. */
export interface NumberOption {
  id: string; // e.g. "opt-3" — unique per exercise, NOT derived from value or position
  value: number; // the number shown (>= 0)
}

// ---------- Hints ----------
export type HintKind =
  | "show-objects" // (1) show the objects each number represents
  | "animate-counting" // (2) animate counting
  | "highlight-options" // (3) highlight some relevant options
  | "guided-demo"; // (4) guided demonstration

export interface Hint {
  kind: HintKind;
  /** Short Spanish text shown with the hint, e.g. "Vamos a contar las estrellas". */
  message: string;
  /** For "highlight-options": option ids to emphasize. Empty for other kinds. */
  highlightOptionIds: string[];
}

// ---------- Exercise ----------
/**
 * A single exercise. Generated fresh; `validAnswers` is precomputed so validation
 * is a pure lookup and never depends on animation/UI.
 */
export interface Exercise {
  /** Unique per generated exercise: `ex-${++exerciseSeq}` (module-level counter, not reset between exercises). */
  id: string;
  operation: Operation;
  world: WorldId;
  subnivel: number; // 1-based index within the world
  /** PURE DISPLAY ALIAS of `subnivel`. validateExercise asserts difficulty === subnivel. */
  difficulty: number;

  target: number; // additions: the goal sum. subtractions: the quantity that must REMAIN.
  initialQuantity: number | null; // subtractions: starting objects. additions: null.

  options: NumberOption[]; // the cards shown

  /**
   * Every valid solution as a set of option ids. Additions: ids whose VALUES sum to `target`.
   * Subtractions: ids whose VALUES sum to `initialQuantity - target`. Used only for the
   * generation-time solvability proof, hint targeting and tests — NEVER by checkAnswer.
   */
  validAnswers: string[][];

  hints: Hint[]; // ordered; progressively more helpful
  /** Short Spanish prompt, e.g. "¡Consigue 4 estrellas!". */
  instruction: string;
  /** Emoji/glyph used as the counting token for this exercise, e.g. "⭐". */
  tokenEmoji: string;
  /** Plural counting noun, e.g. "estrellas". */
  tokenNoun: string;
  /** Singular form, e.g. "estrella", used when the interpolated count === 1. */
  tokenNounSingular: string;
}

// ---------- Progress & levels ----------
export interface SubnivelConfig {
  index: number; // 1-based
  exerciseCount: number; // how many exercises to clear this subnivel
  label: string; // short Spanish label, e.g. "Isla 1"
  params: GenerationParams;
}

export interface GenerationParams {
  operation: Operation;
  minResult: number; // additions: min target; subtractions: min remaining
  maxResult: number; // additions: max target; subtractions: max remaining
  minOptions: number; // minimum number of cards shown
  maxOptions: number; // maximum number of cards shown
  minAddends: number; // min cards in the intended solution (additions); removals (subtractions)
  maxAddends: number; // max cards in the intended solution
  maxInitial: number; // subtractions: cap on the starting quantity (additions: ignored)
  strongVisuals: boolean; // emphasize object representations (early levels)
}

export interface WorldConfig {
  id: WorldId;
  operation: Operation;
  title: string; // "El mundo de las sumas" / "El mundo de las restas"
  subniveles: SubnivelConfig[];
}

/**
 * One subnivel's PERSISTED state. `unlocked` is deliberately NOT stored here (finding #8):
 * it is derived from `completed` flags by `computeUnlocks`.
 */
export interface SubnivelProgress {
  completed: boolean;
  exercisesCleared: number; // 0..exerciseCount
  stars: number; // 1..3 once completed, 0 before
}

/** Full per-world PERSISTED progress keyed by subnivel index (1-based). */
export type WorldProgress = Record<number, SubnivelProgress>;

/** Derived view used by the UI: persisted facts plus the recomputed `unlocked` flag. */
export interface SubnivelView extends SubnivelProgress {
  unlocked: boolean; // DERIVED by computeUnlocks, never persisted
}
export type WorldView = Record<number, SubnivelView>;
export interface GameProgressView {
  sumas: WorldView;
  restas: WorldView;
}

export interface GameProgress {
  sumas: WorldProgress;
  restas: WorldProgress;
}

/** The persisted envelope (what goes to LocalStorage). */
export interface PersistedState {
  version: number; // STORAGE_VERSION
  playerName: string;
  progress: GameProgress;
  audioEnabled: boolean;
}

// ---------- Runtime game state ----------
export type Screen =
  | "welcome"
  | "map"
  | "intro"
  | "exercise"
  | "levelComplete"
  | "worldComplete";

export type ValidationState =
  | "idle" // selection in progress, at/under target, not yet checked
  | "checking" // locked while validating/animating a correct answer
  | "correct" // CHECK_ANSWER: exact match
  | "over" // selection exceeds required amount — live OR checked; gentle hint
  | "incorrect"; // CHECK_ANSWER: under the required amount on check

export interface GameState {
  screen: Screen;
  playerName: string;

  selectedWorld: WorldId | null;
  selectedSubnivel: number | null;

  currentExercise: Exercise | null;
  selectedOptionIds: string[]; // order of selection preserved for deselect/undo UX
  provisionalTotal: number; // additions: sum selected. subtractions: amount removed.
  validation: ValidationState;

  /** DEBUG/telemetry ONLY. MUST NOT affect stars, unlocks, difficulty, or any gating. */
  attempts: number;

  /** PER-EXERCISE hint cursor: 0..currentExercise.hints.length. Reset on LOAD_EXERCISE/SELECT_SUBNIVEL. */
  currentExerciseHintIndex: number;
  /** SUBNIVEL-CUMULATIVE hint counter. Reset to 0 ONLY on SELECT_SUBNIVEL. Sole input to computeStars. */
  subnivelHintsUsed: number;
  activeHint: Hint | null;

  exercisesClearedThisSubnivel: number;

  /** Operations whose intro has been shown THIS SESSION (not persisted). */
  introsSeen: Operation[];

  progress: GameProgress; // persisted facts (no `unlocked`)
  progressView: GameProgressView; // derived (progress + computeUnlocks)
  audioEnabled: boolean;

  /** Set by a rejected subtraction SELECT; the board shakes/greys this card. Cleared on next action. */
  rejectedOptionId: string | null;

  /** True while a transition/celebration animation runs; blocks incompatible actions. */
  transitionLock: boolean;
  /** Celebration tier currently playing. */
  celebration: "none" | "exercise" | "subnivel" | "world";
}

// ---------- Actions (useReducer) ----------
export type GameAction =
  | { type: "RESTORE_PROGRESS"; payload: PersistedState }
  | { type: "START_GAME"; playerName: string }
  | { type: "CONTINUE_GAME" }
  | { type: "RESET_PROGRESS" }
  | { type: "GO_TO_MAP" }
  | { type: "SELECT_SUBNIVEL"; world: WorldId; subnivel: number }
  | { type: "SHOW_INTRO" }
  | { type: "SKIP_INTRO" }
  | { type: "LOAD_EXERCISE"; exercise: Exercise }
  | { type: "SELECT_OPTION"; optionId: string }
  | { type: "DESELECT_OPTION"; optionId: string }
  | { type: "RESET_EXERCISE" }
  | { type: "CHECK_ANSWER" }
  | { type: "SHOW_HINT" }
  | { type: "NEXT_EXERCISE"; exercise: Exercise | null }
  | { type: "COMPLETE_SUBNIVEL"; exerciseCount: number }
  | { type: "UNLOCK_NEXT" }
  | { type: "SET_AUDIO"; enabled: boolean }
  | { type: "SET_TRANSITION_LOCK"; locked: boolean }
  | { type: "CLEAR_CELEBRATION" };
