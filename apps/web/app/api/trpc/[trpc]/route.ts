import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@moveros/trpc";
import { getDb } from "@moveros/db";

// The tRPC HTTP endpoint. Context resolves the Supabase user from the request
// and scopes the db to them (see @moveros/trpc createTRPCContext).
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ db: getDb(), headers: req.headers }),
  });
}

export { handler as GET, handler as POST };
