import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleClient } from "@/lib/google";
import { googleErrorResponse } from "@/lib/googleErrors";
import { calendar_v3, google } from "googleapis";
import { z } from "zod";
import type { CalendarEvent } from "@/types/calendar";

const calendarEventSchema = z.object({
  summary: z.string().min(1).max(500).trim(),
  start: z.string().datetime(),
  end: z.string().datetime(),
}).refine((data) => new Date(data.end) > new Date(data.start), {
  message: "end must be after start",
});

const calendarPatchSchema = z.object({
  eventId: z.string().min(1).max(1024),
  summary: z.string().min(1).max(500).trim(),
});

// Sólo los campos que muestra el panel: evita traer asistentes, correos, etc.
const EVENT_FIELDS = [
  "id",
  "summary",
  "description",
  "location",
  "htmlLink",
  "hangoutLink",
  "start",
  "end",
  "conferenceData(conferenceSolution/name,entryPoints(entryPointType,uri,label,pin))",
  "attachments(title,fileUrl)",
].join(",");

function toClientEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  const entryPoints = event.conferenceData?.entryPoints ?? [];
  const video = entryPoints.find((e) => e.entryPointType === "video" && e.uri);
  const phone = entryPoints.find((e) => e.entryPointType === "phone" && e.uri);

  return {
    id: event.id ?? "",
    summary: event.summary || "(Sin título)",
    start: {
      dateTime: event.start?.dateTime ?? undefined,
      date: event.start?.date ?? undefined,
    },
    end: {
      dateTime: event.end?.dateTime ?? undefined,
      date: event.end?.date ?? undefined,
    },
    description: event.description || undefined,
    location: event.location || undefined,
    htmlLink: event.htmlLink || undefined,
    meetLink: video?.uri || event.hangoutLink || undefined,
    conferenceName: event.conferenceData?.conferenceSolution?.name || undefined,
    phone: phone?.uri
      ? {
          uri: phone.uri,
          label: phone.label || undefined,
          pin: phone.pin || undefined,
        }
      : undefined,
    attachments: (event.attachments ?? []).flatMap((a) =>
      a.fileUrl ? [{ title: a.title || undefined, fileUrl: a.fileUrl }] : [],
    ),
  };
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
      fields: `items(${EVENT_FIELDS})`,
    });

    return NextResponse.json({
      events: (response.data.items || [])
        .filter((event) => event.id)
        .map(toClientEvent),
    });
  } catch (error) {
    return googleErrorResponse("Error fetching calendar events", error);
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
    return googleErrorResponse("Error creating calendar event", error);
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
    return googleErrorResponse("Error updating calendar event", error);
  }
}
