// Welcome / profile screen. Title «¡La aventura de los números!», a short friendly intro
// line, and two mutually-exclusive modes driven by whether a resumable save exists.
// Name rules (§5.3/§7): trim, reject empty/whitespace, cap at 20 (block the 21st char),
// strip control chars, button enabled iff name.trim().length in [1,20].

import { useState } from "react";
import type { Dispatch } from "react";
import type { GameAction } from "../game/types";
import { Mascot } from "../components/Mascot";
import { PrimaryButton } from "../components/PrimaryButton";

export interface WelcomeScreenProps {
  dispatch: Dispatch<GameAction>;
  hasResumableSave: boolean;
  savedPlayerName: string;
}

const MAX_NAME = 20;
// Control characters stripped from name input (see design §5.3).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/** Sanitize a raw input value: strip control chars and cap at MAX_NAME characters. */
function sanitizeName(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").slice(0, MAX_NAME);
}

export function WelcomeScreen({
  dispatch,
  hasResumableSave,
  savedPlayerName,
}: WelcomeScreenProps) {
  const [name, setName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const trimmed = name.trim();
  const canStart = trimmed.length >= 1 && trimmed.length <= MAX_NAME;

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-black text-azul sm:text-5xl">
        ¡La aventura de los números!
      </h1>

      <Mascot
        size="lg"
        mood="happy"
        message={
          hasResumableSave
            ? `Hola de nuevo, ${savedPlayerName}`
            : "Vamos a jugar con sumas y restas. ¡Será muy divertido!"
        }
      />

      {hasResumableSave ? (
        confirmReset ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xl font-bold text-slate-700">
              ¿Seguro que quieres empezar de nuevo? Perderás tus estrellas.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton
                tone="danger"
                onClick={() => {
                  setConfirmReset(false);
                  dispatch({ type: "RESET_PROGRESS" });
                }}
              >
                Sí, empezar
              </PrimaryButton>
              <PrimaryButton
                tone="secondary"
                onClick={() => setConfirmReset(false)}
              >
                No
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <PrimaryButton
              tone="primary"
              onClick={() => dispatch({ type: "CONTINUE_GAME" })}
            >
              Continuar
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="select-none rounded-card px-4 py-2 text-base font-bold text-slate-500 underline"
            >
              Empezar de nuevo
            </button>
          </div>
        )
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <label htmlFor="player-name" className="text-xl font-bold text-slate-700">
            ¿Cómo te llamas?
          </label>
          <input
            id="player-name"
            type="text"
            inputMode="text"
            autoFocus={false}
            value={name}
            onChange={(e) => setName(sanitizeName(e.target.value))}
            maxLength={MAX_NAME}
            className="w-full rounded-card border-4 border-azul/30 bg-white px-5 py-4 text-center text-2xl font-extrabold text-slate-800 shadow-suave outline-none focus:border-azul"
            placeholder="Tu nombre"
          />
          <PrimaryButton
            tone="primary"
            fullWidth
            disabled={!canStart}
            onClick={() =>
              dispatch({ type: "START_GAME", playerName: trimmed })
            }
          >
            ¡Vamos a jugar!
          </PrimaryButton>
        </div>
      )}
    </main>
  );
}

export default WelcomeScreen;
