import { createTRPCReact } from "@trpc/react-query";
// Type-only import — erased at build, so no server code leaks into the client bundle.
import type { AppRouter } from "@moveros/trpc";

export const trpc = createTRPCReact<AppRouter>();
