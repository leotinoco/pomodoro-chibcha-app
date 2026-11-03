import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map<string, { count: number; reset: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const MAX_ENTRIES = 10_000;

let lastCleanup = 0;

function evictExpired(now: number) {
  for (const [key, value] of rateLimit.entries()) {
    if (value.reset < now) {
      rateLimit.delete(key);
    }
  }
}

// Recorrer el mapa en cada petición hacía que muchas IPs distintas encarecieran
// cada solicitud; basta con limpiarlo una vez por ventana.
function cleanup(now: number) {
  if (now - lastCleanup < WINDOW_MS) return;
  lastCleanup = now;
  evictExpired(now);
}

function getClientIp(request: NextRequest): string {
  // Prefer headers injected by trusted reverse proxies (Vercel/Nginx) over
  // generic x-forwarded-for, where upstream proxies may append rather than replace.
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "127.0.0.1";
}

export function proxy(request: NextRequest) {
  const ip = getClientIp(request);
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
    if (!entry && rateLimit.size >= MAX_ENTRIES) {
      evictExpired(now);
      if (rateLimit.size >= MAX_ENTRIES) {
        const oldestKey = rateLimit.keys().next().value;
        if (oldestKey !== undefined) rateLimit.delete(oldestKey);
      }
    }
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
