import type Anthropic from "@anthropic-ai/sdk";
import type { AgentDef, AgentResult, TokenUsage } from "./types";
import { validateOutput, errorMessage } from "./validate";
import { estimateCostUsd, type CostLogger } from "./cost";

const JSON_INSTRUCTION =
  "Respond with a single JSON object that matches the contract described above. " +
  "Output only the JSON — no prose, no markdown fences.";

export interface RunContext {
  readonly client: Anthropic;
  /** Optional cost sink; receives every successful model call. */
  readonly onCost?: CostLogger;
}

/**
 * Run an agent end to end: validate input → call the model → Zod-gate the
 * output → run guardrails, logging cost along the way. Only the "direct"
 * runtime is implemented; "tool-runner" and "managed" return a typed
 * not-implemented result so callers can branch without throwing.
 */
export async function runAgent<I, O>(
  def: AgentDef<I, O>,
  rawInput: I,
  ctx: RunContext,
): Promise<AgentResult<O>> {
  const input = def.inputSchema.safeParse(rawInput);
  if (!input.success) {
    return {
      ok: false,
      phase: "input_validation",
      error: input.error.issues.map((i) => i.message).join("; "),
    };
  }

  if (def.runtime !== "direct") {
    return {
      ok: false,
      phase: "not_implemented",
      error: `runtime '${def.runtime}' is not implemented yet`,
    };
  }

  let message: Anthropic.Message;
  try {
    message = await ctx.client.messages.create({
      model: def.model,
      max_tokens: def.maxTokens ?? 4096,
      system: `${def.system}\n\n${JSON_INSTRUCTION}`,
      messages: [{ role: "user", content: def.buildPrompt(input.data) }],
      ...(def.thinking === "adaptive" ? { thinking: { type: "adaptive" } } : {}),
      ...(def.effort ? { output_config: { effort: def.effort } } : {}),
    });
  } catch (e) {
    return { ok: false, phase: "model_call", error: errorMessage(e) };
  }

  const usage: TokenUsage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
  const costUsd = estimateCostUsd(def.model, usage);
  if (ctx.onCost) {
    await ctx.onCost({ agentType: def.agentType, model: def.model, usage, costUsd });
  }

  let text = "";
  for (const block of message.content) {
    if (block.type === "text") text += block.text;
  }

  const validated = validateOutput(def.outputSchema, text);
  if (!validated.ok) {
    return { ok: false, phase: "output_validation", error: validated.error };
  }

  for (const guard of def.guardrails ?? []) {
    const result = guard.check(validated.value);
    if (!result.ok) {
      return {
        ok: false,
        phase: "guardrail",
        error: `guardrail '${guard.name}' failed: ${result.reason}`,
      };
    }
  }

  return { ok: true, output: validated.value, usage, costUsd };
}
