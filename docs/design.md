# MoverOS — `design.md`

> **Single source of truth for visual + motion design.** Both AI design passes
> and human/AI build passes consume this file. `packages/ui/theme` (TS tokens)
> and `packages/ui/styles/tokens.css` (CSS variables) are generated from it and
> kept in sync. When this file and the code disagree, **this file wins** — update
> code to match, not the other way around.
>
> Schema: the 9-section DESIGN.md format (spec §4.0). Direction: **Soft Depth /
> Tactile** (chosen from the propose-3-directions pass).

---

## 1. Visual Theme & Atmosphere

**"Warm Command Center — Soft Depth / Tactile."**

MoverOS sits between two emotional states: the anxiety of moving and the relief
of a capable assistant handling it. The interface should feel like a trusted,
extremely organized friend — warm enough to lower stress, structured enough to
signal competence.

**The Soft Depth / Tactile interpretation.** Surfaces feel like real, liftable
objects: warm paper cards resting on a warm-stone desk, raised by soft layered
shadows rather than hard lines. Interaction is physical — pressable things press
in, completed things settle with weight. Depth communicates hierarchy (what's
actionable floats; what's done sinks back). Nothing is flat, nothing is glossy.

**Signature moment.** When an agent completes a task, the card delivers a
satisfying settle: a spring checkmark, a brand-tinted background flash, a green
strike-through, and the progress ring incrementing — "that's done, you don't
have to think about it anymore."

**References:** Airbnb (warmth, generous padding), Headspace (calm, rounded,
gentle motion), Linear (crisp hierarchy), Notion (card-based, readable). The
tactile-depth layer is what's ours.

---

## 2. Color Palette & Roles

Seeded from spec §4.2. Three warm ramps + semantic + surface. Hex is
authoritative; the `--color-*` CSS vars and `theme/colors.ts` mirror these.

### Brand — Warm Sage (trust, primary actions, progress)

| Token | Hex | Role |
|---|---|---|
| `brand-50` | `#f0f7f4` | tint wash, success-flash start |
| `brand-100` | `#dceee7` | hover wash, completed-card tint |
| `brand-200` | `#b8ddd0` | subtle borders on brand surfaces |
| `brand-300` | `#87c3ac` | disabled primary, ring halo |
| `brand-400` | `#5ba389` | secondary brand text |
| `brand-500` | `#3d8a70` | **primary brand** (buttons, ring fill) |
| `brand-600` | `#2f6e59` | primary hover |
| `brand-700` | `#275847` | primary pressed |
| `brand-800` | `#21473a` | on-brand deep text |
| `brand-900` | `#1c3c30` | darkest brand |

### Accent — Warm Amber (deadlines, urgency, "review required")

| Token | Hex | Role |
|---|---|---|
| `accent-50` | `#fffbeb` | urgency wash |
| `accent-100` | `#fef3c7` | awaiting-approval card tint |
| `accent-200` | `#fde68a` | amber border |
| `accent-300` | `#fcd34d` | — |
| `accent-400` | `#fbbf24` | — |
| `accent-500` | `#f59e0b` | **deadline / urgency** |
| `accent-600` | `#d97706` | amber hover |
| `accent-700` | `#b45309` | amber pressed |

### Neutral — Warm Stone (surfaces, text)

| Token | Hex | Role |
|---|---|---|
| `neutral-50` | `#faf9f7` | **app background** (the "desk") |
| `neutral-100` | `#f3f1ee` | sunken wells, recessed rows |
| `neutral-200` | `#e8e4de` | **default border / divider** |
| `neutral-300` | `#d4cec6` | strong border, input outline |
| `neutral-400` | `#b0a89e` | placeholder, disabled text |
| `neutral-500` | `#8c8378` | muted text, captions |
| `neutral-600` | `#6e6560` | secondary text |
| `neutral-700` | `#524e4a` | body text on tinted surfaces |
| `neutral-800` | `#3a3632` | strong text |
| `neutral-900` | `#1e1c1a` | **primary text** |

### Semantic

| Token | Hex | Role |
|---|---|---|
| `success` | `#22c55e` | completed tasks, positive deltas |
| `warning` | `#f59e0b` | approaching deadlines (= accent-500) |
| `error` | `#ef4444` | overdue / critical |
| `info` | `#3b82f6` | agent working |

### Surface (the depth layer — Direction C)

| Token | Value | Role |
|---|---|---|
| `surface-base` | `#faf9f7` | the desk; app background |
| `surface-sunken` | `#f3f1ee` | wells/inputs that sit *below* the desk |
| `surface-card` | `#ffffff` | paper cards that float *above* the desk |
| `surface-raised` | `#ffffff` | cards lifted further (modals, popovers) |
| `surface-overlay` | `rgba(30,28,26,0.04)` | hover/active wash on neutral |
| `surface-scrim` | `rgba(30,28,26,0.32)` | modal backdrop |
| `surface-border` | `#e8e4de` | hairline on cards (= neutral-200) |

Dark mode is **V2** — token names are stable; values invert the neutral ramp and
darken surfaces (`base #1a1814`, `card #242019`, `border #3a3530`).

---

## 3. Typography Rules

Families: **Plus Jakarta Sans** (display + body), **JetBrains Mono** (agent
names, task IDs, deadlines, costs). Full scale seeded from spec §4.3; sizes in px,
mirrored in `theme/typography.ts`.

| Role | Size | Weight | Line | Tracking |
|---|--:|--:|--:|--:|
| `display2xl` | 72 | 800 | 80 | -2.5 |
| `displayXl` | 48 | 800 | 56 | -1.5 |
| `displayLg` | 36 | 700 | 44 | -1.0 |
| `h1` | 28 | 700 | 36 | -0.5 |
| `h2` | 22 | 600 | 30 | -0.3 |
| `h3` | 18 | 600 | 26 | -0.2 |
| `h4` | 16 | 600 | 24 | 0 |
| `bodyLg` | 17 | 400 | 26 | 0 |
| `bodyMd` | 15 | 400 | 23 | 0 |
| `bodySm` | 13 | 400 | 20 | 0 |
| `labelLg` | 14 | 500 | 20 | 0.1 |
| `labelMd` | 12 | 500 | 18 | 0.2 |
| `labelSm` | 11 | 500 | 16 | 0.3 |
| `monoMd` | 13 | 400 | 20 | 0 (mono) |
| `monoSm` | 11 | 400 | 16 | 0 (mono) |

Rules: display weights only for hero numbers (countdown, big stats). Mono is
reserved for machine facts (agent ids, `$1,850`, `T-32d`) — never for prose.
Body never exceeds ~68ch measure.

---

## 4. Component Stylings

Every interactive component defines: default / hover / active(pressed) / focus /
disabled, plus domain states where relevant. The tactile rule: **pressable
elements physically depress** — `translateY(1px)` + shadow drops one elevation
step on `:active`.

### Buttons

| Variant | Default | Hover | Pressed | Focus | Disabled |
|---|---|---|---|---|---|
| **Primary** | `brand-500` bg, white text, `e1` shadow | `brand-600` | `brand-700`, `translateY(1px)`, shadow→`e0` | `ring-brand-300` 3px halo | `brand-300` bg, no shadow |
| **Secondary** | `surface-card`, `neutral-300` border, `e1` | `neutral-50` bg | `neutral-100`, depress | ring halo | 50% opacity |
| **Ghost** | transparent, `neutral-700` text | `surface-overlay` | `surface-overlay` ×2 | ring | 40% opacity |
| **Danger** | `error` bg, white | darken 8% | darken + depress | `ring-error/40` | desaturate |

Radii: primary 12, secondary 8, icon/pill 999. Min height 44px (touch).

### Cards (TaskCard, ApprovalCard)

Base: `surface-card`, radius 16, `e2` shadow, 1px `surface-border`, 20px padding.
On hover (interactive cards): lift to `e3` + `translateY(-2px)`. Domain states:

- **pending** — faded 0.85, gray status dot, `e1` (sits lower).
- **agent_working** — `info` pulsing dot, thin `info` top-edge accent, `e2`.
- **awaiting_approval** — `accent-100` tint, 1.5px `accent-300` border, `e2`; "Review required" amber chip.
- **completed** — `brand-50` tint, green check, strike-through title, **sinks to `e0`** (done = recedes).
- **overdue** — `error` 1.5px border, red urgent chip, `e2`.

### Inputs

Sunken: `surface-sunken` bg, inset hairline (`inset 0 1px 2px rgba(0,0,0,0.04)`),
radius 8, 44px height. Focus: bg→white, `brand-400` 1.5px border + 3px
`brand-300` halo. Error: `error` border + halo. Placeholder `neutral-400`.

### Chips / Badges

Pill (999), `labelSm`, 6×10 padding. Priority: critical `error`, high `accent-600`,
medium `neutral-600`, low `neutral-400`. AgentStatusBadge uses mono + status color.

### Nav

App shell: left rail (web wide) / bottom tab bar (mobile). Active item: `brand-500`
icon + `brand-50` pill behind it. Surfaces use `e1`; the rail floats above content.

---

## 5. Layout Principles

Base unit **4px**. Scale: `4 8 12 16 20 24 32 40 48 64 80 96`.

- **Horizontal padding:** 16 (mobile) · 24 (tablet/web-narrow) · 32 (web-wide).
- **Content max-width:** 1200 (dashboard), 680 (reading/forms).
- **Grid:** 12-col web, 4-col mobile, 24px gutters.
- **Whitespace strategy:** generous and intentional — cards breathe (20px interior,
  16px between). Density lives *inside* cards (Linear-like), calm *between* them.
- **Radii:** card 16 / 12 / 8, chip 4, button 12 / 8 / 999.
- **Safe areas (mobile, V2):** respect `safeAreaInsets.top/bottom`.

---

## 6. Depth & Elevation

**The heart of Direction C.** A 5-step elevation ladder using *layered* soft
shadows (a tight contact shadow + a wide ambient shadow), warm-tinted rather than
pure black, so cards read as paper on a warm desk. Elevation encodes status:
actionable floats high, completed sinks.

| Level | Use | Shadow (web) |
|---|---|---|
| `e0` | flush / completed / pressed | `0 1px 2px rgba(30,28,26,0.04)` |
| `e1` | rails, secondary buttons, chips | `0 1px 2px rgba(30,28,26,0.05), 0 2px 6px rgba(30,28,26,0.04)` |
| `e2` | **default card** | `0 1px 3px rgba(30,28,26,0.06), 0 6px 16px rgba(30,28,26,0.05)` |
| `e3` | hovered card, popover | `0 2px 6px rgba(30,28,26,0.07), 0 12px 28px rgba(30,28,26,0.07)` |
| `e4` | modal, dialog | `0 4px 12px rgba(30,28,26,0.08), 0 24px 48px rgba(30,28,26,0.10)` |
| `inset` | inputs, wells | `inset 0 1px 2px rgba(30,28,26,0.05)` |

Shadow color is always warm (`30,28,26` = neutral-900), never `#000`. One light
source, top-down: ambient blur grows with elevation, contact shadow stays tight.
Borders are a hairline backup, not the primary depth cue.

---

## 7. Design Guardrails

**Do**
- Use elevation + warm shadow for hierarchy; reach for a border only as a hairline backup.
- Keep motion physical and short (see §9 motion tokens); honor `prefers-reduced-motion`.
- Reserve mono for machine facts; reserve display weights for hero numbers.
- Keep one warm light source — shadows go down, never up or multi-directional.
- Hit ≥44px touch targets and WCAG AA contrast (verify text on tinted cards).

**Don't (anti-slop)**
- ❌ Generic AI aesthetics: Inter/Roboto/system fonts, purple-on-dark gradients, glassmorphism, neon glows.
- ❌ Pure-black shadows, hard 1px-only flat cards, or uniform elevation (everything floating the same).
- ❌ Cool grays — every neutral is warm stone. No `#666`/`#999`.
- ❌ Decorative motion, parallax, or springs on the core app's data surfaces; bouncy easing on destructive actions.
- ❌ GSAP / R3F / shaders in the **web app** — those live only on the landing page (perf: keep LCP/CLS green, JS lean).

**Perf**
- Animate only `transform` and `opacity` (never `box-shadow`/`width`/`top` in loops — cross-fade two shadow layers instead).
- Lazy-load Lottie; cap concurrent animations; target LCP < 2.5s, CLS < 0.1.

---

## 8. Responsive Behavior

Breakpoints (Tailwind defaults): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

| Range | Layout |
|---|---|
| < 640 | single column, bottom tab bar, 16px gutters, full-width cards |
| 640–1024 | two-column dashboard, 24px gutters, collapsible rail |
| > 1024 | left rail + 12-col content, 32px gutters, max-width 1200 |

Touch targets ≥44px on all sizes. Hover-only affordances (card lift) degrade to
pressed states on touch. Progress ring scales with container; numbers stay
`display*`. Modals are full-screen sheets < 640, centered dialogs above.

---

## 9. Agent Prompt Guide

Quick reference for AI build prompts. Paste the relevant block.

**Atmosphere:** "Warm Command Center, Soft Depth / Tactile. Warm paper cards on a
warm-stone desk, raised by soft *layered, warm-tinted* shadows. Physical,
pressable, calm. Never flat, never glossy, never cool-gray."

**Tokens:** brand = Warm Sage (`brand-500 #3d8a70`), accent = Warm Amber
(`accent-500 #f59e0b`), neutrals = Warm Stone (`#faf9f7`→`#1e1c1a`). Type = Plus
Jakarta Sans + JetBrains Mono (machine facts only). Import from
`@moveros/ui/theme`; use CSS vars `--color-*`, `--elevation-*`, `--motion-*`.

**Elevation:** 5-step ladder `e0…e4` + `inset` (§6). Default card `e2`; hover
`e3` + `translateY(-2px)`; pressed drops one step + `translateY(1px)`; **completed
sinks to `e0`**. Warm shadow color `rgba(30,28,26,*)`, one top-down light source.

**Motion personality — "settled weight":** quick to respond, soft to arrive.
`easeOut [0.16,1,0.3,1]` for most UI; `spring stiffness 400 / damping 30` for
press; `celebration spring 200/15` only for task-complete. Durations: instant 80,
fast 150, normal 250, slow 400, verySlow 600. Press = scale 0.97 + depress;
release settles. Always honor `prefers-reduced-motion`.

**The task-complete sequence:** (1) optional haptic; (2) checkmark springs in;
(3) card bg flashes `brand-100`→`surface-card` (250ms); (4) title green
strike-through (150ms delay); (5) card sinks `e2`→`e0`; (6) progress ring
increments (spring 400ms); (7) confetti only on the final task.

**Anti-slop:** see §7. No Inter/system fonts, no purple gradients, no
glassmorphism, no pure-black shadows, no cool grays, no GSAP/R3F in the app.
