# MoveOS — Full App Review (Code · Market · Roadmap)

*Independent review of `main` @ `1678450`, June 2026. Covers: codebase audit
(security / correctness / optimization), live market-feasibility research,
critique of the internal market & marketing plan, and roadmap assessment.*

---

## 1. Executive Summary

**Where the project stands.** Phase 1 is genuinely complete and in good shape:
a clean Turborepo monorepo, a thoughtful design system, typed end-to-end
(Drizzle → tRPC → React Query), a real agent harness with Zod-gated outputs and
cost accounting, three working agents (timeline, quote, reply-parse), the
human-in-the-loop approval inbox, and the Nylas OAuth + send loop. `pnpm build`
and `pnpm typecheck` pass. The architecture decisions (web-first, Inngest,
scopedDb, HITL-everything) are sound and consistent with the spec.

**The verdict on feasibility.** The concept is viable, but **not on the terms
the internal market research assumes**. Live research confirms the wedge
(agentic quote-shopping + approval inbox is a real 10x over checklists) but
contradicts the internal doc on several load-bearing claims: the mover market
is shrinking in volume (record-low US mobility), direct competitors *do* exist
(Move AI raised a pre-seed for exactly this concept in Oct 2024; Updater has
$453M and touches ~25% of US moves via B2B2C), affiliate conversion assumptions
are 5–10x too optimistic, and — most importantly — **FMCSA "household goods
broker" rules are a real regulatory constraint on taking mover-side referral
fees for interstate moves**, and they are absent from the internal risk
section.

**The strategic takeaway.** Keep building the product as designed — the
HITL agent loop is the defensible core — but re-order monetization:
(1) one-time consumer "move pass" ($29–79), (2) utilities/internet/insurance
referrals (unregulated, proven, the Updater/Utility Concierge playbook),
(3) mover-side lead fees **only after transportation counsel** or as
consumer-paid only. Distribution through realtors/property managers (already
in the plan) matters more than paid acquisition; single-transaction economics
cannot support meaningful CAC.

---

## 2. Main Branch — State of the Build

### What exists (verified)

