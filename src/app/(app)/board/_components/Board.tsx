"use client";

import { useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { X } from "lucide-react";
import type { TaskWithRelations } from "@/server/tasks";
import Column from "./Column";

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "user";
}

interface BoardProps {
  initialTasks: TaskWithRelations[];
  currentUser: CurrentUser;
}

const COLUMNS = [
  { key: "PLANNING", label: "Planning" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
] as const;

type TaskStatus = (typeof COLUMNS)[number]["key"];

export default function Board({ initialTasks }: BoardProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [error, setError] = useState<string | null>(null);

  function getTasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status);
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
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
