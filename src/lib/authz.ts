export type Role = "admin" | "user";
export type TaskStatus = "PLANNING" | "IN_PROGRESS" | "REVIEW" | "DONE";

export const canCreateTask = (role: Role) => role === "admin";
export const canEditTask = (role: Role) => role === "admin";
export const canEditIdea = (_role: Role) => true;
export const canPromoteIdea = (role: Role) => role === "admin";
export const canManageUsers = (role: Role) => role === "admin";

export function canChangeStatus(args: {
  role: Role; isAssignee: boolean; from: TaskStatus; to: TaskStatus;
}): boolean {
  const { role, isAssignee, from, to } = args;
  if (role === "admin") return true;
  if (!isAssignee) return false;
  if (from === "DONE" || to === "DONE") return false;
  return true;
}
