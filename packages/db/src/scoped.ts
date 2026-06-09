import { and, eq, desc, sql } from "drizzle-orm";
import type { Database } from "./client";
import { moves, tasks, agentTasks, approvalItems } from "./schema";
import type { NewMove } from "./schema";

/** Fields a caller supplies when creating a move (userId is injected by scope). */
export type CreateMoveInput = Omit<
  NewMove,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

/**
 * Thrown when a user references a move (or a child of a move — task, approval)
 * they don't own. Routers map this to a 404 — never leak whether the id exists
 * for some other user.
 */
export class NotOwnedError extends Error {
  constructor(public readonly id: string) {
    super(`${id} not found for this user`);
    this.name = "NotOwnedError";
  }
}

/**
 * scopedDb(db, userId) — the ONLY sanctioned way feature code touches the
 * database.
 *
 * The service-role client (client.ts) bypasses Postgres RLS, so a stray query
 * without a `where user_id = …` clause would read across tenants. Rather than
 * trusting every call site to remember that filter, every accessor here bakes
 * the ownership predicate in. Child entities (tasks, agent_tasks, approvals)
 * have no `user_id` of their own, so they're reached only after the parent
 * move's ownership is verified via `requireMove`.
 */
export function scopedDb(db: Database, userId: string) {
  /** Load a move the user owns, or throw NotOwnedError. */
  async function requireMove(moveId: string) {
    const [row] = await db
      .select()
      .from(moves)
      .where(and(eq(moves.id, moveId), eq(moves.userId, userId)))
      .limit(1);
    if (!row) throw new NotOwnedError(moveId);
    return row;
  }

  /** Load a task whose parent move the user owns, or throw. */
  async function requireTask(taskId: string) {
    const [row] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!row) throw new NotOwnedError(taskId);
    await requireMove(row.moveId);
    return row;
  }

  /** Load an approval whose parent move the user owns, or throw. */
  async function requireApproval(approvalId: string) {
    const [row] = await db
      .select()
      .from(approvalItems)
      .where(eq(approvalItems.id, approvalId))
      .limit(1);
    if (!row) throw new NotOwnedError(approvalId);
    await requireMove(row.moveId);
    return row;
  }

  return {
    userId,
    requireMove,

    moves: {
      /** All moves owned by this user, newest first. */
      list() {
        return db
          .select()
          .from(moves)
          .where(eq(moves.userId, userId))
          .orderBy(desc(moves.createdAt));
      },
      /** A single owned move, or throw. */
      get: requireMove,

      /** Create a move owned by this user. */
      async create(input: CreateMoveInput) {
        const [row] = await db
          .insert(moves)
          .values({ ...input, userId })
          .returning();
        if (!row) throw new Error("failed to insert move");
        return row;
      },
    },

    tasks: {
      /** Tasks for a move, after verifying the user owns that move. */
      async listForMove(moveId: string) {
        await requireMove(moveId);
        return db
          .select()
          .from(tasks)
          .where(eq(tasks.moveId, moveId))
          .orderBy(tasks.sortOrder);
      },

      /** Mark a task done (idempotent) and bump the move's completed counter. */
      async complete(taskId: string, notes?: string) {
        const task = await requireTask(taskId);
        if (task.status === "completed") return task;
        const [updated] = await db
          .update(tasks)
          .set({
            status: "completed",
            completedAt: new Date(),
            completionNotes: notes ?? task.completionNotes,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, taskId))
          .returning();
        await db
          .update(moves)
          .set({ tasksCompleted: sql`${moves.tasksCompleted} + 1`, updatedAt: new Date() })
          .where(eq(moves.id, task.moveId));
        return updated!;
      },

      /** Skip a task with an optional reason. */
      async skip(taskId: string, reason?: string) {
        await requireTask(taskId);
        const [updated] = await db
          .update(tasks)
          .set({
            status: "skipped",
            skippedAt: new Date(),
            skippedReason: reason ?? null,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, taskId))
          .returning();
        return updated!;
      },
    },

    agentTasks: {
      /** Agent runs for a move, after verifying ownership. */
      async listForMove(moveId: string) {
        await requireMove(moveId);
        return db
          .select()
          .from(agentTasks)
          .where(eq(agentTasks.moveId, moveId))
          .orderBy(desc(agentTasks.queuedAt));
      },
    },

    approvals: {
      /** The pending approval queue for a move, after verifying ownership. */
      async pendingForMove(moveId: string) {
        await requireMove(moveId);
        return db
          .select()
          .from(approvalItems)
          .where(
            and(
              eq(approvalItems.moveId, moveId),
              eq(approvalItems.status, "awaiting_approval"),
            ),
          )
          .orderBy(desc(approvalItems.createdAt));
      },

      /** The user's whole pending inbox, across all their moves. */
      async pendingForUser() {
        const rows = await db
          .select({ a: approvalItems })
          .from(approvalItems)
          .innerJoin(moves, eq(approvalItems.moveId, moves.id))
          .where(
            and(
              eq(moves.userId, userId),
              eq(approvalItems.status, "awaiting_approval"),
            ),
          )
          .orderBy(desc(approvalItems.createdAt));
        return rows.map((r) => r.a);
      },

      /** Approve an item (the send/spend it gates happens downstream). */
      async approve(approvalId: string) {
        const ap = await requireApproval(approvalId);
        const [updated] = await db
          .update(approvalItems)
          .set({
            status: "approved",
            approvedAt: new Date(),
            readAt: ap.readAt ?? new Date(),
            updatedAt: new Date(),
          })
          .where(eq(approvalItems.id, approvalId))
          .returning();
        return updated!;
      },

      /** Reject an item with an optional reason. */
      async reject(approvalId: string, reason?: string) {
        await requireApproval(approvalId);
        const [updated] = await db
          .update(approvalItems)
          .set({
            status: "rejected",
            rejectedAt: new Date(),
            rejectionReason: reason ?? null,
            updatedAt: new Date(),
          })
          .where(eq(approvalItems.id, approvalId))
          .returning();
        return updated!;
      },

      /** Approve with edits (e.g. a reworded email body). */
      async edit(approvalId: string, edits: { body?: string }) {
        const ap = await requireApproval(approvalId);
        const [updated] = await db
          .update(approvalItems)
          .set({
            status: "edited_approved",
            approvedAt: new Date(),
            userEdits: edits,
            emailBody: edits.body ?? ap.emailBody,
            updatedAt: new Date(),
          })
          .where(eq(approvalItems.id, approvalId))
          .returning();
        return updated!;
      },
    },
  };
}

export type ScopedDb = ReturnType<typeof scopedDb>;
