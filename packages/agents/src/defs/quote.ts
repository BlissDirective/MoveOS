import { z } from "zod";
import type { AgentDef } from "../harness/types";

/**
 * quote — drafts a quote-request email a user can send to a moving company,
 * tailored to their move. It writes the draft, not a price: the output lands in
 * the approval queue for the user to review, set the recipient, and approve
 * before anything is sent (spec §6.5).
 */

export const quoteInput = z.object({
  originCity: z.string(),
  originState: z.string(),
  destinationCity: z.string(),
  destinationState: z.string(),
  moveDate: z.string(),
  homeSize: z.enum(["studio", "1br", "2br", "3br", "4br_plus"]),
  moveType: z.enum(["local", "long_distance", "interstate"]).nullable(),
  specialItems: z.array(z.string()),
});
export type QuoteInput = z.infer<typeof quoteInput>;

export const quoteOutput = z.object({
  /** A short, friendly summary for the approval card. */
  summary: z.string().min(1),
  emailSubject: z.string().min(1),
  emailBody: z.string().min(1),
});
export type QuoteOutput = z.infer<typeof quoteOutput>;

export const quoteAgent: AgentDef<QuoteInput, QuoteOutput> = {
  id: "quote@1",
  agentType: "quote",
  runtime: "direct",
  model: "claude-sonnet-4-6",
  thinking: "adaptive",
  effort: "medium",
  maxTokens: 1500,
  system: [
    "You draft a polished quote-request email a person can send to a moving",
    "company. Return JSON: { summary, emailSubject, emailBody }. The email asks",
    "for a binding estimate and states the move details (route, date, home size,",
    "special items) clearly and briefly. Do NOT invent prices, company names, or",
    "commitments. Leave the greeting generic (e.g. 'Hello,'). Keep it under ~180",
    "words. The summary is one sentence for a review card.",
  ].join(" "),
  buildPrompt: (input) =>
    [
      `Origin: ${input.originCity}, ${input.originState}`,
      `Destination: ${input.destinationCity}, ${input.destinationState}`,
      `Move date: ${input.moveDate}`,
      `Home size: ${input.homeSize}`,
      `Move type: ${input.moveType ?? "unknown"}`,
      `Special items: ${input.specialItems.length ? input.specialItems.join(", ") : "none"}`,
    ].join("\n"),
  inputSchema: quoteInput,
  outputSchema: quoteOutput,
  guardrails: [
    {
      name: "no-fabricated-price",
      check: (o) =>
        /\$\s?\d/.test(o.emailBody)
          ? { ok: false, reason: "drafted a price into a quote request" }
          : { ok: true },
    },
  ],
  goldenCases: [
    {
      name: "drafts a usable quote request",
      input: {
        originCity: "Chicago",
        originState: "IL",
        destinationCity: "Austin",
        destinationState: "TX",
        moveDate: "2026-08-01",
        homeSize: "2br",
        moveType: "interstate",
        specialItems: ["piano"],
      },
      assert: (o) =>
        o.emailBody.length > 40 && o.emailSubject.length > 0
          ? { pass: true }
          : { pass: false, message: "draft too short" },
    },
  ],
};
