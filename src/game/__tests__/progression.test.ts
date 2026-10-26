import { describe, expect, it } from "vitest";
import {
  computeStars,
  computeUnlocks,
  isWorldComplete,
  nextSubnivel,
} from "../progression";
import type { GameProgress, SubnivelProgress } from "../types";
import { WORLDS } from "../../data/levels";

function emptyProgress(): GameProgress {
  return { sumas: {}, restas: {} };
}

const completed: SubnivelProgress = {
  completed: true,
  exercisesCleared: 99,
  stars: 3,
};

const sumas = WORLDS.find((w) => w.id === "sumas")!;
const finalSumas = sumas.subniveles[sumas.subniveles.length - 1].index;

describe("computeUnlocks", () => {
  it("unlocks only sumas Isla 1 on first run", () => {
    const view = computeUnlocks(emptyProgress());
    expect(view.sumas[1].unlocked).toBe(true);
    expect(view.sumas[2].unlocked).toBe(false);
    expect(view.restas[1].unlocked).toBe(false);
  });

  it("unlocks subnivel n once n-1 is completed", () => {
    const progress = emptyProgress();
    progress.sumas[1] = completed;
    const view = computeUnlocks(progress);
    expect(view.sumas[2].unlocked).toBe(true);
    expect(view.sumas[3].unlocked).toBe(false);
  });

  it("keeps restas locked until the final sumas Isla is completed", () => {
    const progress = emptyProgress();
    // Complete all sumas except the final one.
    for (const s of sumas.subniveles) {
      if (s.index !== finalSumas) progress.sumas[s.index] = completed;
    }
    expect(computeUnlocks(progress).restas[1].unlocked).toBe(false);

    progress.sumas[finalSumas] = completed;
    expect(computeUnlocks(progress).restas[1].unlocked).toBe(true);
  });

  it("is idempotent", () => {
    const progress = emptyProgress();
    progress.sumas[1] = completed;
    const a = computeUnlocks(progress);
    const b = computeUnlocks(progress);
    expect(a).toEqual(b);
  });
});

describe("isWorldComplete / nextSubnivel", () => {
  it("reports world completion", () => {
    const progress = emptyProgress();
    for (const s of sumas.subniveles) progress.sumas[s.index] = completed;
    expect(isWorldComplete(progress, "sumas")).toBe(true);
    expect(isWorldComplete(emptyProgress(), "sumas")).toBe(false);
  });

  it("returns the next subnivel or null at the end", () => {
    expect(nextSubnivel("sumas", 1)).toBe(2);
    expect(nextSubnivel("sumas", finalSumas)).toBeNull();
  });
});

describe("computeStars", () => {
  it("awards 3 stars at <= 0.5 hints/exercise", () => {
    expect(computeStars(2, 4)).toBe(3); // 0.5
    expect(computeStars(0, 4)).toBe(3);
  });
  it("awards 2 stars at <= 1.5 hints/exercise", () => {
    expect(computeStars(6, 4)).toBe(2); // 1.5
  });
  it("awards 1 star above 1.5 hints/exercise", () => {
    expect(computeStars(10, 4)).toBe(1);
  });
  it("is never zero even with many hints", () => {
    expect(computeStars(1000, 4)).toBe(1);
  });
  it("never divides by zero", () => {
    expect(computeStars(5, 0)).toBe(1);
  });
});
