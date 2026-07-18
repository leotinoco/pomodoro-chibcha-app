import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map<string, { count: number; reset: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function cleanup() {
  const now = Date.now();
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
  const now = Date.now();

  cleanup();

  let entry = rateLimit.get(ip);

  if (!entry || now > entry.reset) {
    entry = { count: 1, reset: now + WINDOW_MS };
    rateLimit.set(ip, entry);
    return NextResponse.next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
