"use client";

import { useCallback, useState } from "react";

interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

/**
 * Envuelve la Web Speech API (dictado por voz) para reutilizarla en distintos
 * inputs de la app (tareas, eventos, el chat de IA) sin repetir el manejo de
 * errores y permisos.
 */
export function useVoiceInput(lang: string = "es-CO") {
  const [isListening, setIsListening] = useState(false);

  const isSupported = typeof window !== "undefined" && !!getSpeechRecognitionCtor();

  const start = useCallback(
    (onResult: (transcript: string) => void) => {
      const SpeechRecognition = getSpeechRecognitionCtor();
      if (!SpeechRecognition) {
        console.warn("La API de Web Speech no está soportada en este navegador.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed") {
          alert(
            "El acceso al micrófono fue denegado. Por favor, permite el uso del micrófono en la configuración de tu navegador (el ícono del candado en la barra de direcciones) y recarga la página.",
          );
        } else {
          console.warn("Aviso en reconocimiento de voz:", event.error);
        }
      };

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    },
    [lang],
  );

  return { start, isListening, isSupported };
}