| Area | Status | Notes |
|---|---|---|
| Monorepo (Turborepo + pnpm) | ✅ | `apps/web`, `packages/{ui,db,trpc,agents,utils}` |
| Design system | ✅ | `docs/design.md` + tokens + 11 components; unusually disciplined for this stage |
| DB schema + migrations | ✅ | moves, tasks, agent_tasks, approval_items, user_profiles; RLS SQL + profile trigger |
| `scopedDb` tenant isolation | ✅ | Ownership anchored at `moves.user_id`; children gated via `requireMove` |
| Auth | ✅ | Supabase email/password; middleware-protected routes; tRPC `protectedProcedure` |
| Agent harness | ✅ | Zod I/O gates, guardrails, golden cases, cost ledger to `agent_tasks` |
| Agents implemented | 3 of 9+ | `timeline`, `quote`, `reply_parse`; rest are enum stubs |
| Inngest functions | ✅ | `generate-timeline`, `request-quotes`, `parse-email-reply`, `dispatch-approved-action` |
| Approval inbox + task mutations | ✅ | approve / reject / edit-then-approve; complete / skip |
| Nylas | ◐ | OAuth grant + send work; **no inbound webhook yet** (reply loop can't fire from real mail) |
| CI | ◐ | build + typecheck + kimi-gate; **no lint, no tests** |

### Build health

- `pnpm build` ✅ and `pnpm typecheck` ✅ (matches CI).
- `pnpm lint` ❌ — `next lint` is deprecated in Next 15 and hangs on an
  interactive prompt; package lint scripts elsewhere are echo-stubs. CI doesn't
  run lint at all, so nothing is enforcing it.
- No test runner is configured in any package (`turbo run test` is a no-op).

---

## 3. Market Feasibility (live research, June 2026)

### 3.1 Demand

- US moving services: **~$21–23B/year revenue**, but slow growth (~3.8% CAGR
  projected) and **record-low mobility — ~11% of Americans moved in 2024, the
  lowest since tracking began in 1948, with no 2025 rebound** (Census, Harvard
  JCHS). The TAM is large in dollars, shrinking in volume.
- Only ~23% of movers hire full-service pros; ~60% of moving-labor hirers still
  contact companies directly. Cost is the #1 decision factor. The
  quote-request friction MoveOS targets is real.
- Supply is hyper-fragmented (~7,700+ companies, ~half with <5 employees) —
  which actually favors a consumer-side aggregation/agent layer.

### 3.2 Competition (the internal doc's "no direct competitor" is outdated)

| Player | Why it matters |
|---|---|
| **Move AI (moveai.com)** | Closest direct competitor: AI moving concierge that price-shops and returns competitive quotes; free to consumer, vendor-paid. $1.4M pre-seed (Oct 2024), ex-Apple/MIT founder, pursuing corporate-relocation pilots. Early — the space is not locked up, but "first AI-native mover" positioning is no longer true. |
| **Updater** | The incumbent wall: ~$453M raised, claims tech touches >25% of US moves — but distribution is B2B2C (realtors/multifamily), monetizing internet/insurance/supplies referrals. Weak on consumer-grade agentic UX. |
| **Porch** | Pivoted hard to insurance (2025); abandoned the consumer moving-concierge wedge. Validates the difficulty of the consumer-direct model. |
| **Dolly** | Absorbed into Taskrabbit (2024) — consolidation signal. |
| **Yembo / MoveCall / Voiceflow-for-movers** | Supply side is deploying its own AI quote/booking agents — MoveOS agents may soon negotiate with mover agents (arguably good: structured replies). |
| **Utility Concierge / Move Concierge** | Human concierges, free to consumer, vendor-paid commissions — long-lived proof of the monetization model to copy. |

**Pattern:** every consumer-direct moving app has pivoted to B2B2C, been
absorbed, pivoted away, or stayed small. Nobody has won on consumer
subscriptions. Survivors are vendor-paid per transaction and distribute through
parties with recurring deal flow (realtors, property managers, employers).

### 3.3 Lead-gen economics (the real revenue engine)

- Angi/HomeAdvisor moving leads: **$15–60+** (some sources $35–85), shared with
  3–8 movers. Thumbtack: ~$10–50 per response. Dedicated providers: $10–100+
  (exclusive at the high end).
- A MoveOS lead (structured inventory, dates, approval-to-book signal) is
  better than a shared Angi lead and could plausibly command **$50–150
  exclusive** — *inference, unvalidated*.
- ISP/utility connect commissions of $20–135 per signup are real and
  unregulated — but the internal doc's assumed **60–75% ISP conversion is far
  outside anything reported publicly**; treat 10–25% as the planning range
  until measured.

### 3.4 The four kill risks

1. **FMCSA broker classification (biggest, missing from internal doc).**
   Anyone who "negotiates for… or holds itself out by solicitation… as
   arranging transportation of household goods by motor carrier **for
   compensation**" is a household-goods broker (49 CFR 371 subpart B; FMCSA
   June 2023 guidance). Soliciting interstate quotes on the user's behalf
   *while taking mover-side referral fees* plausibly crosses the line →
   MC registration, bond, survey-based-estimate rules; HHG penalties can run
   $10k/day/violation. **Mitigations:** charge only the consumer for the quote
   agent; monetize utilities/internet/insurance referrals; or register as a
   broker deliberately. Get transportation counsel before signing any
   mover-side fee deal.
2. **Reply-parsing reality.** Movers often respond with phone calls, PDFs, or
   "we need to do a survey" — not clean quotes. This is a bigger product risk
   than spam filtering. The HITL inbox absorbs some of this; expect to handle
   attachments, phone-number extraction, and "schedule a survey" outcomes as
   first-class reply intents.
3. **Email deliverability.** Gmail/Yahoo bulk-sender rules tightened again in
   2025. Sending from the **user's own OAuth'd mailbox (current Nylas design)
   is exactly right** — low-volume, genuinely solicited, business-to-business.
   Keep platform-domain (Resend) mail strictly transactional.
4. **Generic agents.** ChatGPT Agent-class products can already "email three
   movers for me." Defensibility lives in mover-side relationships, structured
   quote data, the booking/referral rails, and the move-lifecycle product — not
   in the email-sending act itself.

### 3.5 Willingness to pay

Consumer AI subscription conversion is thin (~5% of ChatGPT weekly actives pay;
~9% of consumers pay for >1 AI product). But one-off, outcome-priced task
automation is the rising pattern. For a once-every-9-years purchase:
**one-time move pass ($29–79) + vendor-paid referrals. No subscription.** The
internal doc reaches the same pricing conclusion — that part is validated.

---

## 4. Review of the Internal Market Research / Marketing Plan

