import { Inngest } from "inngest";

/**
 * The MoverOS Inngest client. Background agent runs are dispatched as Inngest
 * events and executed by step functions (registered under apps/web). Event keys
 * / signing keys are read from the environment by Inngest at serve time.
 */
export const inngest = new Inngest({ id: "moveros" });

/**
 * Event payload map. Extend as agents are added; `data.agentTaskId` ties the
 * run back to the agent_tasks row the harness writes its cost ledger into.
 */
export type MoverOsEvents = {
  "agent/run.requested": {
    data: {
      agentTaskId: string;
      moveId: string;
      agentType: string;
    };
  };
  "move/created": {
    data: {
      moveId: string;
      userId: string;
    };
  };
  "approval/approved": {
    data: {
      approvalId: string;
      moveId: string;
      userId: string;
    };
  };
  "email/reply.received": {
    data: {
      moveId: string;
      threadId: string;
      body: string;
    };
  };
};
