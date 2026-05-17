import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleClient } from "@/lib/google";
import { google } from "googleapis";
import { z } from "zod";

const calendarEventSchema = z.object({
  summary: z.string().min(1).max(500).trim(),
  start: z.string().datetime(),
  end: z.string().datetime(),
}).refine((data) => new Date(data.end) > new Date(data.start), {
  message: "end must be after start",
});

const calendarPatchSchema = z.object({
  eventId: z.string().min(1),
  summary: z.string().min(1).max(500).trim(),
});

function sanitizeError() {
  return { error: "Internal server error" };
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = getGoogleClient(token.accessToken as string);
  const calendar = google.calendar({ version: "v3", auth });

  try {
    const now = new Date();
    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: endOfTomorrow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json({
      events: response.data.items || [],
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(sanitizeError(), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = calendarEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { summary, start, end } = parsed.data;

  const auth = getGoogleClient(token.accessToken as string);
  const calendar = google.calendar({ version: "v3", auth });

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(sanitizeError(), { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = calendarPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { eventId, summary } = parsed.data;

  const auth = getGoogleClient(token.accessToken as string);
  const calendar = google.calendar({ version: "v3", auth });

  try {
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: { summary },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json(sanitizeError(), { status: 500 });
  }
}
