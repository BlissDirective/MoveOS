/** Whole days (UTC) from today until an ISO date; negative if past. */
export function daysUntil(isoDate: string): number {
  const target = Date.parse(`${isoDate}T00:00:00Z`);
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

/** Human due label for a task, e.g. "Due in 3 days" / "Overdue by 2 days". */
export function dueLabel(dueDate: string | null): string | undefined {
  if (!dueDate) return undefined;
  const days = daysUntil(dueDate);
  if (days === 0) return "Due today";
  if (days > 0) return `Due in ${days} day${days === 1 ? "" : "s"}`;
  const od = -days;
  return `Overdue by ${od} day${od === 1 ? "" : "s"}`;
}
