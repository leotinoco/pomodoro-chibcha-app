import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleClient } from "@/lib/google";
import { google, tasks_v1 } from "googleapis";
import { z } from "zod";

// Google Tasks devuelve 20 elementos por página por defecto (máx. 100).
// Sin paginar, las cuentas con muchas tareas sólo mostraban las primeras 20.
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

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

type TaskWithList = tasks_v1.Schema$Task & {
  listId: string;
  listTitle?: string | null;
};

async function listAllTaskLists(service: tasks_v1.Tasks) {
  const items: tasks_v1.Schema$TaskList[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const response = await service.tasklists.list({
      maxResults: PAGE_SIZE,
      pageToken,
    });
    items.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken ?? undefined;
    pages += 1;
  } while (pageToken && pages < MAX_PAGES);

  return items;
}

async function listAllTasks(
  service: tasks_v1.Tasks,
  tasklist: string,
  params: Pick<
    tasks_v1.Params$Resource$Tasks$List,
    "showCompleted" | "showHidden" | "updatedMin"
  >,
) {
  const items: tasks_v1.Schema$Task[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const response = await service.tasks.list({
      ...params,
      tasklist,
      maxResults: PAGE_SIZE,
      pageToken,
    });
    items.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken ?? undefined;
    pages += 1;
  } while (pageToken && pages < MAX_PAGES);

  return items;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const getCompleted = searchParams.get("completed") === "true";

  const auth = getGoogleClient(token.accessToken as string);
  const service = google.tasks({ version: "v1", auth });

  try {
    const taskLists = (await listAllTaskLists(service)).filter(
      (list): list is tasks_v1.Schema$TaskList & { id: string } => !!list.id,
    );

    const defaultListId = taskLists[0]?.id;

    if (!defaultListId) {
      return NextResponse.json({ tasks: [], lists: [] });
    }

    // Cada tarea viaja con el id de su lista para que las mutaciones
    // (completar, editar, mover) apunten siempre a la lista correcta.
    const withListId = (
      items: tasks_v1.Schema$Task[],
      list: tasks_v1.Schema$TaskList & { id: string },
    ): TaskWithList[] =>
      items.map((task) => ({
        ...task,
        listId: list.id,
        listTitle: list.title,
      }));

    const lists = taskLists.map((list) => ({
      id: list.id,
      title: list.title,
    }));

    if (getCompleted) {
      // Fetch completed tasks from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const perList = await Promise.all(
        taskLists.map(async (list) =>
          withListId(
            await listAllTasks(service, list.id, {
              showCompleted: true,
              showHidden: true,
              updatedMin: sevenDaysAgo.toISOString(),
            }),
            list,
          ),
        ),
      );

      const completedTasks = perList
        .flat()
        .filter((task) => task.status === "completed")
        .sort((a, b) => {
          const dateA = a.completed ? new Date(a.completed).getTime() : 0;
          const dateB = b.completed ? new Date(b.completed).getTime() : 0;
          return dateB - dateA;
        });

      return NextResponse.json({
        tasks: completedTasks,
        listId: defaultListId,
        lists,
      });
    }

    const perList = await Promise.all(
      taskLists.map(async (list) =>
        withListId(
          await listAllTasks(service, list.id, {
            showCompleted: false,
            showHidden: false,
          }),
          list,
        ),
      ),
    );

    return NextResponse.json({
      tasks: perList.flat(),
      listId: defaultListId,
      lists,
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
