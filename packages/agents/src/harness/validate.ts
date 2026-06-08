import type { ZodType } from "zod";

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Extract the JSON object a model returned. Tolerates ```json fences and
 * leading/trailing prose by slicing to the outermost `{...}`.
 */
export function extractJson(text: string): ParseResult<unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    return { ok: false, error: "no JSON object found in model output" };
  }
  try {
    return { ok: true, value: JSON.parse(candidate.slice(start, end + 1)) };
  } catch (e) {
    return { ok: false, error: `JSON.parse failed: ${errorMessage(e)}` };
  }
}

/** The Zod validate gate: parse the model's text, then check it against the schema. */
export function validateOutput<T>(
  schema: ZodType<T>,
  text: string,
): ParseResult<T> {
  const json = extractJson(text);
  if (!json.ok) return json;
  const parsed = schema.safeParse(json.value);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  return { ok: true, value: parsed.data };
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
