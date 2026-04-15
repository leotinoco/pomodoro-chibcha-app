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
};

export const usePomodoro = (options: UsePomodoroOptions = {}) => {
  const onPhaseStart = options.onPhaseStart;
  const [mode, setMode] = useState<Mode>("focus");
  const [focusDuration, setFocusDuration] = useState(MODES.focus);
  const [timeLeft, setTimeLeft] = useState(MODES.focus);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [phaseId, setPhaseId] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedPhaseRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (mode === "focus") {
        setSessionsCompleted((prev) => {
          const newCompleted = prev + 1;
          const nextMode = newCompleted % 4 === 0 ? "longBreak" : "shortBreak";
          startPhase(nextMode, MODES[nextMode], true);
          return newCompleted;
        });
      } else {
        startPhase("focus", focusDuration, true);
      }

      if (Notification.permission === "granted") {
        new Notification("Time's up!", {
          body: `${mode === "focus" ? "Focus session" : "Break"} completed. Starting next phase.`,
          icon: "/icon.png",
        });
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [focusDuration, isActive, mode, startPhase, timeLeft]);

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