`docs/MoverOS-Market-Research.md` is strong on segmentation, GTM channel
design, and pricing psychology. The SEO/city-pages strategy, RE-agent gifting
channel, and "instant move report" viral hook are all good and worth keeping.
But several quantitative claims should not be used for planning:

| Claim in doc | Reality check |
|---|---|
| "No direct AI-native competitor" (§5, §13) | Move AI is exactly this, funded Oct 2024. Updater owns the B2B2C channel the doc proposes. |
| Industry "robust", 8.4% YoY growth | Mobility is at a 76-year low; revenue growth is price-driven, volume is shrinking. |
| ISP referral conversion 60–75% (§8.1) | No public comp supports this; plan at 10–25%. ARPM of $135–183 is likely 2–4x optimistic → blended ARPM $40–90 is a safer planning number. |
| Risk section (§15) | **Omits FMCSA broker exposure entirely** — the single biggest structural constraint on §8.2's mover-referral revenue. |
| §14.3: "$100K MRR (666 moves/mo) = $30M+ annual run rate" | Arithmetic error: $100K/month = **$1.2M/year**, not $30M. Projections downstream of this should be rebuilt. |
| Financial projections (§14.1): $600K/mo by month 12 | Implies ~4,000 active moves/month with near-zero paid CAC inside 12 months. Treat as aspiration, not plan. |
| Viral coefficient 0.3–0.8 for the instant report | Unvalidated; the doc's own Priority 1 (validate the report page first) is the right response — do that. |

The doc's three pre-build priorities (validate instant report, sign one
affiliate partner, recruit one RE agent) remain the right go-to-market actions
and **none of them require more code**.

---

## 5. Code Review — Security

Findings verified against source; severity reflects exploitability *today*.

### High priority

1. **No Nylas inbound webhook & no signature verification (blocks the core
   loop).** `email/reply.received` has no producer — the reply-parse agent can
   never fire from real mail. When the webhook route is added, it must verify
   the `X-Nylas-Signature` HMAC **and** map message → grant → user → move
   server-side. Never trust a moveId derived from email content
   (`apps/web/lib/inngest/functions.ts:57-146`).

