"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import {
  Sparkles,
  Send,
  Mic,
  ImagePlus,
  X,
  Loader2,
  CalendarPlus,
  ListPlus,
  ListChecks,
  Timer,
  Check,
} from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { AIChatApiResponse, AIResponse } from "@/types/aiChat";
import type { QueueStep } from "@/hooks/usePomodoro";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
  proposal?: AIResponse;
  providerLabel?: string;
  confirmed?: boolean;
}

const REMINDER_OPTIONS = [15, 10, 5];

/** Mensaje de error de la API (ya apto para el usuario) o el texto por defecto. */
function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function notifyTasksChanged() {
  window.dispatchEvent(new Event("pomodoro-chibcha:refresh-tasks"));
}

export default function AIChat({
  onLoadQueue,
}: {
  onLoadQueue: (steps: QueueStep[]) => void;
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderChoice, setReminderChoice] = useState<Set<number>>(new Set([15]));
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { start: startVoice, isListening, isSupported: voiceSupported } = useVoiceInput();

  const toggleReminder = (minutes: number) => {
    setReminderChoice((prev) => {
      const next = new Set(prev);
      if (next.has(minutes)) next.delete(minutes);
      else next.add(minutes);
      return next;
    });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    e.preventDefault();
    setImageDataUrl(await readFileAsDataUrl(file));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageDataUrl(await readFileAsDataUrl(file));
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !imageDataUrl) return;
    if (!session) {
      setError("Inicia sesión con Google para usar el asistente de IA.");
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || "(imagen sin descripción)",
      imageDataUrl: imageDataUrl ?? undefined,
    };

    const history = messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setImageDataUrl(null);
    setIsSending(true);
    setError(null);

    try {
      const res = await axios.post<AIChatApiResponse>("/api/ai/chat", {
        message: userMessage.content,
        imageDataUrl: userMessage.imageDataUrl,
        history,
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.data.reply,
        proposal: res.data,
        providerLabel: res.data.providerLabel,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(apiErrorMessage(err, "El asistente no pudo responder. Intenta de nuevo."));
    } finally {
      setIsSending(false);
    }
  };

  const markConfirmed = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, confirmed: true } : m)));
  };

  const confirmTask = async (message: ChatMessage) => {
    const task = message.proposal?.task;
    if (!task) return;
    setBusyMessageId(message.id);
    try {
      await axios.post("/api/tasks", { title: task.title, status: "needsAction", due: task.due });
      markConfirmed(message.id);
      notifyTasksChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo crear la tarea."));
    } finally {
      setBusyMessageId(null);
    }
  };

  const confirmEvent = async (message: ChatMessage) => {
    const event = message.proposal?.event;
    if (!event) return;
    setBusyMessageId(message.id);
    try {
      await axios.post("/api/calendar", {
        summary: event.summary,
        start: event.start,
        end: event.end,
        reminderMinutes: Array.from(reminderChoice),
      });
      markConfirmed(message.id);
      notifyTasksChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo crear el evento."));
    } finally {
      setBusyMessageId(null);
    }
  };

  const confirmBreakdown = async (message: ChatMessage) => {
    const breakdown = message.proposal?.breakdown;
    if (!breakdown) return;
    setBusyMessageId(message.id);
    try {
      // Necesitamos el id de la lista para poder anidar las subtareas después.
      const listRes = await axios.get("/api/tasks");
      const tasklist = listRes.data.listId as string;

      const parent = await axios.post("/api/tasks", {
        tasklist,
        title: breakdown.title,
        status: "needsAction",
      });
      const parentId = parent.data.id as string;

      for (const subtask of breakdown.subtasks) {
        const created = await axios.post("/api/tasks", {
          tasklist,
          title: `${subtask.title} (${subtask.minutes} min)`,
          status: "needsAction",
        });
        await axios.patch("/api/tasks", {
          tasklist,
          task: created.data.id,
          parent: parentId,
        });
      }

      markConfirmed(message.id);
      notifyTasksChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudieron crear las subtareas."));
    } finally {
      setBusyMessageId(null);
    }
  };

  const sendToPomodoro = (message: ChatMessage) => {
    const breakdown = message.proposal?.breakdown;
    if (!breakdown) return;
    onLoadQueue(breakdown.subtasks.map((s) => ({ title: s.title, minutes: s.minutes })));
  };

  const startVoiceTyping = () => {
    startVoice((transcript) =>
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript)),
    );
  };

  const formatDateTime = (iso: string) => {
    try {
      return format(parseISO(iso), "EEE d MMM, h:mm a");
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-neutral-800 shadow-xl flex flex-col h-full max-h-[720px]">
      <div className="flex items-center gap-2 p-4 border-b border-neutral-800">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Asistente IA</h2>
        <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-neutral-800/60 rounded-full px-2 py-0.5 ml-auto">
          10 proveedores en cascada
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            Pega una imagen o escribe algo como &ldquo;tengo que preparar el informe, máximo 2
            horas&rdquo; o &ldquo;agéndame reunión con Ana mañana a las 3pm&rdquo;.
          </p>
        )}

        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-gray-200"
              }`}
            >
              {message.imageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.imageDataUrl}
                  alt="Imagen adjunta"
                  className="rounded-lg mb-2 max-h-40 object-cover"
                />
              )}
              <p className="whitespace-pre-wrap break-words">{message.content}</p>

              {message.providerLabel && (
                <p className="text-[10px] text-gray-500 mt-1">vía {message.providerLabel}</p>
              )}

              {/* Propuesta: crear tarea */}
              {message.proposal?.action === "create_task" && message.proposal.task && (
                <div className="mt-3 bg-neutral-900/60 border border-neutral-700 rounded-xl p-3">
                  <p className="text-white font-medium flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-blue-400" />
                    {message.proposal.task.title}
                  </p>
                  {message.proposal.task.due && (
                    <p className="text-xs text-gray-400 mt-1">
                      Vence: {formatDateTime(message.proposal.task.due)}
                    </p>
                  )}
                  <button
                    onClick={() => confirmTask(message)}
                    disabled={message.confirmed || busyMessageId === message.id}
                    className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    {busyMessageId === message.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : message.confirmed ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : null}
                    {message.confirmed ? "Tarea creada" : "Agregar tarea"}
                  </button>
                </div>
              )}

              {/* Propuesta: crear evento */}
              {message.proposal?.action === "create_event" && message.proposal.event && (
                <div className="mt-3 bg-neutral-900/60 border border-neutral-700 rounded-xl p-3">
                  <p className="text-white font-medium flex items-center gap-2">
                    <CalendarPlus className="w-4 h-4 text-purple-400" />
                    {message.proposal.event.summary}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(message.proposal.event.start)} –{" "}
                    {formatDateTime(message.proposal.event.end)}
                  </p>

                  {!message.confirmed && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">
                        Avisar antes:
                      </span>
                      {REMINDER_OPTIONS.map((minutes) => (
                        <label
                          key={minutes}
                          className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={reminderChoice.has(minutes)}
                            onChange={() => toggleReminder(minutes)}
                            className="accent-purple-500"
                          />
                          {minutes}m
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => confirmEvent(message)}
                    disabled={message.confirmed || busyMessageId === message.id}
                    className="mt-2 w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    {busyMessageId === message.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : message.confirmed ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : null}
                    {message.confirmed ? "Evento creado" : "Agregar al calendario"}
                  </button>
                </div>
              )}

              {/* Propuesta: dividir tarea grande */}
              {message.proposal?.action === "task_breakdown" && message.proposal.breakdown && (
                <div className="mt-3 bg-neutral-900/60 border border-neutral-700 rounded-xl p-3">
                  <p className="text-white font-medium flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-indigo-400" />
                    {message.proposal.breakdown.title}
                    <span className="text-[10px] text-gray-500 font-normal">
                      ({message.proposal.breakdown.totalMinutes} min)
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {message.proposal.breakdown.subtasks.map((subtask, i) => (
                      <li
                        key={i}
                        style={{ animationDelay: `${i * 80}ms` }}
                        className="animate-fade-slide-in flex items-center justify-between gap-2 bg-neutral-800/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                      >
                        <span className="truncate">{subtask.title}</span>
                        <span className="text-gray-500 flex-shrink-0">{subtask.minutes}m</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => confirmBreakdown(message)}
                      disabled={message.confirmed || busyMessageId === message.id}
                      className="py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      {busyMessageId === message.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : message.confirmed ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : null}
                      {message.confirmed ? "Subtareas creadas" : "Crear subtareas"}
                    </button>
                    <button
                      onClick={() => sendToPomodoro(message)}
                      className="py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      Enviar al Pomodoro
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 text-gray-400 rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Pensando…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-200">
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} aria-label="Cerrar aviso">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="p-4 border-t border-neutral-800 space-y-2">
        {imageDataUrl && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="Vista previa" className="h-16 rounded-lg" />
            <button
              onClick={() => setImageDataUrl(null)}
              className="absolute -top-1.5 -right-1.5 bg-neutral-900 border border-neutral-700 rounded-full p-0.5 text-gray-300 hover:text-white"
              aria-label="Quitar imagen"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-purple-400 hover:bg-white/5 rounded-xl transition-colors flex-shrink-0"
            title="Adjuntar imagen"
            aria-label="Adjuntar imagen"
          >
            <ImagePlus className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSending) send();
            }}
            placeholder="Escribe o pega una imagen…"
            className="flex-1 min-w-0 bg-neutral-800/60 text-white placeholder-gray-500 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            disabled={isSending}
          />

          {voiceSupported && (
            <button
              onClick={startVoiceTyping}
              className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                isListening
                  ? "text-red-400 bg-red-500/10 animate-pulse"
                  : "text-gray-400 hover:text-purple-400 hover:bg-white/5"
              }`}
              title="Enviar nota de voz"
              aria-label="Enviar nota de voz"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={send}
            disabled={isSending || (!input.trim() && !imageDataUrl)}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
            aria-label="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
