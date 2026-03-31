import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGoogleClient } from "@/lib/google";
import { google } from "googleapis";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
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

    console.log("Calendar API Response Events:", response.data.items?.length);
    if (response.data.items?.length === 0) {
      console.log(
        "No events found. Time range:",
        now.toISOString(),
        "to",
        endOfTomorrow.toISOString(),
      );
    }

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
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: "Failed to create event", details: error.message },
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
  } catch (error: any) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      { error: "Failed to update event", details: error.message },
      { status: 500 },
    );
  }
}
