import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext, type AppEvents } from "@moveros/trpc";
import { getDb } from "@moveros/db";
import { inngest } from "@moveros/agents";

// Inngest-backed event emitter injected into the tRPC context, so resolvers can
// fire domain events (e.g. kick the timeline agent) without coupling @moveros/trpc
// to @moveros/agents.
const events: AppEvents = {
  async moveCreated(data) {
    await inngest.send({ name: "move/created", data });
  },
  async approvalApproved(data) {
    await inngest.send({ name: "approval/approved", data });
  },
  async quotesRequested(data) {
    await inngest.send({ name: "quote/requested", data });
  },
  async internetRequested(data) {
    await inngest.send({ name: "internet/requested", data });
  },
};

// The tRPC HTTP endpoint. Context resolves the Supabase user from the request
// and scopes the db to them (see @moveros/trpc createTRPCContext).
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({ db: getDb(), headers: req.headers, events }),
  });
}

export { handler as GET, handler as POST };
