import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGoogleClient } from "@/lib/google";
import { google } from "googleapis";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
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
    console.log("Found Task Lists:", taskLists?.length);
    taskLists?.forEach((list) =>
      console.log(`- List: ${list.title} (${list.id})`),
    );

    const firstListId = taskLists?.[0]?.id;

    if (!firstListId) {
      console.log("No task lists found.");
      return NextResponse.json({ tasks: [] });
    }

    const tasksResponse = await service.tasks.list({
      tasklist: firstListId,
      showCompleted: false, // Only show active tasks
      showHidden: false,
    });

    console.log(
      "Tasks found in list",
      firstListId,
      ":",
      tasksResponse.data.items?.length,
    );

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

  const { tasklist, task, status, parent, previous, due, title } = await req.json();

  console.log("PATCH /api/tasks received:", {
    tasklist,
    task,
    status,
    parent,
    previous,
    due,
    title,
  });

  const auth = getGoogleClient(session.accessToken);
  const service = google.tasks({ version: "v1", auth });

  try {
    // If 'parent' or 'previous' is provided, we use the 'move' endpoint
    if (parent !== undefined || previous !== undefined) {
      console.log("Moving task...", { parent, previous });
      const moveResponse = await service.tasks.move({
        tasklist,
        task,
        parent: parent || undefined, // If null/empty, it moves to root (usually)
        previous: previous || undefined,
      });
      console.log("Google Tasks move success:", moveResponse.status);
      return NextResponse.json(moveResponse.data);
    }

    // Otherwise, we simply patch the task properties (like status or title)
    console.log("Calling Google Tasks patch...");
    const response = await service.tasks.patch({
      tasklist,
      task,
      requestBody: {
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
        ...(due !== undefined && { due }),
      },
    });
    console.log("Google Tasks patch success:", response.status);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "Error updating task (Google API):",
      error.message,
      error.response?.data,
    );
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
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
