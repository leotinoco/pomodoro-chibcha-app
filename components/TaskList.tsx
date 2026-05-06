"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCcw,
  Calendar as CalendarIcon,
  Plus,
  CornerDownRight,
  Clock,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import confetti from "canvas-confetti";

interface Task {
  id: string;
  title: string;
  due?: string;
  status: "needsAction" | "completed";
  parent?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

function SortableTaskItem({
  task,
  isCompleted,
  isSubtask,
  onComplete,
  getTrafficLightColor,
  isEditing,
  editTitle,
  editDue,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditTitleChange,
  onEditDueChange,
  isSaving,
}: {
  task: Task;
  isCompleted: boolean;
  isSubtask: boolean;
  onComplete: (id: string) => void;
  getTrafficLightColor: (date?: string) => string;
  isEditing: boolean;
  editTitle: string;
  editDue: string;
  onEditStart: (task: Task) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onEditTitleChange: (v: string) => void;
  onEditDueChange: (v: string) => void;
  isSaving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const elementRef = useRef<HTMLDivElement>(null);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      elementRef.current = node;
    },
    [setNodeRef],
  );

  useLayoutEffect(() => {
    if (elementRef.current) {
      elementRef.current.style.transform =
        CSS.Transform.toString(transform) ?? "";
      elementRef.current.style.transition = transition || "";
    }
  }, [transform, transition]);

  return (
    <div
      ref={setRefs}
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
      className={`group flex items-start gap-3 p-4 bg-neutral-800/40 rounded-xl transition-all border border-transparent ${isCompleted ? "opacity-60" : "hover:bg-neutral-800/80 hover:border-neutral-700"} ${isSubtask ? "ml-8 border-l-2 border-neutral-700" : ""} ${isEditing ? "" : "touch-none"}`}
    >
      {isSubtask && (
        <CornerDownRight className="w-4 h-4 text-gray-500 -ml-2 mr-1" />
      )}

      {/* Complete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing) onComplete(task.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex-shrink-0 transition-colors ${isCompleted ? "text-green-500 cursor-default" : "text-gray-400 hover:text-blue-500"}`}
        aria-label="Complete task"
        disabled={isCompleted || isEditing}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>

      {isEditing ? (
        /* ── Inline edit mode ── */
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full bg-neutral-700/60 text-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            aria-label="Edit task title"
            autoFocus
          />
          <input
            type="date"
            value={editDue}
            onChange={(e) => onEditDueChange(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-neutral-700/60 text-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all calendar-picker-indicator-white"
            aria-label="Edit task due date"
          />
        </div>
      ) : (
        /* ── Display mode ── */
        <div className="flex-1 min-w-0 pointer-events-none">
          <p
            className={`text-gray-200 font-medium break-words ${isCompleted ? "line-through text-gray-500" : ""}`}
          >
            {task.title}
          </p>
          {task.due && (
            <p className="text-xs text-gray-500 mt-0.5">
              Due: {format(parseISO(task.due), "MMM d")}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!isCompleted && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEditSave(); }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={isSaving || !editTitle.trim()}
                className="p-1.5 text-green-400 hover:text-green-300 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Save task"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEditCancel(); }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={isSaving}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Cancel edit"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onEditStart(task); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Edit task"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Traffic light (only in display mode) */}
      {task.due && !isCompleted && !isEditing && (
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${getTrafficLightColor(task.due)} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
          title="Priority Status"
        />
      )}
    </div>
  );
}

export default function TaskList() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [listId, setListId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Inline task editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Inline calendar event editing state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventSummary, setEditEventSummary] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Calendar Event Creation State
  const [newEventSummary, setNewEventSummary] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Load tasks on mount or session change
  useEffect(() => {
    if (session?.accessToken) {
      fetchTasks();
    } else {
      // Load local tasks
      const savedTasks = localStorage.getItem("localTasks");
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (e) {
          console.error("Failed to parse local tasks", e);
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
    }
  }, [session?.accessToken]);

  const saveLocalTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("localTasks", JSON.stringify(newTasks));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find indices
    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    const newIndex = tasks.findIndex((t) => t.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // Create new array with moved item
    const newTasks = [...tasks];
    const [movedItem] = newTasks.splice(oldIndex, 1);

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask || !overTask) return;

    let newParentId: string | undefined;
    if (!overTask.parent) {
      newParentId = overTask.id;
    } else {
      newParentId = overTask.parent;
    }

    if (activeTask.parent === newParentId) {
      return;
    }

    // Update parent
    const updatedTasks = tasks.map((t) =>
      t.id === activeId ? { ...t, parent: newParentId } : t,
    );

    if (!session) {
      saveLocalTasks(updatedTasks);
      return;
    }

    setTasks(updatedTasks); // Optimistic update

    try {
      await axios.patch("/api/tasks", {
        tasklist: listId,
        task: activeId,
        parent: newParentId,
      });
    } catch (error) {
      console.error("Failed to move task", error);
      fetchTasks();
    }
  };

  // Track locally completed tasks to keep them visible and struck through
  const [locallyCompleted, setLocallyCompleted] = useState<Set<string>>(
    new Set(),
  );

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(
    new Set(),
  );

  // Load completed events from local storage to persist daily checkmarks
  useEffect(() => {
    const savedEvents = localStorage.getItem("completedCalendarEvents");
    if (savedEvents) {
      try {
        setCompletedEvents(new Set(JSON.parse(savedEvents)));
      } catch (e) {
        console.error("Failed to parse completed events", e);
      }
    }
  }, []);

  const saveCompletedEvents = (newSet: Set<string>) => {
    setCompletedEvents(newSet);
    localStorage.setItem(
      "completedCalendarEvents",
      JSON.stringify(Array.from(newSet)),
    );
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsAdding(true);
    let dueISO = undefined;
    if (newTaskDue) {
      const date = new Date(newTaskDue);
      date.setHours(12, 0, 0, 0);
      dueISO = date.toISOString();
    }

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
      colors: ["#60A5FA", "#818CF8"],
    });

