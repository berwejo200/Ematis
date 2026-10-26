import { describe, expect, it } from "vitest";
import { generateExercise, signatureOf } from "../exerciseGenerator";
import { WORLDS } from "../../data/levels";
import { seededRng } from "./seededRng";

const sumas = WORLDS.find((w) => w.id === "sumas")!;
const restas = WORLDS.find((w) => w.id === "restas")!;

describe("generateExercise", () => {
  it("returns a valid exercise for a sumas subnivel", () => {
    const rng = seededRng(1);
    const sub = sumas.subniveles[2];
    const ex = generateExercise("sumas", sub.index, sub.params, rng);
    expect(ex.operation).toBe("addition");
    expect(ex.validAnswers.length).toBeGreaterThan(0);
  });

  it("returns a valid exercise for a restas subnivel", () => {
    const rng = seededRng(2);
    const sub = restas.subniveles[2];
    const ex = generateExercise("restas", sub.index, sub.params, rng);
    expect(ex.operation).toBe("subtraction");
    expect(ex.validAnswers.length).toBeGreaterThan(0);
  });

  it("regenerates away from a given previous signature when the space is large enough", () => {
    const rng = seededRng(42);
    const sub = sumas.subniveles[4]; // Isla 5 — large space
    const first = generateExercise("sumas", sub.index, sub.params, rng);
    const sig = signatureOf(first);
    // Generate several more avoiding the first signature.
    for (let i = 0; i < 20; i++) {
      const next = generateExercise("sumas", sub.index, sub.params, rng, sig);
      expect(signatureOf(next)).not.toBe(sig);
    }
  });

  it("produces globally unique ids across a tight batch loop", () => {
    const rng = seededRng(7);
    const ids = new Set<string>();
    const sub = sumas.subniveles[1];
    for (let i = 0; i < 300; i++) {
      const ex = generateExercise("sumas", sub.index, sub.params, rng);
      expect(ids.has(ex.id)).toBe(false);
      ids.add(ex.id);
    }
  });

  it("recovers to a valid exercise even under many seeds (discard+regenerate)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = seededRng(seed);
      const sub = restas.subniveles[0];
      const ex = generateExercise("restas", sub.index, sub.params, rng);
      // A valid exercise always has at least one solution.
      expect(ex.validAnswers.length).toBeGreaterThan(0);
    }
  });
});
