import type { ZodType } from "zod";

/**
 * Agent type names. Mirrors the `agent_type` enum in @moveros/db
 * (kept as a local union so this package doesn't depend on the schema).
 * `manual` is excluded — those tasks have no agent run.
 */
export type AgentTypeName =
  | "setup"
  | "quote"
  | "internet"
  | "utility"
  | "address"
  | "service"
  | "timeline"
  | "moving_day"
  | "settled"
  | "reply_parse";

/**
 * How an agent is executed:
 *  - "direct"      — one structured Messages call, output validated by Zod (implemented).
 *  - "tool-runner" — SDK tool-runner loop with client-side tools (not yet implemented).
 *  - "managed"     — Anthropic Managed Agents session (not yet implemented).
 */
export type AgentRuntime = "direct" | "tool-runner" | "managed";

/** Effort levels (spec §6.5). `max` is Opus-tier only; omit on Haiku. */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export type GuardrailResult = { ok: true } | { ok: false; reason: string };

/**
 * A post-validation invariant the output must satisfy before an agent result
 * is allowed to reach the approval queue (e.g. "drafted email names no price").
 */
export interface Guardrail<Output> {
  readonly name: string;
  readonly check: (output: Output) => GuardrailResult;
}

export type GoldenAssertion = { pass: true } | { pass: false; message: string };

/** A golden/eval case: an input plus an assertion over the produced output. */
export interface GoldenCase<Input, Output> {
  readonly name: string;
  readonly input: Input;
  readonly assert: (output: Output) => GoldenAssertion;
}

/**
 * The full definition of an agent. Prompts, schemas, guardrails, and eval cases
 * live together so the harness can run, validate, cost, and test any agent
 * uniformly (spec §6.5 — the shared agent harness).
 */
export interface AgentDef<Input, Output> {
  readonly id: string;
  readonly agentType: AgentTypeName;
  readonly runtime: AgentRuntime;
  /** Model id, e.g. "claude-opus-4-8" or "claude-haiku-4-5". */
  readonly model: string;
  readonly system: string;
  readonly buildPrompt: (input: Input) => string;
  readonly inputSchema: ZodType<Input>;
  readonly outputSchema: ZodType<Output>;
  /** Adaptive thinking — leave unset (off) for models that don't support it. */
  readonly thinking?: "adaptive" | "off";
  /** Only sent when set; do NOT set on Haiku (effort 400s there). */
  readonly effort?: Effort;
  readonly maxTokens?: number;
  readonly guardrails?: ReadonlyArray<Guardrail<Output>>;
  readonly goldenCases?: ReadonlyArray<GoldenCase<Input, Output>>;
}

export type AgentFailurePhase =
  | "input_validation"
  | "model_call"
  | "output_validation"
  | "guardrail"
  | "not_implemented";

export type AgentResult<Output> =
  | { ok: true; output: Output; usage: TokenUsage; costUsd: number }
  | { ok: false; error: string; phase: AgentFailurePhase };
