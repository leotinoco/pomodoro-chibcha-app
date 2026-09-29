import { AI_PROVIDERS, AIProviderConfig } from "./providers";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIChatResult {
  text: string;
  providerId: string;
  providerLabel: string;
  /** false si había una imagen pero el proveedor que respondió no la pudo leer. */
  imageUsed: boolean;
}

const REQUEST_TIMEOUT_MS = 20000;

class ProviderError extends Error {
  constructor(
    public providerId: string,
    public status: number | undefined,
    detail: string,
  ) {
    super(detail);
    this.name = "ProviderError";
  }
}

async function safeText(res: Response) {
  try {
    const body = await res.text();
    return body.slice(0, 300);
  } catch {
    return res.statusText;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Convierte un data URL (data:image/png;base64,AAAA...) en mime type + base64 crudo. */
function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

async function callOpenAICompatible(
  cfg: AIProviderConfig,
  apiKey: string,
  messages: ChatMessage[],
  imageDataUrl: string | undefined,
): Promise<string> {
  type Part =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

  const chatMessages: { role: string; content: string | Part[] }[] = messages.map(
    (m) => ({ role: m.role, content: m.content }),
  );

  if (imageDataUrl) {
    const last = chatMessages[chatMessages.length - 1];
    if (last && last.role === "user" && typeof last.content === "string") {
      last.content = [
        { type: "text", text: last.content },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ];
    }
  }

  const res = await fetchWithTimeout(cfg.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: chatMessages,
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) throw new ProviderError(cfg.id, res.status, await safeText(res));

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new ProviderError(cfg.id, res.status, "Respuesta vacía");
  }
  return text;
}

async function callGemini(
  cfg: AIProviderConfig,
  apiKey: string,
  messages: ChatMessage[],
  imageDataUrl: string | undefined,
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system");

  const contents = turns.map((m, i) => {
    const isLast = i === turns.length - 1;
    const parts: Record<string, unknown>[] = [{ text: m.content }];
    if (isLast && m.role === "user" && imageDataUrl) {
      const parsed = parseDataUrl(imageDataUrl);
      if (parsed) {
        parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.base64 } });
      }
    }
    return { role: m.role === "assistant" ? "model" : "user", parts };
  });

  const body: Record<string, unknown> = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const res = await fetchWithTimeout(`${cfg.baseUrl}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new ProviderError(cfg.id, res.status, await safeText(res));

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p.text ?? "").join("")
    : undefined;

  if (!text || !text.trim()) throw new ProviderError(cfg.id, res.status, "Respuesta vacía");
  return text;
}

async function callCohere(
  cfg: AIProviderConfig,
  apiKey: string,
  messages: ChatMessage[],
): Promise<string> {
  const res = await fetchWithTimeout(cfg.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new ProviderError(cfg.id, res.status, await safeText(res));

  const data = await res.json();
  const text = data?.message?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new ProviderError(cfg.id, res.status, "Respuesta vacía");
  }
  return text;
}

/**
 * Intenta cada proveedor configurado en orden hasta obtener una respuesta.
 * Si hay imagen, prioriza los proveedores con visión; si ninguno de esos
 * tiene key/responde, sigue con los de solo texto (sin la imagen) para no
 * dejar al usuario sin respuesta.
 */
export async function runAIChat(
  messages: ChatMessage[],
  imageDataUrl?: string,
): Promise<AIChatResult> {
  const order = imageDataUrl
    ? [
        ...AI_PROVIDERS.filter((p) => p.supportsImage),
        ...AI_PROVIDERS.filter((p) => !p.supportsImage),
      ]
    : AI_PROVIDERS;

  const errors: string[] = [];
  let triedAny = false;

  for (const cfg of order) {
    const apiKey = process.env[cfg.envKey];
    if (!apiKey) continue;
    triedAny = true;

    const useImage = !!imageDataUrl && cfg.supportsImage;

    try {
      let text: string;
      if (cfg.kind === "gemini") {
        text = await callGemini(cfg, apiKey, messages, useImage ? imageDataUrl : undefined);
      } else if (cfg.kind === "cohere") {
        text = await callCohere(cfg, apiKey, messages);
      } else {
        text = await callOpenAICompatible(cfg, apiKey, messages, useImage ? imageDataUrl : undefined);
      }

      return { text, providerId: cfg.id, providerLabel: cfg.label, imageUsed: useImage };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`${cfg.label}: ${detail}`);
    }
  }

  if (!triedAny) {
    throw new Error(
      "No hay ninguna API key de IA configurada. Agrega al menos una en las variables de entorno (ver .env.example).",
    );
  }

  throw new Error(`Ningún proveedor de IA respondió. Detalles: ${errors.join(" | ")}`);
}
