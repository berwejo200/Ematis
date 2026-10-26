// Top-level orchestrator: selects the screen component from state.screen, wires
// useGameState + useGameProgress + useSound, generates exercises OUTSIDE the reducer and
// injects them via LOAD_EXERCISE / NEXT_EXERCISE, and drives the Celebration fallback that
// releases the transition lock. See design §5.1/§6.

import { useCallback, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useGameState } from "../hooks/useGameState";
import { useGameProgress } from "../hooks/useGameProgress";
import { useSound } from "../hooks/useSound";
import { generateExercise, signatureOf } from "../game/exerciseGenerator";
import { getExerciseCount, getWorld } from "../data/levels";
import type { GenerationParams, WorldId } from "../game/types";
import { Mascot } from "../components/Mascot";
import { PrimaryButton } from "../components/PrimaryButton";
import { Celebration } from "../components/Celebration";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { WorldMapScreen } from "../screens/WorldMapScreen";
import { ExerciseScreen } from "../screens/ExerciseScreen";
import { LevelCompleteScreen } from "../screens/LevelCompleteScreen";

/** Read the GenerationParams for a world/subnivel from levels config. */
function paramsFor(world: WorldId, subnivel: number): GenerationParams | null {
  const config = getWorld(world);
  const sub = config?.subniveles.find((s) => s.index === subnivel);
  return sub ? sub.params : null;
}

export function App() {
  const [state, dispatch] = useGameState();
  const { hasResumableSave, savedPlayerName } = useGameProgress(state, dispatch);
  const { play } = useSound(state.audioEnabled);

  // Anti-repeat: remember the previous exercise signature for the current subnivel.
  const prevSignatureRef = useRef<string | undefined>(undefined);

  // Generate + inject the first exercise when entering a subnivel with none loaded.
  useEffect(() => {
    if (state.screen !== "exercise" || state.currentExercise !== null) return;
    const world = state.selectedWorld;
    const subnivel = state.selectedSubnivel;
    if (world === null || subnivel === null) return;
    const params = paramsFor(world, subnivel);
    if (!params) return;

    prevSignatureRef.current = undefined;
    const exercise = generateExercise(world, subnivel, params);
    prevSignatureRef.current = signatureOf(exercise);
    dispatch({ type: "LOAD_EXERCISE", exercise });
  }, [
    state.screen,
    state.currentExercise,
    state.selectedWorld,
    state.selectedSubnivel,
    dispatch,
  ]);

  // Play a short sound when a celebration begins (user gesture already happened on the tap).
  useEffect(() => {
    if (state.celebration === "none") return;
    play(state.celebration === "exercise" ? "success" : "celebration");
  }, [state.celebration, play]);

  // Advance to the next exercise or finish the subnivel. The hook (here) decides the payload.
  const onNext = useCallback(() => {
    const world = state.selectedWorld;
    const subnivel = state.selectedSubnivel;
    if (world === null || subnivel === null) return;
    const exerciseCount = getExerciseCount(world, subnivel);

    if (state.exercisesClearedThisSubnivel >= exerciseCount) {
      // Subnivel finished.
      dispatch({ type: "NEXT_EXERCISE", exercise: null });
      dispatch({ type: "COMPLETE_SUBNIVEL", exerciseCount });
      dispatch({ type: "UNLOCK_NEXT" });
      return;
    }

    const params = paramsFor(world, subnivel);
    if (!params) return;
    const exercise = generateExercise(
      world,
      subnivel,
      params,
      Math.random,
      prevSignatureRef.current,
    );
    prevSignatureRef.current = signatureOf(exercise);
    dispatch({ type: "NEXT_EXERCISE", exercise });
  }, [
    state.selectedWorld,
    state.selectedSubnivel,
    state.exercisesClearedThisSubnivel,
    dispatch,
  ]);

  // Celebration completion releases the transition lock (idempotent).
  const onCelebrationDone = useCallback(() => {
    dispatch({ type: "CLEAR_CELEBRATION" });
  }, [dispatch]);

  const renderScreen = () => {
    switch (state.screen) {
      case "welcome":
        return (
          <WelcomeScreen
            dispatch={dispatch}
            hasResumableSave={hasResumableSave}
            savedPlayerName={savedPlayerName}
          />
        );
      case "map":
        return (
          <WorldMapScreen
            dispatch={dispatch}
            progressView={state.progressView}
            playerName={state.playerName}
          />
        );
      case "intro":
        return <IntroScreen onStart={() => dispatch({ type: "SKIP_INTRO" })} />;
      case "exercise":
        return <ExerciseScreen state={state} dispatch={dispatch} onNext={onNext} />;
      case "levelComplete":
        return (
          <LevelCompleteScreen
            state={state}
            dispatch={dispatch}
            worldComplete={false}
          />
        );
      case "worldComplete":
        return (
          <LevelCompleteScreen
            state={state}
            dispatch={dispatch}
            worldComplete
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Audio on/off toggle (persisted via audioEnabled); never autoplays. */}
      <div className="fixed right-3 top-3 z-40">
        <PrimaryButton
          tone="secondary"
          ariaLabel={state.audioEnabled ? "Desactivar sonido" : "Activar sonido"}
          onClick={() =>
            dispatch({ type: "SET_AUDIO", enabled: !state.audioEnabled })
          }
          icon={
            state.audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />
          }
        >
          {state.audioEnabled ? "Sonido" : "Silencio"}
        </PrimaryButton>
      </div>

      {renderScreen()}

      <Celebration tier={state.celebration} onDone={onCelebrationDone} />
    </div>
  );
}

/** A very short, skippable activity intro. See design §6.1. */
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6 text-center">
      <Mascot
        size="lg"
        mood="think"
        message="Toca las cajas para conseguir el número de arriba. ¡Vamos a contar juntos!"
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PrimaryButton tone="primary" onClick={onStart}>
          ¡Empezar!
        </PrimaryButton>
        <PrimaryButton tone="secondary" onClick={onStart}>
          Saltar
        </PrimaryButton>
      </div>
    </main>
  );
}

export default App;
