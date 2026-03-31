"use client";

import { usePomodoro } from "@/hooks/usePomodoro";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Utensils,
  Brain,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export default function PomodoroTimer({
  onPlaySfx,
}: {
  onPlaySfx: (type: "start" | "break" | "longBreak") => void;
}) {
  const {
    mode,
    timeLeft,
    isActive,
    sessionsCompleted,
    switchMode,
    toggleTimer,
    resetTimer,
    formatTime,
  } = usePomodoro();

  useEffect(() => {
    if (timeLeft === 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (mode === "focus") {
        // We are checking the CURRENT state before the hook updates it in its effect.
        // Actually, the hook updates in the same render cycle effectively if we are not careful,
        // but simple effects run after render.
        // If timeLeft is 0, the session is done.
        // sessionsCompleted here is the value BEFORE the hook increments it?
        // No, the hook handles the transition in its own useEffect on [timeLeft].
        // This component also has a useEffect on [timeLeft].
        // They might run in any order or together.
        // However, we can reliably use the logic:
        // Next will be (sessionsCompleted + 1).

        if ((sessionsCompleted + 1) % 4 === 0) {
          onPlaySfx("longBreak");
        } else {
          onPlaySfx("break");
        }
      }
    }
  }, [timeLeft, mode, sessionsCompleted, onPlaySfx]);

  const handleToggle = () => {
    if (!isActive) {
      onPlaySfx("start");
    }
    toggleTimer();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-neutral-800 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${mode === "focus" ? "from-blue-500 to-purple-500" : "from-green-400 to-emerald-600"}`}
      />

      {/* Mode Selectors */}
      <div className="flex gap-2 mb-8 flex-wrap justify-center">
        <button
          onClick={() => switchMode("focus", 25 * 60)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === "focus"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <Brain className="w-4 h-4" /> Focus
        </button>
        <button
          onClick={() => switchMode("shortBreak")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === "shortBreak"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <Coffee className="w-4 h-4" /> Short Break
        </button>
        <button
          onClick={() => switchMode("longBreak")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === "longBreak"
              ? "bg-teal-600 text-white shadow-lg shadow-teal-500/25"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <Zap className="w-4 h-4" /> Long Break
        </button>
        <button
          onClick={() => switchMode("meal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === "meal"
              ? "bg-orange-600 text-white shadow-lg shadow-orange-500/25"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <Utensils className="w-4 h-4" /> Meal
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tighter mb-8 font-mono">
        {formatTime(timeLeft)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          aria-label={isActive ? "Pause Timer" : "Start Timer"}
          className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg hover:shadow-xl active:scale-95"
        >
          {isActive ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>
        <button
          onClick={resetTimer}
          aria-label="Reset Timer"
          className="p-4 bg-neutral-800 text-gray-400 rounded-full hover:bg-neutral-700 hover:text-white transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Duration Toggles for Focus */}
      {mode === "focus" && (
        <div className="mt-8 flex gap-2">
          {[15, 20, 25, 30].map((mins) => (
            <button
              key={mins}
              onClick={() => switchMode("focus", mins * 60)}
              className="text-xs px-3 py-1 rounded-md bg-neutral-800 text-gray-500 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              {mins}m
            </button>
          ))}
        </div>
      )}

      {/* Session Counter (Optional debug/visual) */}
      <div className="absolute bottom-4 right-4 text-xs text-neutral-600 font-mono">
        Sessions: {sessionsCompleted}
      </div>
    </div>
  );
}
