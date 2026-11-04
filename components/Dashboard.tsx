"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import TaskList from "./TaskList";
import PomodoroTimer from "./PomodoroTimer";
import AmbientPlayer from "./AmbientPlayer";
import Mascot from "./Mascot";
import axios from "axios";
import { differenceInMinutes, parseISO } from "date-fns";
import { AlertTriangle, LogOut } from "lucide-react";
import { SfxType, useSfx } from "@/hooks/useSfx";

interface CalendarEvent {
  summary: string;
  start: {
    dateTime: string;
  };
}

interface CalendarState {
  upcomingMeeting: CalendarEvent | null;
  shouldPauseAudio: boolean;
  loading: boolean;
  error: string | null;
}

type CalendarAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { meeting: CalendarEvent | null; shouldPause: boolean } }
  | { type: "FETCH_ERROR"; payload: string };

const initialState: CalendarState = {
  upcomingMeeting: null,
  shouldPauseAudio: false,
  loading: false,
  error: null,
};

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        upcomingMeeting: action.payload.meeting,
        shouldPauseAudio: action.payload.shouldPause,
        error: null,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function GoogleMark() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.12 7.12 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
      />
    </svg>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  // Booleano estable: el objeto de sesión cambia en cada refresco (p. ej. al
  // volver a la pestaña) y reiniciaba el sondeo del calendario.
  const isAuthenticated = status === "authenticated";
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  const [isDucking, setIsDucking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { play: playSfx } = useSfx();
  const [sfxVolume, setSfxVolume] = useState(0.5);

  /* eslint-disable react-hooks/set-state-in-effect --
   * Mount-time sync with browser-only state (hydration flag, localStorage).
   * localStorage is unavailable during SSR, so reading it in a lazy state
   * initializer would cause a hydration mismatch; an effect is the safe way.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sfxVolume");
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
        setSfxVolume(parsed);
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSfxVolumeChange = (newVolume: number) => {
    setSfxVolume(newVolume);
    localStorage.setItem("sfxVolume", newVolume.toString());
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkCalendar = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const res = await axios.get("/api/calendar");
        const events = res.data.events || [];
        const now = new Date();

        const bufferTime = 10; // minutes
        const nextMeeting = events.find((event: CalendarEvent) => {
          if (!event.start.dateTime) return false;
          const start = parseISO(event.start.dateTime);
          const diff = differenceInMinutes(start, now);
          return diff >= 0 && diff <= bufferTime;
        });

        dispatch({
          type: "FETCH_SUCCESS",
          payload: {
            meeting: nextMeeting || null,
            shouldPause: !!nextMeeting,
          },
        });
      } catch (error) {
        dispatch({
          type: "FETCH_ERROR",
          payload: error instanceof Error ? error.message : "Failed to check calendar",
        });
      }
    };

    checkCalendar();
    const interval = setInterval(checkCalendar, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handlePlaySfx = useCallback(
    (type: SfxType) => {
      void playSfx(type, { volume: sfxVolume, onDuckingChange: setIsDucking });
    },
    [playSfx, sfxVolume],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0">
              <Image
                src="/logo-pomodoro.avif"
                alt="Pomodoro Chibcha Logo"
                fill
                sizes="(max-width: 768px) 40px, 40px"
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Pomodoro Chibcha
              </h1>
              <p className="text-xs text-zinc-400">
                Temporizador Pomodoro, música ambiental y sincronización con Google Tasks y Calendar
              </p>
            </div>
          </div>

          {session ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative size-10 rounded-full overflow-hidden border-2 border-zinc-800">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      fill
                      sizes="(max-width: 768px) 40px, 40px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white font-semibold">
                      {session.user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-white">
                    {session.user?.name?.split(" ")[0]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white text-zinc-900 rounded-full font-semibold text-sm shadow-sm hover:bg-zinc-100 hover:scale-105 transition-all"
            >
              <GoogleMark />
              <span>Sign in with Google</span>
            </button>
          )}
        </header>

        {/* Expired Google session: the refresh token was revoked or expired */}
        {session?.error === "RefreshAccessTokenError" && (
          <div
            role="alert"
            className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-xl flex flex-wrap items-center gap-4"
          >
            <AlertTriangle className="size-6 text-amber-400" />
            <p className="flex-1 min-w-48 text-amber-100 text-sm">
              Tu sesión con Google expiró. Vuelve a iniciar sesión para ver
              tus tareas y eventos.
            </p>
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-full font-semibold text-sm hover:bg-zinc-100 hover:scale-105 transition-all"
            >
              <GoogleMark />
              <span>Iniciar sesión de nuevo</span>
            </button>
          </div>
        )}

        {/* Meeting Alert */}
        {state.upcomingMeeting && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-4 animate-pulse">
            <AlertTriangle className="size-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-white">
                Upcoming Meeting: {state.upcomingMeeting.summary}
              </h3>
              <p className="text-red-400 text-sm">
                Starts in less than 10 minutes. Audio paused.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Timer & Ambient (4 columns) */}
          <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <PomodoroTimer
              onPlaySfx={handlePlaySfx}
              sfxVolume={sfxVolume}
              onSfxVolumeChange={handleSfxVolumeChange}
            />
            <AmbientPlayer
              shouldPause={state.shouldPauseAudio}
              isDucking={isDucking}
            />
            <Mascot />
          </div>

          {/* Right Column: Tasks (8 columns) */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <TaskList />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-12 mt-20 text-zinc-500 text-sm">
        {mounted && (
          <p>&copy; {new Date().getFullYear()} Pomodoro Chibcha.</p>
        )}
        <div className="flex items-center justify-center flex-wrap gap-4 mt-2">
          <Link
            href="/changelog"
            className="hover:text-blue-400 transition-colors underline decoration-zinc-700 hover:decoration-blue-400"
          >
            Ver Novedades (v0.14.0)
          </Link>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <Link
            href="/privacy"
            className="hover:text-emerald-400 transition-colors underline decoration-zinc-700 hover:decoration-emerald-400"
          >
            Política de Privacidad
          </Link>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <Link
            href="/terms"
            className="hover:text-purple-400 transition-colors underline decoration-zinc-700 hover:decoration-purple-400"
          >
            Términos de Servicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
