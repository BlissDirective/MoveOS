// @moveros/agents — agent definitions + prompts + the shared agent harness.
// Phase 1 adds: packages/agents/harness (AgentDef, runtime dispatch, Zod
// validate gate, cost logging, eval runner) per spec §6.5, plus the Inngest
// client. Placeholder export keeps the package type-checkable.

export const AGENTS_PACKAGE = "@moveros/agents" as const;
