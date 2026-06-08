// @moveros/trpc — tRPC v11 API: context, auth, and routers.
//
// Phase 1 increment 3 delivers:
//   • createTRPCContext — resolves the Supabase user and scopes the db to them.
//   • protectedProcedure — auth gate + domain-error mapping; resolvers only ever
//     see the scoped client (ctx.scoped), closing the RLS-bypass path.
//   • rateLimited — pluggable per-user limiter.
//   • appRouter / AppRouter — the moves router and the exported API contract.

export { appRouter } from "./root";
export type { AppRouter } from "./root";
export {
  router,
  middleware,
  publicProcedure,
  protectedProcedure,
  rateLimited,
} from "./trpc";
export { createTRPCContext, createInnerContext } from "./context";
export type { Context, CreateContextOptions } from "./context";
export { getUserIdFromToken } from "./auth";
export { inMemoryRateLimiter } from "./rate-limit";
export type { RateLimiter } from "./rate-limit";
