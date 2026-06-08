import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { NotOwnedError } from "@moveros/db";
import type { Context } from "./context";
import { inMemoryRateLimiter, type RateLimiter } from "./rate-limit";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

/**
 * Map domain errors thrown by the db layer onto tRPC error codes. A move the
 * user doesn't own becomes a 404 — never leak that the id exists elsewhere.
 */
const mapDomainErrors = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok && result.error.cause instanceof NotOwnedError) {
    throw new TRPCError({ code: "NOT_FOUND", message: result.error.cause.message });
  }
  return result;
});

/** Require an authenticated user; narrow `userId`/`scoped` to non-null. */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.scoped) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { db: ctx.db, userId: ctx.userId, scoped: ctx.scoped },
  });
});

/**
 * Every authenticated procedure goes through scopedDb (via ctx.scoped) — there
 * is no path to the unscoped client from a resolver.
 */
export const protectedProcedure = t.procedure
  .use(mapDomainErrors)
  .use(enforceAuth);

const defaultLimiter = inMemoryRateLimiter({ windowMs: 60_000, max: 120 });

/**
 * Per-user rate limit. Pass a distributed limiter in production; defaults to a
 * per-process in-memory window.
 */
export function rateLimited(limiter: RateLimiter = defaultLimiter) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!limiter.check(ctx.userId)) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return next();
  });
}
