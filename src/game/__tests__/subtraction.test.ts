import { describe, expect, it } from "vitest";
import { generateSubtractionExercise } from "../subtraction";
import { calculateSelectedTotal, checkAnswer, validateExercise } from "../validation";
import { WORLDS } from "../../data/levels";
import { seededRng } from "./seededRng";

const restas = WORLDS.find((w) => w.id === "restas")!;

describe("generateSubtractionExercise", () => {
  it("produces valid initial quantities and solvable removals", () => {
    const rng = seededRng(1);
    const sub = restas.subniveles[0];
    const ex = generateSubtractionExercise(sub.params, sub.index, rng);
    expect(ex.operation).toBe("subtraction");
    expect(ex.initialQuantity).not.toBeNull();
    const removeTotal = (ex.initialQuantity ?? 0) - ex.target;
    for (const set of ex.validAnswers) {
      expect(calculateSelectedTotal(ex, set)).toBe(removeTotal);
    }
  });

  it("initialQuantity >= target + 1 across 1000 generated per row; no negatives; every option <= initialQuantity", () => {
    for (const sub of restas.subniveles) {
      for (let seed = 0; seed < 1000; seed++) {
        const rng = seededRng(seed + sub.index * 100000);
        const ex = generateSubtractionExercise(sub.params, sub.index, rng);
        const initial = ex.initialQuantity ?? 0;
        expect(initial).toBeGreaterThanOrEqual(ex.target + 1);
        expect(ex.target).toBeGreaterThanOrEqual(0);
        for (const o of ex.options) {
          expect(o.value).toBeGreaterThanOrEqual(0);
          expect(o.value).toBeLessThanOrEqual(initial);
        }
        expect(ex.validAnswers.length).toBeGreaterThan(0);
        expect(validateExercise(ex, sub.params)).toBe(true);
      }
    }
  });

  it("checkAnswer over/under/equal on removed total", () => {
    const rng = seededRng(5);
    const sub = restas.subniveles[2];
    const ex = generateSubtractionExercise(sub.params, sub.index, rng);
    const required = (ex.initialQuantity ?? 0) - ex.target;
    expect(checkAnswer(ex, ex.validAnswers[0])).toBe("correct");
    expect(required).toBeGreaterThan(0);
  });

  it("special-cases target === 0 instruction", () => {
    let found = false;
    for (let seed = 0; seed < 2000 && !found; seed++) {
      const rng = seededRng(seed);
      const sub = restas.subniveles[0]; // remaining 0..3
      const ex = generateSubtractionExercise(sub.params, sub.index, rng);
      if (ex.target === 0) {
        found = true;
        expect(ex.instruction).toBe("¡Quítalas todas!");
      }
    }
    expect(found).toBe(true);
  });
});
