// Centralized progression + difficulty configuration. No React, no DOM, no magic
// numbers in components. See design §4.

import type { WorldConfig, WorldId } from "../game/types";

/** A Spanish-correct counting token (emoji + noun pair) for an exercise. */
export interface TokenSpec {
  emoji: string;
  singular: string;
  plural: string;
}

/** Token table — chosen per exercise by the generators. See design §3.4. */
export const TOKENS: TokenSpec[] = [
  { emoji: "⭐", singular: "estrella", plural: "estrellas" },
  { emoji: "🍎", singular: "manzana", plural: "manzanas" },
  { emoji: "🚀", singular: "cohete", plural: "cohetes" },
];

/** UI constants. Values belong here, never inline in components. */
export const UI = {
  /** Minimum touch target in CSS px (iPad/Safari a11y requirement). */
  MIN_TOUCH_TARGET_PX: 60,
  /** Hard cap on options per exercise (keeps subset-sum enumeration trivial). */
  MAX_OPTIONS: 8,
  /** Bounded fallback timer (ms) that releases transitionLock after a celebration. */
  CELEBRATION_FALLBACK_MS: 1200,
} as const;

/** Storage key + version used by progressStorage. */
export const STORAGE_KEY = "ematis.v1";
export const STORAGE_VERSION = 1;

/**
 * World «El mundo de las sumas». Every row satisfies minResult >= minAddends
 * (Isla 5 minResult raised to 3 so it is >= minAddends 3). See design §4.
 */
const SUMAS: WorldConfig = {
  id: "sumas",
  operation: "addition",
  title: "El mundo de las sumas",
  subniveles: [
    {
      index: 1,
      exerciseCount: 4,
      label: "Isla 1",
      params: {
        operation: "addition",
        minResult: 2,
        maxResult: 3,
        minOptions: 3,
        maxOptions: 4,
        minAddends: 2,
        maxAddends: 2,
        maxInitial: 0,
        strongVisuals: true,
      },
    },
    {
      index: 2,
      exerciseCount: 5,
      label: "Isla 2",
      params: {
        operation: "addition",
        minResult: 2,
        maxResult: 5,
        minOptions: 4,
        maxOptions: 5,
        minAddends: 2,
        maxAddends: 2,
        maxInitial: 0,
        strongVisuals: true,
      },
    },
    {
      index: 3,
      exerciseCount: 5,
      label: "Isla 3",
      params: {
        operation: "addition",
        minResult: 2,
        maxResult: 5,
        minOptions: 5,
        maxOptions: 6,
        minAddends: 2,
        maxAddends: 2,
        maxInitial: 0,
        strongVisuals: false,
      },
    },
    {
      index: 4,
      exerciseCount: 6,
      label: "Isla 4",
      params: {
        operation: "addition",
        minResult: 2,
        maxResult: 10,
        minOptions: 5,
        maxOptions: 6,
        minAddends: 2,
        maxAddends: 2,
        maxInitial: 0,
        strongVisuals: false,
      },
    },
    {
      index: 5,
      exerciseCount: 6,
      label: "Isla 5",
      params: {
        operation: "addition",
        minResult: 3,
        maxResult: 10,
        minOptions: 6,
        maxOptions: 7,
        minAddends: 3,
        maxAddends: 4,
        maxInitial: 0,
        strongVisuals: false,
      },
    },
    {
      index: 6,
      exerciseCount: 8,
      label: "Isla 6 (repaso)",
      params: {
        operation: "addition",
        minResult: 2,
        maxResult: 10,
        minOptions: 5,
        maxOptions: 7,
        minAddends: 2,
        maxAddends: 4,
        maxInitial: 0,
        strongVisuals: false,
      },
    },
  ],
};

/**
 * World «El mundo de las restas». Each maxInitial = maxResult + maxAddends so a
 * removal always fits strictly below the cap. See design §4.
 */
const RESTAS: WorldConfig = {
  id: "restas",
  operation: "subtraction",
  title: "El mundo de las restas",
  subniveles: [
    {
      index: 1,
      exerciseCount: 4,
      label: "Puerta 1",
      params: {
        operation: "subtraction",
        minResult: 0,
        maxResult: 3,
        minOptions: 3,
        maxOptions: 4,
        minAddends: 1,
        maxAddends: 1,
        maxInitial: 4,
        strongVisuals: true,
      },
    },
    {
      index: 2,
      exerciseCount: 5,
      label: "Puerta 2",
      params: {
        operation: "subtraction",
        minResult: 0,
        maxResult: 5,
        minOptions: 4,
        maxOptions: 5,
        minAddends: 1,
        maxAddends: 1,
        maxInitial: 6,
        strongVisuals: true,
      },
    },
    {
      index: 3,
      exerciseCount: 5,
      label: "Puerta 3",
      params: {
        operation: "subtraction",
        minResult: 0,
        maxResult: 5,
        minOptions: 5,
        maxOptions: 6,
        minAddends: 1,
        maxAddends: 2,
        maxInitial: 7,
        strongVisuals: false,
      },
    },
    {
      index: 4,
      exerciseCount: 6,
      label: "Puerta 4",
      params: {
        operation: "subtraction",
        minResult: 0,
        maxResult: 10,
        minOptions: 5,
        maxOptions: 6,
        minAddends: 1,
        maxAddends: 2,
        maxInitial: 12,
        strongVisuals: false,
      },
    },
    {
      index: 5,
      exerciseCount: 8,
      label: "Puerta 5 (repaso)",
      params: {
        operation: "subtraction",
        minResult: 0,
        maxResult: 10,
        minOptions: 5,
        maxOptions: 7,
        minAddends: 1,
        maxAddends: 2,
        maxInitial: 12,
        strongVisuals: false,
      },
    },
  ],
};

export const WORLDS: WorldConfig[] = [SUMAS, RESTAS];

/** Look up a world config by id. */
export function getWorld(worldId: WorldId): WorldConfig | undefined {
  return WORLDS.find((w) => w.id === worldId);
}

/** Read how many exercises are needed to clear a subnivel (1-based index). */
export function getExerciseCount(worldId: WorldId, subnivel: number): number {
  const world = getWorld(worldId);
  const config = world?.subniveles.find((s) => s.index === subnivel);
  return config?.exerciseCount ?? 0;
}
