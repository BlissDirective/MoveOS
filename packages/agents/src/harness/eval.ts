import type { AgentDef } from "./types";
import { runAgent, type RunContext } from "./runtime";

export interface GoldenResult {
  readonly name: string;
  readonly pass: boolean;
  readonly message?: string;
}

export interface EvalSummary {
  readonly agentId: string;
  readonly total: number;
  readonly passed: number;
  readonly results: ReadonlyArray<GoldenResult>;
}

/**
 * Run an agent against its golden cases. A case fails if the run errors or the
 * case's assertion rejects the output. Wire this into CI to catch prompt or
 * schema regressions before they ship (spec §6.5 — eval harness).
 */
export async function runGoldenCases<I, O>(
  def: AgentDef<I, O>,
  ctx: RunContext,
): Promise<EvalSummary> {
  const results: GoldenResult[] = [];
  for (const c of def.goldenCases ?? []) {
    const run = await runAgent(def, c.input, ctx);
    if (!run.ok) {
      results.push({ name: c.name, pass: false, message: `run failed (${run.phase}): ${run.error}` });
      continue;
    }
    const assertion = c.assert(run.output);
    results.push(
      assertion.pass
        ? { name: c.name, pass: true }
        : { name: c.name, pass: false, message: assertion.message },
    );
  }
  return {
    agentId: def.id,
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    results,
  };
}
