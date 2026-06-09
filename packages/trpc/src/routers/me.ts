import { protectedProcedure, router } from "../trpc";

/** Current-user router — the signed-in user's own profile. */
export const meRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.scoped.profile.get()),
});
