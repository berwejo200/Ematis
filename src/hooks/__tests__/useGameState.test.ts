import { describe, expect, it } from "vitest";
import { gameReducer, initialState } from "../useGameState";
import type { Exercise, GameState, Hint } from "../../game/types";

function makeHints(n: number): Hint[] {
  const hints: Hint[] = [];
  for (let i = 0; i < n; i++) {
    hints.push({
      kind: "show-objects",
      message: `pista ${i + 1}`,
      highlightOptionIds: [],
    });
  }
  return hints;
}

function additionExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex-1",
    operation: "addition",
    world: "sumas",
    subnivel: 1,
    difficulty: 1,
    target: 4,
    initialQuantity: null,
    options: [
      { id: "opt-0", value: 1 },
      { id: "opt-1", value: 3 },
      { id: "opt-2", value: 2 },
      { id: "opt-3", value: 4 },
    ],
    validAnswers: [["opt-0", "opt-1"]],
    hints: makeHints(4),
    instruction: "¡Consigue 4 estrellas!",
    tokenEmoji: "⭐",
    tokenNoun: "estrellas",
    tokenNounSingular: "estrella",
    ...overrides,
  };
}

function subtractionExercise(overrides: Partial<Exercise> = {}): Exercise {
  // initialQuantity 5, target 2 => required removal total = 3.
  return {
    id: "ex-2",
    operation: "subtraction",
    world: "restas",
    subnivel: 1,
    difficulty: 1,
    target: 2,
    initialQuantity: 5,
    options: [
      { id: "opt-0", value: 1 },
      { id: "opt-1", value: 2 },
      { id: "opt-2", value: 3 },
      { id: "opt-3", value: 4 },
    ],
    validAnswers: [["opt-2"]],
    hints: makeHints(4),
    instruction: "¡Quita hasta que queden 2 estrellas!",
    tokenEmoji: "⭐",
    tokenNoun: "estrellas",
    tokenNounSingular: "estrella",
    ...overrides,
  };
}

/** Build a state in "exercise" with the given exercise loaded. */
function stateWithExercise(exercise: Exercise): GameState {
  let s = initialState();
  s = gameReducer(s, {
    type: "SELECT_SUBNIVEL",
    world: exercise.world,
    subnivel: exercise.subnivel,
  });
  s = gameReducer(s, { type: "SKIP_INTRO" });
  s = gameReducer(s, { type: "LOAD_EXERCISE", exercise });
  return s;
}

describe("gameReducer — transition lock (double-tap prevention)", () => {
  it("ignores SELECT/CHECK/NEXT/SELECT_SUBNIVEL/DESELECT while locked", () => {
    const ex = additionExercise();
    let s = stateWithExercise(ex);
    s = { ...s, transitionLock: true };

    expect(gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-0" })).toBe(s);
    expect(gameReducer(s, { type: "DESELECT_OPTION", optionId: "opt-0" })).toBe(s);
    expect(gameReducer(s, { type: "CHECK_ANSWER" })).toBe(s);
    expect(gameReducer(s, { type: "NEXT_EXERCISE", exercise: null })).toBe(s);
    expect(
      gameReducer(s, { type: "SELECT_SUBNIVEL", world: "sumas", subnivel: 2 }),
    ).toBe(s);
  });
});

describe("gameReducer — correct answer advances exactly once", () => {
  it("bumps exercisesClearedThisSubnivel once, sets celebration + lock, persists cleared", () => {
    const ex = additionExercise();
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-0" }); // 1
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-1" }); // 1+3 = 4

    const afterCheck = gameReducer(s, { type: "CHECK_ANSWER" });
    expect(afterCheck.validation).toBe("correct");
    expect(afterCheck.exercisesClearedThisSubnivel).toBe(1);
    expect(afterCheck.celebration).toBe("exercise");
    expect(afterCheck.transitionLock).toBe(true);
    expect(afterCheck.progress.sumas[1].exercisesCleared).toBe(1);

    // A second CHECK is ignored because the lock is now held.
    const again = gameReducer(afterCheck, { type: "CHECK_ANSWER" });
    expect(again).toBe(afterCheck);
    expect(again.exercisesClearedThisSubnivel).toBe(1);
  });

  it("persists clamped (monotonic) exercisesCleared across several corrects", () => {
    const ex = additionExercise();
    let s = stateWithExercise(ex);
    // Simulate three cleared exercises by clearing the celebration between each.
    for (let i = 1; i <= 3; i++) {
      s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-0" });
      s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-1" });
      s = gameReducer(s, { type: "CHECK_ANSWER" });
      expect(s.progress.sumas[1].exercisesCleared).toBe(i);
      s = gameReducer(s, { type: "CLEAR_CELEBRATION" });
      s = gameReducer(s, { type: "LOAD_EXERCISE", exercise: ex });
    }
    expect(s.exercisesClearedThisSubnivel).toBe(3);
  });
});

describe("gameReducer — hints (dual counter + clamp)", () => {
  it("advances both counters and clamps to a no-op past the last tier", () => {
    const ex = additionExercise({ hints: makeHints(2) });
    let s = stateWithExercise(ex);

    s = gameReducer(s, { type: "SHOW_HINT" });
    expect(s.currentExerciseHintIndex).toBe(1);
    expect(s.subnivelHintsUsed).toBe(1);
    expect(s.activeHint?.message).toBe("pista 1");

    s = gameReducer(s, { type: "SHOW_HINT" });
    expect(s.currentExerciseHintIndex).toBe(2);
    expect(s.subnivelHintsUsed).toBe(2);

    // Clamp: no-op once the per-exercise cursor reaches hints.length.
    const clamped = gameReducer(s, { type: "SHOW_HINT" });
    expect(clamped).toBe(s);
  });
});

describe("gameReducer — LOAD_EXERCISE vs SELECT_SUBNIVEL counters", () => {
  it("LOAD_EXERCISE resets the per-exercise cursor but leaves subnivelHintsUsed", () => {
    const ex = additionExercise();
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "SHOW_HINT" });
    s = gameReducer(s, { type: "SHOW_HINT" });
    expect(s.currentExerciseHintIndex).toBe(2);
    expect(s.subnivelHintsUsed).toBe(2);

    s = gameReducer(s, { type: "LOAD_EXERCISE", exercise: ex });
    expect(s.currentExerciseHintIndex).toBe(0);
    expect(s.subnivelHintsUsed).toBe(2); // untouched
  });

  it("SELECT_SUBNIVEL resets BOTH hint counters", () => {
    const ex = additionExercise();
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "SHOW_HINT" });
    s = gameReducer(s, { type: "SHOW_HINT" });
    expect(s.subnivelHintsUsed).toBe(2);

    s = gameReducer(s, { type: "SELECT_SUBNIVEL", world: "sumas", subnivel: 2 });
    expect(s.currentExerciseHintIndex).toBe(0);
    expect(s.subnivelHintsUsed).toBe(0);
    expect(s.exercisesClearedThisSubnivel).toBe(0);
    expect(s.attempts).toBe(0);
  });
});

