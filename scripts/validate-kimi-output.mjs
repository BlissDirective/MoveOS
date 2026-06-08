#!/usr/bin/env node
// Validate raw Kimi K2.6 build output before integrating it (see
// docs/kimi-handoff.md). The point is to catch SILENT TRUNCATION and elision
// before the code reaches the repo.
//
// Usage:
//   node scripts/validate-kimi-output.mjs <output.txt> [--manifest <manifest.json>]
//   cat output.txt | node scripts/validate-kimi-output.mjs -        [--manifest ...]
//   pnpm validate:kimi <output.txt> [--manifest <manifest.json>]
//
// manifest.json shape: { "files": ["packages/ui/src/components/Foo.tsx", ...] }
//
// Exit codes: 0 = pass · 1 = hard failure · 2 = NEEDS SPLIT (re-decompose).

import { readFileSync } from "node:fs";

const BUILD_COMPLETE = "===BUILD COMPLETE===";
const NEEDS_SPLIT = "===NEEDS SPLIT===";
const FILE_OPEN = /^===FILE:\s*(.+?)\s*===$/;
const FILE_CLOSE = /^===END FILE===$/;
const SELF_CHECK = /^===SELF-CHECK===$/;

// Elision / truncation markers. Deliberately comment- and standalone-anchored so
// legitimate JS spread/rest (`...props`, `{...rest}`) is NOT flagged.
const ELISION = [
  { re: /^\s*\/\/\s*\.\.\./, msg: "`// ...` elision comment" },
  { re: /^\s*\.\.\.\s*$/, msg: "standalone `...` line" },
  { re: /…/, msg: "unicode ellipsis `…`" },
  { re: /^\s*#\s*\.\.\./, msg: "`# ...` elision comment" },
  { re: /\{\s*\/\*\s*\.\.\.\s*\*\/\s*\}/, msg: "JSX `{/* ... */}` elision" },
  { re: /<!--\s*\.\.\.\s*-->/, msg: "HTML `<!-- ... -->` elision" },
  {
    re: /\/\/\s*(rest of|remaining|unchanged|existing code|same as before|as above|keep existing|omitted|truncat|implementation here)/i,
    msg: "elision/placeholder comment",
  },
  { re: /\/\*\s*(rest of|remaining|unchanged|omitted)/i, msg: "elision block comment" },
];
const TODO = /\/\/\s*TODO|\/\*\s*TODO/i; // warning only

function parseArgs(argv) {
  const args = { input: null, manifest: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--manifest") args.manifest = argv[++i];
    else if (!args.input) args.input = a;
  }
  return args;
}

function read(path) {
  if (!path || path === "-") return readFileSync(0, "utf8"); // stdin
  return readFileSync(path, "utf8");
}

/** Split the raw output into file blocks; detect unclosed (truncated) blocks. */
function parseBlocks(lines) {
  const blocks = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const open = line.match(FILE_OPEN);
    if (open) {
      if (cur) {
        cur.closed = false; // previous block never closed before a new one opened
        blocks.push(cur);
      }
      cur = { path: open[1], start: i + 1, body: [], closed: false, inSelfCheck: false };
      continue;
    }
    if (!cur) continue;
    if (FILE_CLOSE.test(line)) {
      cur.closed = true;
      blocks.push(cur);
      cur = null;
      continue;
    }
    if (SELF_CHECK.test(line)) {
      cur.inSelfCheck = true;
      continue;
    }
    if (!cur.inSelfCheck) cur.body.push({ n: i + 1, text: line });
  }
  if (cur) {
    cur.closed = false; // reached EOF mid-block
    blocks.push(cur);
  }
  return blocks;
}

