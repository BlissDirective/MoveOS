/**
 * Agent eval runner (spec §6.5 — eval harness; wired into CI).
 *
 * Two layers:
 *  1. OFFLINE def checks — always run, no API key needed: every golden-case
 *     input must satisfy the agent's inputSchema, every model id must exist in
 *     the pricing table (a missing entry silently zeroes the cost ledger), and
 *     every def must have at least one golden case.
 *  2. LIVE golden cases — run only when ANTHROPIC_API_KEY is set: each case is
 *     executed through the real harness (model call + Zod gate + guardrails)
 *     and its assertion checked. Catches prompt/schema regressions. Costs a
 *     few cents per run.
 *
 * Exit code 1 on any failure; CI fails the build.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { AgentDef } from "../src/harness/types";
import { MODEL_PRICING } from "../src/harness/cost";
import { runGoldenCases } from "../src/harness/eval";
import { timelineAgent } from "../src/defs/timeline";
import { quoteAgent } from "../src/defs/quote";
import { replyParseAgent } from "../src/defs/reply-parse";
import { internetAgent } from "../src/defs/internet";
import { utilityAgent } from "../src/defs/utility";
import { serviceAgent } from "../src/defs/service";

// Every shipped agent def registers here — a def missing from this list is
// itself a review finding.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFS: AgentDef<any, any>[] = [
  timelineAgent,
  quoteAgent,
  replyParseAgent,
  internetAgent,
  utilityAgent,
  serviceAgent,
];

let failures = 0;
const fail = (msg: string) => {
  failures += 1;
  console.error(`  ✗ ${msg}`);
};
const pass = (msg: string) => console.log(`  ✓ ${msg}`);

console.log("── offline def checks ──");
for (const def of DEFS) {
  console.log(`${def.id} (${def.model})`);
  if (!MODEL_PRICING[def.model]) {
    fail(`model "${def.model}" missing from MODEL_PRICING — cost ledger would record $0`);
  } else {
    pass("model has a pricing entry");
  }
  if (!def.system.trim()) fail("empty system prompt");
  const cases = def.goldenCases ?? [];
  if (cases.length === 0) {
    fail("no golden cases — agent is untestable");
    continue;
  }
  for (const c of cases) {
    const parsed = def.inputSchema.safeParse(c.input);
    if (parsed.success) {
      pass(`golden input ok: ${c.name}`);
    } else {
      fail(
        `golden input INVALID for "${c.name}": ${parsed.error.issues
          .map((i) => i.message)
          .join("; ")}`,
      );
    }
  }
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.log(
    "\n── live golden cases: SKIPPED (no ANTHROPIC_API_KEY) ──",
  );
} else {
  console.log("\n── live golden cases ──");
  const client = new Anthropic({ apiKey });
  let totalCostUsd = 0;
  for (const def of DEFS) {
    const summary = await runGoldenCases(def, {
      client,
      onCost: (r) => {
        totalCostUsd += r.costUsd;
      },
    });
    console.log(`${summary.agentId}: ${summary.passed}/${summary.total} passed`);
    for (const r of summary.results) {
      if (r.pass) pass(r.name);
      else fail(`${summary.agentId} / ${r.name}: ${r.message ?? "failed"}`);
    }
  }
  console.log(`(live eval spend: ~$${totalCostUsd.toFixed(4)})`);
}

if (failures > 0) {
  console.error(`\n${failures} eval failure(s)`);
  process.exit(1);
}
console.log("\nall evals passed");
