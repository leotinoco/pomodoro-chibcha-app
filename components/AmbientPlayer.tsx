"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  SkipBack,
  SkipForward,
} from "lucide-react";

export default function AmbientPlayer({
  shouldPause,
  isDucking = false,
}: {
  shouldPause?: boolean;
  isDucking?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGenre, setCurrentGenre] =
    useState<keyof typeof PLAYLISTS>("Lofi");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isLooping, setIsLooping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const PLAYLISTS = {
    Lofi: [
      "/sounds/lofi/lofi-1.mp3",
      "/sounds/lofi/lofi-2.mp3",
      "/sounds/lofi/lofi-3.mp3",
      "/sounds/lofi/lofi-4.mp3",
      "/sounds/lofi/lofi-5.mp3",
    ],
    Clásica: [
      "/sounds/classic/clasic-1.mp3",
      "/sounds/classic/clasic-2.mp3",
      "/sounds/classic/clasic-3.mp3",
      "/sounds/classic/clasic-4.mp3",
      "/sounds/classic/clasic-5.mp3",
    ],
    Rock: [
      "/sounds/rock/rock-1.mp3",
      "/sounds/rock/rock-2.mp3",
      "/sounds/rock/rock-3.mp3",
      "/sounds/rock/rock-4.mp3",
      "/sounds/rock/rock-5.mp3",
    ],
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isDucking) {
        // Lower volume during SFX
        audioRef.current.volume = volume * 0.2;
      } else {
        // Restore volume
        audioRef.current.volume = volume;
      }
    }
  }, [volume, isDucking]);

  // Handle external pause requests (e.g. from Dashboard)
  useEffect(() => {
    if (shouldPause && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [shouldPause]);

  const safePlay = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Playback failed", error);
      }
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      safePlay();
    }
  };

  const changeGenre = (genre: keyof typeof PLAYLISTS) => {
    setCurrentGenre(genre);
    setCurrentTrackIndex(0); // Reset to first song of new genre
    setIsPlaying(true);
    // Auto-play will be handled by the src change + useEffect if we want,
    // or we can rely on `autoPlay` prop, but React control is better.
    // Let's use a small timeout to ensure DOM update is ready if needed,
    // or just let the user press play.
    // Actually, setting isPlaying=true nicely updates UI,
    // and we can trigger play in a useEffect on track change.
  };

  const nextTrack = () => {
    const playlist = PLAYLISTS[currentGenre];
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setIsPlaying(true);
    } else if (isLooping) {
      setCurrentTrackIndex(0); // Loop back to start
      setIsPlaying(true);
    } else {
      setIsPlaying(false); // Stop if not looping
    }
  };

  const prevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    } else if (isLooping) {
      // Go to last track if looping and at start? Or just stay at 0?
      // Usually "Previous" at start of track 0 either restarts track or goes to last.
      // Let's go to last track for continuous feel.
      setCurrentTrackIndex(PLAYLISTS[currentGenre].length - 1);
    }
  };

  // Auto-play when track index changes if it was already playing or we just switched genre to play
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      safePlay();
    }
  }, [currentTrackIndex, currentGenre]);

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md rounded-2xl p-6 border border-neutral-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
          Ambient Sound
        </h2>
        <div className="text-xs text-gray-500 font-mono">
          {currentGenre} • Track {currentTrackIndex + 1}/
          {PLAYLISTS[currentGenre].length}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={PLAYLISTS[currentGenre][currentTrackIndex]}
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-700">
        {Object.keys(PLAYLISTS).map((genre) => (
          <button
            key={genre}
            onClick={() => changeGenre(genre as keyof typeof PLAYLISTS)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              currentGenre === genre
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Previous Button */}
          <button
            onClick={prevTrack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
            className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform active:scale-95 shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={nextTrack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            aria-label={isLooping ? "Disable repeat" : "Enable repeat"}
            title={isLooping ? "Disable repeat" : "Enable repeat"}
            className={`p-2 rounded-lg transition-colors ${
              isLooping
                ? "text-purple-400 bg-purple-400/10"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 group">
          {volume === 0 ? (
            <VolumeX className="w-5 h-5 text-gray-500" />
          ) : (
            <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125 hover:bg-neutral-600"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
