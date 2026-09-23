import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map<string, { count: number; reset: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

let lastCleanup = 0;

// Recorrer el mapa en cada petición hacía que muchas IPs distintas encarecieran
// cada solicitud; basta con limpiarlo una vez por ventana.
function cleanup(now: number) {
  if (now - lastCleanup < WINDOW_MS) return;
  lastCleanup = now;
  for (const [key, value] of rateLimit.entries()) {
    if (value.reset < now) {
      rateLimit.delete(key);
    }
  }
}

export function proxy(request: NextRequest) {
  // x-forwarded-for may be a list ("client, proxy1, proxy2"); the first
  // entry is the original client.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";
  // Separate buckets: NextAuth polls /api/auth/session on every tab focus and
  // must not use up the quota of the Google-backed endpoints.
  const bucket = request.nextUrl.pathname.startsWith("/api/auth/")
    ? "auth"
    : "data";
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  cleanup(now);

  const entry = rateLimit.get(key);

  if (!entry || now > entry.reset) {
    rateLimit.set(key, { count: 1, reset: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.reset - now) / 1000)),
        },
      },
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
