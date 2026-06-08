import { router } from "./trpc";
import { movesRouter } from "./routers/moves";

export const appRouter = router({
  moves: movesRouter,
});

/** Inferred API contract consumed by the typed client in apps/web. */
export type AppRouter = typeof appRouter;
