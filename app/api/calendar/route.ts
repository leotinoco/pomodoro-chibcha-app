import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGoogleClient } from "@/lib/google";
import { google } from "googleapis";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = getGoogleClient(session.accessToken);
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
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { summary, start, end } = await req.json();

  if (!summary || !start || !end) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const auth = getGoogleClient(session.accessToken);
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error creating calendar event";
    const details =
      process.env.NODE_ENV !== "production" ? { details: message } : {};
    console.error("Error creating calendar event:", message);
    return NextResponse.json(
      { error: "Failed to create event", ...details },
      { status: 500 },
    );
  }
}
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, summary } = await req.json();

  if (!eventId || !summary) {
    return NextResponse.json(
      { error: "Missing required fields: eventId and summary" },
      { status: 400 },
    );
  }

  const auth = getGoogleClient(session.accessToken);
  const calendar = google.calendar({ version: "v3", auth });

  try {
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: { summary },
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error updating calendar event";
    const details =
      process.env.NODE_ENV !== "production" ? { details: message } : {};
    console.error("Error updating calendar event:", message);
    return NextResponse.json(
      { error: "Failed to update event", ...details },
      { status: 500 },
    );
  }
}