describe("gameReducer — subtraction selection rules", () => {
  it("over-selection (above required but within initial) reclassifies to 'over'", () => {
    const ex = subtractionExercise(); // required removal = 3
    let s = stateWithExercise(ex);
    // Remove 4 (> required 3 but <= initial 5) => accepted, reclassifies to over.
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-3" });
    expect(s.selectedOptionIds).toEqual(["opt-3"]);
    expect(s.provisionalTotal).toBe(4);
    expect(s.validation).toBe("over");
  });

  it("rejects a tap that would exceed initialQuantity (card not selected)", () => {
    const ex = subtractionExercise(); // initial 5
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-3" }); // 4
    const rejected = gameReducer(s, {
      type: "SELECT_OPTION",
      optionId: "opt-1",
    }); // 4+2 = 6 > 5 => rejected
    expect(rejected.selectedOptionIds).toEqual(["opt-3"]);
    expect(rejected.rejectedOptionId).toBe("opt-1");
    expect(rejected.provisionalTotal).toBe(4);
  });
});

describe("gameReducer — over-hint chosen by operation at CHECK_ANSWER", () => {
  it("addition over selection checks to 'over'", () => {
    const ex = additionExercise(); // target 4
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-3" }); // 4
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-2" }); // 4+2 = 6 > 4
    expect(s.validation).toBe("over");
    const checked = gameReducer(s, { type: "CHECK_ANSWER" });
    expect(checked.validation).toBe("over");
    // Over-hint copy is chosen at render time by currentExercise.operation.
    expect(checked.currentExercise?.operation).toBe("addition");
  });

  it("subtraction under selection checks to 'incorrect'", () => {
    const ex = subtractionExercise(); // required 3
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-0" }); // 1 < 3
    const checked = gameReducer(s, { type: "CHECK_ANSWER" });
    expect(checked.validation).toBe("incorrect");
    expect(checked.currentExercise?.operation).toBe("subtraction");
  });
});

describe("gameReducer — CLEAR_CELEBRATION releases the lock", () => {
  it("clears celebration and releases transitionLock (idempotent)", () => {
    const ex = additionExercise();
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-0" });
    s = gameReducer(s, { type: "SELECT_OPTION", optionId: "opt-1" });
    s = gameReducer(s, { type: "CHECK_ANSWER" });
    expect(s.transitionLock).toBe(true);

    s = gameReducer(s, { type: "CLEAR_CELEBRATION" });
    expect(s.celebration).toBe("none");
    expect(s.transitionLock).toBe(false);

    // Idempotent second clear.
    const again = gameReducer(s, { type: "CLEAR_CELEBRATION" });
    expect(again.celebration).toBe("none");
    expect(again.transitionLock).toBe(false);
  });
});

describe("gameReducer — COMPLETE_SUBNIVEL", () => {
  it("marks completed, sets exercisesCleared = exerciseCount, keeps max stars", () => {
    const ex = additionExercise();
    let s = stateWithExercise(ex);
    s = gameReducer(s, { type: "COMPLETE_SUBNIVEL", exerciseCount: 4 });
    expect(s.progress.sumas[1].completed).toBe(true);
    expect(s.progress.sumas[1].exercisesCleared).toBe(4);
    expect(s.progress.sumas[1].stars).toBeGreaterThanOrEqual(1);
  });

  it("is a no-op when exerciseCount < 1 (never divides by zero)", () => {
    const ex = additionExercise();
    const s = stateWithExercise(ex);
    const after = gameReducer(s, { type: "COMPLETE_SUBNIVEL", exerciseCount: 0 });
    expect(after).toBe(s);
  });
});
