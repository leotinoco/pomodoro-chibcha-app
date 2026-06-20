"use client";

import React from "react";

export default function Mascot() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-neutral-800 shadow-xl overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full" />
      
      <div className="relative w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0">
        <svg
          viewBox="0 0 200 200"
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
                50% { transform: translateY(-6px); }
              }
              @keyframes metronome-tail {
                0% { transform: rotate(-15deg); }
                50% { transform: rotate(15deg); }
                100% { transform: rotate(-15deg); }
              }
              @keyframes ear-twitch-l {
                0%, 90%, 100% { transform: rotate(0deg); }
                95% { transform: rotate(-12deg); }
              }
              @keyframes ear-twitch-r {
                0%, 90%, 100% { transform: rotate(0deg); }
                95% { transform: rotate(12deg); }
              }
              .eye-group { animation: blink 4s infinite; transform-origin: 100px 85px; }
              .cat-body { animation: float 3s ease-in-out infinite; transform-origin: center; }
              /* The tail animates exactly every 1s to match the timer tick */
              .tail { animation: metronome-tail 1s ease-in-out infinite; transform-origin: 130px 140px; }
              .ear-l { animation: ear-twitch-l 5s infinite; transform-origin: 60px 65px; }
              .ear-r { animation: ear-twitch-r 5s infinite; transform-origin: 140px 65px; }
            `}
          </style>

          <g className="cat-body">
            {/* Tail */}
            <path 
              className="tail" 
              d="M 130 140 C 170 150, 190 100, 170 70 C 160 55, 180 40, 185 30" 
              stroke="#8b5cf6" 
              strokeWidth="14" 
              fill="none" 
              strokeLinecap="round" 
            />
            
            {/* Left Back Paw */}
            <ellipse cx="65" cy="165" rx="18" ry="12" fill="#8b5cf6" />
            <ellipse cx="62" cy="166" rx="6" ry="5" fill="#1f2937" />
            {/* Left Toe Beans */}
            <circle cx="56" cy="160" r="2.5" fill="#1f2937" />
            <circle cx="63" cy="158" r="2.5" fill="#1f2937" />
            <circle cx="70" cy="160" r="2.5" fill="#1f2937" />

            {/* Right Back Paw */}
            <ellipse cx="135" cy="165" rx="18" ry="12" fill="#8b5cf6" />
            <ellipse cx="138" cy="166" rx="6" ry="5" fill="#1f2937" />
            {/* Right Toe Beans */}
            <circle cx="130" cy="160" r="2.5" fill="#1f2937" />
            <circle cx="137" cy="158" r="2.5" fill="#1f2937" />
            <circle cx="144" cy="160" r="2.5" fill="#1f2937" />

            {/* Body */}
            <ellipse cx="100" cy="135" rx="48" ry="42" fill="#a78bfa" />
            
            {/* Belly */}
            <ellipse cx="100" cy="145" rx="28" ry="22" fill="#ede9fe" />

            {/* Front Paws */}
            <ellipse cx="80" cy="170" rx="12" ry="18" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="2" />
            <ellipse cx="120" cy="170" rx="12" ry="18" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="2" />

            {/* Head Group */}
            <g className="head">
              {/* Ears */}
              <g className="ear-l">
                <path d="M 55 65 Q 25 15 80 40 Z" fill="#8b5cf6" />
                <path d="M 60 60 Q 35 25 75 42 Z" fill="#c4b5fd" />
              </g>
              <g className="ear-r">
                <path d="M 145 65 Q 175 15 120 40 Z" fill="#8b5cf6" />
                <path d="M 140 60 Q 165 25 125 42 Z" fill="#c4b5fd" />
              </g>
              
              {/* Face base */}
              <ellipse cx="100" cy="80" rx="55" ry="42" fill="#a78bfa" />
              
              {/* Face details */}
              <g className="eye-group">
                {/* Left Eye */}
                <ellipse cx="75" cy="85" rx="8" ry="12" fill="#1f2937" />
                <circle cx="72" cy="79" r="3.5" fill="#ffffff" />
                <circle cx="78" cy="90" r="2" fill="#ffffff" />
                
                {/* Right Eye */}
                <ellipse cx="125" cy="85" rx="8" ry="12" fill="#1f2937" />
                <circle cx="122" cy="79" r="3.5" fill="#ffffff" />
                <circle cx="128" cy="90" r="2" fill="#ffffff" />
              </g>
              
              {/* Nose */}
              <circle cx="100" cy="96" r="2.5" fill="#f472b6" />
              
              {/* Mouth */}
              <path d="M 92 101 Q 96 106 100 101 Q 104 106 108 101" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
              
              {/* Blush */}
              <ellipse cx="60" cy="100" rx="10" ry="5" fill="#f472b6" opacity="0.4" />
              <ellipse cx="140" cy="100" rx="10" ry="5" fill="#f472b6" opacity="0.4" />
            </g>

            {/* Collar */}
            <path d="M 65 115 Q 100 138 135 115" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />
            
            {/* Bell */}
            <circle cx="100" cy="130" r="9" fill="#fbbf24" />
            <line x1="100" y1="135" x2="100" y2="139" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
            <circle cx="100" cy="133" r="2" fill="#b45309" />
            <path d="M 93 128 Q 100 125 107 128" stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />
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
