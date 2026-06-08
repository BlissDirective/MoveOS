import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const moveId = z.object({ moveId: z.string().uuid() });

const homeSize = z.enum(["studio", "1br", "2br", "3br", "4br_plus"]);
const moveType = z.enum(["local", "long_distance", "interstate"]);

/** Onboarding payload → a new move. Column-shaped so it maps straight to insert. */
const createMoveInput = z.object({
  originCity: z.string().min(1),
  originState: z.string().min(1),
  originZip: z.string().optional(),
  destinationCity: z.string().min(1),
  destinationState: z.string().min(1),
  destinationZip: z.string().optional(),
  moveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  homeSize,
  moveType: moveType.optional(),
  specialItems: z.array(z.string()).default([]),
  usageProfile: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Moves router. Every resolver reads/writes through ctx.scoped, so ownership is
 * enforced for free — a move (or its tasks/approvals) belonging to another user
 * surfaces as NOT_FOUND via the domain-error middleware.
 */
export const movesRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.scoped.moves.list()),

  get: protectedProcedure
    .input(moveId)
    .query(({ ctx, input }) => ctx.scoped.moves.get(input.moveId)),

  create: protectedProcedure
    .input(createMoveInput)
    .mutation(async ({ ctx, input }) => {
      const move = await ctx.scoped.moves.create(input);
      // Kick the timeline agent to seed this move's task list.
      await ctx.events.moveCreated({ moveId: move.id, userId: ctx.userId });
      return { id: move.id };
    }),

  tasks: protectedProcedure
    .input(moveId)
    .query(({ ctx, input }) => ctx.scoped.tasks.listForMove(input.moveId)),

  pendingApprovals: protectedProcedure
    .input(moveId)
    .query(({ ctx, input }) => ctx.scoped.approvals.pendingForMove(input.moveId)),
});
