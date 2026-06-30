"use client";

import { useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Plus, X } from "lucide-react";
import type { TaskWithRelations } from "@/server/tasks";
import type { UserListItem } from "@/server/users";
import Column from "./Column";
import TaskDialog from "./TaskDialog";
import TaskIdeasDialog, { type IdeaOption } from "./TaskIdeasDialog";

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "user";
}

interface BoardProps {
  initialTasks: TaskWithRelations[];
  currentUser: CurrentUser;
  users: UserListItem[];
  ideas: IdeaOption[];
}

interface SavedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  assigneeId: string | null;
  deadline: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; task: TaskWithRelations }
  | null;

const COLUMNS = [
  { key: "PLANNING", label: "Planning" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
] as const;

type TaskStatus = (typeof COLUMNS)[number]["key"];

export default function Board({ initialTasks, currentUser, users, ideas }: BoardProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [ideasTaskId, setIdeasTaskId] = useState<string | null>(null);

  const isAdmin = currentUser.role === "admin";

  const ideasTask = ideasTaskId
    ? tasks.find((t) => t.id === ideasTaskId) ?? null
    : null;

  function handleAttached(taskId: string, idea: IdeaOption) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? ({
              ...t,
              ideas: [
                ...t.ideas,
                { idea: { id: idea.id, title: idea.title, links: idea.links } },
              ],
            } as TaskWithRelations)
          : t
      )
    );
  }

  function handleDetached(taskId: string, ideaId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? ({
              ...t,
              ideas: t.ideas.filter((e) => e.idea.id !== ideaId),
            } as TaskWithRelations)
          : t
      )
    );
  }

  function getTasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status);
  }

  function deriveAssignee(assigneeId: string | null): TaskWithRelations["assignee"] {
    if (!assigneeId) return null;
    const u = users.find((x) => x.id === assigneeId);
    if (!u) return null;
    return { id: u.id, name: u.name, username: u.username };
  }

  function handleSaved({
    task: saved,
    assigneeId,
  }: {
    task: SavedTask;
    assigneeId: string | null;
  }) {
    const assignee = deriveAssignee(assigneeId);
    setTasks((prev) => {
      const existing = prev.find((t) => t.id === saved.id);
      if (existing) {
        // EDIT: merge returned fields, re-derive assignee, preserve ideas.
        return prev.map((t) =>
          t.id === saved.id
            ? ({
                ...t,
                ...saved,
                deadline: saved.deadline ? new Date(saved.deadline) : null,
                createdAt: new Date(saved.createdAt),
                updatedAt: new Date(saved.updatedAt),
                assignee,
                ideas: t.ideas,
              } as unknown as TaskWithRelations)
            : t
        );
      }
      // CREATE: append a new card built from the API response.
      const newTask = {
        ...saved,
        deadline: saved.deadline ? new Date(saved.deadline) : null,
        createdAt: new Date(saved.createdAt),
        updatedAt: new Date(saved.updatedAt),
        assignee,
        ideas: [],
      } as unknown as TaskWithRelations;
      return [...prev, newTask];
    });
    setDialog(null);
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const prevTasks = tasks;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setTasks(prevTasks);
        if (res.status === 403) {
          setError("Tidak diizinkan memindahkan ke kolom ini.");
        } else {
          setError("Gagal memperbarui status.");
        }
      }
    } catch {
      setTasks(prevTasks);
      setError("Gagal memperbarui status.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-[--fg]">
          Papan Tugas
        </h1>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setDialog({ mode: "create" })}
            className="flex min-h-[40px] items-center gap-2 rounded-lg bg-[--accent] px-4 text-sm font-semibold text-[--on-accent] focus:outline-none focus:ring-2 focus:ring-[--primary]"
          >
            <Plus size={16} />
            Tugas Baru
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-[--primary] rounded"
            aria-label="Tutup pesan kesalahan"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Board columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto snap-x pb-4 lg:grid lg:grid-cols-4 lg:overflow-x-visible">
          {COLUMNS.map(({ key, label }) => (
            <Column
              key={key}
              columnKey={key}
              label={label}
              tasks={getTasksByStatus(key)}
              isAdmin={isAdmin}
              onEdit={(task) => setDialog({ mode: "edit", task })}
              onOpenIdeas={(task) => setIdeasTaskId(task.id)}
            />
          ))}
        </div>
      </DragDropContext>

      {dialog && (
        <TaskDialog
          mode={dialog.mode}
          task={dialog.mode === "edit" ? dialog.task : undefined}
          users={users}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}

      {ideasTask && (
        <TaskIdeasDialog
          task={ideasTask}
          ideas={ideas}
          onClose={() => setIdeasTaskId(null)}
          onAttached={handleAttached}
          onDetached={handleDetached}
        />
      )}
    </div>
  );
}
