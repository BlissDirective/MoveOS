import { router } from "./trpc";
import { movesRouter } from "./routers/moves";
import { tasksRouter } from "./routers/tasks";
import { approvalsRouter } from "./routers/approvals";
import { meRouter } from "./routers/me";

export const appRouter = router({
  me: meRouter,
  moves: movesRouter,
  tasks: tasksRouter,
  approvals: approvalsRouter,
});

/** Inferred API contract consumed by the typed client in apps/web. */
export type AppRouter = typeof appRouter;
