import { serve } from "inngest/next";
import { inngest } from "@moveros/agents";
import {
  parseEmailReply,
  generateTimeline,
  dispatchApprovedAction,
} from "@/lib/inngest/functions";

// The Inngest endpoint. Inngest discovers and invokes registered functions here.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [parseEmailReply, generateTimeline, dispatchApprovedAction],
});
