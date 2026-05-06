"use client";

import React from "react";

export default function Mascot() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-neutral-800 shadow-xl overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full" />
      
      <div className="relative w-24 h-24 lg:w-32 lg:h-32 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>
            {`
              @keyframes blink {
                0%, 96%, 98% { transform: scaleY(1); }
                97% { transform: scaleY(0.1); }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              @keyframes metronome-tail {
                0% { transform: rotate(-10deg); }
                50% { transform: rotate(20deg); }
                100% { transform: rotate(-10deg); }
              }
              @keyframes ear-twitch {
                0%, 90%, 100% { transform: rotate(0deg); }
                95% { transform: rotate(-5deg); }
              }
              .eye { animation: blink 4s infinite; transform-origin: center; }
              .body { animation: float 3s ease-in-out infinite; }
              /* The tail animates exactly every 1s to match the timer tick */
              .tail { animation: metronome-tail 1s ease-in-out infinite; transform-origin: 75px 65px; }
              .ear { animation: ear-twitch 5s infinite; transform-origin: 20px 30px; }
            `}
          </style>
          
          <g className="body">
            {/* Tail */}
            <path className="tail" d="M 75 65 Q 95 65 90 40" stroke="#8b5cf6" strokeWidth="8" fill="none" strokeLinecap="round" />
            
            {/* Body */}
            <rect x="25" y="45" width="50" height="35" rx="17.5" fill="#a78bfa" />
            
            {/* Left Ear */}
            <path className="ear" d="M 30 50 L 25 25 L 45 45 Z" fill="#8b5cf6" />
            
            {/* Right Ear */}
            <path d="M 70 50 L 75 25 L 55 45 Z" fill="#8b5cf6" />
            
            {/* Eyes */}
            <circle cx="38" cy="60" r="4.5" fill="#1f2937" className="eye" />
            <circle cx="62" cy="60" r="4.5" fill="#1f2937" className="eye" />
            
            {/* Nose / Mouth */}
            <path d="M 48 65 Q 50 68 52 65" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            
            {/* Blush */}
            <ellipse cx="30" cy="65" rx="4" ry="2" fill="#f472b6" opacity="0.5" />
            <ellipse cx="70" cy="65" rx="4" ry="2" fill="#f472b6" opacity="0.5" />
          </g>
        </svg>
      </div>
      
      <div className="mt-2 lg:mt-0 lg:ml-4 text-center lg:text-left z-10">
        <p className="text-sm text-gray-200 font-bold tracking-wide">
          Chibi Pomodoro
        </p>
        <p className="text-xs text-purple-400 font-mono mt-1">
          Tick tock...
        </p>
      </div>
    </div>
  );
}
