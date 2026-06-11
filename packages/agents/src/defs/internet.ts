import { z } from "zod";
import type { AgentDef } from "../harness/types";

/**
 * internet — ranks ISP candidates for the destination and explains the fit.
 * Cheap one-shot classification → Haiku, no effort, no thinking (spec §6.1).
 *
 * The agent only ever ranks candidates it is GIVEN (today: the national ISPs
 * in the offers catalog; later: the SmartyStreets availability lookup for the
 * exact address). It must not invent providers, speeds, or firm prices — the
 * caller additionally drops any recommendation whose offerId isn't in the
 * input set, and the result lands in the approval inbox, never auto-acts.
 */

export const ispCandidate = z.object({
  offerId: z.string().min(1),
  provider: z.string().min(1),
  technology: z.enum(["cable", "fiber", "5g_home", "dsl", "satellite"]),
  typicalDownloadMbps: z.number().positive(),
  typicalMonthlyUsd: z.number().positive(),
  notes: z.string(),
});
export type IspCandidate = z.infer<typeof ispCandidate>;

export const internetInput = z.object({
  destinationCity: z.string(),
  destinationState: z.string(),
  destinationZip: z.string().nullable(),
  homeSize: z.enum(["studio", "1br", "2br", "3br", "4br_plus"]),
  candidates: z.array(ispCandidate).min(1).max(12),
});
export type InternetInput = z.infer<typeof internetInput>;

export const internetRecommendation = z.object({
  offerId: z.string().min(1),
  provider: z.string().min(1),
  /** One sentence: why this fits THIS move. */
  fitReason: z.string().min(1),
  /** Always phrased as an estimate (e.g. "est. ~$55/mo for 500 Mbps"). */
  estimatedPriceLabel: z.string().min(1),
});
export type InternetRecommendation = z.infer<typeof internetRecommendation>;

export const internetOutput = z.object({
  /** A short, friendly summary for the approval card. */
  summary: z.string().min(1),
  /** Best first; 1–3 picks. */
  recommendations: z.array(internetRecommendation).min(1).max(3),
});
export type InternetOutput = z.infer<typeof internetOutput>;

export const internetAgent: AgentDef<InternetInput, InternetOutput> = {
  id: "internet@1",
  agentType: "internet",
  runtime: "direct",
  model: "claude-haiku-4-5",
  maxTokens: 1024,
  system: [
    "You rank internet service options for someone moving to a new home.",
    "Return JSON: { summary, recommendations: [{ offerId, provider, fitReason,",
    "estimatedPriceLabel }] }. Pick 1-3 from the PROVIDED candidates only —",
    "copy offerId and provider verbatim; never invent a provider. Prefer fiber",
    "for larger homes, self-setup options for renters/studios, and value for",
    "money overall. Prices and speeds are typical figures, not address-level",
    "availability, so every estimatedPriceLabel must read as an estimate",
    "(prefix 'est.' or '~') and the summary must note that availability is",
    "confirmed at signup. Keep the summary to two sentences.",
  ].join(" "),
  buildPrompt: (input) =>
    [
      `Destination: ${input.destinationCity}, ${input.destinationState}${input.destinationZip ? ` ${input.destinationZip}` : ""}`,
      `Home size: ${input.homeSize}`,
      "Candidates:",
      ...input.candidates.map(
        (c) =>
          `- offerId=${c.offerId} provider=${c.provider} tech=${c.technology} ` +
          `~${c.typicalDownloadMbps}Mbps ~$${c.typicalMonthlyUsd}/mo — ${c.notes}`,
      ),
    ].join("\n"),
  inputSchema: internetInput,
  outputSchema: internetOutput,
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
      name: "ranks given candidates without inventing providers",
      input: {
        destinationCity: "Denver",
        destinationState: "CO",
        destinationZip: "80205",
        homeSize: "1br",
        candidates: [
          {
            offerId: "isp_xfinity",
            provider: "Xfinity",
            technology: "cable",
            typicalDownloadMbps: 500,
            typicalMonthlyUsd: 55,
            notes: "Widest cable footprint.",
          },
          {
            offerId: "isp_tmobile_home",
            provider: "T-Mobile Home Internet",
            technology: "5g_home",
            typicalDownloadMbps: 200,
            typicalMonthlyUsd: 50,
            notes: "No install appointment — self-setup.",
          },
        ],
      },
      assert: (o) => {
        const allowed = new Set(["isp_xfinity", "isp_tmobile_home"]);
        return o.recommendations.length >= 1 &&
          o.recommendations.every((r) => allowed.has(r.offerId))
          ? { pass: true }
          : { pass: false, message: "recommended an offer outside the candidate set" };
      },
    },
  ],
};
