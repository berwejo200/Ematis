// Level / world completion screen. Shows the child's name, stars earned, a varied positive
// message, the next unlocked challenge from progressView, and «Continuar» + «Volver al mapa».
// The worldComplete variant is the flashiest and names the newly unlocked world. See design §6.1.

import type { Dispatch } from "react";
import { Star } from "lucide-react";
import type { GameAction, GameState, WorldId } from "../game/types";
import { WORLDS, getWorld } from "../data/levels";
import { nextSubnivel } from "../game/progression";
import { Mascot } from "../components/Mascot";
import { PrimaryButton } from "../components/PrimaryButton";

export interface LevelCompleteScreenProps {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  /** When true, render the flashier world-complete variant. */
  worldComplete: boolean;
}

const MESSAGES = [
  "¡Lo has hecho genial!",
  "¡Eres un campeón de los números!",
  "¡Cada vez sumas mejor!",
  "¡Sigue así!",
];

/** Human-friendly label for the next unlocked challenge, if any. */
function nextChallengeLabel(
  world: WorldId,
  subnivel: number,
): string | null {
  const next = nextSubnivel(world, subnivel);
  if (next !== null) {
    const config = getWorld(world);
    const sub = config?.subniveles.find((s) => s.index === next);
    return sub ? sub.label : null;
  }
  // No next subnivel in this world: point to the next world's first subnivel.
  const idx = WORLDS.findIndex((w) => w.id === world);
  const following = WORLDS[idx + 1];
  if (following) {
    return `${following.title} · ${following.subniveles[0].label}`;
  }
  return null;
}

export function LevelCompleteScreen({
  state,
  dispatch,
  worldComplete,
}: LevelCompleteScreenProps) {
  const world = state.selectedWorld;
  const subnivel = state.selectedSubnivel;

  const stars =
    world !== null && subnivel !== null
      ? (state.progress[world][subnivel]?.stars ?? 1)
      : 1;

  const nextLabel =
    world !== null && subnivel !== null
      ? nextChallengeLabel(world, subnivel)
      : null;

  const seed = subnivel ?? 0;
  const message = worldComplete
    ? "¡Has completado un mundo entero!"
    : MESSAGES[seed % MESSAGES.length];

  const greeting = state.playerName
    ? `¡Enhorabuena, ${state.playerName}!`
    : "¡Enhorabuena!";

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-black text-verde sm:text-5xl">{greeting}</h1>

      <div className="flex items-center gap-2" aria-label={`${stars} estrellas`}>
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={48}
            strokeWidth={2.5}
            className={i <= stars ? "text-amarillo" : "text-slate-300"}
            fill={i <= stars ? "currentColor" : "none"}
            aria-hidden="true"
          />
        ))}
      </div>

      <Mascot mood="cheer" size="lg" message={message} />

      {nextLabel ? (
        <p className="text-xl font-bold text-slate-700">
          {worldComplete
            ? `Nueva aventura desbloqueada: ${nextLabel}`
            : `Siguiente reto: ${nextLabel}`}
        </p>
      ) : (
        <p className="text-xl font-bold text-slate-700">
          ¡Has terminado todas las aventuras!
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <PrimaryButton
          tone="primary"
          onClick={() => dispatch({ type: "GO_TO_MAP" })}
        >
          Continuar
        </PrimaryButton>
        <PrimaryButton
          tone="secondary"
          onClick={() => dispatch({ type: "GO_TO_MAP" })}
        >
          Volver al mapa
        </PrimaryButton>
      </div>
    </main>
  );
}

export default LevelCompleteScreen;
