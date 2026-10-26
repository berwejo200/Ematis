// Adventure map. Reads state.progressView. Two worlds: islands (sumas) / doors (restas).
// Each subnivel badge shows available / completed / locked via icon + label + shape,
// NOT color alone. Locked stays fully visible with a lock icon. See design §6.1.

import type { Dispatch } from "react";
import { Lock, Play, Star } from "lucide-react";
import type { GameAction, GameProgressView, SubnivelView, WorldId } from "../game/types";
import { WORLDS } from "../data/levels";
import { Mascot } from "../components/Mascot";
import { UI } from "../data/levels";

export interface WorldMapScreenProps {
  dispatch: Dispatch<GameAction>;
  progressView: GameProgressView;
  playerName: string;
}

type Status = "available" | "completed" | "locked";

function statusOf(view: SubnivelView): Status {
  if (view.completed) return "completed";
  if (view.unlocked) return "available";
  return "locked";
}

/** One subnivel badge. State conveyed by icon + label + shape, never color alone. */
function SubnivelBadge({
  worldId,
  index,
  label,
  view,
  shape,
  onSelect,
}: {
  worldId: WorldId;
  index: number;
  label: string;
  view: SubnivelView;
  /** "island" (rounded) for sumas, "door" (tall) for restas. */
  shape: "island" | "door";
  onSelect: (world: WorldId, subnivel: number) => void;
}) {
  const status = statusOf(view);
  const locked = status === "locked";

  const shapeClass =
    shape === "island"
      ? "rounded-full aspect-square"
      : "rounded-card aspect-[3/4]";

  const toneClass =
    status === "completed"
      ? "bg-verde text-white"
      : status === "available"
        ? "bg-amarillo text-slate-800 animate-pulse"
        : "bg-slate-200 text-slate-500";

  return (
    <button
      type="button"
      aria-label={`${label}: ${
        status === "completed"
          ? "completado"
          : status === "available"
            ? "disponible"
            : "bloqueado"
      }`}
      aria-disabled={locked}
      disabled={locked}
      onClick={() => {
        if (!locked) onSelect(worldId, index);
      }}
      style={{ minWidth: UI.MIN_TOUCH_TARGET_PX, minHeight: UI.MIN_TOUCH_TARGET_PX }}
      className={[
        "relative flex w-24 select-none flex-col items-center justify-center gap-1 p-3 shadow-suave transition-transform sm:w-28",
        "active:scale-95 disabled:active:scale-100",
        shapeClass,
        toneClass,
      ].join(" ")}
    >
      <span aria-hidden="true">
        {status === "completed" ? (
          <Star size={28} strokeWidth={2.5} fill="currentColor" />
        ) : status === "available" ? (
          <Play size={28} strokeWidth={2.5} fill="currentColor" />
        ) : (
          <Lock size={28} strokeWidth={2.5} />
        )}
      </span>
      <span className="text-sm font-extrabold leading-tight">{label}</span>
      {status === "completed" ? (
        <span className="text-xs font-bold">
          {"⭐".repeat(Math.max(1, view.stars))}
        </span>
      ) : null}
    </button>
  );
}

export function WorldMapScreen({
  dispatch,
  progressView,
  playerName,
}: WorldMapScreenProps) {
  const onSelect = (world: WorldId, subnivel: number) =>
    dispatch({ type: "SELECT_SUBNIVEL", world, subnivel });

  return (
    <main className="flex min-h-[100dvh] flex-col items-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-black text-azul sm:text-4xl">
          Mapa de aventuras
        </h1>
        <Mascot
          mood="happy"
          message={
            playerName
              ? `¡Elige una aventura, ${playerName}!`
              : "¡Elige una aventura!"
          }
        />
      </div>

      {WORLDS.map((world) => (
        <section
          key={world.id}
          className="flex w-full max-w-4xl flex-col items-center gap-3"
        >
          <h2 className="text-2xl font-extrabold text-slate-700">
            {world.title}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {world.subniveles.map((sub) => {
              const view =
                progressView[world.id][sub.index] ??
                ({ completed: false, exercisesCleared: 0, stars: 0, unlocked: false } as SubnivelView);
              return (
                <SubnivelBadge
                  key={sub.index}
                  worldId={world.id}
                  index={sub.index}
                  label={sub.label}
                  view={view}
                  shape={world.id === "sumas" ? "island" : "door"}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}

export default WorldMapScreen;
