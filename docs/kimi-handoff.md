# Kimi K2.6 Handoff Protocol

How Claude (which owns `docs/design.md`) hands frontend build work to **Kimi
K2.6**, and how the output comes back for review. The protocol exists to exploit
Kimi's strengths (fast, cheap, strong long-horizon coding, image→UI, an "Agent
Swarm" that parallelizes work) while defending against its one sharp edge:
**silent output truncation**.

> Pipeline: **Claude (design) → Kimi K2.6 (build) → Claude (review + integrate).**
> Claude never lets Kimi invent shared contracts, and never integrates an
> unverified file. The validator (`scripts/validate-kimi-output.mjs`) is the gate.

---

## 1. Why this protocol exists — Kimi K2.6 traits

| Trait | Value | Consequence |
|---|---|---|
| Context window | 256K (262,144) | Give it the full design context up front |
| **Max output (default)** | **32,768 tokens** (configurable to 256K − prompt) | The default silently caps long files → **truncation** |
| Truncation signal | `finish_reason: "length"` → remainder **discarded** | Must detect + resume, not regenerate |
| Modes | Thinking (temp **1.0**, default) / Instant (temp **0.6**) | Temp is fixed per mode — choose the mode, don't tune temp |
| Multi-agent | "Agent Swarm" — auto-decompose + parallel agents | Fast, but agents over-scope and diverge without contracts |
| Tool use | Automatic; Thinking ⇒ `tool_choice` ∈ {auto, none}; keep `reasoning_content` across tool steps | Don't choreograph tool use — it degrades autonomy |
| Resume | **Partial Mode** (continue from cutoff) | Native truncation recovery primitive |

**Root cause of truncation:** not a model defect — `max_tokens` left at the
32K default (some integrations even default to 1024). The fixes below turn
Moonshot's own guidance (raise `max_tokens`, split into sections, stream, resume
via Partial Mode) into enforced protocol.

---

## 2. Architecture — three layers

```
Layer 0 — ORCHESTRATION (Claude, once per screen)
  ├─ Decompose screen → FILE MANIFEST (paths + ≤line budget + deps)
  └─ Freeze the CONTRACT PACK (types, token names, conventions, import rules)

Layer 1 — PER-FILE BUILD BRIEF (Claude → Kimi, ONE FILE per request)
  └─ Single deliverable + output contract + truncation protocol

Layer 2 — RETURN GATE (Claude + validator)
  └─ Verify sentinels, no-elision, manifest, contracts → typecheck/build → integrate
```

**The cardinal rule: one file per generation request.** Parallelize *across the
swarm* (N agents → N files), never *within* a response. A response that emits
multiple files is where output runs past the cap mid-file.

---

## 3. Truncation safety — six enforced measures

1. **Budget `max_tokens` explicitly.** Token-count the prompt, set
   `max_tokens = min(256K − prompt_tokens, hard_cap)`. Never send the default.
2. **Line budget per file (~300–400 lines).** If the spec implies more, split at
   Layer 0. A file that can't overflow the window can't truncate.
3. **Sentinel-wrapped output** (machine-checkable completeness):
   ```
   ===FILE: <path>===
   <complete file contents>
   ===END FILE===
   ===SELF-CHECK===
   - imports resolve: yes
   - no placeholder/elision comments: yes
   - all braces/JSX tags closed: yes
   - line count: <n> (budget <n>)
   ===BUILD COMPLETE===
   ```
   A missing `===BUILD COMPLETE===` means **truncated**, whatever `finish_reason`
   says.
4. **No-elision rule (explicit ban).** Forbid `...`, `// rest unchanged`,
   `// TODO`, `// existing code`, and any partial file. If it won't fit the
   budget, the model must emit **only** `===NEEDS SPLIT===` + a proposed sub-file
   list and stop — converting a silent truncation into an actionable signal.
5. **Resume via Partial Mode, not regeneration.** On truncation, prefill the last
   complete line back as the assistant turn and instruct "continue from exactly
   here; never repeat emitted lines." Loop until `===BUILD COMPLETE===`.
6. **Stream + manifest reconciliation.** Always `stream: true` (avoids timeouts).
   After the swarm, reconcile produced files against the Layer-0 manifest; any
   file missing its seal re-enters the continuation loop.

---

## 4. Agent Swarm guardrails

- **Contracts before code.** Emit the Contract Pack first; pass it as *immutable*
  context to every swarm agent. Agents must never invent shared types.
- **One agent = one file = one output contract.** The swarm parallelizes across
  the manifest; it must not split a single file across agents.
- **Parallelize leaves, serialize shared deps.** Build `types.ts`, `cn`, and
  primitives first (serial), then fan out independent components in parallel.
- **Don't over-instruct tool use.** Give goals + contracts, not tool
  choreography — Kimi's tool selection is automatic and degrades when micromanaged.
