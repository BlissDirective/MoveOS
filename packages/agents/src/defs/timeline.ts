import { z } from "zod";
import type { AgentDef } from "../harness/types";

/**
 * timeline — turns a move profile into a personalized, ordered task list (spec
 * §6.5). Stateful, quality-sensitive → Opus with adaptive thinking + high
 * effort. This is the first agent run after a move is created.
 */

export const timelineInput = z.object({
  originCity: z.string(),
  originState: z.string(),
  destinationCity: z.string(),
  destinationState: z.string(),
  moveDate: z.string(), // YYYY-MM-DD
  daysUntilMove: z.number().int(),
  homeSize: z.enum(["studio", "1br", "2br", "3br", "4br_plus"]),
  moveType: z.enum(["local", "long_distance", "interstate"]).nullable(),
  specialItems: z.array(z.string()),
});
export type TimelineInput = z.infer<typeof timelineInput>;

const taskAgent = z.enum([
  "setup",
  "quote",
  "internet",
  "utility",
  "address",
  "service",
  "moving_day",
  "settled",
  "manual",
]);

export const timelineTask = z.object({
  agentType: taskAgent,
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  /** Days before move date this should be done. Null = no fixed deadline. */
  dueDaysBefore: z.number().int().min(0).max(120).nullable(),
});
export type TimelineTask = z.infer<typeof timelineTask>;

export const timelineOutput = z.object({
  tasks: z.array(timelineTask).min(5).max(40),
});
export type TimelineOutput = z.infer<typeof timelineOutput>;

export const timelineAgent: AgentDef<TimelineInput, TimelineOutput> = {
  id: "timeline@1",
  agentType: "timeline",
  runtime: "direct",
  model: "claude-opus-4-8",
  thinking: "adaptive",
  effort: "high",
  maxTokens: 8192,
  system: [
    "You are MoverOS's planning agent. Given a move profile, produce a",
    "personalized, realistic moving checklist as JSON: { tasks: [...] }.",
    "Each task has: agentType (which MoverOS agent handles it: quote, internet,",
    "utility, address, service, moving_day, settled, or manual for the user),",
    "category, title, description, priority (critical|high|medium|low), and",
    "dueDaysBefore (integer days before the move date, or null). Order matters:",
    "earlier deadlines first. Tailor to home size, distance, and special items.",
    "Return 8–25 tasks. Do not invent prices or vendor names.",
  ].join(" "),
  buildPrompt: (input) =>
    [
      `Origin: ${input.originCity}, ${input.originState}`,
      `Destination: ${input.destinationCity}, ${input.destinationState}`,
      `Move date: ${input.moveDate} (${input.daysUntilMove} days away)`,
      `Home size: ${input.homeSize}`,
      `Move type: ${input.moveType ?? "unknown"}`,
      `Special items: ${input.specialItems.length ? input.specialItems.join(", ") : "none"}`,
    ].join("\n"),
  inputSchema: timelineInput,
  outputSchema: timelineOutput,
  guardrails: [
    {
      name: "unique-titles",
      check: (o) => {
        const titles = o.tasks.map((t) => t.title.trim().toLowerCase());
        return new Set(titles).size === titles.length
          ? { ok: true }
          : { ok: false, reason: "duplicate task titles" };
      },
    },
    {
      name: "deadlines-within-horizon",
      check: (o) =>
        o.tasks.every((t) => t.dueDaysBefore === null || t.dueDaysBefore >= 0)
          ? { ok: true }
          : { ok: false, reason: "negative dueDaysBefore" },
    },
  ],
  goldenCases: [
    {
      name: "2BR interstate produces a real checklist",
      input: {
        originCity: "Chicago",
        originState: "IL",
        destinationCity: "Austin",
        destinationState: "TX",
        moveDate: "2026-08-01",
        daysUntilMove: 54,
        homeSize: "2br",
        moveType: "interstate",
        specialItems: ["piano"],
      },
      assert: (o) =>
        o.tasks.length >= 5 && o.tasks.every((t) => t.title.trim().length > 0)
          ? { pass: true }
          : { pass: false, message: `got ${o.tasks.length} tasks` },
    },
  ],
};
