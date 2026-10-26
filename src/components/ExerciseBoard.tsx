// The exercise board: top (large target + short instruction; subtraction shows the
// initial quantity with the target highlighted), center NumberCards, running-total row,
// big «Comprobar» (disabled on empty selection and during transitionLock), and «Pista»
// (disabled/hidden once all hint tiers are shown). See design §6.

import type { Exercise, Hint, ValidationState } from "../game/types";
import { tokenPhrase } from "../game/validation";
import { NumberCard } from "./NumberCard";
import { ProgressBar } from "./ProgressBar";
import { PrimaryButton } from "./PrimaryButton";

export interface ExerciseBoardProps {
  exercise: Exercise;
  selectedOptionIds: string[];
  provisionalTotal: number;
  validation: ValidationState;
  rejectedOptionId: string | null;
  activeHint: Hint | null;
  /** True once all hint tiers for this exercise have been revealed (hide «Pista»). */
  hintsExhausted: boolean;
  transitionLock: boolean;
  onToggleOption: (optionId: string) => void;
  onCheck: () => void;
  onHint: () => void;
}

/** The amount the child must build (addition target) or remove (subtraction removal total). */
function requiredFor(exercise: Exercise): number {
  return exercise.operation === "addition"
    ? exercise.target
    : (exercise.initialQuantity ?? 0) - exercise.target;
}

/** Render a row of object glyphs (capped) to visualize a quantity. */
function GlyphRow({ count, emoji }: { count: number; emoji: string }) {
  const n = Math.max(0, Math.min(count, 12));
  return (
    <span className="flex flex-wrap justify-center gap-1 text-3xl leading-none">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} aria-hidden="true">
          {emoji}
        </span>
      ))}
    </span>
  );
}

export function ExerciseBoard({
  exercise,
  selectedOptionIds,
  provisionalTotal,
  validation,
  rejectedOptionId,
  activeHint,
  hintsExhausted,
  transitionLock,
  onToggleOption,
  onCheck,
  onHint,
}: ExerciseBoardProps) {
  const required = requiredFor(exercise);
  const isSubtraction = exercise.operation === "subtraction";
  const emptySelection = selectedOptionIds.length === 0;

  // Over-hint copy chosen by operation (never stored in state). See design §6.2.
  const overLine = isSubtraction
    ? "Has quitado demasiadas, vuelve a poner una"
    : "¿Quitamos una caja? Nos hemos pasado";

  const rejectedLine = "No puedes quitar más de las que hay";

  // Highlighted option ids come from an active «highlight-options»/«guided-demo» hint.
  const highlightIds = new Set(activeHint?.highlightOptionIds ?? []);

  const progressLabel = isSubtraction ? "Has quitado" : "Llevas";

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      {/* Top: target + instruction (the most important element on screen). */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span
          className="text-7xl font-black text-azul sm:text-8xl"
          aria-label={`Número objetivo ${exercise.target}`}
        >
          {exercise.target}
        </span>
        <p className="text-xl font-bold text-slate-700 sm:text-2xl">
          {exercise.instruction}
        </p>
      </div>

      {/* Subtraction: show the initial quantity with the target highlighted. */}
      {isSubtraction && exercise.initialQuantity !== null ? (
        <div className="flex flex-col items-center gap-1 rounded-card bg-white/70 px-4 py-3 shadow-inner">
          <p className="text-base font-bold text-slate-600">
            Tienes{" "}
            {tokenPhrase(
              exercise.initialQuantity,
              exercise.tokenNounSingular,
              exercise.tokenNoun,
            )}
          </p>
          <GlyphRow
            count={exercise.initialQuantity}
            emoji={exercise.tokenEmoji}
          />
          <p className="text-base font-bold text-verde">
            Deben quedar{" "}
            {tokenPhrase(
              exercise.target,
              exercise.tokenNounSingular,
              exercise.tokenNoun,
            )}
          </p>
        </div>
      ) : null}

      {/* Center: number cards. */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {exercise.options.map((opt) => (
          <NumberCard
            key={opt.id}
            optionId={opt.id}
            value={opt.value}
            tokenEmoji={exercise.tokenEmoji}
            selected={selectedOptionIds.includes(opt.id)}
            highlighted={highlightIds.has(opt.id)}
            rejected={rejectedOptionId === opt.id}
            showObjects={exercise.difficulty <= 2}
            disabled={transitionLock}
            onToggle={onToggleOption}
          />
        ))}
      </div>

      {/* Running provisional total as accumulating tokens. */}
      <ProgressBar
        total={provisionalTotal}
        required={required}
        tokenEmoji={exercise.tokenEmoji}
        label={progressLabel}
      />

      {/* Gentle hint / rejected-tap line (text + the active hint message). */}
      <div className="min-h-[2rem] text-center">
        {rejectedOptionId ? (
          <p className="text-lg font-bold text-rojo">{rejectedLine}</p>
        ) : validation === "over" ? (
          <p className="text-lg font-bold text-naranja">{overLine}</p>
        ) : activeHint ? (
          <p className="text-lg font-bold text-azul">{activeHint.message}</p>
        ) : null}
      </div>

      {/* Actions. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!hintsExhausted ? (
          <PrimaryButton tone="secondary" onClick={onHint} disabled={transitionLock}>
            Pista
          </PrimaryButton>
        ) : null}
        <PrimaryButton
          tone="success"
          onClick={onCheck}
          disabled={emptySelection || transitionLock}
        >
          Comprobar
        </PrimaryButton>
      </div>
    </div>
  );
}

export default ExerciseBoard;
