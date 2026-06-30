import { describe, it, expect } from "vitest";
import { canCreateTask, canEditTask, canChangeStatus, canPromoteIdea, canManageUsers, type TaskStatus } from "@/lib/authz";

describe("task creation/edit", () => {
  it("only admin creates/edits tasks", () => {
    expect(canCreateTask("admin")).toBe(true);
    expect(canCreateTask("user")).toBe(false);
    expect(canEditTask("user")).toBe(false);
  });
});

describe("status changes", () => {
  const u = (from: TaskStatus, to: TaskStatus, isAssignee = true) =>
    canChangeStatus({ role: "user", isAssignee, from, to });

  it("assignee user may move between non-DONE states", () => {
    expect(u("PLANNING", "IN_PROGRESS")).toBe(true);
    expect(u("IN_PROGRESS", "REVIEW")).toBe(true);
    expect(u("REVIEW", "IN_PROGRESS")).toBe(true);
  });
  it("user may never touch DONE", () => {
    expect(u("REVIEW", "DONE")).toBe(false);
    expect(u("DONE", "REVIEW")).toBe(false);
  });
  it("user cannot change a task that is not theirs", () => {
    expect(u("PLANNING", "IN_PROGRESS", false)).toBe(false);
  });
  it("admin may move anything including DONE", () => {
    const a = (from: TaskStatus, to: TaskStatus) => canChangeStatus({ role: "admin", isAssignee: false, from, to });
    expect(a("REVIEW", "DONE")).toBe(true);
    expect(a("DONE", "PLANNING")).toBe(true);
  });
});

describe("idea promotion + user mgmt", () => {
  it("only admin promotes ideas and manages users", () => {
    expect(canPromoteIdea("admin")).toBe(true);
    expect(canPromoteIdea("user")).toBe(false);
    expect(canManageUsers("user")).toBe(false);
  });
});
