import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { runAIChat, type ChatMessage } from "@/lib/ai/orchestrator";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { aiResponseSchema } from "@/types/aiChat";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  imageDataUrl: z
    .string()
    .max(6_000_000)
    .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "Formato de imagen inválido")
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
});

/** Quita cercas ```json … ``` por si un proveedor las agrega a pesar de las instrucciones. */
function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { message, imageDataUrl, history } = parsed.data;

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...(history ?? []).map((h) => ({ role: h.role, content: h.content }) as ChatMessage),
    { role: "user", content: message },
  ];

  let result;
  try {
    result = await runAIChat(messages, imageDataUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    console.error("AI chat: ningún proveedor respondió:", detail);
    return NextResponse.json(
      { error: "Ningún proveedor de IA pudo responder en este momento. Intenta de nuevo en unos minutos." },
      { status: 503 },
    );
  }

  let parsedResponse;
  try {
    parsedResponse = aiResponseSchema.parse(JSON.parse(extractJson(result.text)));
  } catch {
    // El modelo no devolvió JSON válido: lo tratamos como una respuesta de chat plana.
    parsedResponse = { reply: result.text.trim().slice(0, 2000), action: "chat" as const };
  }

  if (imageDataUrl && !result.imageUsed) {
    parsedResponse = {
      ...parsedResponse,
      reply: `(Ningún proveedor con visión disponible pudo leer la imagen; respondo solo con tu texto.)\n\n${parsedResponse.reply}`,
    };
  }

  return NextResponse.json({ ...parsedResponse, providerLabel: result.providerLabel });
}
