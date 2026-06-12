import type { TokenUsage } from "./types";

export interface ModelPricing {
  readonly inputPerMTok: number;
  readonly outputPerMTok: number;
}

/**
 * USD per 1M tokens. Source: Claude model catalog (Opus 4.x $5/$25,
 * Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5). Update when pricing changes.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-8": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-7": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-6": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
};

/** Estimated USD cost of a run. Unknown models log loudly and return 0 — a
 * silent 0 would corrupt the ledger the per-move budget guard reads. */
export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const p = MODEL_PRICING[model];
  if (!p) {
    console.error(
      `[cost] model "${model}" missing from MODEL_PRICING — recording $0; fix the pricing table`,
    );
    return 0;
  }
  return (
    (usage.inputTokens / 1_000_000) * p.inputPerMTok +
    (usage.outputTokens / 1_000_000) * p.outputPerMTok
  );
}

/** One line in the cost ledger; persisted to agent_tasks by the caller. */
export interface CostRecord {
  readonly agentType: string;
  readonly model: string;
  readonly usage: TokenUsage;
  readonly costUsd: number;
}

/**
 * Sink for per-run cost. The Inngest function wires this to write
 * agent_tasks.{llm_model,input_tokens,output_tokens,estimated_cost_usd}.
 */
export type CostLogger = (record: CostRecord) => Promise<void> | void;
