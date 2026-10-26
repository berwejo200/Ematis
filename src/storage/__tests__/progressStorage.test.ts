import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  defaultPersistedState,
  loadState,
  saveState,
} from "../progressStorage";
import type { PersistedState } from "../../game/types";
import { getExerciseCount } from "../../data/levels";

describe("progressStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns null when nothing is stored (fresh start)", () => {
    expect(loadState()).toBeNull();
  });

  it("round-trips save then load (with backfill of every subnivel)", () => {
    const state: PersistedState = {
      version: STORAGE_VERSION,
      playerName: "Leo",
      progress: {
        sumas: { 1: { completed: true, exercisesCleared: 4, stars: 3 } },
        restas: {},
      },
      audioEnabled: false,
    };
    saveState(state);
    const loaded = loadState();

    expect(loaded).not.toBeNull();
    expect(loaded!.playerName).toBe("Leo");
    expect(loaded!.audioEnabled).toBe(false);
    expect(loaded!.version).toBe(STORAGE_VERSION);
    // The saved subnivel survives.
    expect(loaded!.progress.sumas[1]).toEqual({
      completed: true,
      exercisesCleared: 4,
      stars: 3,
    });
    // Missing subniveles are backfilled with defaults.
    expect(loaded!.progress.sumas[2]).toEqual({
      completed: false,
      exercisesCleared: 0,
      stars: 0,
    });
    expect(loaded!.progress.restas[1]).toEqual({
      completed: false,
      exercisesCleared: 0,
      stars: 0,
    });
  });

  it("clears the key and returns null on corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadState()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("rejects a bad shape (missing/typed fields) and clears the key", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, playerName: 123, progress: {}, audioEnabled: true }),
    );
    expect(loadState()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("rejects when progress.sumas/restas are not objects", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        playerName: "Ana",
        progress: { sumas: "nope", restas: {} },
        audioEnabled: true,
      }),
    );
    expect(loadState()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("discards an older version with no migration path", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION - 1,
        playerName: "Ana",
        progress: { sumas: {}, restas: {} },
        audioEnabled: true,
      }),
    );
    expect(loadState()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("handles a storage quota/throw on save without crashing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

    expect(() => saveState(defaultPersistedState())).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);

    setItem.mockRestore();
  });

  it("clamps out-of-range exercisesCleared and stars on load", () => {
    const sumasCount = getExerciseCount("sumas", 1);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        playerName: "Max",
        progress: {
          sumas: { 1: { completed: true, exercisesCleared: 999, stars: 9 } },
          restas: {},
        },
        audioEnabled: true,
      }),
    );
    const loaded = loadState();
    expect(loaded!.progress.sumas[1].exercisesCleared).toBe(sumasCount);
    expect(loaded!.progress.sumas[1].stars).toBe(3);
  });

  it("does NOT relock a completed later level when an earlier entry is missing", () => {
    // Only subnivel 3 saved (1 and 2 absent): backfill fills 1 and 2 with defaults,
    // but the completed fact of 3 is preserved — no relock of what was cleared.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        playerName: "Max",
        progress: {
          sumas: { 3: { completed: true, exercisesCleared: 5, stars: 2 } },
          restas: {},
        },
        audioEnabled: true,
      }),
    );
    const loaded = loadState();
    expect(loaded!.progress.sumas[3].completed).toBe(true);
    expect(loaded!.progress.sumas[1].completed).toBe(false);
    expect(loaded!.progress.sumas[2].completed).toBe(false);
  });

  it("never persists an `unlocked` flag", () => {
    saveState(defaultPersistedState());
    const raw = localStorage.getItem(STORAGE_KEY)!;
    expect(raw).not.toContain("unlocked");
  });
});
