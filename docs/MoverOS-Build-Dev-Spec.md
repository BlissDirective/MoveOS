# MoverOS — Build & Development Specification
**Document 2 of 2 · Complete Technical Build Spec with Cost Analysis**

*Configured from interactive questionnaire · June 2026*

---

## Configuration Summary (From Questionnaire)

| Decision | Choice |
|----------|--------|
| Platform | Simultaneous Web + Mobile (identical UI/design) |
| Mobile Framework | Expo (React Native) — recommended for Next.js web stack |
| Move Lifecycle Scope | Full lifecycle: planning → moving day → settled |
| UI Aesthetic | Warm / friendly — earthy tones, rounded corners, consumer-app feel |
| LLM Strategy | Best model per agent type (Sonnet for reasoning, Haiku for classification) |
| Agent Autonomy | Human-in-the-loop on ALL agent actions |
| Real-World Actions | Yes — email + form submission on user's behalf (Nylas) |
| Backend | Supabase (Postgres + Auth + Storage) |
| Background Jobs | Inngest |
| Notifications | Full stack: Push + Email + SMS |
| Monetization | One-time unlock ($29–$79 per move) |

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack — Full Specification](#2-technology-stack--full-specification)
3. [Mobile Framework Recommendation & Rationale](#3-mobile-framework-recommendation--rationale)
4. [UI / Design System Specification](#4-ui--design-system-specification)
5. [Screen-by-Screen UX Specification](#5-screen-by-screen-ux-specification)
6. [Multi-Agent Orchestration Specification](#6-multi-agent-orchestration-specification)
7. [Human-in-the-Loop System Design](#7-human-in-the-loop-system-design)
8. [Notification System Specification](#8-notification-system-specification)
9. [Database Schema — Full Specification](#9-database-schema--full-specification)
10. [API Integration Specifications](#10-api-integration-specifications)
11. [Monorepo Structure & Code Organization](#11-monorepo-structure--code-organization)
12. [Authentication & Security](#12-authentication--security)
13. [Monetization Implementation](#13-monetization-implementation)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Cost Analysis — Full Breakdown](#15-cost-analysis--full-breakdown)
16. [Build Timeline — Week-by-Week](#16-build-timeline--week-by-week)
17. [Testing Strategy](#17-testing-strategy)
18. [Post-Launch Iteration Plan](#18-post-launch-iteration-plan)

---

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                   │
│   ┌─────────────────────┐    ┌─────────────────────────────┐    │
│   │   Next.js 15 Web    │    │   Expo (React Native) App   │    │
│   │   (Vercel)          │    │   iOS + Android             │    │
│   │   App Router + RSC  │    │   Expo Router (file-based)  │    │
│   └──────────┬──────────┘    └──────────────┬──────────────┘    │
│              │                              │                     │
│              └──────────────┬───────────────┘                    │
│                             │ Shared UI + Logic                   │
│                      (shared package)                             │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   tRPC API Layer    │
                    │  (Next.js Routes)   │
                    │  Type-safe end-to-  │
                    │  end, no schema     │
                    │  drift              │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────▼──────┐   ┌───────▼───────┐   ┌──────▼──────┐
   │  Supabase   │   │    Inngest     │   │  Anthropic  │
   │  Postgres   │   │  Background    │   │  Claude API │
   │  Auth       │   │  Agent Tasks   │   │  Sonnet 4.5 │
   │  Storage    │   │  Scheduled     │   │  Haiku 4.5  │
   │  Realtime   │   │  Events        │   │             │
   └─────────────┘   └───────────────┘   └─────────────┘
          │                   │
   ┌──────▼──────┐   ┌───────▼───────┐
   │   Nylas     │   │  External APIs │
   │  Email Auth │   │  SmartyStreets │
   │  Send/Recv  │   │  FMCSA         │
   │  (Gmail,    │   │  Google Places │
   │   Outlook)  │   │  USPS          │
   └─────────────┘   └───────────────┘
```

### 1.2 Key Architectural Decisions

**Why a monorepo (Turborepo)?**
Simultaneous web + mobile with identical UI requires sharing:
- UI components (design system)
- Business logic (move state, agent schemas)
- Type definitions (Drizzle schema types)
- Utility functions (date formatting, address parsing)

Without a monorepo, you maintain two separate codebases that will inevitably drift. Turborepo handles build caching and makes this nearly as simple as a single repo.

**Why tRPC over REST?**
- Full TypeScript type safety from database → server → client → mobile
- No separate OpenAPI spec to maintain
- Auto-completion in VS Code for all API calls on web and mobile
- Eliminates entire class of "API schema drift" bugs

**Why Inngest over n8n for agents?**
While you use n8n professionally, Inngest is the right choice here because:
- It runs inside your Next.js codebase (no separate service to maintain)
- Purpose-built for TypeScript + durable function patterns
- Native retry, scheduling, and step-function semantics
- No infrastructure to provision — serverless
- Agents are code, not visual flows — better version control and testing
- n8n is excellent for integration automation; Inngest is better for code-first agent orchestration

**The web/mobile identity bridge:**
Both web and mobile share a single Supabase Auth instance. A user logging in on web and then opening the mobile app is the same authenticated session. Supabase handles the JWT refresh across both platforms.

---

## 2. Technology Stack — Full Specification

### 2.1 Complete Stack Reference

```
MONOREPO
└── Turborepo (build orchestration, shared caching)

APPS
├── apps/web           → Next.js 15 (App Router)
└── apps/mobile        → Expo SDK 52 (React Native)

PACKAGES (shared)
├── packages/ui        → Design system (shared components)
├── packages/db        → Drizzle schema + Supabase client
├── packages/trpc      → tRPC router definitions
├── packages/agents    → Agent type definitions + prompts
└── packages/utils     → Shared utilities (dates, addresses, etc.)

FRONTEND — WEB
├── Framework:         Next.js 15.x (App Router, React Server Components)
├── Styling:           Tailwind CSS 4 + CSS variables for theming
├── Components:        shadcn/ui (radix primitives, customized to design system)
├── Animations:        Framer Motion (page transitions, task completions)
├── Forms:             React Hook Form + Zod validation
├── State:             Zustand (client UI state) + tRPC (server state)
├── Charts:            Recharts (timeline progress, task completion charts)
├── Email Preview:     React Email (render agent-drafted emails in-app)
└── Icons:             Lucide React

FRONTEND — MOBILE
├── Framework:         Expo SDK 52 + Expo Router 4 (file-based navigation)
├── Styling:           NativeWind 4 (Tailwind CSS classes for React Native)
├── Components:        Custom from packages/ui (React Native compatible)
├── Animations:        React Native Reanimated 3 + Moti
├── Forms:             React Hook Form + Zod (same as web)
├── Gestures:          React Native Gesture Handler
├── Push:              Expo Notifications
├── Haptics:           Expo Haptics (task completion feedback)
└── Storage:           Expo SecureStore (token storage)

BACKEND
├── API:               tRPC v11 (Next.js API routes)
├── ORM:               Drizzle ORM (type-safe, schema-as-code)
├── Database:          Supabase PostgreSQL (managed Postgres)
├── Auth:              Supabase Auth (email + Google + Apple OAuth)
├── Storage:           Supabase Storage (lease PDFs, move documents)
├── Realtime:          Supabase Realtime (agent status live updates)
├── Background Jobs:   Inngest (durable agent orchestration)
└── Validation:        Zod (shared with frontend)

AI / AGENTS
├── Reasoning agents:  Claude Sonnet 4.5 (MoveSetupAgent, BriefAgent, NegotiateAgent)
├── Classification:    Claude Haiku 4.5 (task classification, sentiment, quick lookups)
├── Orchestration:     Inngest step functions (multi-step agent flows)
└── Streaming:         Vercel AI SDK (streaming responses for long-running agent output)

EXTERNAL SERVICES
├── Email execution:   Nylas (connect user's Gmail/Outlook; send on their behalf)
├── Transactional:     Resend (system emails: receipts, alerts, weekly digest)
├── SMS:               Twilio (moving-day critical alerts)
├── Push (web):        Web Push API via Supabase Edge Functions
├── Push (mobile):     Expo Push Notification Service → APNs/FCM
├── ISP lookup:        SmartyStreets API
├── Mover validation:  FMCSA API (free federal API)
├── Local services:    Google Places API
├── Address:           USPS Address API
├── Calendar:          Google Calendar API (add appointments)
└── Payments:          Stripe (one-time unlock + B2B gifting codes)

INFRASTRUCTURE
├── Web hosting:       Vercel (Next.js native, edge functions, global CDN)
├── Mobile builds:     EAS Build (Expo Application Services)
├── Mobile OTA:        EAS Update (push JS updates without App Store review)
├── Database:          Supabase Cloud (managed Postgres on AWS)
├── Monitoring:        Sentry (web + mobile, unified error tracking)
├── Analytics:         PostHog (product analytics, feature flags, session replay)
├── Uptime:            BetterStack (status page + alerting)
└── CI/CD:             GitHub Actions
```

### 2.2 Package Version Lock (June 2026)

```json
{
  "next": "15.2.x",
  "expo": "~52.0.x",
  "expo-router": "~4.0.x",
  "react": "19.0.x",
  "react-native": "0.76.x",
  "typescript": "5.7.x",
  "tailwindcss": "4.0.x",
  "nativewind": "4.1.x",
  "drizzle-orm": "0.38.x",
  "drizzle-kit": "0.30.x",
  "@trpc/server": "11.0.x",
  "@trpc/client": "11.0.x",
  "inngest": "3.x",
  "@anthropic-ai/sdk": "0.32.x",
  "ai": "4.x",
  "framer-motion": "11.x",
  "react-native-reanimated": "3.16.x",
  "zod": "3.23.x",
  "stripe": "16.x"
}
```

---

## 3. Mobile Framework Recommendation & Rationale

### 3.1 Why Expo (Not Flutter, Not bare React Native)

Given your web stack is Next.js + React + TypeScript, **Expo with Expo Router** is the optimal mobile choice for the following reasons:

**1. Maximum code reuse with the web**
Both web and mobile share:
- Identical Zod schemas for form validation
- Identical tRPC client calls
- Identical Zustand state logic
- Identical agent type definitions
- 60–70% of business logic

Flutter uses Dart — a completely separate language. Zero code sharing with your Next.js web app.

**2. Expo Router = React Router for mobile**
Expo Router 4 uses file-based routing identical in philosophy to Next.js App Router. Moving between the two apps in development feels natural. Same `layout.tsx` / `page.tsx` mental model.

**3. NativeWind = Tailwind on mobile**
NativeWind 4 lets you write Tailwind class names on React Native components. Your `packages/ui` design system can export components that use Tailwind on web and NativeWind on mobile — **identical class names, both render correctly.** This is the key to the "identical UI" requirement.

**4. EAS Build + EAS Update**
- EAS Build: Cloud-based iOS and Android builds without a Mac required
- EAS Update: Push JavaScript updates to users instantly, without App Store review cycles (critical for fixing agent bugs post-launch)

**5. Expo SDK breadth**
Expo provides first-party packages for everything MoverOS needs:
- `expo-notifications` (push)
- `expo-haptics` (tactile feedback on task completion)
- `expo-secure-store` (JWT token storage)
- `expo-calendar` (add moving appointments)
- `expo-camera` (scan moving documents)
- `expo-linking` (deep links from email CTAs)

### 3.2 Expo Tradeoffs (Acknowledged)

| Concern | Mitigation |
|---------|-----------|
| App size (~40MB baseline) | Acceptable for a utility app; users keep it for 60–90 days |
| Performance vs native | Reanimated 3 + JSI bridge delivers 60fps animations |
| App Store approval time | First submission ~2 weeks; EAS Update bypasses reviews for JS changes |
| Native modules needed | Expo SDK 52 covers all required native features |

### 3.3 Shared Code Architecture

```
packages/ui/
├── components/
│   ├── TaskCard.tsx          ← Platform-adaptive (web div / RN View)
│   ├── AgentStatusBadge.tsx  ← Identical on both platforms
│   ├── MoveProgress.tsx      ← Recharts (web) / Victory Native (mobile)
│   ├── Timeline.tsx          ← Platform-specific rendering
│   └── Button.tsx            ← NativeWind handles web/mobile CSS
├── hooks/
│   ├── useMoveData.ts        ← tRPC query, identical both platforms
│   ├── useAgentTasks.ts      ← Supabase realtime subscription
│   └── useNotifications.ts   ← Platform-branched (Expo vs Web Push)
└── theme/
    ├── colors.ts             ← Shared color tokens
    ├── typography.ts         ← Font size scale
    └── spacing.ts            ← 4-point grid
```

---

## 4. UI / Design System Specification

### 4.1 Design Philosophy

**Aesthetic Direction: "Warm Command Center"**

MoverOS sits at the intersection of two emotional states: the anxiety of moving and the relief of having a capable assistant. The UI must feel like a trusted friend who happens to be extremely organized — warm enough to reduce stress, structured enough to communicate competence.

References:
- **Airbnb:** Warm, trustworthy, human photography, generous padding
- **Headspace:** Calm color palette, rounded everything, gentle motion
- **Linear:** Crisp information density, clear hierarchy, purposeful dark/light variants
- **Notion:** Card-based layouts, flexible structure, readable typography

The signature moment: When an agent completes a task, the UI delivers a satisfying haptic + animation + color flash that communicates "that's done, you don't have to think about it anymore."

### 4.2 Color System

```css
/* Design Tokens — CSS Variables (web) / JS tokens (mobile) */

:root {
  /* Brand — Warm Sage */
  --color-brand-50:  #f0f7f4;
  --color-brand-100: #dceee7;
  --color-brand-200: #b8ddd0;
  --color-brand-300: #87c3ac;
  --color-brand-400: #5ba389;
  --color-brand-500: #3d8a70;  /* Primary brand */
  --color-brand-600: #2f6e59;
  --color-brand-700: #275847;
  --color-brand-800: #21473a;
  --color-brand-900: #1c3c30;

  /* Accent — Warm Amber */
  --color-accent-50:  #fffbeb;
  --color-accent-100: #fef3c7;
  --color-accent-200: #fde68a;
  --color-accent-300: #fcd34d;
  --color-accent-400: #fbbf24;
  --color-accent-500: #f59e0b;  /* Deadline / urgency */
  --color-accent-600: #d97706;
  --color-accent-700: #b45309;

  /* Neutral — Warm Stone */
  --color-neutral-50:  #faf9f7;  /* App background */
  --color-neutral-100: #f3f1ee;
  --color-neutral-200: #e8e4de;
  --color-neutral-300: #d4cec6;
  --color-neutral-400: #b0a89e;
  --color-neutral-500: #8c8378;
  --color-neutral-600: #6e6560;
  --color-neutral-700: #524e4a;
  --color-neutral-800: #3a3632;
  --color-neutral-900: #1e1c1a;  /* Primary text */

  /* Semantic */
  --color-success: #22c55e;     /* Completed tasks */
  --color-warning: #f59e0b;     /* Approaching deadlines */
  --color-error:   #ef4444;     /* Overdue / critical */
  --color-info:    #3b82f6;     /* Agent working */

  /* Surface */
  --color-surface-base:    #faf9f7;
  --color-surface-card:    #ffffff;
  --color-surface-overlay: rgba(30, 28, 26, 0.04);
  --color-surface-border:  #e8e4de;

  /* Typography */
  --font-display:  'Plus Jakarta Sans', sans-serif;
  --font-body:     'Plus Jakarta Sans', sans-serif;
  --font-mono:     'JetBrains Mono', monospace;
}

/* Dark mode (optional, V2) */
[data-theme="dark"] {
  --color-surface-base:  #1a1814;
  --color-surface-card:  #242019;
  --color-surface-border: #3a3530;
  /* ... inverted neutral scale */
}
```

### 4.3 Typography Scale

```typescript
// packages/ui/theme/typography.ts
export const typography = {
  // Display — used for hero countdown, big numbers
  display2xl: { size: 72, weight: 800, lineHeight: 80, letterSpacing: -2.5 },
  displayXl:  { size: 48, weight: 800, lineHeight: 56, letterSpacing: -1.5 },
  displayLg:  { size: 36, weight: 700, lineHeight: 44, letterSpacing: -1.0 },

  // Headings
  h1: { size: 28, weight: 700, lineHeight: 36, letterSpacing: -0.5 },
  h2: { size: 22, weight: 600, lineHeight: 30, letterSpacing: -0.3 },
  h3: { size: 18, weight: 600, lineHeight: 26, letterSpacing: -0.2 },
  h4: { size: 16, weight: 600, lineHeight: 24, letterSpacing: 0 },

  // Body
  bodyLg: { size: 17, weight: 400, lineHeight: 26 },
  bodyMd: { size: 15, weight: 400, lineHeight: 23 },
  bodySm: { size: 13, weight: 400, lineHeight: 20 },

  // Labels
  labelLg: { size: 14, weight: 500, lineHeight: 20, letterSpacing: 0.1 },
  labelMd: { size: 12, weight: 500, lineHeight: 18, letterSpacing: 0.2 },
  labelSm: { size: 11, weight: 500, lineHeight: 16, letterSpacing: 0.3 },

  // Mono (agent names, task IDs, deadlines)
  monoMd: { size: 13, weight: 400, lineHeight: 20, fontFamily: 'JetBrains Mono' },
  monoSm: { size: 11, weight: 400, lineHeight: 16, fontFamily: 'JetBrains Mono' },
};
```

### 4.4 Component Anatomy — Core Components

#### TaskCard (the most-used component)
```
┌─────────────────────────────────────────────────────────┐
│  ○ [AgentIcon]  Task Title                  [Priority]  │
│                 Agent description · Due in 3 days       │
│                                                         │
│  [Review & Approve]                    [Skip for now]   │
└─────────────────────────────────────────────────────────┘

States:
- pending (gray circle, faded)
- agent_working (pulsing blue dot, "Agent working...")
- awaiting_approval (amber border, "Review required" badge)
- completed (green checkmark, strike-through title)
- overdue (red border, urgent chip)
```

#### AgentApproval Modal
```
┌──────────────────────────────────────┐
│  ← Back     Review Action     [X]   │
├──────────────────────────────────────┤
│  🤖 QuoteAgent                       │
│  "Here are 4 mover quotes I found"  │
│                                      │
│  [Quote comparison table/cards]      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Draft email to Allied Van Lines│  │
│  │ ···                            │  │
│  │ [Edit this draft]              │  │
│  └────────────────────────────────┘  │
│                                      │
│  [Approve & Send]   [Edit first]     │
└──────────────────────────────────────┘
```

#### Move Progress Ring (hero element)
```
        ╭──────────────╮
       ╱  ┌──────────┐  ╲
      │   │    32    │   │  ← Days until move
      │   │  DAYS    │   │
       ╲  └──────────┘  ╱
        ╰──────────────╯
         ●●●●●●●●○○○○
           8/12 tasks done
```

### 4.5 Spacing & Grid System

```
Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

Mobile safe areas:
- Status bar: respect safeAreaInsets.top
- Bottom: respect safeAreaInsets.bottom (critical for iPhone notch/island)
- Horizontal padding: 16px (mobile), 24px (tablet/web narrow), 32px (web wide)

Card radius: 16px (large), 12px (medium), 8px (small), 4px (chip)
Button radius: 12px (primary), 8px (secondary), 999px (pill/icon)

Shadow (web): 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)
Shadow (mobile): elevation 2 (Android) / shadowOpacity 0.06 (iOS)
```

### 4.6 Motion Principles

```typescript
// Framer Motion (web) / Reanimated (mobile) shared timing

export const motionTokens = {
  // Duration
  instant:  80,   // Hover states, focus rings
  fast:     150,  // Button presses, chip toggles
  normal:   250,  // Card appearances, modal opens
  slow:     400,  // Page transitions, progress animations
  verySlow: 600,  // The "task completed" celebration

  // Easing
  easeOut:     [0.16, 1, 0.3, 1],    // Most UI animations
  easeInOut:   [0.45, 0, 0.55, 1],   // Modal close/open
  spring:      { type: 'spring', stiffness: 400, damping: 30 },
  celebration: { type: 'spring', stiffness: 200, damping: 15 },
};

// The "task completed" moment:
// 1. Haptic: impactAsync(ImpactFeedbackStyle.Medium)
// 2. Checkmark animates in (spring)
// 3. Card background flashes brand-100 → white (250ms)
// 4. Title gets green strike-through (150ms delay)
// 5. Progress ring increments (spring, 400ms)
// 6. Optional: confetti for final task (celebration spring)
```

---

## 5. Screen-by-Screen UX Specification

### 5.1 Web Navigation Structure

```
/ (landing page)
/auth/sign-in
/auth/sign-up
/onboarding/[1-5]          ← Move setup wizard
/dashboard                  ← Main dashboard
/dashboard/timeline         ← Full task timeline
/dashboard/movers           ← Quote comparison
/dashboard/utilities        ← Utility setup module
/dashboard/internet         ← ISP comparison
/dashboard/address          ← Address change tracker
/dashboard/services         ← Ancillary services
/dashboard/moving-day       ← Moving day live mode
/dashboard/settled          ← Post-move module
/approvals                  ← Agent approval inbox (HITL center)
/settings                   ← Account, integrations, notifications
/settings/connect-email     ← Nylas OAuth flow
/settings/billing           ← Stripe customer portal
```

### 5.2 Mobile Tab Structure (Expo Router)

```
(tabs)/
├── index.tsx               ← Dashboard (countdown + urgent tasks)
├── timeline.tsx            ← Full task list
├── approvals.tsx           ← Agent approval inbox
├── services.tsx            ← Movers, utilities, ISP, address
└── settings.tsx            ← Account + notifications + billing

(modals)/
├── task-detail/[id].tsx    ← Task detail + agent output
├── approval/[id].tsx       ← HITL approval interface
├── mover-quote/[id].tsx    ← Individual quote detail
└── connect-email.tsx       ← Nylas OAuth flow
```

### 5.3 Screen Specifications

#### Onboarding Wizard (5 screens, web + mobile identical)

**Screen 1 — Origin Address**
- Large text input with address autocomplete (Google Places)
- "Where are you moving FROM?" headline
- Progress dots: ●○○○○
- Continue button at bottom (fixed on mobile, sticky on web)

**Screen 2 — Destination Address**
- Same pattern as above
- "Where are you moving TO?"
- Progress: ●●○○○
- Note: After both addresses entered, backend detects move type (local/LD/interstate)

**Screen 3 — Move Date**
- Date picker component (native DatePicker on mobile, Popover calendar on web)
- "When is your move date?" headline
- "Not sure yet? Pick a rough date — you can always change it"
- Progress: ●●●○○

**Screen 4 — Home Size**
- Large icon grid: Studio · 1BR · 2BR · 3BR · 4BR+
- Tap to select (large touch targets, 64px min height)
- Progress: ●●●●○

**Screen 5 — Special Items**
- Multi-select chips: Piano · Safe · Artwork · Hot Tub · Firearms · Antiques · Other
- "Anything that needs special handling?" headline
- Skip option prominent
- "Build my move plan →" CTA
- Progress: ●●●●●

**Transition to Dashboard:**
- 2-second loading screen: "Building your personalized move plan..."
- Animated: boxes appearing, checklist materializing
- Dashboard slides in with task list populated

#### Dashboard (Primary Screen)

**Layout — Mobile:**
```
┌──────────────────────────────────┐
│ MoverOS           [Avatar] [Bell]│
├──────────────────────────────────┤
│                                  │
│    [Move Progress Ring — 160px]  │
│         32 DAYS UNTIL MOVE       │
│         8 of 24 tasks done       │
│                                  │
├──────────────────────────────────┤
│ NEEDS YOUR REVIEW  (3)    →      │
├──────────────────────────────────┤
│ ● QuoteAgent found 4 movers     │
│   Review & approve · Amber chip  │
├──────────────────────────────────┤
│ ● InternetAgent needs address   │
│   Confirm destination · Amber    │
├──────────────────────────────────┤
│ UPCOMING DEADLINES               │
├──────────────────────────────────┤
│ ○ Cancel electric at origin     │
│   Due in 5 days · Medium         │
│                                  │
│ ○ USPS mail forward             │
│   Due in 12 days · Low           │
│                                  │
│ [View all 24 tasks →]            │
└──────────────────────────────────┘
  [Home] [Timeline] [✓] [Services] [...]
```

**Layout — Web (wider):**
- Left column (400px): Progress ring + move details + agent status
- Right column: Action feed + upcoming deadlines + quick stats

#### Agent Approval Inbox (Critical Screen)

This screen is the core loop — everything agents do surfaces here for user review before execution.

```
┌──────────────────────────────────┐
│ ← Back      Agent Inbox    (3)  │
├──────────────────────────────────┤
│ WAITING FOR YOU                  │
├──────────────────────────────────┤
│ ┌────────────────────────────┐   │
│ │ 🏠 QuoteAgent              │   │
│ │ 4 moving company quotes    │   │
│ │ ready for review           │   │
│ │                            │   │
│ │ [Allied Van Lines $3,200]  │   │
│ │ [Two Men and a Truck $2,8] │   │
│ │ [Atlas Van Lines $3,600]   │   │
│ │ [Local Best Move $2,200⚠️] │   │
│ │                            │   │
│ │ [Select & Request Booking] │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🌐 InternetAgent           │   │
│ │ ISP options at your new    │   │
│ │ address:                   │   │
│ │                            │   │
│ │ Xfinity 300Mbps · $49.99   │   │
│ │ AT&T Fiber 500Mbps · $55   │   │
│ │ Spectrum 200Mbps · $44.99  │   │
│ │                            │   │
│ │ ⭐ Recommended: AT&T Fiber │   │
│ │    (best value for WFH)    │   │
│ │                            │   │
│ │ [Order AT&T] [See others]  │   │
│ └────────────────────────────┘   │
│                                  │
│ COMPLETED TODAY                  │
├──────────────────────────────────┤
│ ✓ MoveSetupAgent built your     │
│   24-task move plan · 9:14 AM   │
└──────────────────────────────────┘
```

#### Moving Day Live Mode (Special Screen)

Activated on the day of the move. Full-screen experience.

```
┌──────────────────────────────────┐
│        MOVING DAY 🚛             │
│     Saturday, July 12            │
├──────────────────────────────────┤
│ MOVERS ARRIVING                  │
│ 8:00 AM · Allied Van Lines       │
│ John: (555) 234-5678    [Call]   │
├──────────────────────────────────┤
│ TODAY'S CHECKLIST                │
│ ☐ Confirm movers on the way     │
│ ☑ Keys ready for handoff        │
│ ☐ Final walkthrough: origin     │
│ ☐ Utility shutoffs confirmed    │
│ ☐ Lock all doors + windows      │
│ ☐ Take meter photos (electric)  │
│ ☐ Keys to landlord/new owner    │
│ ─────────────────────────────── │
│ ☐ Arrive at new address         │
│ ☐ Do inventory count (arrivals) │
│ ☐ Photo damage documentation    │
│ ☐ Tips for crew                 │
│ ☐ Confirm internet install time │
├──────────────────────────────────┤
│ TOMORROW                         │
│ 10:00 AM – AT&T Fiber install   │
│ [Add to Calendar]               │
└──────────────────────────────────┘
```

---

## 6. Multi-Agent Orchestration Specification

### 6.1 Agent Registry

| Agent | Model | Trigger | Avg Runtime | Cost/Run |
|-------|-------|---------|-------------|---------|
| MoveSetupAgent | Sonnet 4.5 | Move created | 15–30s | ~$0.08 |
| QuoteAgent | Haiku 4.5 + Sonnet | 6wks out / manual | 60–120s | ~$0.04 |
| InternetAgent | Haiku 4.5 | 3wks out / manual | 20–40s | ~$0.02 |
| UtilityAgent | Haiku 4.5 | 3wks out / manual | 30–60s | ~$0.03 |
| AddressAgent | Haiku 4.5 | 2wks out / manual | 20–40s | ~$0.02 |
| ServiceAgent | Haiku 4.5 | User-triggered | 20–40s | ~$0.02 |
| TimelineAgent | Sonnet 4.5 | Daily cron / events | 5–10s | ~$0.01 |
| MovingDayAgent | Haiku 4.5 | Move date trigger | Ongoing | ~$0.03 |
| SettledAgent | Haiku 4.5 | 3 days post-move | 10–20s | ~$0.01 |
| **Total per move lifecycle** | | | | **~$0.26** |

### 6.2 Inngest Function Definitions

```typescript
// packages/agents/src/inngest/functions.ts

import { inngest } from './client';
import { anthropic } from '@anthropic-ai/sdk';

// ── MOVE SETUP AGENT ──────────────────────────────────────────────
export const moveSetupAgent = inngest.createFunction(
  { id: 'move-setup-agent', name: 'MoveSetupAgent' },
  { event: 'move/created' },
  async ({ event, step }) => {
    const { moveId, origin, destination, moveDate, homeSize, specialItems } = event.data;

    // Step 1: Determine move type and complexity
    const moveProfile = await step.run('analyze-move-profile', async () => {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: MOVE_SETUP_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Origin: ${origin}, Destination: ${destination}, Date: ${moveDate}, Size: ${homeSize}, Special: ${specialItems.join(', ')}`
        }]
      });
      return parseJSON(response.content[0].text);
    });

    // Step 2: Generate personalized task list
    const taskList = await step.run('generate-task-list', async () => {
      // Generate 20-30 tasks with due dates, priorities, dependencies
      return generateTasksFromProfile(moveProfile, moveDate);
    });

    // Step 3: Persist task list to database
    await step.run('persist-tasks', async () => {
      await db.insert(tasks).values(
        taskList.map(task => ({ ...task, moveId, status: 'pending' }))
      );
    });

    // Step 4: Schedule future agent triggers based on move date
    await step.run('schedule-agents', async () => {
      const moveDateObj = new Date(moveDate);

      await inngest.send([
        {
          name: 'agent/trigger',
          data: { agentType: 'quote', moveId },
          ts: daysBeforeMove(moveDateObj, 42), // 6 weeks out
        },
        {
          name: 'agent/trigger',
          data: { agentType: 'internet', moveId },
          ts: daysBeforeMove(moveDateObj, 21),
        },
        {
          name: 'agent/trigger',
          data: { agentType: 'utility', moveId },
          ts: daysBeforeMove(moveDateObj, 21),
        },
        {
          name: 'agent/trigger',
          data: { agentType: 'address', moveId },
          ts: daysBeforeMove(moveDateObj, 14),
        },
        {
          name: 'agent/trigger',
          data: { agentType: 'moving-day', moveId },
          ts: daysBeforeMove(moveDateObj, 0), // On move date
        },
      ]);
    });

    // Step 5: Create approval item for user
    await step.run('create-approval', async () => {
      await createApprovalItem({
        moveId,
        agentType: 'setup',
        title: `Your ${taskList.length}-task move plan is ready`,
        body: `I've built a personalized plan for your ${moveProfile.moveType} move. Review and confirm to start tracking.`,
        outputData: { taskList, moveProfile },
        requiresApproval: true,
      });
    });

    return { taskCount: taskList.length, moveProfile };
  }
);

// ── QUOTE AGENT ───────────────────────────────────────────────────
export const quoteAgent = inngest.createFunction(
  { id: 'quote-agent', name: 'QuoteAgent',
    retries: 3,
    throttle: { limit: 10, period: '1m' }
  },
  { event: 'agent/trigger', if: 'event.data.agentType == "quote"' },
  async ({ event, step }) => {
    const { moveId } = event.data;
    const move = await step.run('fetch-move', () => getMoveById(moveId));

    // Step 1: Query FMCSA for licensed movers on the route
    const licensedMovers = await step.run('query-fmcsa', async () => {
      return await queryFMCSA({ origin: move.originState, destination: move.destinationState });
    });

    // Step 2: Filter for quality (rating, review count)
    const qualityMovers = await step.run('filter-movers', async () => {
      return await filterAndEnrichMovers(licensedMovers, move.originZip);
    });

    // Step 3: Generate RFQ emails for top 5 movers
    const rfqDrafts = await step.run('generate-rfqs', async () => {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 3000,
        system: QUOTE_RFQ_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: buildRFQPrompt(move, qualityMovers.slice(0, 5))
        }]
      });
      return parseRFQDrafts(response.content[0].text);
    });

    // Step 4: Create approval items (HITL — user must approve before sending)
    await step.run('create-approvals', async () => {
      await createApprovalItem({
        moveId,
        agentType: 'quote',
        title: `${qualityMovers.length} moving companies found`,
        body: 'I drafted quote request emails for the top 5. Review each draft and approve to send.',
        outputData: { movers: qualityMovers.slice(0, 5), rfqDrafts },
        requiresApproval: true,
        requiresEmailSend: true,
      });
    });

    return { moversFound: qualityMovers.length };
  }
);

// ── INTERNET AGENT ────────────────────────────────────────────────
export const internetAgent = inngest.createFunction(
  { id: 'internet-agent', name: 'InternetAgent' },
  { event: 'agent/trigger', if: 'event.data.agentType == "internet"' },
  async ({ event, step }) => {
    const { moveId } = event.data;
    const move = await step.run('fetch-move', () => getMoveById(moveId));

    // Step 1: Look up ISPs at destination address
    const isps = await step.run('lookup-isps', async () => {
      return await smartyStreets.getISPsByAddress(move.destinationAddress);
    });

    // Step 2: Classify and score ISPs via Claude Haiku
    const scoredIsps = await step.run('score-isps', async () => {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        system: ISP_SCORING_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `ISPs available: ${JSON.stringify(isps)}. User profile: ${JSON.stringify(move.usageProfile)}`
        }]
      });
      return parseScoredISPs(response.content[0].text);
    });

    // Step 3: Create approval item with affiliate links
    await step.run('create-approval', async () => {
      const ispsWithAffiliateLinks = attachAffiliateLinks(scoredIsps);
      await createApprovalItem({
        moveId,
        agentType: 'internet',
        title: `${isps.length} internet providers at your new address`,
        body: `I found ${isps.length} ISPs. ${scoredIsps[0].name} is my top pick based on your usage.`,
        outputData: { isps: ispsWithAffiliateLinks, recommendation: scoredIsps[0] },
        requiresApproval: true,
        requiresEmailSend: false,
        affiliateContext: { type: 'isp', topPickId: scoredIsps[0].id }
      });
    });

    return { ispCount: isps.length, recommendation: scoredIsps[0].name };
  }
);

// Additional agents follow identical pattern...
```

### 6.3 Agent Prompt Library

```typescript
// packages/agents/src/prompts/index.ts

export const MOVE_SETUP_SYSTEM_PROMPT = `
You are MoverOS's MoveSetupAgent. You create personalized, comprehensive moving task plans.

When given move details, output a JSON object with:
- moveType: "local" | "long_distance" | "interstate"
- complexityScore: 1-10
- estimatedTasks: number
- keyRisks: string[] (e.g., ["elevator reservation needed", "interstate DOT requirements"])
- priorityFocus: string (what matters most for this specific move)

Be precise and practical. Every task must be actionable.
Output ONLY valid JSON, no prose.
`;

export const QUOTE_RFQ_SYSTEM_PROMPT = `
You are MoverOS's QuoteAgent. You draft professional, clear quote request emails to moving companies.

Each email must:
- Be 150-200 words maximum
- Include: move date, origin/destination, home size, special items
- Request a binding estimate specifically
- Ask about insurance coverage
- Sound professional but warm
- NOT mention you are an AI assistant

Output a JSON array of {moverId, emailSubject, emailBody} objects.
Output ONLY valid JSON, no prose.
`;

export const ISP_SCORING_SYSTEM_PROMPT = `
You are MoverOS's InternetAgent. Score ISPs for a specific user's needs.

Scoring criteria (weight):
- Speed adequacy for stated usage (40%)
- Price per Mbps value (30%)
- Contract flexibility (20%)
- Setup/installation ease (10%)

For each ISP, output:
- score: 0-100
- recommendation: one sentence explaining the score
- bestFor: the user type this ISP suits best
- redFlags: any concerns (contracts, data caps, price increases)

Output ONLY valid JSON array, no prose.
`;

// ADDRESS_AGENT_SYSTEM_PROMPT, UTILITY_AGENT_SYSTEM_PROMPT, etc.
```

### 6.4 Agent Status Realtime Updates

```typescript
// Using Supabase Realtime to push agent status to clients

// Server: Publish agent status changes
await supabase
  .from('agent_tasks')
  .update({ status: 'running', started_at: new Date() })
  .eq('id', taskId);

// Client (web + mobile): Subscribe to changes
const channel = supabase
  .channel(`move-${moveId}-agents`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'agent_tasks',
    filter: `move_id=eq.${moveId}`,
  }, (payload) => {
    // Update local state — triggers re-render of AgentStatusBadge
    updateAgentStatus(payload.new.id, payload.new.status);
  })
  .subscribe();
```

---

## 7. Human-in-the-Loop System Design

### 7.1 HITL Architecture

Every agent action flows through the same approval pipeline before executing. This is the defining UX pattern of MoverOS — agents prepare, humans approve.

```
Agent completes work
        ↓
Creates approval_item in DB
(status: 'awaiting_approval')
        ↓
Supabase Realtime pushes to client
        ↓
Client shows approval badge (red dot on inbox icon)
        ↓
Push notification: "QuoteAgent found 4 movers — review now"
        ↓
User opens approval inbox
        ↓
Reviews agent output (quote table, email draft, ISP comparison)
        ↓
User taps [Approve] or [Reject] or [Edit first]
        ↓
Approval event fires to Inngest
        ↓
Agent executes real-world action
(email sent via Nylas, form submitted, etc.)
        ↓
Task marked complete
        ↓
Move progress updates
```

### 7.2 Approval Item Schema

```typescript
// Types for the HITL system

type ApprovalItem = {
  id: string;
  moveId: string;
  agentType: AgentType;
  status: 'awaiting_approval' | 'approved' | 'rejected' | 'edited_and_approved';
  title: string;
  body: string;
  outputData: {
    // Agent-specific structured output (varies by agent type)
    [key: string]: unknown;
  };
  requiresEmailSend: boolean;
  emailDraft?: {
    to: string;
    subject: string;
    body: string;
    from: string; // User's connected email
  };
  affiliateContext?: {
    type: 'isp' | 'mover' | 'storage' | 'insurance';
    topPickId: string;
    affiliateLink: string;
  };
  userEdits?: string; // Any edits made before approval
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
};
```

### 7.3 Email Execution Flow (Nylas Integration)

```typescript
// When user approves an action that requires email send:

// 1. Frontend sends approval with any edits
const approveAction = api.approvals.approve.useMutation({
  onSuccess: () => {
    // Optimistic UI update
    queryClient.invalidateQueries(['approvals', moveId]);
  }
});

// 2. tRPC handler validates and triggers Inngest
export const approvalsRouter = router({
  approve: protectedProcedure
    .input(z.object({
      approvalId: z.string().uuid(),
      editedEmailBody: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const approval = await getApprovalById(input.approvalId);

      // Security: verify user owns this approval
      if (approval.move.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });

      // Update approval status
      await db.update(approvalItems)
        .set({ status: 'approved', approvedAt: new Date() })
        .where(eq(approvalItems.id, input.approvalId));

      // Trigger execution via Inngest
      if (approval.requiresEmailSend) {
        await inngest.send({
          name: 'approval/email-send',
          data: {
            approvalId: input.approvalId,
            userId: ctx.user.id,
            emailDraft: input.editedEmailBody
              ? { ...approval.emailDraft, body: input.editedEmailBody }
              : approval.emailDraft,
          }
        });
      }

      return { success: true };
    }),
});

// 3. Inngest email-send function uses Nylas
export const emailSendFunction = inngest.createFunction(
  { id: 'approval-email-send' },
  { event: 'approval/email-send' },
  async ({ event, step }) => {
    const { approvalId, userId, emailDraft } = event.data;

    // Get user's Nylas grant (connected email account)
    const nylasGrant = await step.run('get-nylas-grant', async () => {
      return await getNylasGrantForUser(userId);
    });

    // Send email via user's own email account
    await step.run('send-email', async () => {
      return await nylasClient.messages.send(nylasGrant.grantId, {
        to: [{ email: emailDraft.to }],
        subject: emailDraft.subject,
        body: emailDraft.body,
      });
    });

    // Update task status
    await step.run('complete-task', async () => {
      await completeTaskByApproval(approvalId);
    });
  }
);
```

---

## 8. Notification System Specification

### 8.1 Full Stack: Push + Email + SMS

#### Push Notifications (Expo + Web Push)

```typescript
// Mobile: Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  });

  return token.data;
}

// Push notification categories
export const NOTIFICATION_TYPES = {
  AGENT_READY:      { sound: true, badge: true, priority: 'high' },
  DEADLINE_WARNING: { sound: true, badge: true, priority: 'high' },
  TASK_COMPLETED:   { sound: false, badge: true, priority: 'normal' },
  MOVING_DAY:       { sound: true, badge: true, priority: 'max' },
  WEEKLY_SUMMARY:   { sound: false, badge: false, priority: 'low' },
};
```

#### Email Notifications (Resend + React Email)

```typescript
// Three email types using React Email templates

// 1. Agent approval notification
// Sent immediately when agent creates approval item
// CTA: deep link into approval inbox

// 2. Deadline reminder digest
// Sent at 8 AM local time
// Content: tasks due in next 7 days, overdue items
// Frequency: daily in the week before the move; weekly otherwise

// 3. Weekly move progress report
// Sent every Sunday at 9 AM
// Content: % complete, what was accomplished, what's coming up

// React Email template (shared, renders identically in inbox + in-app preview)
export function AgentApprovalEmail({ agentName, taskTitle, moveDate, approvalUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Img src={logoUrl} width={48} height={48} alt="MoverOS" />
          <Heading style={h1}>{agentName} has an update for you</Heading>
          <Text style={text}>{taskTitle}</Text>
          <Text style={subtext}>Your move is on {formatDate(moveDate)}. Review and approve to keep things moving.</Text>
          <Button style={button} href={approvalUrl}>
            Review Now →
          </Button>
          <Text style={footer}>
            You can turn off these alerts in Settings → Notifications.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

#### SMS Notifications (Twilio)

```typescript
// SMS reserved for high-urgency events only
// Rationale: SMS fatigue is real; over-SMS = uninstall/unsubscribe

export const SMS_TRIGGERS = {
  // Day before move: "Your move is tomorrow. 3 tasks still need review."
  MOVE_EVE_REMINDER: {
    daysBeforeMove: 1,
    message: (name: string, pendingCount: number) =>
      `MoverOS: Your move is tomorrow, ${name}! ${pendingCount} tasks still need your review. Open the app: [deep link]`,
  },

  // Moving day morning: "Moving day! Here's your first task."
  MOVING_DAY_MORNING: {
    daysBeforeMove: 0,
    message: (name: string, moverName: string, arrivalTime: string) =>
      `MoverOS: Moving day, ${name}! 🚛 ${moverName} arrives at ${arrivalTime}. Open your checklist: [deep link]`,
  },

  // Critical overdue: Task that blocks other tasks is overdue
  CRITICAL_TASK_OVERDUE: {
    triggered: 'on-demand',
    message: (taskTitle: string) =>
      `MoverOS urgent: "${taskTitle}" is overdue and blocking your move plan. Tap to handle it: [deep link]`,
  },
};

// All other alerts → push notification (not SMS)
```

### 8.2 Notification Preference Settings

```typescript
type NotificationPreferences = {
  push: {
    agentApprovals: boolean;    // default: true
    deadlineReminders: boolean; // default: true
    taskCompletions: boolean;   // default: false (too noisy)
    movingDay: boolean;         // default: true, locked true in final week
  };
  email: {
    agentApprovals: boolean;    // default: true
    weeklyDigest: boolean;      // default: true
    dailyReminder: boolean;     // default: false (opt-in only)
  };
  sms: {
    moveEveReminder: boolean;   // default: true
    movingDayMorning: boolean;  // default: true
    criticalOverdue: boolean;   // default: true
  };
  quietHours: {
    enabled: boolean;
    start: string;  // "22:00"
    end: string;    // "08:00"
  };
};
```

---

## 9. Database Schema — Full Specification

```sql
-- Supabase PostgreSQL schema with Drizzle ORM

-- ── USERS & AUTH ──────────────────────────────────────────────────
-- Supabase handles auth.users; we extend with a profile table
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  phone         TEXT,
  expo_push_token TEXT,           -- Expo push token (mobile)
  web_push_subscription JSONB,    -- Web Push API subscription object
  nylas_grant_id TEXT,            -- Connected email account
  nylas_email    TEXT,
  stripe_customer_id TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  notification_prefs JSONB DEFAULT '{"push":{"agentApprovals":true},...}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── MOVES ─────────────────────────────────────────────────────────
CREATE TABLE moves (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'planning'
                        CHECK (status IN ('planning','active','moving_day','settling','completed','cancelled')),

  -- Addresses
  origin_address        TEXT NOT NULL,
  origin_city           TEXT NOT NULL,
  origin_state          TEXT NOT NULL,
  origin_zip            TEXT NOT NULL,
  origin_lat            DECIMAL(10,7),
  origin_lng            DECIMAL(10,7),

  destination_address   TEXT NOT NULL,
  destination_city      TEXT NOT NULL,
  destination_state     TEXT NOT NULL,
  destination_zip       TEXT NOT NULL,
  destination_lat       DECIMAL(10,7),
  destination_lng       DECIMAL(10,7),

  -- Move details
  move_date             DATE NOT NULL,
  home_size             TEXT NOT NULL
                        CHECK (home_size IN ('studio','1br','2br','3br','4br_plus')),
  move_type             TEXT NOT NULL
                        CHECK (move_type IN ('local','long_distance','interstate')),
  special_items         TEXT[] DEFAULT '{}',
  budget_range          TEXT,
  usage_profile         JSONB DEFAULT '{}',  -- WFH, streaming, gaming, etc.

  -- Plan metadata
  task_count            INT DEFAULT 0,
  tasks_completed       INT DEFAULT 0,
  complexity_score      INT CHECK (complexity_score BETWEEN 1 AND 10),
  move_profile_data     JSONB DEFAULT '{}',  -- MoveSetupAgent output

  -- Payment
  plan_tier             TEXT DEFAULT 'free'
                        CHECK (plan_tier IN ('free','essentials','complete','premium')),
  stripe_payment_intent TEXT,
  paid_at               TIMESTAMPTZ,
  gifted_by_agent_id    UUID,               -- If gifted by RE agent

  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_moves_user_id ON moves(user_id);
CREATE INDEX idx_moves_move_date ON moves(move_date);
CREATE INDEX idx_moves_status ON moves(status);

-- ── TASKS ─────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,

  agent_type      TEXT NOT NULL
                  CHECK (agent_type IN ('setup','quote','internet','utility','address','service','moving_day','settled','manual')),
  category        TEXT NOT NULL,         -- 'movers','utilities','paperwork','services','moving_day','post_move'
  title           TEXT NOT NULL,
  description     TEXT,
  instructions    TEXT,                  -- Step-by-step if manual

  -- Scheduling
  due_date        DATE,
  due_days_before INT,                   -- Calculated from move_date
  priority        TEXT DEFAULT 'medium'
                  CHECK (priority IN ('critical','high','medium','low')),

  -- Status
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','agent_working','awaiting_approval','completed','skipped','overdue')),

  -- Dependencies
  depends_on      UUID[] DEFAULT '{}',   -- FK array → tasks.id

  -- Completion
  completion_notes TEXT,
  completed_at    TIMESTAMPTZ,
  skipped_at      TIMESTAMPTZ,
  skipped_reason  TEXT,

  -- Agent linkage
  agent_task_id   UUID,                  -- FK → agent_tasks.id

  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_move_id ON tasks(move_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ── AGENT TASKS ───────────────────────────────────────────────────
CREATE TABLE agent_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  agent_type      TEXT NOT NULL,
  inngest_event_id TEXT,
  inngest_run_id  TEXT,

  status          TEXT DEFAULT 'queued'
                  CHECK (status IN ('queued','running','awaiting_approval','completed','failed','cancelled')),

  -- Input / output
  input_data      JSONB DEFAULT '{}',
  output_data     JSONB DEFAULT '{}',
  error_message   TEXT,
  retry_count     INT DEFAULT 0,

  -- Timing
  queued_at       TIMESTAMPTZ DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,

  -- Cost tracking
  llm_model       TEXT,
  input_tokens    INT,
  output_tokens   INT,
  estimated_cost_usd DECIMAL(8,6),

  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_tasks_move_id ON agent_tasks(move_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);

-- ── APPROVAL ITEMS (HITL) ─────────────────────────────────────────
CREATE TABLE approval_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id             UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  agent_task_id       UUID REFERENCES agent_tasks(id),

  agent_type          TEXT NOT NULL,
  status              TEXT DEFAULT 'awaiting_approval'
                      CHECK (status IN ('awaiting_approval','approved','rejected','edited_approved','skipped')),
  priority            TEXT DEFAULT 'medium'
                      CHECK (priority IN ('high','medium','low')),

  -- Display
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,

  -- Structured output (agent-specific)
  output_data         JSONB DEFAULT '{}',

  -- Email execution
  requires_email_send BOOLEAN DEFAULT false,
  email_to            TEXT,
  email_subject       TEXT,
  email_body          TEXT,            -- Markdown
  email_sent_at       TIMESTAMPTZ,
  email_thread_id     TEXT,            -- Nylas thread ID after send

  -- Affiliate context
  affiliate_type      TEXT,
  affiliate_pick_id   TEXT,
  affiliate_link      TEXT,
  affiliate_clicked   BOOLEAN DEFAULT false,
  affiliate_converted BOOLEAN DEFAULT false,
  affiliate_revenue   DECIMAL(8,2),

  -- User response
  user_edits          TEXT,
  approved_at         TIMESTAMPTZ,
  rejected_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  read_at             TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_approval_items_move_id ON approval_items(move_id);
CREATE INDEX idx_approval_items_status ON approval_items(status);

-- ── MOVER QUOTES ──────────────────────────────────────────────────
CREATE TABLE mover_quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  approval_item_id UUID REFERENCES approval_items(id),

  company_name    TEXT NOT NULL,
  dot_number      TEXT,
  mc_number       TEXT,
  fmcsa_verified  BOOLEAN DEFAULT false,
  rating          DECIMAL(3,2),
  review_count    INT DEFAULT 0,

  estimate_type   TEXT CHECK (estimate_type IN ('binding','non_binding','not_to_exceed','tbd')),
  base_price      DECIMAL(10,2),
  price_low       DECIMAL(10,2),
  price_high      DECIMAL(10,2),

  available_dates DATE[],
  includes_packing BOOLEAN DEFAULT false,
  insurance_coverage TEXT,
  deposit_required DECIMAL(10,2),

  red_flags       TEXT[] DEFAULT '{}',
  rfq_email_sent  BOOLEAN DEFAULT false,
  rfq_sent_at     TIMESTAMPTZ,
  reply_received  BOOLEAN DEFAULT false,
  reply_at        TIMESTAMPTZ,

  selected        BOOLEAN DEFAULT false,
  selected_at     TIMESTAMPTZ,
  booked          BOOLEAN DEFAULT false,
  booked_at       TIMESTAMPTZ,

  affiliate_link  TEXT,

  source_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── UTILITIES ─────────────────────────────────────────────────────
CREATE TABLE utilities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  address_type    TEXT NOT NULL CHECK (address_type IN ('origin','destination')),
  utility_type    TEXT NOT NULL CHECK (utility_type IN ('electricity','gas','water','trash','sewer','internet','cable','renters_insurance','homeowners_insurance')),

  provider_name   TEXT,
  account_number  TEXT,
  provider_phone  TEXT,
  provider_url    TEXT,

  action_type     TEXT CHECK (action_type IN ('cancel','transfer','new_setup','none_required')),
  action_status   TEXT DEFAULT 'pending'
                  CHECK (action_status IN ('pending','in_progress','completed','requires_phone_call','not_applicable')),

  scheduled_date  DATE,
  confirmation_number TEXT,
  monthly_cost    DECIMAL(8,2),
  deposit_required DECIMAL(8,2),

  affiliate_link  TEXT,
  affiliate_clicked BOOLEAN DEFAULT false,

  notes           TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── ISP OPTIONS ───────────────────────────────────────────────────
CREATE TABLE isp_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,

  provider_name   TEXT NOT NULL,
  plan_name       TEXT,
  download_mbps   INT,
  upload_mbps     INT,
  monthly_price   DECIMAL(8,2),
  contract_months INT DEFAULT 0,  -- 0 = no contract
  data_cap_gb     INT,            -- NULL = unlimited
  installation_fee DECIMAL(8,2) DEFAULT 0,
  promo_price     DECIMAL(8,2),
  promo_months    INT,

  isp_score       INT CHECK (isp_score BETWEEN 0 AND 100),
  agent_recommendation TEXT,
  best_for        TEXT,
  red_flags       TEXT[] DEFAULT '{}',

  affiliate_link  TEXT NOT NULL,
  affiliate_provider TEXT,
  affiliate_commission DECIMAL(8,2),

  selected        BOOLEAN DEFAULT false,
  selected_at     TIMESTAMPTZ,
  ordered         BOOLEAN DEFAULT false,
  ordered_at      TIMESTAMPTZ,
  install_date    DATE,
  install_time    TEXT,
  calendar_event_id TEXT,

  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── ADDRESS CHANGES ───────────────────────────────────────────────
CREATE TABLE address_changes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,

  entity_name     TEXT NOT NULL,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('government','bank','subscription','insurance','employer','medical','utilities','loyalty','other')),
  priority        INT CHECK (priority BETWEEN 1 AND 5),  -- 1=critical (IRS, USPS), 5=low

  change_url      TEXT,
  change_method   TEXT CHECK (change_method IN ('online','phone','mail','in_person','automatic')),
  phone_number    TEXT,
  notes           TEXT,                  -- e.g., "Need account number and SSN"

  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','skipped','not_applicable')),
  completed_at    TIMESTAMPTZ,
  skipped_at      TIMESTAMPTZ,

  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_address_changes_move_id ON address_changes(move_id);

-- ── BOOKED SERVICES ───────────────────────────────────────────────
CREATE TABLE booked_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,

  service_type    TEXT NOT NULL CHECK (service_type IN ('cleaning_origin','cleaning_destination','storage','junk_removal','handyman','packing','carpet_cleaning','painting','other')),

  provider_name   TEXT,
  provider_phone  TEXT,
  provider_url    TEXT,
  provider_rating DECIMAL(3,2),

  scheduled_date  DATE,
  scheduled_time  TEXT,
  duration_hours  DECIMAL(4,1),
  price_estimate  DECIMAL(10,2),
  price_final     DECIMAL(10,2),
  deposit_paid    DECIMAL(10,2),

  confirmation    TEXT,
  calendar_event_id TEXT,

  affiliate_link  TEXT,
  affiliate_provider TEXT,

  status          TEXT DEFAULT 'inquiry'
                  CHECK (status IN ('inquiry','booked','completed','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── NOTIFICATIONS LOG ─────────────────────────────────────────────
CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  move_id         UUID REFERENCES moves(id) ON DELETE SET NULL,

  channel         TEXT NOT NULL CHECK (channel IN ('push','email','sms')),
  notification_type TEXT NOT NULL,
  title           TEXT,
  body            TEXT NOT NULL,
  deep_link       TEXT,

  sent_at         TIMESTAMPTZ DEFAULT now(),
  delivered       BOOLEAN,
  opened          BOOLEAN DEFAULT false,
  opened_at       TIMESTAMPTZ,

  external_id     TEXT  -- Twilio SID, Resend ID, Expo ticket ID
);

-- ── AFFILIATE TRACKING ────────────────────────────────────────────
CREATE TABLE affiliate_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id         UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  affiliate_type  TEXT NOT NULL CHECK (affiliate_type IN ('isp','mover','storage','insurance','home_services')),
  provider_name   TEXT NOT NULL,
  affiliate_network TEXT,  -- 'cj_affiliate', 'direct', 'impact', etc.
  affiliate_link  TEXT NOT NULL,

  event_type      TEXT NOT NULL CHECK (event_type IN ('shown','clicked','converted')),
  revenue_amount  DECIMAL(8,2),  -- Populated on conversion
  conversion_confirmed BOOLEAN DEFAULT false,
  conversion_confirmed_at TIMESTAMPTZ,

  occurred_at     TIMESTAMPTZ DEFAULT now()
);

-- ── B2B AGENT GIFTING ─────────────────────────────────────────────
CREATE TABLE re_agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  brokerage       TEXT,
  stripe_customer_id TEXT,
  plan_type       TEXT DEFAULT 'starter_pack',
  codes_remaining INT DEFAULT 0,
  codes_used      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gifted_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  re_agent_id     UUID NOT NULL REFERENCES re_agents(id),
  code            TEXT NOT NULL UNIQUE,
  plan_tier       TEXT NOT NULL DEFAULT 'essentials',
  redeemed        BOOLEAN DEFAULT false,
  redeemed_by     UUID REFERENCES user_profiles(id),
  redeemed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────
-- Users can only access their own moves and related data
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own moves" ON moves
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users access own tasks" ON tasks
  FOR ALL USING (
    move_id IN (SELECT id FROM moves WHERE user_id = auth.uid())
  );

-- (similar policies for all user-owned tables)
```

---

## 10. API Integration Specifications

### 10.1 Integration Matrix

| Service | Purpose | Auth | Rate Limits | Cost |
|---------|---------|------|------------|------|
| **Anthropic Claude** | Agent reasoning + classification | API key | Tier 2: 40 RPM Sonnet, 500 RPM Haiku | ~$0.26/move lifecycle |
| **Nylas** | Send email on user's behalf | OAuth per user | 1000 sends/day/grant | $0 (free tier up to 5 grants); $25/mo after |
| **SmartyStreets** | ISP availability at address | API key | 250 lookups/mo free; $10/1,000 after | ~$0.01/move |
| **FMCSA API** | Licensed moving company database | API key (free) | Unlimited | $0 |
| **Google Places** | Local services discovery | API key | $5/1,000 requests | ~$0.02/move |
| **Google Calendar** | Add appointments | OAuth per user | 1M requests/day | $0 |
| **USPS Web Tools** | Address validation, mail forwarding guidance | Free API | 5,000/day | $0 |
| **Twilio** | SMS notifications | API key | Unlimited (metered) | $0.0079/SMS |
| **Resend** | Transactional email | API key | 3,000/mo free; $20/mo after | ~$0.001/email |
| **Stripe** | Payments | API key | Unlimited | 2.9% + $0.30/transaction |
| **CJ Affiliate** | Xfinity affiliate tracking | Partner account | N/A | Commission-based |

### 10.2 Nylas Integration — Detailed

```typescript
// packages/db/src/integrations/nylas.ts

import Nylas from 'nylas';

const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY!,
  apiUri: 'https://api.us.nylas.com',
});

// OAuth flow — redirect user to connect Gmail or Outlook
export function getNylasAuthUrl(userId: string): string {
  return nylas.auth.urlForOAuth2({
    clientId: process.env.NYLAS_CLIENT_ID!,
    redirectUri: `${process.env.APP_URL}/api/nylas/callback`,
    loginHint: '',
    state: userId, // Pass userId so we can store grant after redirect
    scopes: ['email.read_only', 'email.send'],
  });
}

// Store grant after OAuth callback
export async function handleNylasCallback(code: string, userId: string) {
  const { grantId, email } = await nylas.auth.exchangeCodeForToken({
    clientId: process.env.NYLAS_CLIENT_ID!,
    clientSecret: process.env.NYLAS_CLIENT_SECRET!,
    redirectUri: `${process.env.APP_URL}/api/nylas/callback`,
    code,
  });

  await db.update(userProfiles)
    .set({ nylasGrantId: grantId, nylasEmail: email })
    .where(eq(userProfiles.id, userId));

  return { grantId, email };
}

// Send email on user's behalf
export async function sendOnBehalf(
  grantId: string,
  { to, subject, body }: { to: string; subject: string; body: string }
) {
  return await nylas.messages.send(grantId, {
    to: [{ email: to }],
    subject,
    body,
    replyTo: [],
  });
}

// Monitor inbox for mover quote replies
export async function setupEmailWebhook() {
  await nylas.webhooks.create({
    description: 'MoverOS reply monitoring',
    triggerTypes: ['message.created'],
    webhookUrl: `${process.env.APP_URL}/api/webhooks/nylas`,
    notificationEmailAddress: process.env.NYLAS_NOTIFICATION_EMAIL!,
  });
}
```

### 10.3 SmartyStreets — ISP Lookup

```typescript
// packages/db/src/integrations/smartystreets.ts

interface ISPResult {
  providerName: string;
  technologyType: string; // 'fiber', 'cable', 'dsl', '5g', 'satellite'
  downloadMbps: number;
  uploadMbps: number;
  monthlyPrice?: number;
  contractRequired: boolean;
  affiliateAvailable: boolean;
}

export async function getISPsByAddress(address: {
  street: string;
  city: string;
  state: string;
  zip: string;
}): Promise<ISPResult[]> {
  const params = new URLSearchParams({
    'auth-id': process.env.SMARTYSTREETS_AUTH_ID!,
    'auth-token': process.env.SMARTYSTREETS_AUTH_TOKEN!,
    street: address.street,
    city: address.city,
    state: address.state,
    zipcode: address.zip,
    candidates: '1',
  });

  const lookupRes = await fetch(`https://us-street.api.smartystreets.com/street-address?${params}`);
  const [lookup] = await lookupRes.json();

  if (!lookup?.components) throw new Error('Address not found');

  // Use standardized address to query ISP coverage
  // SmartyStreets + FCC Broadband Map API combination
  const fccRes = await fetch(
    `https://broadbandmap.fcc.gov/api/public/map/listAvailability?latitude=${lookup.metadata.latitude}&longitude=${lookup.metadata.longitude}&unit_count=1`
  );
  const { availability } = await fccRes.json();

  return transformFCCToISPResults(availability);
}
```

---

## 11. Monorepo Structure & Code Organization

### 11.1 Full Directory Tree

```
moveros/
├── package.json              # Root: workspaces config
├── turbo.json                # Turborepo pipeline config
├── .env.example              # All env vars documented
├── .github/
│   └── workflows/
│       ├── ci.yml            # Run tests on PR
│       ├── deploy-web.yml    # Deploy web on merge to main
│       └── deploy-mobile.yml # EAS build on release tag
│
├── apps/
│   ├── web/                  # Next.js 15 app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/page.tsx
│   │   │   │   └── sign-up/page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx        # Main dashboard
│   │   │   │   │   ├── timeline/page.tsx
│   │   │   │   │   ├── movers/page.tsx
│   │   │   │   │   ├── utilities/page.tsx
│   │   │   │   │   ├── internet/page.tsx
│   │   │   │   │   ├── address/page.tsx
│   │   │   │   │   ├── services/page.tsx
│   │   │   │   │   ├── moving-day/page.tsx
│   │   │   │   │   └── settled/page.tsx
│   │   │   │   ├── approvals/page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx
│   │   │   │       └── connect-email/page.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── [step]/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── trpc/[trpc]/route.ts
│   │   │   │   ├── inngest/route.ts    # Inngest event receiver
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── nylas/route.ts
│   │   │   │   │   └── stripe/route.ts
│   │   │   │   └── nylas/callback/route.ts
│   │   │   └── layout.tsx
│   │   ├── components/       # Web-only components
│   │   ├── lib/              # Web-only utilities
│   │   ├── next.config.ts
│   │   └── tailwind.config.ts
│   │
│   └── mobile/               # Expo app
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── index.tsx           # Dashboard
│       │   │   ├── timeline.tsx
│       │   │   ├── approvals.tsx
│       │   │   ├── services.tsx
│       │   │   └── settings.tsx
│       │   ├── (modals)/
│       │   │   ├── task-detail/[id].tsx
│       │   │   ├── approval/[id].tsx
│       │   │   └── connect-email.tsx
│       │   ├── onboarding/
│       │   │   └── [step].tsx
│       │   └── _layout.tsx
│       ├── assets/
│       ├── app.json
│       ├── eas.json
│       └── metro.config.js
│
└── packages/
    ├── ui/                   # Shared component library
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── TaskCard/
    │   │   │   │   ├── TaskCard.tsx       # Platform-adaptive
    │   │   │   │   ├── TaskCard.web.tsx   # Web override if needed
    │   │   │   │   └── index.ts
    │   │   │   ├── ApprovalCard/
    │   │   │   ├── MoveProgress/
    │   │   │   ├── AgentStatusBadge/
    │   │   │   ├── Button/
    │   │   │   ├── Input/
    │   │   │   ├── Modal/
    │   │   │   └── ...
    │   │   ├── theme/
    │   │   │   ├── colors.ts
    │   │   │   ├── typography.ts
    │   │   │   ├── spacing.ts
    │   │   │   └── motion.ts
    │   │   └── index.ts
    │   └── package.json
    │
    ├── db/                   # Database layer
    │   ├── src/
    │   │   ├── schema/
    │   │   │   ├── moves.ts
    │   │   │   ├── tasks.ts
    │   │   │   ├── agents.ts
    │   │   │   ├── approvals.ts
    │   │   │   └── index.ts
    │   │   ├── client.ts     # Drizzle + Supabase client
    │   │   ├── integrations/
    │   │   │   ├── nylas.ts
    │   │   │   ├── smartystreets.ts
    │   │   │   ├── fmcsa.ts
    │   │   │   └── stripe.ts
    │   │   └── index.ts
    │   └── package.json
    │
    ├── trpc/                 # tRPC routers
    │   ├── src/
    │   │   ├── routers/
    │   │   │   ├── moves.ts
    │   │   │   ├── tasks.ts
    │   │   │   ├── approvals.ts
    │   │   │   ├── agents.ts
    │   │   │   ├── settings.ts
    │   │   │   └── billing.ts
    │   │   ├── middleware/
    │   │   │   ├── auth.ts
    │   │   │   └── rateLimit.ts
    │   │   └── root.ts
    │   └── package.json
    │
    ├── agents/               # Agent definitions
    │   ├── src/
    │   │   ├── inngest/
    │   │   │   ├── client.ts
    │   │   │   ├── functions/
    │   │   │   │   ├── moveSetupAgent.ts
    │   │   │   │   ├── quoteAgent.ts
    │   │   │   │   ├── internetAgent.ts
    │   │   │   │   ├── utilityAgent.ts
    │   │   │   │   ├── addressAgent.ts
    │   │   │   │   ├── serviceAgent.ts
    │   │   │   │   ├── timelineAgent.ts
    │   │   │   │   ├── movingDayAgent.ts
    │   │   │   │   └── settledAgent.ts
    │   │   │   └── index.ts
    │   │   ├── prompts/
    │   │   │   └── index.ts
    │   │   └── types.ts
    │   └── package.json
    │
    └── utils/                # Shared utilities
        ├── src/
        │   ├── dates.ts      # Move date calculations
        │   ├── addresses.ts  # Address formatting
        │   ├── moves.ts      # Move type detection
        │   ├── notifications.ts
        │   └── index.ts
        └── package.json
```

---

## 12. Authentication & Security

### 12.1 Auth Flow

```typescript
// Supabase Auth handles all auth — unified across web and mobile

// Web: Supabase JS client in server components
import { createServerClient } from '@supabase/ssr'

// Mobile: Supabase JS client with AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Supported auth methods:
// - Email + password (primary)
// - Google OAuth (web + mobile via expo-auth-session)
// - Apple Sign In (mobile required by App Store for apps with social auth)
// - Magic link (email)
```

### 12.2 Security Checklist

```
□ Supabase Row Level Security on all user-owned tables
□ JWT validation on every tRPC procedure
□ Nylas OAuth tokens stored encrypted in Supabase (never client-side)
□ Stripe webhook signature validation
□ Inngest signing key for webhook verification
□ All API keys in environment variables (never committed)
□ HTTPS only (enforced by Vercel + Supabase)
□ Rate limiting on tRPC procedures (custom Inngest-based middleware)
□ Input sanitization via Zod on all endpoints
□ No PII in Inngest event payloads (pass IDs, fetch in function)
□ Affiliate link click tracking via server redirect (not client-side)
□ USPS address data not stored beyond the move lifecycle
□ Move data deleted 90 days after move completion (GDPR-friendly)
□ Privacy policy: no selling user data, no third-party analytics except PostHog
```

---

## 13. Monetization Implementation

### 13.1 Stripe One-Time Unlock Flow

```typescript
// 1. User completes onboarding, lands on paywall if free tier
// 2. Selects plan (Essentials $29 / Complete $59 / Premium $99)
// 3. tRPC call creates Stripe Payment Intent

export const billingRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({
      moveId: z.string().uuid(),
      planTier: z.enum(['essentials', 'complete', 'premium']),
      giftCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const prices = { essentials: 2900, complete: 5900, premium: 9900 }; // cents

      // Check for valid gift code (RE agent gifting)
      if (input.giftCode) {
        const code = await validateGiftCode(input.giftCode);
        if (code) {
          await redeemGiftCode(code.id, ctx.user.id, input.moveId);
          await upgradeMovePlan(input.moveId, code.planTier);
          return { success: true, gifted: true };
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: prices[input.planTier],
        currency: 'usd',
        metadata: {
          moveId: input.moveId,
          userId: ctx.user.id,
          planTier: input.planTier,
        },
      });

      return { clientSecret: paymentIntent.client_secret };
    }),
});

// 4. Stripe webhook confirms payment → upgrade move plan
// apps/web/app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body, sig, process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'payment_intent.succeeded') {
    const { moveId, planTier } = event.data.object.metadata;
    await upgradeMoveplan(moveId, planTier);
    await unlockAgentsForMove(moveId, planTier);
  }
}
```

### 13.2 Affiliate Revenue Implementation

```typescript
// Affiliate clicks tracked server-side for accurate attribution

