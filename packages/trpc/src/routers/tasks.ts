import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

/**
 * Task mutations. Ownership is enforced through ctx.scoped (which verifies the
 * parent move before touching the task), so a task on someone else's move
 * surfaces as NOT_FOUND.
 */
export const tasksRouter = router({
  complete: protectedProcedure
    .input(z.object({ taskId: z.string().uuid(), notes: z.string().optional() }))
    .mutation(({ ctx, input }) => ctx.scoped.tasks.complete(input.taskId, input.notes)),

  skip: protectedProcedure
    .input(z.object({ taskId: z.string().uuid(), reason: z.string().optional() }))
    .mutation(({ ctx, input }) => ctx.scoped.tasks.skip(input.taskId, input.reason)),
});
