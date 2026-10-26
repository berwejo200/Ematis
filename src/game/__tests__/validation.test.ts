import { describe, expect, it } from "vitest";
import {
  calculateSelectedTotal,
  checkAnswer,
  tokenPhrase,
  validateExercise,
} from "../validation";
import type { Exercise } from "../types";

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
      { id: "opt-3", value: 2 },
    ],
    validAnswers: [
      ["opt-0", "opt-1"],
      ["opt-2", "opt-3"],
    ],
    hints: [],
    instruction: "¡Consigue 4 estrellas!",
    tokenEmoji: "⭐",
    tokenNoun: "estrellas",
    tokenNounSingular: "estrella",
    ...overrides,
  };
}

function subtractionExercise(overrides: Partial<Exercise> = {}): Exercise {
  // initialQuantity 6, target 2 => remove 4.
  return {
    id: "ex-2",
    operation: "subtraction",
    world: "restas",
    subnivel: 1,
    difficulty: 1,
    target: 2,
    initialQuantity: 6,
    options: [
      { id: "opt-0", value: 1 },
      { id: "opt-1", value: 3 },
      { id: "opt-2", value: 4 },
      { id: "opt-3", value: 2 },
    ],
    validAnswers: [["opt-2"], ["opt-1", "opt-0"]],
    hints: [],
    instruction: "¡Quita hasta que queden 2 estrellas!",
    tokenEmoji: "⭐",
    tokenNoun: "estrellas",
    tokenNounSingular: "estrella",
    ...overrides,
  };
}

describe("tokenPhrase", () => {
  it("uses the singular form for count === 1", () => {
    expect(tokenPhrase(1, "estrella", "estrellas")).toBe("1 estrella");
  });
  it("uses the plural form otherwise", () => {
    expect(tokenPhrase(4, "estrella", "estrellas")).toBe("4 estrellas");
    expect(tokenPhrase(0, "estrella", "estrellas")).toBe("0 estrellas");
  });
});

describe("calculateSelectedTotal", () => {
  it("sums selected values by id, ignoring positions", () => {
    const ex = additionExercise();
    expect(calculateSelectedTotal(ex, ["opt-0", "opt-1"])).toBe(4);
    expect(calculateSelectedTotal(ex, [])).toBe(0);
  });
  it("counts duplicate-value cards independently", () => {
    const ex = additionExercise();
    expect(calculateSelectedTotal(ex, ["opt-2", "opt-3"])).toBe(4);
  });
  it("ignores ids that are not present", () => {
    const ex = additionExercise();
    expect(calculateSelectedTotal(ex, ["opt-0", "missing"])).toBe(1);
  });
});

describe("checkAnswer — additions", () => {
  const ex = additionExercise();
  it("correct when sum equals target", () => {
    expect(checkAnswer(ex, ["opt-0", "opt-1"])).toBe("correct");
  });
  it("over when sum exceeds target", () => {
    expect(checkAnswer(ex, ["opt-1", "opt-2", "opt-3"])).toBe("over");
  });
  it("incorrect when sum below target", () => {
    expect(checkAnswer(ex, ["opt-0"])).toBe("incorrect");
  });
  it("is position-independent (shuffled options, same answer)", () => {
    const shuffled = additionExercise({
      options: [
        { id: "opt-1", value: 3 },
        { id: "opt-3", value: 2 },
        { id: "opt-0", value: 1 },
        { id: "opt-2", value: 2 },
      ],
    });
    expect(checkAnswer(shuffled, ["opt-0", "opt-1"])).toBe("correct");
  });
});

describe("checkAnswer — subtractions", () => {
  const ex = subtractionExercise(); // required removal = 4
  it("correct when removed total equals initial - target", () => {
    expect(checkAnswer(ex, ["opt-2"])).toBe("correct");
    expect(checkAnswer(ex, ["opt-1", "opt-0"])).toBe("correct");
  });
  it("over when removed total exceeds required", () => {
    expect(checkAnswer(ex, ["opt-2", "opt-3"])).toBe("over");
  });
  it("incorrect when removed total below required", () => {
    expect(checkAnswer(ex, ["opt-0"])).toBe("incorrect");
  });
});

describe("validateExercise", () => {
  it("accepts a well-formed addition exercise", () => {
    expect(validateExercise(additionExercise())).toBe(true);
  });
  it("accepts a well-formed subtraction exercise", () => {
    expect(validateExercise(subtractionExercise())).toBe(true);
  });
  it("rejects when difficulty !== subnivel", () => {
    expect(validateExercise(additionExercise({ difficulty: 2 }))).toBe(false);
  });
  it("rejects duplicate option ids", () => {
    expect(
      validateExercise(
        additionExercise({
          options: [
            { id: "opt-0", value: 1 },
            { id: "opt-0", value: 3 },
          ],
          validAnswers: [["opt-0"]],
        }),
      ),
    ).toBe(false);
  });
  it("rejects more than 8 options", () => {
    const options = Array.from({ length: 9 }, (_, i) => ({
      id: `opt-${i}`,
      value: 1,
    }));
    expect(
      validateExercise(
        additionExercise({ options, target: 4, validAnswers: [["opt-0"]] }),
      ),
    ).toBe(false);
  });
  it("rejects empty validAnswers", () => {
    expect(validateExercise(additionExercise({ validAnswers: [] }))).toBe(false);
  });
  it("rejects validAnswers that do not sum to the required amount", () => {
    expect(
      validateExercise(additionExercise({ validAnswers: [["opt-0"]] })),
    ).toBe(false);
  });
  it("rejects subtraction with initialQuantity <= target", () => {
    expect(
      validateExercise(
        subtractionExercise({
          initialQuantity: 2,
          target: 2,
          validAnswers: [["opt-0"]],
        }),
      ),
    ).toBe(false);
  });
});
