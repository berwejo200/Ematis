// Exercise screen: composes ExerciseBoard and wires SELECT/DESELECT/CHECK/HINT/NEXT.
// Shows the mascot with success/retry lines (random pick) and «Volver al mapa».
// Over-hint/rejected copy live in ExerciseBoard, chosen per operation. See design §6.

import { useMemo } from "react";
import type { Dispatch } from "react";
import type { GameAction, GameState } from "../game/types";
import { Mascot } from "../components/Mascot";
import { PrimaryButton } from "../components/PrimaryButton";
import { ExerciseBoard } from "../components/ExerciseBoard";

export interface ExerciseScreenProps {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  /** Supplied by App: generates + injects the next exercise (or completes the subnivel). */
  onNext: () => void;
}

const SUCCESS_LINES = [
  "¡Lo has conseguido!",
  "¡Muy bien!",
  "¡Has encontrado la solución!",
  "¡Una estrella más!",
  "¡Vamos a por el siguiente reto!",
];

const RETRY_LINES = [
  "¡Casi! Vamos a contar otra vez",
  "¿Qué pasa si quitamos una caja?",
  "Vamos a intentarlo juntos",
];

/** Pick a stable line for the current validation phase from a pool. */
function pick(pool: string[], seed: number): string {
  return pool[seed % pool.length];
}

export function ExerciseScreen({ state, dispatch, onNext }: ExerciseScreenProps) {
  const exercise = state.currentExercise;

  // Stable per-exercise seed so the chosen mascot line does not flicker on re-render.
  const seed = useMemo(() => {
    const n = exercise ? Number.parseInt(exercise.id.replace(/\D/g, ""), 10) : 0;
    return Number.isFinite(n) ? n : 0;
  }, [exercise]);

  if (!exercise) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center p-6">
        <Mascot mood="think" message="Preparando el siguiente reto…" />
      </main>
    );
  }

  const hintsExhausted =
    state.currentExerciseHintIndex >= exercise.hints.length;

  const onToggleOption = (optionId: string) => {
    if (state.selectedOptionIds.includes(optionId)) {
      dispatch({ type: "DESELECT_OPTION", optionId });
    } else {
      dispatch({ type: "SELECT_OPTION", optionId });
    }
  };

  // Mascot line reflects the current phase (never punishing).
  let mascotMood: "happy" | "cheer" | "gentle" = "happy";
  let mascotMessage = exercise.instruction;
  if (state.validation === "correct") {
    mascotMood = "cheer";
    mascotMessage = pick(SUCCESS_LINES, seed);
  } else if (state.validation === "incorrect") {
    mascotMood = "gentle";
    mascotMessage = pick(RETRY_LINES, seed);
  }

  const showContinue = state.validation === "correct";

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-between gap-4 p-4 sm:p-6">
      <div className="flex w-full items-center justify-between">
        <PrimaryButton
          tone="secondary"
          onClick={() => dispatch({ type: "GO_TO_MAP" })}
          disabled={state.transitionLock}
        >
          Volver al mapa
        </PrimaryButton>
        <Mascot mood={mascotMood} message={mascotMessage} />
      </div>

      <ExerciseBoard
        exercise={exercise}
        selectedOptionIds={state.selectedOptionIds}
        provisionalTotal={state.provisionalTotal}
        validation={state.validation}
        rejectedOptionId={state.rejectedOptionId}
        activeHint={state.activeHint}
        hintsExhausted={hintsExhausted}
        transitionLock={state.transitionLock}
        onToggleOption={onToggleOption}
        onCheck={() => dispatch({ type: "CHECK_ANSWER" })}
        onHint={() => dispatch({ type: "SHOW_HINT" })}
      />

      <div className="min-h-[4rem]">
        {showContinue ? (
          <PrimaryButton tone="success" onClick={onNext}>
            ¡Vamos a por el siguiente reto!
          </PrimaryButton>
        ) : null}
      </div>
    </main>
  );
}

export default ExerciseScreen;
