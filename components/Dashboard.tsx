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

export default function Dashboard() {
  const { data: session } = useSession();
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  const [isDucking, setIsDucking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { play: playSfx } = useSfx();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!session) return;

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
  }, [session]);

  const handlePlaySfx = useCallback(
    (type: SfxType) => {
      void playSfx(type, { onDuckingChange: setIsDucking });
    },
    [playSfx],
  );

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
            <PomodoroTimer onPlaySfx={handlePlaySfx} />
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
          <p>&copy; {new Date().getFullYear()} Pomodoro Chibcha App.</p>
        )}
        <div className="flex items-center justify-center flex-wrap gap-4 mt-2">
          <Link
            href="/changelog"
            className="hover:text-blue-400 transition-colors underline decoration-zinc-700 hover:decoration-blue-400"
          >
            Ver Novedades (v0.6.0)
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
