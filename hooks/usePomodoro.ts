import { useState, useEffect, useCallback, useRef } from "react";

type Mode = "focus" | "shortBreak" | "longBreak" | "meal";

const MODES: Record<Mode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 30 * 60,
  meal: 60 * 60,
};

export const usePomodoro = () => {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const requestNotificationPermission = useCallback(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const switchMode = (newMode: Mode, customDuration?: number) => {
    setMode(newMode);
    setTimeLeft(customDuration || MODES[newMode]);
    setIsActive(false);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode]);
    setSessionsCompleted(0);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished
      if (mode === "focus") {
        const newCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newCompleted);

        if (newCompleted % 4 === 0) {
          switchMode("longBreak");
        } else {
          switchMode("shortBreak");
        }
      } else {
        // Break finished, back to work
        switchMode("focus");
      }

      // Auto-start next phase
      setIsActive(true);

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
  }, [isActive, timeLeft, mode, sessionsCompleted]);

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
