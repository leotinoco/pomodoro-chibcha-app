import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleClient } from "@/lib/google";
import { google } from "googleapis";
import { z } from "zod";

const taskPatchSchema = z.object({
  tasklist: z.string().min(1),
  task: z.string().min(1),
  status: z.enum(["needsAction", "completed"]).optional(),
  parent: z.string().optional().nullable(),
  previous: z.string().optional().nullable(),
  due: z.string().datetime().optional().nullable(),
  title: z.string().min(1).max(1024).trim().optional(),
});

const taskCreateSchema = z.object({
  tasklist: z.string().optional(),
  title: z.string().min(1).max(1024).trim(),
  status: z.enum(["needsAction", "completed"]).optional(),
  due: z.string().datetime().optional().nullable(),
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
  const service = google.tasks({ version: "v1", auth });

  try {
    const response = await service.tasklists.list();
    const taskLists = response.data.items;

    const firstListId = taskLists?.[0]?.id;

    if (!firstListId) {
      return NextResponse.json({ tasks: [] });
    }

    const tasksResponse = await service.tasks.list({
      tasklist: firstListId,
      showCompleted: false,
      showHidden: false,
    });

    return NextResponse.json({
      tasks: tasksResponse.data.items || [],
      listId: firstListId,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
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

  const parsed = taskPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tasklist, task, status, parent, previous, due, title } = parsed.data;

  const auth = getGoogleClient(token.accessToken as string);
  const service = google.tasks({ version: "v1", auth });

  try {
    if (parent !== undefined || previous !== undefined) {
      const moveResponse = await service.tasks.move({
        tasklist,
        task,
        parent: parent || undefined,
        previous: previous || undefined,
      });
      return NextResponse.json(moveResponse.data);
    }

    const response = await service.tasks.patch({
      tasklist,
      task,
      requestBody: {
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
        ...(due !== undefined && { due }),
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error updating task (Google API):", error);
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

  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tasklist, title, status, due } = parsed.data;

  const auth = getGoogleClient(token.accessToken as string);
  const service = google.tasks({ version: "v1", auth });

  try {
    let targetTaskListId = tasklist;
    if (!targetTaskListId) {
      const taskLists = await service.tasklists.list();
      targetTaskListId = taskLists.data.items?.[0]?.id ?? undefined;
    }

    const response = await service.tasks.insert({
      tasklist: targetTaskListId,
      requestBody: {
        title,
        status,
        due,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(sanitizeError(), { status: 500 });
  }
}
