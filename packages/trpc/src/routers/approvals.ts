import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const approvalId = z.object({ approvalId: z.string().uuid() });

/**
 * Approval-queue router — the human-in-the-loop API. Approve/edit emit
 * approvalApproved so a downstream Inngest function performs the gated action
 * (e.g. the Nylas email send); reject does not.
 */
export const approvalsRouter = router({
  /** The user's pending inbox across all their moves. */
  listPending: protectedProcedure.query(({ ctx }) =>
    ctx.scoped.approvals.pendingForUser(),
  ),

  approve: protectedProcedure
    .input(approvalId)
    .mutation(async ({ ctx, input }) => {
      const ap = await ctx.scoped.approvals.approve(input.approvalId);
      await ctx.events.approvalApproved({
        approvalId: ap.id,
        moveId: ap.moveId,
        userId: ctx.userId,
      });
      return ap;
    }),

  edit: protectedProcedure
    .input(approvalId.extend({ body: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const ap = await ctx.scoped.approvals.edit(input.approvalId, {
        body: input.body,
      });
      await ctx.events.approvalApproved({
        approvalId: ap.id,
        moveId: ap.moveId,
        userId: ctx.userId,
      });
      return ap;
    }),

  reject: protectedProcedure
    .input(approvalId.extend({ reason: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.scoped.approvals.reject(input.approvalId, input.reason),
    ),
});