2. **Prompt-injection exposure in `reply_parse`.** Raw inbound email bodies go
   straight into the prompt (`packages/agents/src/defs/reply-parse.ts`,
   `functions.ts:79-86`). A malicious "vendor" can attempt to steer the parse
   (fabricated quotes, instructions to the agent). Mitigations: wrap the email
   body in clearly delimited untrusted-content tags with an explicit
   "data, not instructions" system rule; cap body length
   (`z.string().max(~20_000)` — currently unbounded `min(1)`); add a guardrail
   that rejects outputs whose extracted values don't appear in the source text;
   and keep HITL approval in front of every consequential action (already the
   case — this is the design's best defense, preserve it).

3. **Inngest functions use the unscoped service-role DB.** All four functions
   call `getDb()` and trust `event.data.moveId`/`approvalId` without
   re-verifying ownership (`functions.ts:62,158,274,338`). Today the only
   producers are ownership-checked tRPC mutations, so this is latent — but it
   becomes real the moment any event has a non-tRPC producer (the Nylas
   webhook). Fix cheaply: include `userId` in every event payload and assert
   `moves.user_id = userId` in the first step of each function.

4. **`dispatch-approved-action` doesn't check approval status, and the
   idempotency check races.** `functions.ts:276-309` loads the row but never
   asserts `status IN ('approved','edited_approved')`, and the
   `emailSentAt` guard is read-then-act across steps — a double-fired event
   could double-send. Add a status assertion and make the send step claim the
   row atomically (`UPDATE … SET email_sent_at = now() WHERE id = ? AND
   email_sent_at IS NULL RETURNING *`), or set an Inngest idempotency key on
   the event.

### Medium

5. **RLS exists but nothing uses it.** The app's only DB path is the
   service-role client, which bypasses RLS; `scopedDb` is the *sole* tenant
   boundary (`packages/db/src/scoped.ts:24-34` documents this honestly). Fine
   for now — but add a CI test that exercises `scopedDb` cross-tenant denial,
   and keep the RLS policies in sync so a future user-context client is safe.
6. **In-memory rate limiter** (`packages/trpc/src/rate-limit.ts`) — per-process
   only; resets on deploy and is wrong the moment Vercel runs >1 instance.
   Replace with Upstash/Redis before launch. Also: there is no per-move cap on
   agent-triggering mutations (`quote/requested`), so a hot loop = LLM spend.
7. **No per-user/per-move LLM budget enforcement.** Costs are *recorded*
   (`agent_tasks.estimated_cost_usd`) but never *checked*. Add a cheap "sum
   costs for move this day > $X → refuse + flag" guard in the harness.
8. **OAuth state cookie** (`api/nylas/connect/route.ts:21-27`) is httpOnly +
   600s — good. Minor hardening: delete the cookie in the callback after use
   (single-use), and consider binding state to the user id (HMAC) rather than
   a bare UUID.

### Noted and dismissed (false positives from a first-pass audit)

- `estimatedCostUsd: outcome.costUsd.toFixed(6)` is **correct** — Drizzle
  `numeric` columns take strings by design.
- `new URL("/api/nylas/callback", req.url)` does **not** leak query params —
  an absolute path discards the base's query/fragment.

---

## 6. Code Review — Correctness & Quality

### Bugs / fragile spots

1. **`tasks.complete` counter isn't transactional**
   (`packages/db/src/scoped.ts:118-136`): task update and `tasks_completed`
   increment are two statements with a read-then-act idempotency check.
   Concurrent completes can double-increment; a failure between statements
   drifts the counter. Either wrap in `db.transaction`, or — better — make the
   guard atomic (`UPDATE tasks … WHERE id = ? AND status != 'completed'
   RETURNING *` and only increment when a row returns). A DB trigger is the
   most robust option. Same idea applies anywhere a denormalized counter lives.
2. **`parseEmailReply` hardcodes context** (`functions.ts:81-85`):
   `vendorType: "other"`, `subject: "(email reply)"` — the threadId is stored
   but never used to recover the original vendor/quote context. Fine as
   scaffolding; must be fixed with the webhook work (thread → approval_item →
   vendor type), or parse quality will be poor.
3. **Quote approval with empty recipient**: `request-quotes` inserts
   `emailTo: ""` and dispatch no-ops on empty (`functions.ts:286,411`) — the
   ApprovalInbox edit flow is the only path to a recipient. Make "recipient
   required before approve" an explicit UI + server validation rather than a
   silent no-op, or approved items appear to do nothing.

### Optimization opportunities

**Backend / Inngest**
- Carry `userId` (and for replies, vendor context) in event payloads — kills
  the join-per-dispatch lookup (`functions.ts:291-296`) and enables scoping
  (§5.3).
- Add Inngest `idempotency` keys (e.g. `event.data.approvalId`) and
  `concurrency` limits per function; today only `retries: 2` is configured.
- `getUserIdFromToken` calls `supabase.auth.getUser()` per request — fine at
  this scale; when it shows up in latency traces, switch to local JWT
  verification with the project's JWKS.

**Database**
- Add a composite index for the inbox query
  (`approval_items(move_id, status)` or partial index
  `WHERE status = 'awaiting_approval'`) — `pendingForUser` joins moves and
  filters status on every dashboard load.
- `tasks(move_id, sort_order)` composite would serve `listForMove` ordering.
- Run Supabase advisors (`get_advisors`) after applying migrations — cheap
  wins.

**Frontend**
- Dashboard pages are client components fetching via tRPC on mount; with App
  Router you can prefetch in a server component and hydrate — but at this
  stage, the bigger win is **optimistic updates** on approve/reject/complete
  (`ApprovalInbox.tsx`, `MoveTimeline.tsx`) so the inbox feels instant.
- Supabase Realtime for approval items is specced (Phase 2) and not yet wired —
  polling/refresh is the current behavior.

**Agent harness**
- `cost.ts` returns silently for unknown models — log loudly or throw; silent
  $0 cost rows will corrupt the ledger you'll later use for budgets.
- Golden cases exist on the agent defs but nothing runs them — wire
  `eval.ts` into CI (even just "golden cases pass schema + guardrails") before
  agent count grows.
- Single-provider risk is acceptable now; keep model ids in one config module
  so a swap is a one-line change.

**Tooling / hygiene**
- Fix lint: migrate to ESLint CLI flat config (the `next lint` deprecation
  path), give every package a real lint script, add it to CI.
- Add a minimal test harness (Vitest) — first targets: `scopedDb` ownership
  denial, harness Zod-gating/guardrails, `daysUntil`/`dueDateFrom` (timezone
  edge cases), validate-kimi-output.
- `packages/utils` is an empty placeholder — delete or populate.

---

## 7. Roadmap Assessment (Phases 2–5)

The spec's remaining work is correctly identified. Recommended adjustments
based on this review:

1. **Pull the Nylas inbound webhook forward** (it's implicitly Phase 3). The
   quote → send → reply → parse → approve loop is the product's entire "wow";
   until the webhook exists, the flagship loop cannot complete on real mail.
   Build it with signature verification + thread mapping (§5.1, §6.2) next.
2. **Expand reply-intent coverage early.** Plan for `needs_survey`,
   `call_requested`, `attachment_quote` outcomes, not just clean parsed prices
   (§3.4 risk 2). This is product-shaping, cheaper to do now than retrofit.
3. **Re-order monetization inside Phase 4:** Stripe one-time move pass and
   ISP/utility/insurance affiliate links first; **mover-side lead fees only
   after FMCSA counsel** (§3.4 risk 1). The affiliate redirect route
   (`/api/affiliate/click`) is unaffected and fine.
4. **Before more agents, harden the rails:** per-move event rate caps, LLM
   budget guard, distributed rate limiting, idempotency keys, eval-in-CI.
   Six more agents on today's rails multiplies today's gaps.
5. **Don't let Phase 5's landing page slip behind validation.** The internal
   doc's own Priority 1 — the no-signup instant move report — is both the #1
   acquisition hypothesis and buildable as a standalone page now. Validating
   it doesn't depend on Phases 2–4.
6. **Agent-count sanity check:** the spec's 9 agents are a fine north star, but
   market findings suggest depth on 3 (quote, reply-parse, internet/utility)
   beats breadth on 9 — internet/utility setup is where the unregulated,
   proven referral money is.

---

## 8. Immediate Action Points

| # | Action | Why now | Size |
|---|---|---|---|
| 1 | Build `/api/nylas/webhook` with HMAC signature verification + server-side grant→user→move mapping | Completes the flagship loop; security boundary for everything inbound | M |
| 2 | Add `userId` to all Inngest event payloads + ownership assertion in each function | Closes latent tenant-isolation gap before webhook lands | S |
| 3 | Harden `reply_parse` against prompt injection (delimited untrusted input, max body length, source-grounding guardrail) | Inbound email is attacker-controlled input to an LLM | S–M |
| 4 | Fix `dispatch-approved-action`: assert approval status + atomic claim of `email_sent_at`; add idempotency key | Prevents duplicate/unauthorized real-world sends | S |
| 5 | Make `tasks.complete` atomic (transaction or guarded UPDATE) | Counter drift is user-visible (progress ring) | S |
| 6 | Add LLM budget guard (per-move daily cost cap) + per-move event rate caps | Cost-runaway protection before agent breadth | S |
| 7 | Fix lint (ESLint flat config) + add Vitest + wire golden-case evals into CI | Only build+typecheck gate the repo today | M |
| 8 | Composite indexes: `approval_items(move_id,status)`, `tasks(move_id,sort_order)` | Cheap, query-shaped | XS |
| 9 | **Business:** get FMCSA/transportation counsel opinion before any mover-side fee agreement | Biggest structural constraint on monetization | — |
| 10 | **Business:** correct the market doc (§14.3 run-rate arithmetic, ISP conversion assumptions, competitor section: Move AI/Updater) and re-derive projections at ARPM $40–90 | Plans built on these numbers will mis-allocate effort | — |
| 11 | **Business:** ship the no-signup instant move report page + start CJ Affiliate (ISP) and A2P 10DLC applications | Long lead times; validates acquisition hypothesis with zero product risk | M |

---

## 9. Overall Assessment

The codebase is in the top tier of what a Phase-1 solo build looks like:
disciplined design system, real type-safety end-to-end, an agent harness with
actual guardrails, and a security posture (`scopedDb`, HITL gating, CSRF state,
httpOnly cookies) that shows intent. The gaps are the *normal* gaps of this
stage — no tests, no webhook yet, latent scoping holes behind a single
producer — and all are cheaply fixable now, expensively fixable after six more
agents are stacked on top.

The market opportunity is real but narrower and more contested than the
internal research assumes. The product wedge (HITL quote agent + the move
lifecycle) is right; the monetization order needs to flip toward
utilities/internet referrals + one-time pass, with mover-side fees gated on
regulatory counsel; and distribution through realtors/PMs deserves the weight
the plan already gives it. Build the webhook, harden the rails, validate the
instant report — in that order.
