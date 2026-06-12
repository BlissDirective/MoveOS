import { z } from "zod";
import type { AgentDef } from "../harness/types";

/**
 * service — picks which ancillary services actually fit THIS move (renter's
 * insurance, storage, home services) from the offers catalog. Cheap one-shot →
 * Haiku, no effort, no thinking (spec §6.1).
 *
 * Same contract as the internet agent: rank ONLY the provided candidates,
 * never invent a provider, phrase every price as an estimate. The caller
 * additionally drops recommendations whose offerId isn't in the catalog, and
 * the picks land in the approval inbox — the user clicks through (or doesn't).
 * Recommendation shape matches the internet agent so the inbox UI renders both.
 */

export const serviceCandidate = z.object({
  offerId: z.string().min(1),
  provider: z.string().min(1),
  category: z.enum(["insurance", "storage", "home_service"]),
  /** e.g. "est. ~$15-25/mo" — typical figures, not quotes. */
  typicalCostLabel: z.string().min(1),
  notes: z.string(),
});
export type ServiceCandidate = z.infer<typeof serviceCandidate>;

export const serviceInput = z.object({
  moveType: z.enum(["local", "long_distance", "interstate"]).nullable(),
  moveDate: z.string(),
  homeSize: z.enum(["studio", "1br", "2br", "3br", "4br_plus"]),
  specialItems: z.array(z.string()),
  candidates: z.array(serviceCandidate).min(1).max(12),
});
export type ServiceInput = z.infer<typeof serviceInput>;

export const serviceRecommendation = z.object({
  offerId: z.string().min(1),
  provider: z.string().min(1),
  /** One sentence: why this fits THIS move (or its timing). */
  fitReason: z.string().min(1),
  /** Always phrased as an estimate (e.g. "est. ~$15/mo"). */
  estimatedPriceLabel: z.string().min(1),
});
export type ServiceRecommendation = z.infer<typeof serviceRecommendation>;

export const serviceOutput = z.object({
  /** A short, friendly summary for the approval card. */
  summary: z.string().min(1),
  /** Most relevant first; 1–3 picks. Recommend only what genuinely fits. */
  recommendations: z.array(serviceRecommendation).min(1).max(3),
});
export type ServiceOutput = z.infer<typeof serviceOutput>;

export const serviceAgent: AgentDef<ServiceInput, ServiceOutput> = {
  id: "service@1",
  agentType: "service",
  runtime: "direct",
  model: "claude-haiku-4-5",
  maxTokens: 1024,
  system: [
    "You pick ancillary services that genuinely help a specific residential",
    "move. Return JSON: { summary, recommendations: [{ offerId, provider,",
    "fitReason, estimatedPriceLabel }] }. Choose 1-3 from the PROVIDED",
    "candidates only — copy offerId and provider verbatim; never invent a",
    "provider. Recommend a service only when the move details justify it",
    "(e.g. storage for downsizing or long-distance gaps; renter's insurance",
    "for apartment-sized homes). Costs are typical figures, not quotes, so",
    "every estimatedPriceLabel must read as an estimate (prefix 'est.' or '~').",
    "Keep the summary to two sentences.",
  ].join(" "),
  buildPrompt: (input) =>
    [
      `Move type: ${input.moveType ?? "unknown"}`,
      `Move date: ${input.moveDate}`,
      `Home size: ${input.homeSize}`,
      `Special items: ${input.specialItems.length ? input.specialItems.join(", ") : "none"}`,
      "Candidates:",
      ...input.candidates.map(
        (c) =>
          `- offerId=${c.offerId} provider=${c.provider} category=${c.category} ` +
          `${c.typicalCostLabel} — ${c.notes}`,
      ),
    ].join("\n"),
  inputSchema: serviceInput,
  outputSchema: serviceOutput,
  guardrails: [
    {
      name: "prices-read-as-estimates",
      check: (o) =>
        o.recommendations.every((r) =>
          /(est\.?|~|around|about)/i.test(r.estimatedPriceLabel),
        )
          ? { ok: true }
          : { ok: false, reason: "a price label is not phrased as an estimate" },
    },
  ],
  goldenCases: [
    {
      name: "recommends from the candidate set only",
      input: {
        moveType: "interstate",
        moveDate: "2026-08-01",
        homeSize: "1br",
        specialItems: [],
        candidates: [
          {
            offerId: "insurance_lemonade",
            provider: "Lemonade",
            category: "insurance",
            typicalCostLabel: "est. ~$15-25/mo",
            notes: "Renter's insurance; most landlords require a policy at move-in.",
          },
          {
            offerId: "storage_extra_space",
            provider: "Extra Space Storage",
            category: "storage",
            typicalCostLabel: "est. ~$80-200/mo",
            notes: "Month-to-month units; useful for gaps between leases.",
          },
        ],
      },
      assert: (o) => {
        const allowed = new Set(["insurance_lemonade", "storage_extra_space"]);
        return o.recommendations.length >= 1 &&
          o.recommendations.every((r) => allowed.has(r.offerId))
          ? { pass: true }
          : { pass: false, message: "recommended an offer outside the candidate set" };
      },
    },
  ],
};