function checkBalance(body) {
  const pairs = { "}": "{", ")": "(", "]": "[" };
  const open = { "{": 0, "(": 0, "[": 0 };
  let ticks = 0;
  for (const { text } of body) {
    for (const ch of text) {
      if (ch === "{" || ch === "(" || ch === "[") open[ch]++;
      else if (ch in pairs) open[pairs[ch]]--;
      else if (ch === "`") ticks++;
    }
  }
  const issues = [];
  if (open["{"] !== 0) issues.push(`unbalanced braces (${open["{"] > 0 ? "+" : ""}${open["{"]})`);
  if (open["("] !== 0) issues.push(`unbalanced parens (${open["("] > 0 ? "+" : ""}${open["("]})`);
  if (open["["] !== 0) issues.push(`unbalanced brackets (${open["["] > 0 ? "+" : ""}${open["["]})`);
  if (ticks % 2 !== 0) issues.push("odd number of backticks");
  return issues;
}

function main() {
  const { input, manifest } = parseArgs(process.argv.slice(2));
  let raw;
  try {
    raw = read(input);
  } catch (e) {
    console.error(`Cannot read input: ${e.message}`);
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // Explicit NEEDS SPLIT signal — not a failure, an instruction to re-decompose.
  if (raw.includes(NEEDS_SPLIT)) {
    const after = raw.slice(raw.indexOf(NEEDS_SPLIT) + NEEDS_SPLIT.length).trim();
    console.log("● NEEDS SPLIT — Kimi declined to build within budget.");
    console.log("  Re-decompose at Layer 0 (smaller files). Proposed split:\n");
    console.log(after ? after.split("\n").map((l) => "    " + l).join("\n") : "    (no list provided)");
    process.exit(2);
  }

  const lines = raw.split(/\r?\n/);
  const blocks = parseBlocks(lines);

  if (blocks.length === 0) {
    errors.push("No ===FILE: ...=== blocks found. Output is not in the handoff contract format.");
  }

  if (!raw.includes(BUILD_COMPLETE)) {
    errors.push(`Missing ${BUILD_COMPLETE} sentinel → output is TRUNCATED (or contract not followed).`);
  }

  const seen = new Map();
  for (const b of blocks) {
    const tag = `${b.path}`;
    if (!b.closed) {
      errors.push(`File "${tag}" block never closed (no ===END FILE===) → TRUNCATED at/after line ${b.start}.`);
    }
    if (seen.has(b.path)) errors.push(`Duplicate file block: "${tag}".`);
    seen.set(b.path, b);

    for (const { n, text } of b.body) {
      for (const { re, msg } of ELISION) {
        if (re.test(text)) errors.push(`${tag}:${n} — ${msg}: ${text.trim().slice(0, 60)}`);
      }
      if (TODO.test(text)) warnings.push(`${tag}:${n} — TODO comment (protocol forbids placeholders).`);
    }

    if (b.closed) {
      for (const issue of checkBalance(b.body)) {
        warnings.push(`${tag} — ${issue} (possible truncation; verify with typecheck).`);
      }
    }
  }

  // Manifest reconciliation.
  if (manifest) {
    let expected;
    try {
      expected = JSON.parse(readFileSync(manifest, "utf8")).files ?? [];
    } catch (e) {
      errors.push(`Cannot read manifest "${manifest}": ${e.message}`);
      expected = [];
    }
    for (const f of expected) {
      const b = seen.get(f);
      if (!b) errors.push(`Manifest file missing from output: "${f}".`);
      else if (!b.closed) errors.push(`Manifest file "${f}" present but not sealed (truncated).`);
    }
    const extra = [...seen.keys()].filter((p) => !expected.includes(p));
    for (const p of extra) warnings.push(`File not in manifest: "${p}".`);
  }

  // Report.
  const sealed = blocks.filter((b) => b.closed).length;
  console.log(`Parsed ${blocks.length} file block(s); ${sealed} sealed.`);
  for (const w of warnings) console.log(`  [WARN] ${w}`);
  for (const e of errors) console.log(`  [FAIL] ${e}`);

  if (errors.length > 0) {
    console.log(`\n✗ ${errors.length} failure(s). Do NOT integrate — resume via Partial Mode or re-decompose.`);
    process.exit(1);
  }
  console.log(`\n✓ Passed${warnings.length ? ` (${warnings.length} warning(s) to eyeball)` : ""}. Proceed to typecheck + build.`);
  process.exit(0);
}

main();
