import { z } from "zod";
import type { AgentDef } from "../harness/types";

/**
 * utility — builds the stop/start utility plan for a move: what to shut off at
 * the origin, what to set up at the destination, and when. Cheap one-shot →
 * Haiku, no effort, no thinking (spec §6.1).
 *
 * Utilities are regional monopolies with no national catalog, so this agent
 * deliberately does NOT name providers — it describes each step generically
 * ("your city's water department") and the user fills in the local company.
 * Any dollar figures must read as estimates; the plan lands in the approval
 * inbox and never acts on its own.
 */

export const utilityItem = z.object({
  utilityType: z.enum([
    "electricity",
    "gas",
    "water_sewer",
    "trash_recycling",
    "other",
  ]),
  where: z.enum(["origin", "destination"]),
  /** Short imperative title, e.g. "Stop electricity service at your old place". */
  title: z.string().min(1),
  /** One or two sentences: what to do and what to have on hand. */
  action: z.string().min(1),
  /** Days before move date to do this (0 = moving day). */
  dueDaysBefore: z.number().int().min(0).max(60),
});
export type UtilityItem = z.infer<typeof utilityItem>;

export const utilityInput = z.object({
  originCity: z.string(),
  originState: z.string(),
  destinationCity: z.string(),
  destinationState: z.string(),
  moveDate: z.string(),
  homeSize: z.enum(["studio", "1br", "2br", "3br", "4br_plus"]),
});
export type UtilityInput = z.infer<typeof utilityInput>;

export const utilityOutput = z.object({
  /** A short, friendly summary for the approval card. */
  summary: z.string().min(1),
  /** Origin shutoffs + destination setups, 3–8 items. */
  items: z.array(utilityItem).min(3).max(8),
});
export type UtilityOutput = z.infer<typeof utilityOutput>;

/** Dollar figures are allowed only when phrased as estimates. */
const ESTIMATE_HINT = /(est\.?|~|typical|around|about|may|range|deposit)/i;

export const utilityAgent: AgentDef<UtilityInput, UtilityOutput> = {
  id: "utility@1",
  agentType: "utility",
  runtime: "direct",
  model: "claude-haiku-4-5",
  maxTokens: 1500,
  system: [
    "You plan the utility transitions for a residential move. Return JSON:",
    "{ summary, items: [{ utilityType, where, title, action, dueDaysBefore }] }.",
    "Cover stopping service at the origin and starting it at the destination",
    "for electricity, gas (if plausible for the region), water/sewer, and",
    "trash/recycling. NEVER name a specific utility company — refer to providers",
    "generically ('your electric utility', 'the city water department') because",
    "providers vary by address. Typical timing: start destination setup 14-21",
    "days out; schedule origin shutoff for move-out day (request it 7-14 days",
    "ahead). If you mention money (deposits, activation fees) phrase it as an",
    "estimate. Keep the summary to two sentences.",
  ].join(" "),
  buildPrompt: (input) =>
    [
      `Origin: ${input.originCity}, ${input.originState}`,
      `Destination: ${input.destinationCity}, ${input.destinationState}`,
      `Move date: ${input.moveDate}`,
      `Home size: ${input.homeSize}`,
    ].join("\n"),
  inputSchema: utilityInput,
  outputSchema: utilityOutput,
  guardrails: [
    {
      name: "prices-read-as-estimates",
      check: (o) => {
        const texts = [o.summary, ...o.items.flatMap((i) => [i.title, i.action])];
        const bad = texts.find((t) => /\$\s?\d/.test(t) && !ESTIMATE_HINT.test(t));
        return bad
          ? { ok: false, reason: `a dollar figure is not phrased as an estimate: "${bad.slice(0, 80)}"` }
          : { ok: true };
      },
    },
    {
      name: "covers-both-ends",
      check: (o) =>
        o.items.some((i) => i.where === "origin") &&
        o.items.some((i) => i.where === "destination")
          ? { ok: true }
          : { ok: false, reason: "plan misses origin shutoffs or destination setups" },
    },
  ],
  goldenCases: [
    {
      name: "plans both shutoffs and setups without naming providers",
      input: {
        originCity: "Chicago",
        originState: "IL",
        destinationCity: "Austin",
        destinationState: "TX",
        moveDate: "2026-08-01",
        homeSize: "2br",
      },
      assert: (o) => {
        const hasElectric = o.items.some((i) => i.utilityType === "electricity");
        const bothEnds =
          o.items.some((i) => i.where === "origin") &&
          o.items.some((i) => i.where === "destination");
        return hasElectric && bothEnds
          ? { pass: true }
          : { pass: false, message: "missing electricity or one end of the move" };
      },
    },
  ],
};
