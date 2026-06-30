"use client";

import { Draggable } from "@hello-pangea/dnd";
import { CalendarDays, Lightbulb, User } from "lucide-react";
import type { TaskWithRelations } from "@/server/tasks";

const STATUS_BAR: Record<string, string> = {
  PLANNING: "#64748B",
  IN_PROGRESS: "#0D9488",
  REVIEW: "#F59E0B",
  DONE: "#22C55E",
};

interface TaskCardProps {
  task: TaskWithRelations;
  index: number;
}

function formatDeadline(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export default function TaskCard({ task, index }: TaskCardProps) {
  const overdue =
    task.deadline &&
    task.status !== "DONE" &&
    new Date(task.deadline) < new Date();

  const ideaCount = task.ideas.length;
  const barColor = STATUS_BAR[task.status] ?? "#64748B";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[--surface] rounded-2xl shadow-sm p-4 flex flex-col gap-2 border border-[--border] cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[--primary] ${
            snapshot.isDragging ? "opacity-80 shadow-md" : ""
          }`}
          style={{
            borderLeft: `3px solid ${barColor}`,
            ...provided.draggableProps.style,
          }}
        >
          {/* Title */}
          <p className="text-sm font-semibold text-[--fg] leading-snug line-clamp-2">
            {task.title}
          </p>

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-1 text-xs text-[--muted-fg]">
              <User size={12} />
              <span className="font-mono">{task.assignee.username}</span>
            </div>
          )}

          {/* Deadline + idea count */}
          <div className="flex items-center gap-2 flex-wrap">
            {task.deadline && (
              <span
                className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full ${
                  overdue
                    ? "bg-red-100 text-red-700"
                    : "bg-[--muted] text-[--muted-fg]"
                }`}
              >
                <CalendarDays size={11} />
                {formatDeadline(task.deadline)}
              </span>
            )}

            {ideaCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-[--muted] text-[--muted-fg]">
                <Lightbulb size={12} />
                {ideaCount}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
