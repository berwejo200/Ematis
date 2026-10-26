// Short success/celebration sounds behind an on/off preference bound to audioEnabled.
// NEVER autoplays: the AudioContext is created/resumed only after a user gesture.
// Self-contained WebAudio tones (no external assets, no network). The game stays fully
// usable with audio off — errors are never conveyed by sound alone. See design §6.4.

import { useCallback, useEffect, useRef } from "react";

export type SoundName = "success" | "celebration";

export interface UseSoundResult {
  /** Play a named sound if audio is enabled; a no-op when disabled or unsupported. */
  play: (name: SoundName) => void;
  /** Whether WebAudio is available in this environment. */
  supported: boolean;
}

/** A tiny tone sequence per sound (frequency in Hz, duration in seconds). */
const TONES: Record<SoundName, { freq: number; dur: number }[]> = {
  success: [
    { freq: 523.25, dur: 0.12 }, // C5
    { freq: 783.99, dur: 0.16 }, // G5
  ],
  celebration: [
    { freq: 523.25, dur: 0.1 }, // C5
    { freq: 659.25, dur: 0.1 }, // E5
    { freq: 783.99, dur: 0.1 }, // G5
    { freq: 1046.5, dur: 0.22 }, // C6
  ],
};

type AudioCtor = typeof AudioContext;

function getAudioContextCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioCtor;
    webkitAudioContext?: AudioCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Audio playback hook. Bound to `audioEnabled`; when false, `play` is a no-op. The
 * AudioContext is lazily created on the first `play` call (which must originate from a
 * user gesture on iPad Safari) and resumed if suspended — never on mount.
 */
export function useSound(audioEnabled: boolean): UseSoundResult {
  const ctorRef = useRef<AudioCtor | null>(getAudioContextCtor());
  const ctxRef = useRef<AudioContext | null>(null);
  const supported = ctorRef.current !== null;

  const play = useCallback(
    (name: SoundName) => {
      if (!audioEnabled) return;
      const Ctor = ctorRef.current;
      if (!Ctor) return;

      // Lazily create the context on first use (a user gesture is in progress).
      if (!ctxRef.current) {
        try {
          ctxRef.current = new Ctor();
        } catch {
          return; // Creation failed (e.g. blocked); stay silent, game still usable.
        }
      }
      const ctx = ctxRef.current;
      // Resume if the browser suspended it (Safari autoplay policy).
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const sequence = TONES[name];
      let when = ctx.currentTime;
      for (const { freq, dur } of sequence) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        // Short attack/decay envelope so tones are soft, not harsh (child-friendly).
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(0.2, when + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(when);
        osc.stop(when + dur);
        when += dur;
      }
    },
    [audioEnabled],
  );

  // Close the context on unmount to free resources.
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        void ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, []);

  return { play, supported };
}
