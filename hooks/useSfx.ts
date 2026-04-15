"use client";

import { useCallback, useEffect, useRef } from "react";

export type SfxType = "start" | "break" | "longBreak";

const SFX_FILES: Record<SfxType, string> = {
  start: "/audio/star.wav",
  break: "/audio/break.wav",
  longBreak: "/audio/large-break.wav",
};

type PlayOptions = {
  volume?: number;
  retries?: number;
  onDuckingChange?: (isDucking: boolean) => void;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isNotAllowedError(error: unknown) {
  const name = (error as { name?: string } | null)?.name;
  return name === "NotAllowedError" || name === "NotSupportedError";
}

function waitForCanPlay(audio: HTMLAudioElement, timeoutMs: number) {
  if (audio.readyState >= 2) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let done = false;

    const onReady = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    };

    const onError = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("Audio load error"));
    };

    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timer);
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("loadeddata", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
}

export function useSfx() {
  const audioByTypeRef = useRef<Map<SfxType, HTMLAudioElement>>(new Map());
  const availabilityRef = useRef<Record<SfxType, boolean>>({
    start: true,
    break: true,
    longBreak: true,
  });
  const unlockedRef = useRef(false);

  useEffect(() => {
    for (const type of Object.keys(SFX_FILES) as SfxType[]) {
      const audio = new Audio(SFX_FILES[type]);
      audio.preload = "auto";
      audio.addEventListener(
        "error",
        () => {
          availabilityRef.current[type] = false;
        },
        { once: true },
      );
      audio.load();
      audioByTypeRef.current.set(type, audio);
    }
  }, []);

  const unlock = useCallback(async () => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;

    const audio = audioByTypeRef.current.get("start");
    if (!audio) return;

    const prevVolume = audio.volume;
    try {
      audio.volume = 0;
      await waitForCanPlay(audio, 1200);
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
    } catch {
    } finally {
      audio.volume = prevVolume;
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      void unlock();
      window.removeEventListener("pointerdown", handler, true);
    };
    window.addEventListener("pointerdown", handler, true);
    return () => window.removeEventListener("pointerdown", handler, true);
  }, [unlock]);

  const play = useCallback(
    async (type: SfxType, options?: PlayOptions) => {
      const audio = audioByTypeRef.current.get(type);
      if (!audio) return false;
      if (!availabilityRef.current[type]) return false;

      const volume = options?.volume ?? 1;
      const retries = options?.retries ?? 2;

      options?.onDuckingChange?.(true);

      let lastError: unknown;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          await waitForCanPlay(audio, 1500);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = volume;

          audio.onended = () => {
            options?.onDuckingChange?.(false);
          };

          await audio.play();
          return true;
        } catch (error) {
          lastError = error;
          if (isNotAllowedError(error)) {
            await unlock();
          }
          await delay(250 * (attempt + 1) ** 2);
        }
      }

      options?.onDuckingChange?.(false);

      if (process.env.NODE_ENV !== "production") {
        console.error("Error playing SFX:", type, lastError);
      }

      return false;
    },
    [unlock],
  );

  return { play, unlock };
}