// Server redirect route: /api/affiliate/click?id=[affiliate_event_id]
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const affiliateEventId = searchParams.get('id');

  const event = await getAffiliateEvent(affiliateEventId);
  if (!event) return new Response('Not found', { status: 404 });

  // Log the click
  await db.update(affiliateEvents)
    .set({ eventType: 'clicked', occurredAt: new Date() })
    .where(eq(affiliateEvents.id, affiliateEventId));

  // Redirect to affiliate link (appends tracking params)
  return Response.redirect(event.affiliateLink, 302);
}

// ISP affiliate links pre-configured per provider:
export const ISP_AFFILIATE_LINKS = {
  xfinity: {
    baseUrl: 'https://www.xfinity.com/internet',
    trackingParam: 'cjevent',
    network: 'cj_affiliate',
    cid: process.env.CJ_XFINITY_CID,
    estimatedCommission: 135,
  },
  att: {
    baseUrl: 'https://www.att.com/internet/',
    trackingParam: 'source',
    network: 'cj_affiliate',
    estimatedCommission: 100,
  },
  // etc.
};
```

---

## 14. Deployment & Infrastructure

### 14.1 Web Deployment (Vercel)

```
vercel.json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": { ... },
  "functions": {
    "app/api/inngest/route.ts": { "maxDuration": 300 }
  }
}

