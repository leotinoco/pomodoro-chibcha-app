import { useState, useEffect, useCallback, useRef } from "react";

type Mode = "focus" | "shortBreak" | "longBreak" | "meal";

const MODES: Record<Mode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 30 * 60,
  meal: 60 * 60,
};

type UsePomodoroOptions = {
  onPhaseStart?: (mode: Mode) => void;
  onPhaseEnd?: (mode: Mode) => void;
};

export const usePomodoro = (options: UsePomodoroOptions = {}) => {
  const onPhaseStart = options.onPhaseStart;
  const onPhaseEnd = options.onPhaseEnd;
  const [mode, setMode] = useState<Mode>("focus");
  const [focusDuration, setFocusDuration] = useState(MODES.focus);
  const [timeLeft, setTimeLeft] = useState(MODES.focus);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [phaseId, setPhaseId] = useState(0);
  const notifiedPhaseRef = useRef<number | null>(null);
  const timeLeftRef = useRef(timeLeft);

  const requestNotificationPermission = useCallback(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const startPhase = useCallback(
    (newMode: Mode, durationSeconds: number, autoStart: boolean) => {
      setMode(newMode);
      setTimeLeft(durationSeconds);
      setIsActive(autoStart);
      setPhaseId((prev) => prev + 1);
    },
    [],
  );

  const switchMode = useCallback(
    (newMode: Mode, customDuration?: number) => {
      const durationSeconds =
        customDuration ??
        (newMode === "focus" ? focusDuration : MODES[newMode]);

      if (newMode === "focus" && customDuration) {
        setFocusDuration(customDuration);
      }

      startPhase(newMode, durationSeconds, false);
    },
    [focusDuration, startPhase],
  );

  const toggleTimer = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? focusDuration : MODES[mode]);
    setSessionsCompleted(0);
    setPhaseId((prev) => prev + 1);
    notifiedPhaseRef.current = null;
  }, [focusDuration, mode]);

  const completePhase = useCallback(() => {
    onPhaseEnd?.(mode);

    if (mode === "focus") {
      const newCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newCompleted);
      const nextMode = newCompleted % 4 === 0 ? "longBreak" : "shortBreak";
      startPhase(nextMode, MODES[nextMode], true);
    } else {
      startPhase("focus", focusDuration, true);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Time's up!", {
        body: `${mode === "focus" ? "Focus session" : "Break"} completed. Starting next phase.`,
        icon: "/logo-pomodoro.avif",
      });
    }
  }, [focusDuration, mode, onPhaseEnd, sessionsCompleted, startPhase]);

  const completePhaseRef = useRef(completePhase);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    completePhaseRef.current = completePhase;
  }, [timeLeft, completePhase]);

  // El conteo se calcula contra la hora de fin: los navegadores ralentizan los
  // intervalos en pestañas en segundo plano (hasta 1 por minuto) y descontar
  // un segundo por tick hacía que el Pomodoro se atrasara.
  useEffect(() => {
    if (!isActive) return;

    const endAt = Date.now() + timeLeftRef.current * 1000;
    let finished = false;

    const tick = () => {
      if (finished) return;
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        finished = true;
        completePhaseRef.current();
      }
    };

    const interval = setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [isActive, phaseId]);

  useEffect(() => {
    if (!onPhaseStart) return;
    if (!isActive) return;
    if (notifiedPhaseRef.current === phaseId) return;

    notifiedPhaseRef.current = phaseId;
    onPhaseStart(mode);
  }, [isActive, mode, onPhaseStart, phaseId]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return {
    mode,
    timeLeft,
    isActive,
    sessionsCompleted,
    switchMode,
    toggleTimer,
    resetTimer,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    },
  };
};
