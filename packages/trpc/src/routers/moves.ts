import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const moveId = z.object({ moveId: z.string().uuid() });

/**
 * Moves router. Every resolver reads through ctx.scoped, so ownership is
 * enforced for free — a move (or its tasks/approvals) belonging to another user
 * surfaces as NOT_FOUND via the domain-error middleware.
 */
export const movesRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.scoped.moves.list()),

  get: protectedProcedure
    .input(moveId)
    .query(({ ctx, input }) => ctx.scoped.moves.get(input.moveId)),

  tasks: protectedProcedure
    .input(moveId)
    .query(({ ctx, input }) => ctx.scoped.tasks.listForMove(input.moveId)),

  pendingApprovals: protectedProcedure
    .input(moveId)
    .query(({ ctx, input }) => ctx.scoped.approvals.pendingForMove(input.moveId)),
});
