// Loads persisted progress on mount (RESTORE_PROGRESS with the repaired state), and
// persists on every change to name/progress/audio via an effect. Also reports whether
// a resumable save exists for the Welcome screen. See design §5.2.

import { useEffect, useRef, useState } from "react";
import type { Dispatch } from "react";
import type { GameAction, GameState } from "../game/types";
import {
  STORAGE_VERSION,
  loadState,
  saveState,
} from "../storage/progressStorage";

export interface UseGameProgressResult {
  /** True when a non-null save with a non-empty trimmed playerName exists (Welcome «Continuar»). */
  hasResumableSave: boolean;
  /** The saved player name (trimmed, already-capped) when a resumable save exists, else "". */
  savedPlayerName: string;
}

/**
 * Wires persistence to the reducer. Call with the current state + dispatch.
 * - On mount: loadState() -> dispatch RESTORE_PROGRESS with the repaired state (if any).
 * - On change to playerName/progress/audioEnabled: saveState with only the persisted shape.
 */
export function useGameProgress(
  state: GameState,
  dispatch: Dispatch<GameAction>,
): UseGameProgressResult {
  const [hasResumableSave, setHasResumableSave] = useState(false);
  const [savedPlayerName, setSavedPlayerName] = useState("");
  const restored = useRef(false);

  // Load once on mount.
  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      dispatch({ type: "RESTORE_PROGRESS", payload: loaded });
      if (loaded.playerName.trim().length > 0) {
        setHasResumableSave(true);
        setSavedPlayerName(loaded.playerName.trim());
      }
    }
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change to the persisted slice (skip the first run before restore).
  useEffect(() => {
    if (!restored.current) return;
    saveState({
      version: STORAGE_VERSION,
      playerName: state.playerName,
      progress: state.progress,
      audioEnabled: state.audioEnabled,
    });
  }, [state.playerName, state.progress, state.audioEnabled]);

  return { hasResumableSave, savedPlayerName };
}