Environment variables (Vercel):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- INNGEST_EVENT_KEY
- INNGEST_SIGNING_KEY
- NYLAS_API_KEY
- NYLAS_CLIENT_ID
- NYLAS_CLIENT_SECRET
- SMARTYSTREETS_AUTH_ID
- SMARTYSTREETS_AUTH_TOKEN
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- RESEND_API_KEY
- GOOGLE_PLACES_API_KEY
- NEXT_PUBLIC_POSTHOG_KEY
- SENTRY_DSN
```

### 14.2 Mobile Deployment (EAS)

```json
// apps/mobile/eas.json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "ios": { "buildConfiguration": "Release" },
      "android": { "buildType": "apk" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
```

### 14.3 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck
      - run: pnpm turbo lint
      - run: pnpm turbo test

# .github/workflows/deploy-mobile.yml
name: EAS Build (Production)
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with: { expo-version: latest, eas-version: latest, token: ${{ secrets.EXPO_TOKEN }} }
      - run: pnpm install
      - run: eas build --platform all --non-interactive --auto-submit
        working-directory: apps/mobile
```

---

## 15. Cost Analysis — Full Breakdown

### 15.1 Development Infrastructure Costs

#### Phase 1: MVP (Months 1–3, 0–500 active moves/month)

| Service | Plan | Monthly Cost | Notes |
|---------|------|-------------|-------|
| Vercel | Pro | $20 | Needed for team + custom domain |
| Supabase | Pro | $25 | 8GB DB, 100GB storage, 5GB bandwidth |
| Inngest | Free → Starter | $0–$25 | Free up to 50K events/mo; $25 after |
| Anthropic Claude | API (usage) | $15–$50 | ~$0.26/move × 50–200 moves |
| Nylas | Free | $0 | Up to 5 grants free; $25/mo after |
| SmartyStreets | Starter | $0–$10 | 250 free/mo; 500 moves = $2.50 |
| Google Places | Pay-as-go | $5–$20 | $0.017/call × ~500 calls/mo |
| Twilio | Pay-as-go | $5–$15 | $0.0079/SMS; ~1,000 SMS/mo |
| Resend | Free | $0 | 3,000 emails/mo free |
| Stripe | 2.9% + $0.30 | Variable | On direct revenue only |
| Sentry | Developer | $0 | Free tier sufficient |
| PostHog | Free | $0 | Free up to 1M events |
| BetterStack | Starter | $0 | Free tier |
| EAS Build | Free | $0 | 30 builds/mo free |
| Domain | Annual | $1.25/mo | ~$15/year |
| **Total monthly** | | **$71–$166** | At early stage |

#### Phase 2: Growth (Months 3–9, 500–3,000 active moves/month)

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Inngest | Team | $100 |
| Anthropic Claude | API | $200–$800 |
| Nylas | Business | $150 |
| SmartyStreets | Standard | $50 |
| Google Places | Pay-as-go | $50–$100 |
| Twilio | Pay-as-go | $40–$100 |
| Resend | Starter | $20 |
| CJ Affiliate | Free | $0 |
| Sentry | Team | $26 |
| PostHog | Scale | $50 |
| BetterStack | Basic | $23 |
| **Total monthly** | | **$754–$1,414** |

#### Phase 3: Scale (Months 9–18, 3,000–10,000 active moves/month)

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Vercel | Enterprise | $400 |
| Supabase | Team | $599 |
| Inngest | Enterprise | $500 |
| Anthropic Claude | API + Volume discount | $1,500–$4,000 |
| Nylas | Scale | $500 |
| SmartyStreets | Volume | $200 |
| Google Places | Pay-as-go | $300–$600 |
| Twilio | Volume | $150–$400 |
| Resend | Business | $90 |
| Sentry | Business | $89 |
| PostHog | Enterprise | $450 |
| BetterStack | Business | $99 |
| **Total monthly** | | **$4,877–$7,927** |

### 15.2 One-Time Development Costs

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | $99/yr | Required for App Store |
| Google Play Console | $25 one-time | Required for Play Store |
| Design assets (icons, splash) | $0–$200 | Can use Figma free tier |
| Font licenses | $0 | Plus Jakarta Sans is open source |
| EAS Build credits (first year) | $0 | Free tier sufficient |
| Domain registration | $15/yr | .com or .app |
| **Total one-time** | **$139–$339** | |

### 15.3 Cost Per Move — Operational

| Cost Category | Per Move (0–500/mo) | Per Move (500–3,000/mo) | Per Move (3,000+/mo) |
|--------------|--------------------|-----------------------|---------------------|
| Claude API | $0.26 | $0.22 | $0.18 (volume discount) |
| Infrastructure (allocated) | $0.40 | $0.25 | $0.15 |
| SMS notifications | $0.024 | $0.020 | $0.016 |
| Email (Resend) | $0.004 | $0.003 | $0.002 |
| SmartyStreets | $0.010 | $0.010 | $0.008 |
| Google Places | $0.040 | $0.035 | $0.030 |
| Stripe fees (on paid plans) | $0.18 | $0.18 | $0.18 |
| **Total cost per move** | **~$0.92** | **~$0.72** | **~$0.57** |

**Gross margin at $135 ARPM: 99.3%**
**Gross margin at $183 ARPM: 99.5%**

The unit economics are extraordinarily favorable. Infrastructure cost is negligible against affiliate revenue.

### 15.4 App Store Revenue Share

| Platform | Commission | Applies to |
|----------|-----------|-----------|
| Apple App Store | 15–30% | In-app purchases (IAP) |
| Google Play | 15–30% | In-app purchases |
| Stripe direct (web) | 2.9% + $0.30 | Web payments |

**Strategy: Web-first payment to avoid 15–30% App Store tax**
- Present paywall on web when possible
- Use deep link from app to web checkout
- Affiliate revenue bypasses App Store entirely
- This alone improves effective margin by 15–30 percentage points on direct revenue

Apple's App Store guidelines require IAP for "digital goods consumed within the app" but affiliate clicks and external service bookings are not subject to this rule.

### 15.5 CAC Payback Analysis

| Channel | CAC | ARPM | Payback Period |
|---------|-----|------|---------------|
| SEO (organic) | $8 | $135 | Immediate |
| Community/Reddit | $12 | $135 | Immediate |
| RE agent gifting | $0 (agent pays) | $135 | Immediate |
| Referral program | $18 | $135 | Immediate |
| ProductHunt | $15 | $135 | Immediate |
| Google Ads | $65 | $135 | Immediate |
| Meta Ads | $120 | $135 | Immediate |
| **Blended** | **$35** | **$135** | **Immediate** |

Every customer is profitable on their first move. The episodic revenue model with affiliate upside makes MoverOS one of the few consumer apps where CAC payback is genuinely instant.

---

## 16. Build Timeline — Week-by-Week

### Phase 1: Foundation (Weeks 1–2)

**Week 1:**
- [ ] Initialize Turborepo monorepo with `pnpm` workspaces
- [ ] Create `apps/web` (Next.js 15) and `apps/mobile` (Expo 52)
- [ ] Set up `packages/ui`, `packages/db`, `packages/trpc`, `packages/agents`, `packages/utils`
- [ ] Configure NativeWind in mobile app; verify Tailwind classes render correctly on both platforms
- [ ] Supabase project setup: database, auth, storage, RLS policies
- [ ] Drizzle schema: `user_profiles`, `moves`, `tasks` (core tables only)
- [ ] Supabase Auth: email + Google OAuth on web; Google + Apple on mobile
- [ ] tRPC router skeleton: auth middleware, basic `moves` router
- [ ] Deploy web to Vercel; run Expo on device via Expo Go

**Week 2:**
- [ ] Full Drizzle schema: all 12 tables from spec
- [ ] Onboarding wizard: 5-step flow (web + mobile, pixel-identical)
- [ ] Address autocomplete: Google Places API integration
- [ ] MoveSetupAgent: Inngest function + Claude Sonnet prompt
- [ ] Task list generation from move profile
- [ ] `approval_items` table + HITL approval flow skeleton
- [ ] Supabase Realtime: subscribe to agent task status changes
- [ ] Design system: color tokens, typography scale, spacing in `packages/ui`
- [ ] Core components: `TaskCard`, `Button`, `Input`, `AgentStatusBadge`

### Phase 2: Core Agent Loop (Weeks 3–4)

**Week 3:**
- [ ] QuoteAgent: FMCSA API + Haiku classification + Sonnet email drafting
- [ ] Nylas OAuth flow (web + mobile deep link)
- [ ] Email execution: user approves → Inngest sends via Nylas
- [ ] Mover quotes UI: comparison cards with red flag indicators
- [ ] InternetAgent: SmartyStreets ISP lookup + Haiku scoring
- [ ] ISP comparison table with affiliate links
- [ ] Agent approval inbox: full HITL UI (web + mobile)
- [ ] Move Progress Ring component with Reanimated animation (mobile)

**Week 4:**
- [ ] UtilityAgent: origin cancel + destination setup logic
- [ ] Utility module UI: split tabs (origin/destination)
- [ ] AddressAgent: USPS + priority entity list + check-off tracker
- [ ] Address change module: 20+ entity list with links and status
- [ ] TimelineAgent: Inngest cron + dependency graph rendering
- [ ] Timeline screen: Gantt-style scrollable view (web + mobile)
- [ ] Task detail modal: full task info + agent output + completion
- [ ] Push notification registration: Expo + Web Push setup

### Phase 3: Full Lifecycle + Notifications (Weeks 5–6)

**Week 5:**
- [ ] ServiceAgent: Google Places search + booking inquiry drafting
- [ ] Services screen: cleaning, storage, handyman cards
- [ ] Google Calendar API: add appointments from service bookings
- [ ] Moving Day Mode: special screen, activated on move date
- [ ] Moving day checklist: real-time check-off + mover contact
- [ ] SettledAgent: post-move tasks (30 days after move)
- [ ] Settled module: "You've moved! Here's what's left" screen

**Week 6:**
- [ ] Inngest scheduling: all time-based triggers (6wks, 3wks, 2wks, 1wk, day-of)
- [ ] Twilio SMS: move eve reminder + moving day morning message
- [ ] Resend email: agent approval notification + weekly digest templates
- [ ] Push notifications: full registration + send from Inngest functions
- [ ] Notification preferences settings screen
- [ ] Daily cron: TimelineAgent refresh + overdue task detection
- [ ] Notification log table + read receipts

### Phase 4: Monetization + Polish (Weeks 7–8)

**Week 7:**
- [ ] Stripe: Payment Intent creation + webhook handler
- [ ] Paywall UI: plan comparison modal (web + mobile)
- [ ] Gift code redemption: validation + plan unlock
- [ ] RE agent gifting portal: buy codes, view redemptions
- [ ] Affiliate tracking: click events, server-side redirect
- [ ] ISP + mover affiliate link injection in approval items
- [ ] Affiliate revenue dashboard (admin view)
- [ ] Sentry: error tracking on web + mobile
- [ ] PostHog: product analytics + funnel tracking

**Week 8:**
- [ ] End-to-end testing: full move lifecycle (onboarding → settled)
- [ ] Performance audit: Lighthouse (web) + Flipper profiling (mobile)
- [ ] App Store assets: icon (1024×1024), splash screen, screenshots (6.7")
- [ ] App Store / Play Store submissions
- [ ] Landing page: hero, features, pricing, RE agent section
- [ ] SEO: 5 city-specific landing pages
- [ ] Instant Free Report page (viral acquisition hook)
- [ ] Beta test: 10 users with active moves

**Target: App Store approval + first paying customer by end of Week 8**

### Timeline Risk Buffer
- **App Store review:** Allow 2 weeks for first iOS submission approval
- **EAS Build setup:** First build takes 1–2 days to configure properly
- **Nylas OAuth approval:** May require Nylas to review/approve app (allow 1 week)
- **Affiliate account approvals:** CJ Affiliate for Xfinity takes 3–7 days

**Recommended:** Submit App Store at end of Week 6 (with core features complete), use Weeks 7–8 for monetization and polish while waiting for Apple review.

---

## 17. Testing Strategy

### 17.1 Testing Layers

```typescript
// Unit tests: packages/utils, packages/agents (prompt output parsing)
// vitest for all packages

// Integration tests: tRPC routes with test database
// vitest + supertest

// E2E tests: Playwright (web) + Detox (mobile)
// Focus: full move lifecycle (onboard → approve → complete)

// Manual testing matrix per sprint:
// - iOS 17+ (iPhone 15, iPhone SE 3rd gen)
// - Android 13+ (Pixel 7, Samsung Galaxy S23)
// - Web: Chrome, Safari, Firefox
// - Web responsive: 375px, 768px, 1280px, 1440px

// Agent testing: synthetic move profiles
// - Local move: 1BR, 2 weeks out
// - Long-distance: 3BR, 6 weeks out
// - Interstate: 4BR+, 8 weeks out, special items
```

### 17.2 Critical Test Scenarios

```
1. Full HITL flow: Agent creates approval → user approves → email sends via Nylas
2. Inngest retry: Agent function fails → retries 3x → failure alert
3. Realtime: Agent status update visible on both web and mobile simultaneously
4. Payment: Stripe webhook → move plan upgraded → agents unlocked
5. Gift code: RE agent creates code → user redeems → plan upgraded
6. Affiliate: User clicks ISP link → click tracked → conversion tracked
7. Notifications: Push delivered on mobile → deep link opens correct screen
8. Offline: Mobile app shows cached data when offline, syncs when reconnected
9. Auth: Sign in on web → same session visible on mobile
10. Move date change: TimelineAgent recalculates all due dates correctly
```

---

## 18. Post-Launch Iteration Plan

### Month 2–3 (Post-Launch Priorities)

**Optimization:**
- A/B test: Does showing the instant free report on landing page before signup increase conversion?
- A/B test: $29 vs $39 vs free-with-affiliate for Essentials plan
- Optimize ISP affiliate conversion: test recommendation framing ("best value" vs "fastest")
- PostHog funnel: identify highest drop-off step in onboarding

**Features:**
- Renter's insurance agent (Lemonade + Toggle affiliate)
- Storage unit finder (Public Storage, Extra Space affiliate)
- Neighborhood guide: AI-generated city brief at destination
- RE agent gifting dashboard improvements

### Month 4–6

**Scale:**
- City-specific SEO: 25+ landing pages published
- Affiliate network expansion: negotiate direct deals with AT&T, Verizon
- Property management partnership: 2–3 large PM companies piloting MoverOS as move-in gift

**Features:**
- Moving day live mode enhancements (damage photo documentation, inventory count)
- Post-move settled module: 30-day follow-up tasks
- Corporate HR relocation benefit (pilot with 2–3 mid-market companies)
- Android widget: countdown + today's tasks on home screen

### Month 7–12

**Business development:**
- Full B2B product: RE agent gifting portal with branding, analytics, bulk codes
- Corporate relocation benefit packaging
- Property management white-label offering

**Technical:**
- Offline-first architecture for mobile (moving day = potentially no internet)
- Agent learning: use approved/rejected feedback to fine-tune prompts
- Performance: Hermes engine profiling, reduce mobile bundle size
- Internationalization: Spanish (30M Spanish speakers in US move frequently)
