import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseBoard } from "../ExerciseBoard";
import type { Exercise } from "../../game/types";
import { buildHints } from "../../game/hints";

/** A minimal addition exercise: target 4 with options 1,2,3,1. */
function additionExercise(): Exercise {
  return {
    id: "ex-1",
    operation: "addition",
    world: "sumas",
    subnivel: 3,
    difficulty: 3,
    target: 4,
    initialQuantity: null,
    options: [
      { id: "opt-0", value: 1 },
      { id: "opt-1", value: 2 },
      { id: "opt-2", value: 3 },
      { id: "opt-3", value: 1 },
    ],
    validAnswers: [["opt-0", "opt-2"]],
    hints: buildHints(4, "estrella", "estrellas", ["opt-0", "opt-2"]),
    instruction: "¡Consigue 4 estrellas!",
    tokenEmoji: "⭐",
    tokenNoun: "estrellas",
    tokenNounSingular: "estrella",
  };
}

const baseProps = {
  selectedOptionIds: [] as string[],
  provisionalTotal: 0,
  validation: "idle" as const,
  rejectedOptionId: null,
  activeHint: null,
  hintsExhausted: false,
  transitionLock: false,
  onToggleOption: () => {},
  onCheck: () => {},
  onHint: () => {},
};

describe("ExerciseBoard", () => {
  it("renders the target, instruction and the running total", () => {
    render(
      <ExerciseBoard
        {...baseProps}
        exercise={additionExercise()}
        selectedOptionIds={["opt-0"]}
        provisionalTotal={1}
      />,
    );

    expect(screen.getByText("¡Consigue 4 estrellas!")).toBeInTheDocument();
    // Running total row announces the current amount.
    expect(screen.getByText(/Llevas/)).toBeInTheDocument();
  });

  it("disables «Comprobar» on an empty selection", () => {
    render(<ExerciseBoard {...baseProps} exercise={additionExercise()} />);
    expect(
      screen.getByRole("button", { name: "Comprobar" }),
    ).toBeDisabled();
  });

  it("disables «Comprobar» while the transition lock is held", () => {
    render(
      <ExerciseBoard
        {...baseProps}
        exercise={additionExercise()}
        selectedOptionIds={["opt-0"]}
        provisionalTotal={1}
        transitionLock
      />,
    );
    expect(
      screen.getByRole("button", { name: "Comprobar" }),
    ).toBeDisabled();
  });

  it("enables «Comprobar» with a non-empty selection and no lock", () => {
    render(
      <ExerciseBoard
        {...baseProps}
        exercise={additionExercise()}
        selectedOptionIds={["opt-0"]}
        provisionalTotal={1}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Comprobar" }),
    ).toBeEnabled();
  });

  it("shows the addition over-hint when validation is 'over'", () => {
    render(
      <ExerciseBoard
        {...baseProps}
        exercise={additionExercise()}
        selectedOptionIds={["opt-1", "opt-2"]}
        provisionalTotal={5}
        validation="over"
      />,
    );
    expect(
      screen.getByText("¿Quitamos una caja? Nos hemos pasado"),
    ).toBeInTheDocument();
  });

  it("hides «Pista» once hints are exhausted", () => {
    const onHint = vi.fn();
    render(
      <ExerciseBoard
        {...baseProps}
        exercise={additionExercise()}
        hintsExhausted
        onHint={onHint}
      />,
    );
    expect(screen.queryByRole("button", { name: "Pista" })).toBeNull();
  });
});