    if (!session) {
      const newLocalTask: Task = {
        id: crypto.randomUUID(),
        title: newTask,
        status: "needsAction",
        due: dueISO,
      };
      saveLocalTasks([newLocalTask, ...tasks]);
      setNewTask("");
      setNewTaskDue("");
      setIsAdding(false);
      return;
    }

    try {
      await axios.post("/api/tasks", {
        tasklist: listId,
        title: newTask,
        status: "needsAction",
        due: dueISO,
      });
      setNewTask("");
      setNewTaskDue("");
      await fetchTasks();
    } catch (error) {
      console.error("Failed to add task", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newEventSummary.trim() ||
      !newEventDate ||
      !newEventTime ||
      !session?.accessToken
    )
      return;

    setIsAddingEvent(true);
    try {
      const startDateTime = new Date(`${newEventDate}T${newEventTime}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      await axios.post("/api/calendar", {
        summary: newEventSummary,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
      });

      setNewEventSummary("");
      setNewEventDate("");
      setNewEventTime("");

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#A78BFA", "#F472B6"],
      });

      await fetchTasks();
    } catch (error) {
      console.error("Failed to add event", error);
    } finally {
      setIsAddingEvent(false);
    }
  };

  const fetchTasks = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/tasks");
      const serverTasks = res.data.tasks || [];
      setTasks(serverTasks);
      setListId(res.data.listId);

      const calendarRes = await axios.get("/api/calendar");
      setEvents(calendarRes.data.events || []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setLocallyCompleted((prev) => new Set(prev).add(taskId));

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (!session) {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: "completed" as const } : t,
      );
      saveLocalTasks(updatedTasks);
      return;
    }

    try {
      await axios.patch("/api/tasks", {
        tasklist: listId,
        task: taskId,
        status: "completed",
      });
    } catch (error) {
      console.error("Failed to complete task", error);
      setLocallyCompleted((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      fetchTasks();
    }
  };

  // ── Inline task edit handlers ──
  const handleTaskEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDue(task.due ? task.due.slice(0, 10) : "");
  };

  const handleTaskEditCancel = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDue("");
  };

  const handleTaskEditSave = async () => {
    if (!editingTaskId || !editTitle.trim()) return;
    setIsSavingTask(true);

    let dueISO: string | undefined = undefined;
    if (editDue) {
      const date = new Date(editDue);
      date.setHours(12, 0, 0, 0);
      dueISO = date.toISOString();
    }

    if (!session) {
      // Local update
      const updated = tasks.map((t) =>
        t.id === editingTaskId
          ? { ...t, title: editTitle.trim(), due: dueISO }
          : t,
      );
      saveLocalTasks(updated);
      handleTaskEditCancel();
      setIsSavingTask(false);
      return;
    }

    try {
      await axios.patch("/api/tasks", {
        tasklist: listId,
        task: editingTaskId,
        title: editTitle.trim(),
        due: dueISO,
      });
      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? { ...t, title: editTitle.trim(), due: dueISO }
            : t,
        ),
      );
      handleTaskEditCancel();
    } catch (error) {
      console.error("Failed to update task", error);
    } finally {
      setIsSavingTask(false);
    }
  };

  // ── Inline calendar event edit handlers ──
  const handleEventEditStart = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setEditEventSummary(event.summary);
  };

  const handleEventEditCancel = () => {
    setEditingEventId(null);
    setEditEventSummary("");
  };

  const handleEventEditSave = async () => {
    if (!editingEventId || !editEventSummary.trim()) return;
    setIsSavingEvent(true);

    try {
      await axios.patch("/api/calendar", {
        eventId: editingEventId,
        summary: editEventSummary.trim(),
      });
      // Optimistic UI update
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEventId
            ? { ...e, summary: editEventSummary.trim() }
            : e,
        ),
      );
      handleEventEditCancel();
    } catch (error) {
      console.error("Failed to update event", error);
    } finally {
      setIsSavingEvent(false);
    }
  };

  const completeEvent = async (event: CalendarEvent) => {
    if (completedEvents.has(event.id)) return;

    const newCompleted = new Set(completedEvents);
    newCompleted.add(event.id);
    saveCompletedEvents(newCompleted);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    try {
      await axios.post("/api/tasks", {
        tasklist: listId,
        title: `[Calendar] ${event.summary}`,
        status: "completed",
      });
    } catch (error) {
      console.error("Failed to sync completed event to tasks", error);
    }
  };

  const getEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime) {
      return format(parseISO(event.start.dateTime), "h:mm a");
    }
    return "All Day";
  };

  const filterEvents = (
    eventList: CalendarEvent[],
    day: "today" | "tomorrow",
  ) => {
    return eventList.filter((e) => {
      const start = e.start.dateTime || e.start.date;
      if (!start) return false;
      const date = parseISO(start);
      if (day === "today") return isToday(date);
      if (day === "tomorrow") return isTomorrow(date);
      return false;
    });
  };

  const todayEvents = filterEvents(events, "today");
  const tomorrowEvents = filterEvents(events, "tomorrow");

  // Group tasks to ensure subtasks appear under their parents
  const groupedTasks = (() => {
    const roots = tasks.filter((t) => !t.parent);
    const childrenMap = new Map<string, Task[]>();

    tasks
      .filter((t) => t.parent)
      .forEach((t) => {
        if (t.parent) {
          const current = childrenMap.get(t.parent) || [];
          current.push(t);
          childrenMap.set(t.parent, current);
        }
      });

    const result: Task[] = [];
    roots.forEach((root) => {
      result.push(root);
      if (childrenMap.has(root.id)) {
        result.push(...childrenMap.get(root.id)!);
      }
    });

    return result;
  })();

  const getTrafficLightColor = (dueDate?: string) => {
    if (!dueDate) return "bg-gray-500";
    const date = parseISO(dueDate);
    if (isPast(date) || isToday(date)) return "bg-red-500";
    if (isTomorrow(date)) return "bg-orange-500";
    return "bg-green-500";
  };

  // Reusable calendar event row (for Today/Tomorrow sections)
  const renderEventRow = (event: CalendarEvent) => {
    const isCompleted = completedEvents.has(event.id);
    const isEditing = editingEventId === event.id;

    return (
      <div
        key={event.id}
        className={`group flex items-start gap-3 p-4 bg-neutral-800/40 rounded-xl transition-all border border-transparent ${isCompleted ? "opacity-50" : "hover:bg-neutral-800/80 hover:border-neutral-700"}`}
      >
        {/* Complete event button */}
        <button
          onClick={() => { if (!isEditing) completeEvent(event); }}
          className={`flex-shrink-0 transition-colors ${isCompleted ? "text-green-500 cursor-default" : "text-gray-400 hover:text-blue-500"}`}
          aria-label="Complete event"
          disabled={isCompleted || isEditing}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        {isEditing ? (
          <div className="flex-1 flex gap-2 min-w-0">
            <input
              type="text"
              value={editEventSummary}
              onChange={(e) => setEditEventSummary(e.target.value)}
              className="flex-1 min-w-0 bg-neutral-700/60 text-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              aria-label="Edit event title"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p
              className={`text-gray-200 font-medium break-words ${isCompleted ? "line-through text-gray-500" : ""}`}
            >
              {event.summary}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{getEventTime(event)}</p>
          </div>
        )}

        {/* Edit / Save / Cancel buttons */}
        {!isCompleted && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleEventEditSave}
                  disabled={isSavingEvent || !editEventSummary.trim()}
                  className="p-1.5 text-green-400 hover:text-green-300 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Save event"
                >
                  {isSavingEvent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleEventEditCancel}
                  disabled={isSavingEvent}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Cancel event edit"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleEventEditStart(event)}
                className="p-1.5 text-gray-500 hover:text-purple-400 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Edit event"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md rounded-2xl p-6 border border-neutral-800 shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span
            className={`w-2 h-8 rounded-full ${session ? "bg-blue-500" : "bg-orange-500"}`}
          ></span>
          {session ? "Tasks" : "My Tasks (Local)"}
        </h2>
        {session && (
          <button
            onClick={fetchTasks}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            disabled={loading}
            aria-label="Refresh tasks"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <RefreshCcw className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700">
        {/* Add Task Input */}
        <form onSubmit={handleAddTask} className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="w-full bg-neutral-800/60 text-white placeholder-gray-500 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              disabled={isAdding}
            />
            <button
              type="submit"
              disabled={!newTask.trim() || isAdding}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
          <input
            type="date"
            value={newTaskDue}
            onChange={(e) => setNewTaskDue(e.target.value)}
            className="bg-neutral-800/60 text-white rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-auto calendar-picker-indicator-white"
            title="Set Due Date"
          />
        </form>

        {/* Tasks Section */}
        <div className="space-y-3">
          {tasks.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-4">
              {session
                ? "No tasks pending. Chill!"
                : "No local tasks. Add one to get started!"}
            </p>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groupedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {groupedTasks.map((task) => {
                const isCompleted =
                  locallyCompleted.has(task.id) || task.status === "completed";
                const isSubtask = !!task.parent;

                return (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isCompleted={isCompleted}
                    isSubtask={isSubtask}
                    onComplete={completeTask}
                    getTrafficLightColor={getTrafficLightColor}
                    isEditing={editingTaskId === task.id}
                    editTitle={editTitle}
                    editDue={editDue}
                    onEditStart={handleTaskEditStart}
                    onEditCancel={handleTaskEditCancel}
                    onEditSave={handleTaskEditSave}
                    onEditTitleChange={setEditTitle}
                    onEditDueChange={setEditDue}
                    isSaving={isSavingTask}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {session && (
          <>
            <div className="border-t border-neutral-800 my-4"></div>

            {/* Calendar Events - Today */}
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                Today&apos;s Events
              </h3>
              <div className="space-y-3">
                {todayEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm italic py-2 pl-2">
                    Sin reuniones para hoy
                  </p>
                ) : (
                  todayEvents.map(renderEventRow)
                )}
              </div>
            </div>

            {/* Calendar Events - Tomorrow */}
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
                Tomorrow&apos;s Events
              </h3>
              <div className="space-y-3">
                {tomorrowEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm italic py-2 pl-2">
                    Sin reuniones para mañana
                  </p>
                ) : (
                  tomorrowEvents.map(renderEventRow)
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {session && (
        <>
          <div className="border-t border-neutral-800 my-4"></div>

          {/* Create Calendar Event */}
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-green-400" />
              Create Activity
            </h3>
            <form
              onSubmit={handleAddEvent}
              className="space-y-3 bg-neutral-800/20 p-4 rounded-xl border border-neutral-800/50"
            >
              <input
                type="text"
                value={newEventSummary}
                onChange={(e) => setNewEventSummary(e.target.value)}
                placeholder="Event Title..."
                className="w-full bg-neutral-800/60 text-white placeholder-gray-500 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                disabled={isAddingEvent}
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="flex-1 bg-neutral-800/60 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm calendar-picker-indicator-white"
                  required
                  disabled={isAddingEvent}
                  aria-label="Event Date"
                />
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="flex-1 bg-neutral-800/60 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm clock-picker-indicator-white"
                  required
                  disabled={isAddingEvent}
                  aria-label="Event Time"
                />
              </div>
              <button
                type="submit"
                disabled={
                  !newEventSummary.trim() ||
                  !newEventDate ||
                  !newEventTime ||
                  isAddingEvent
                }
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isAddingEvent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add to Calendar"
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
