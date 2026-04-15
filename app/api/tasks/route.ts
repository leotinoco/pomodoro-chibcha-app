import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGoogleClient } from "@/lib/google";
import { google } from "googleapis";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions); // Type assertion if needed or valid config
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = getGoogleClient(session.accessToken);
  const service = google.tasks({ version: "v1", auth });

  try {
    // Get the first task list for simplicity, or handle multiple lists
    const response = await service.tasklists.list();
    const taskLists = response.data.items;

    const firstListId = taskLists?.[0]?.id;

    if (!firstListId) {
      return NextResponse.json({ tasks: [] });
    }

    const tasksResponse = await service.tasks.list({
      tasklist: firstListId,
      showCompleted: false, // Only show active tasks
      showHidden: false,
    });

    return NextResponse.json({
      tasks: tasksResponse.data.items || [],
      listId: firstListId,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tasklist, task, status, parent, previous, due, title } =
    await req.json();

  const auth = getGoogleClient(session.accessToken);
  const service = google.tasks({ version: "v1", auth });

  try {
    // If 'parent' or 'previous' is provided, we use the 'move' endpoint
    if (parent !== undefined || previous !== undefined) {
      const moveResponse = await service.tasks.move({
        tasklist,
        task,
        parent: parent || undefined, // If null/empty, it moves to root (usually)
        previous: previous || undefined,
      });
      return NextResponse.json(moveResponse.data);
    }

    // Otherwise, we simply patch the task properties (like status or title)
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
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error updating task (Google API)";
    const details =
      process.env.NODE_ENV !== "production" ? { details: message } : {};
    console.error("Error updating task (Google API):", message);
    return NextResponse.json(
      { error: "Failed to update task", ...details },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tasklist, title, status, due } = await req.json();

  const auth = getGoogleClient(session.accessToken);
  const service = google.tasks({ version: "v1", auth });

  try {
    // If no tasklist provided, use the first one (or default)
    let targetTaskListId = tasklist;
    if (!targetTaskListId) {
      const taskLists = await service.tasklists.list();
      targetTaskListId = taskLists.data.items?.[0]?.id;
    }

    const response = await service.tasks.insert({
      tasklist: targetTaskListId,
      requestBody: {
        title,
        status, // 'needsAction' or 'completed'
        due,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
