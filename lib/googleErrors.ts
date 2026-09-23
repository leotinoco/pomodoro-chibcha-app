import { NextResponse } from "next/server";

/** Código HTTP de un error de googleapis (GaxiosError) o undefined si no lo trae. */
function googleErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { status, code, response } = error as {
    status?: unknown;
    code?: unknown;
    response?: { status?: unknown };
  };
  const value = response?.status ?? status ?? code;
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  return undefined;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "Google rechazó la solicitud.",
  401: "Tu sesión con Google expiró. Vuelve a iniciar sesión.",
  403: "Google no permitió esta acción.",
  404: "No se encontró el elemento en Google. Actualiza la lista.",
  429: "Demasiadas solicitudes a Google. Intenta de nuevo en un momento.",
};

/**
 * Registra el error sin volcar el objeto completo (que incluye la
 * configuración de la petición) y responde con un mensaje apto para el
 * usuario, sin detalles internos.
 */
export function googleErrorResponse(
  context: string,
  error: unknown,
  messages: Partial<Record<number, string>> = {},
) {
  const status = googleErrorStatus(error);
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`${context} (Google API ${status ?? "?"}):`, detail);

  if (status && DEFAULT_MESSAGES[status]) {
    return NextResponse.json(
      { error: messages[status] ?? DEFAULT_MESSAGES[status] },
      { status },
    );
  }

  return NextResponse.json(
    { error: "Ocurrió un error inesperado. Intenta de nuevo." },
    { status: 500 },
  );
}
