"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { TaskWithRelations } from "@/server/tasks";
import TaskCard from "./TaskCard";

const STATUS_COLOR: Record<string, string> = {
  PLANNING: "var(--status-planning)",
  IN_PROGRESS: "var(--status-in-progress)",
  REVIEW: "var(--status-review)",
  DONE: "var(--status-done)",
};

interface ColumnProps {
  columnKey: string;
  label: string;
  tasks: TaskWithRelations[];
  isAdmin: boolean;
  onEdit: (task: TaskWithRelations) => void;
  onOpenIdeas: (task: TaskWithRelations) => void;
}

export default function Column({
  columnKey,
  label,
  tasks,
  isAdmin,
  onEdit,
  onOpenIdeas,
}: ColumnProps) {
  const dotColor = STATUS_COLOR[columnKey] ?? "var(--status-planning)";

  return (
    <div className="flex flex-col min-w-[80%] lg:min-w-0 snap-start rounded-2xl overflow-hidden border border-[--border]">
      {/* Column header */}
      <div className="bg-[--muted] px-4 py-3 flex items-center gap-2 shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span className="text-sm font-semibold font-heading text-[--fg] flex-1">
          {label}
        </span>
        <span className="text-xs font-mono text-[--muted-fg] bg-[--surface] px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <Droppable droppableId={columnKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-3 p-3 flex-1 min-h-[120px] transition-colors ${
              snapshot.isDraggingOver ? "bg-[color-mix(in_srgb,var(--muted)_60%,transparent)]" : "bg-[--bg]"
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-[--muted-fg] text-center py-6">
                Belum ada tugas.
              </p>
            )}
            {tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onOpenIdeas={onOpenIdeas}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
