import { and, eq, desc } from "drizzle-orm";
import type { Database } from "./client";
import { moves, tasks, agentTasks, approvalItems } from "./schema";
import type { NewMove } from "./schema";

/** Fields a caller supplies when creating a move (userId is injected by scope). */
export type CreateMoveInput = Omit<
  NewMove,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

/**
 * Thrown when a user references a move (or a child of a move) they don't own.
 * Routers should map this to a 404/FORBIDDEN — never leak whether the id
 * exists for some other user.
 */
export class NotOwnedError extends Error {
  constructor(public readonly moveId: string) {
    super(`Move ${moveId} not found for this user`);
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
    },
  };
}

export type ScopedDb = ReturnType<typeof scopedDb>;
