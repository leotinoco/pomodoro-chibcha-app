"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import TaskList from "./TaskList";
import PomodoroTimer from "./PomodoroTimer";
import AmbientPlayer from "./AmbientPlayer";
import axios from "axios";
import { differenceInMinutes, parseISO } from "date-fns";
import { AlertTriangle, LogOut } from "lucide-react";
import { SfxType, useSfx } from "@/hooks/useSfx";

export default function Dashboard() {
  const { data: session } = useSession();
  const [upcomingMeeting, setUpcomingMeeting] = useState<any>(null);
  const [shouldPauseAudio, setShouldPauseAudio] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const { play: playSfx } = useSfx();

  useEffect(() => {
    if (!session) return;

    const checkCalendar = async () => {
      try {
        const res = await axios.get("/api/calendar");
        const events = res.data.events || [];
        const now = new Date();

        const bufferTime = 10; // minutes
        const nextMeeting = events.find((event: any) => {
          if (!event.start.dateTime) return false;
          const start = parseISO(event.start.dateTime);
          const diff = differenceInMinutes(start, now);
          return diff >= 0 && diff <= bufferTime;
        });

        if (nextMeeting) {
          setUpcomingMeeting(nextMeeting);
          setShouldPauseAudio(true);
        } else {
          setUpcomingMeeting(null);
          setShouldPauseAudio(false);
        }
      } catch (error) {
        console.error("Failed to check calendar", error);
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
    <div className="min-h-screen bg-black text-gray-200 p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo-pomodoro.avif"
                alt="Pomodoro Chibcha Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Pomodoro & Dashboard
            </h1>
          </div>

          {session ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-800">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white font-bold">
                      {session.user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-white">
                    {session.user?.name?.split(" ")[0]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-gray-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
            >
              Sign in with Google
            </button>
          )}
        </header>

        {/* Meeting Alert */}
        {upcomingMeeting && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-4 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-bold text-white">
                Upcoming Meeting: {upcomingMeeting.summary}
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
              shouldPause={shouldPauseAudio}
              isDucking={isDucking}
            />
          </div>

          {/* Right Column: Tasks (8 columns) */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <TaskList />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-12 mt-20 text-gray-500 text-sm space-y-2">
        <p>&copy; {new Date().getFullYear()} Pomodoro Chibcha App.</p>
        <div className="flex items-center justify-center flex-wrap gap-4 mt-2">
          <Link
            href="/changelog"
            className="hover:text-blue-400 transition-colors underline decoration-gray-700 hover:decoration-blue-400"
          >
            Ver Novedades (v0.1.0)
          </Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link
            href="/privacy"
            className="hover:text-emerald-400 transition-colors underline decoration-gray-700 hover:decoration-emerald-400"
          >
            Política de Privacidad
          </Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link
            href="/terms"
            className="hover:text-purple-400 transition-colors underline decoration-gray-700 hover:decoration-purple-400"
          >
            Términos de Servicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
