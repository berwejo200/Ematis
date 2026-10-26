import { describe, expect, it } from "vitest";
import { generateAdditionExercise } from "../addition";
import { calculateSelectedTotal, checkAnswer, validateExercise } from "../validation";
import { WORLDS } from "../../data/levels";
import { seededRng } from "./seededRng";

const sumas = WORLDS.find((w) => w.id === "sumas")!;

describe("generateAdditionExercise", () => {
  it("produces a solvable exercise whose validAnswers sum to the target", () => {
    const rng = seededRng(1);
    const sub = sumas.subniveles[0];
    const ex = generateAdditionExercise(sub.params, sub.index, rng);
    expect(ex.operation).toBe("addition");
    expect(ex.initialQuantity).toBeNull();
    for (const set of ex.validAnswers) {
      expect(calculateSelectedTotal(ex, set)).toBe(ex.target);
    }
  });

  it("accepts a single valid solution", () => {
    const rng = seededRng(2);
    const sub = sumas.subniveles[0];
    const ex = generateAdditionExercise(sub.params, sub.index, rng);
    expect(checkAnswer(ex, ex.validAnswers[0])).toBe("correct");
  });

  it("accepts MULTIPLE distinct valid solutions when they exist", () => {
    // target 4 with options 1,3,2,2 has two distinct solutions.
    let found = false;
    for (let seed = 0; seed < 500 && !found; seed++) {
      const rng = seededRng(seed);
      const sub = sumas.subniveles[3]; // Isla 4, wider range
      const ex = generateAdditionExercise(sub.params, sub.index, rng);
      if (ex.validAnswers.length >= 2) {
        found = true;
        for (const set of ex.validAnswers) {
          expect(checkAnswer(ex, set)).toBe("correct");
        }
      }
    }
    expect(found).toBe(true);
  });

  it("detects over-target selections", () => {
    const rng = seededRng(3);
    const sub = sumas.subniveles[0];
    const ex = generateAdditionExercise(sub.params, sub.index, rng);
    const allIds = ex.options.map((o) => o.id);
    const total = calculateSelectedTotal(ex, allIds);
    if (total > ex.target) {
      expect(checkAnswer(ex, allIds)).toBe("over");
    }
  });

  it("Finding-1 invariant: every sumas row, 1000 exercises satisfy target>=minAddends and non-empty validAnswers", () => {
    for (const sub of sumas.subniveles) {
      for (let seed = 0; seed < 1000; seed++) {
        const rng = seededRng(seed + sub.index * 100000);
        const ex = generateAdditionExercise(sub.params, sub.index, rng);
        expect(ex.target).toBeGreaterThanOrEqual(sub.params.minAddends);
        expect(ex.validAnswers.length).toBeGreaterThan(0);
        expect(validateExercise(ex, sub.params)).toBe(true);
      }
    }
  });

  it("assigns unique option ids and no negative values", () => {
    for (const sub of sumas.subniveles) {
      for (let seed = 0; seed < 50; seed++) {
        const rng = seededRng(seed * 7 + sub.index);
        const ex = generateAdditionExercise(sub.params, sub.index, rng);
        const ids = ex.options.map((o) => o.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const o of ex.options) expect(o.value).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