- **Mode by task:** **Thinking** (temp 1.0) for Layer-0 decomposition and
  stateful/interactive components; **Instant** (temp 0.6) for token-faithful
  static leaves — faster and less likely to improvise off `design.md`.

---

## 5. Phases (same safety envelope, different payload)

| Pass | Mode | Input | Output |
|---|---|---|---|
| **A — Plan/scaffold** | Thinking | `design.md` §relevant + screen goal | FILE MANIFEST + CONTRACT PACK only (no code). Claude approves before any build. |
| **B — Build** | Instant (static) / Thinking (stateful) | One component spec + Contract Pack | One static component file (markup + tokens + states + a11y + responsive). No data wiring. |
| **C — Wire & motion** | Thinking | One existing file + interaction spec | Motion micro-interactions, handlers, tRPC hooks. Landing GSAP/R3F/shader files get the tightest budgets — split aggressively. |

---

## 6. API settings to pin

- `stream: true`
- `max_tokens` from token-count (**never** the default)
- Thinking ON for planning + `auto`/`none` tools; Instant for static leaves
- Retain `reasoning_content` across multi-step tool calls
- Do **not** send custom `temperature`/`top_p` — they're fixed per mode and error otherwise

---

## 7. MoveOS-specific context to inject

Every brief's IMMUTABLE CONTEXT should include:

- The relevant `docs/design.md` sections (§2 color, §4 components, §6 elevation,
  §9 agent prompt guide) — the **design source of truth**.
- **Token rule:** import from `@moveros/ui/theme`; use Tailwind utilities
  (`bg-brand-500`, `shadow-e2`, `rounded-lg`, `font-mono`). **Never hardcode
  hex/px** — every value has a token, so this is enforceable.
- **Style exemplars (few-shot):** paste `packages/ui/src/components/Button.tsx`
  and `TaskCard.tsx` so Kimi matches the `cva` / `cn()` / `motion/react` /
  `"use client"` conventions exactly.
- **Drop-in is pre-wired:** `transpilePackages` + the Tailwind `@source` in
  `apps/web/app/globals.css` already cover `packages/ui` — the return gate is just
  the validator → `pnpm typecheck` → `pnpm build` → anti-slop/`design.md` review.

---

## 8. Per-file Build Brief template (Layer 1)

````md
ROLE: Senior frontend engineer building MoverOS. Mode: <Instant|Thinking>.

IMMUTABLE CONTEXT (do not change or reinterpret):
- Design source of truth (design.md excerpts):
  <paste relevant §2/§4/§6/§9>
- Token rule: import from "@moveros/ui/theme"; use Tailwind utilities
  (bg-brand-500, shadow-e2, rounded-lg, font-mono). NEVER hardcode hex/px.
- Conventions: "use client" only if the file uses motion/hooks; cn() for
  classes; cva for variants; motion/react for animation; honor
  prefers-reduced-motion.
- Style exemplars: <paste Button.tsx + TaskCard.tsx>
- Contract Pack (immutable — do not redefine):
  <paste the exact prop interface(s), imports, and file paths>

DELIVERABLE (exactly ONE file):
  <path/to/Component.tsx>
SPEC:
  <props; EVERY state; a11y; responsive; motion per design.md §X>
BUDGET: <=350 lines.

OUTPUT CONTRACT (mandatory):
- Wrap the file in:
  ===FILE: <path>===
  <complete contents>
  ===END FILE===
  ===SELF-CHECK===
  - imports resolve: yes/no
  - no placeholder/elision comments: yes/no
  - all braces/JSX tags closed: yes/no
  - line count: <n> (budget 350)
  ===BUILD COMPLETE===
- Emit the COMPLETE file. FORBIDDEN: "...", "// rest unchanged", "// TODO",
  "// existing code", or any elision/partial file.
- If the file cannot fit the budget, output ONLY:
  ===NEEDS SPLIT===
  <proposed sub-file list with paths + responsibilities>
  ...and do NOT start coding.
- If you are cut off mid-file, on continuation resume from the EXACT last line
  emitted; never repeat lines already sent.

ACCEPTANCE (Claude will verify before integrating):
- Validator passes (sentinels present, no elision, file sealed).
- Imports resolve against the Contract Pack; zero token violations.
- All specified states implemented; pnpm typecheck + build pass.
````

---

## 9. The return gate

```
pnpm validate:kimi <kimi-output.txt> [--manifest manifest.json]
  → fails on: missing ===BUILD COMPLETE===, elision markers, unbalanced
    braces/parens/brackets/backticks, manifest files missing or unsealed
  → exit 2 on ===NEEDS SPLIT=== (re-decompose at Layer 0)
then:
pnpm typecheck && pnpm --filter web build   # drop-in is pre-wired
then: Claude anti-slop + design.md conformance review → integrate
```

See `scripts/validate-kimi-output.mjs`.
