"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import TaskList from "./TaskList";
import PomodoroTimer, { PomodoroTimerHandle } from "./PomodoroTimer";
import AmbientPlayer from "./AmbientPlayer";
import Mascot from "./Mascot";
import AIChat from "./AIChat";
import axios from "axios";
import { differenceInMinutes, parseISO } from "date-fns";
import { AlertTriangle, BellRing, LogOut, X } from "lucide-react";
import { SfxType, useSfx } from "@/hooks/useSfx";

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
}

/**
 * Minutos antes de un evento en los que avisamos dentro de la app, además del
 * recordatorio nativo de Google. Si el celular está en silencio (trabajando,
 * estudiando) esta alerta en pantalla + sonido sigue avisando.
 */
const IN_APP_REMINDER_THRESHOLDS = [15, 10, 5];

interface ReminderAlert {
  key: string;
  summary: string;
  minutes: number;
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
  const pomodoroRef = useRef<PomodoroTimerHandle>(null);
  const [reminderAlerts, setReminderAlerts] = useState<ReminderAlert[]>([]);
  // Recuerda qué combinaciones evento+umbral ya avisamos, para no repetir la
  // alerta en cada sondeo mientras el evento sigue dentro de la ventana.
  const firedRemindersRef = useRef<Set<string>>(new Set());

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
      setSfxVolume(parseFloat(saved));
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSfxVolumeChange = (newVolume: number) => {
    setSfxVolume(newVolume);
    localStorage.setItem("sfxVolume", newVolume.toString());
  };

  const handlePlaySfx = useCallback(
    (type: SfxType) => {
      void playSfx(type, { volume: sfxVolume, onDuckingChange: setIsDucking });
    },
    [playSfx, sfxVolume],
  );

  // Alertas en pantalla (+ sonido) para no depender solo de la notificación
  // nativa del celular, que no se nota si está en silencio.
  const triggerInAppReminder = useCallback(
    (event: CalendarEvent, minutes: number) => {
      setReminderAlerts((prev) => [
        ...prev,
        { key: `${event.id}-${minutes}`, summary: event.summary, minutes },
      ]);
      handlePlaySfx("start");

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`En ${minutes} minutos: ${event.summary}`, {
          body: "Recordatorio de Pomodoro Chibcha",
          icon: "/logo-pomodoro.avif",
        });
      }
    },
    [handlePlaySfx],
  );

  const dismissReminderAlert = (key: string) => {
    setReminderAlerts((prev) => prev.filter((a) => a.key !== key));
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkCalendar = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const res = await axios.get("/api/calendar");
        const events: CalendarEvent[] = res.data.events || [];
        const now = new Date();

        const bufferTime = 10; // minutes
        const nextMeeting = events.find((event) => {
          if (!event.start.dateTime) return false;
          const start = parseISO(event.start.dateTime);
          const diff = differenceInMinutes(start, now);
          return diff >= 0 && diff <= bufferTime;
        });

        // Recordatorio dentro de la app: se dispara la primera vez que un
        // evento entra en cada ventana (15/10/5 min), independiente de la
        // notificación nativa de Google.
        events.forEach((event) => {
          if (!event.start.dateTime) return;
          const diff = differenceInMinutes(parseISO(event.start.dateTime), now);
          if (diff < 0) return;

          for (const threshold of IN_APP_REMINDER_THRESHOLDS) {
            if (diff > threshold) continue;
            const key = `${event.id}-${threshold}`;
            if (firedRemindersRef.current.has(key)) continue;
            firedRemindersRef.current.add(key);
            triggerInAppReminder(event, threshold);
          }
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
    const interval = setInterval(checkCalendar, 30000); // Sondeo cada 30s para no pasar por alto una ventana de recordatorio
    return () => clearInterval(interval);
  }, [isAuthenticated, triggerInAppReminder]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative size-10">
              <Image
                src="/logo-pomodoro.avif"
                alt="Pomodoro Chibcha Logo"
                fill
                sizes="(max-width: 768px) 40px, 40px"
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Pomodoro & Dashboard
            </h1>
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
              className="px-6 py-2 bg-white text-black rounded-full font-semibold text-sm hover:scale-105 transition-transform"
            >
              Sign in with Google
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
              className="px-4 py-2 bg-white text-black rounded-full font-semibold text-sm hover:scale-105 transition-transform"
            >
              Iniciar sesión de nuevo
            </button>
          </div>
        )}

        {/* Recordatorios en pantalla (15/10/5 min): respaldan la notificación
            nativa de Google por si el celular está en silencio. */}
        {reminderAlerts.length > 0 && (
          <div className="space-y-2">
            {reminderAlerts.map((alert) => (
              <div
                key={alert.key}
                role="alert"
                className="bg-purple-500/10 border border-purple-500/50 p-4 rounded-xl flex items-center gap-4"
              >
                <BellRing className="size-6 text-purple-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{alert.summary}</h3>
                  <p className="text-purple-300 text-sm">
                    Empieza en {alert.minutes} minuto{alert.minutes === 1 ? "" : "s"}.
                  </p>
                </div>
                <button
                  onClick={() => dismissReminderAlert(alert.key)}
                  className="p-1.5 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Cerrar recordatorio"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
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
              ref={pomodoroRef}
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

          {/* Middle Column: Tasks (5 columns) */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <TaskList />
          </div>

          {/* Right Column: AI Chat (3 columns) */}
          <div className="lg:col-span-3 order-3">
            <AIChat onLoadQueue={(steps) => pomodoroRef.current?.loadQueue(steps)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-12 mt-20 text-zinc-500 text-sm">
        {mounted && (
          <p>&copy; {new Date().getFullYear()} Pomodoro Chibcha App.</p>
        )}
        <div className="flex items-center justify-center flex-wrap gap-4 mt-2">
          <Link
            href="/changelog"
            className="hover:text-blue-400 transition-colors underline decoration-zinc-700 hover:decoration-blue-400"
          >
            Ver Novedades (v0.13.0)
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
