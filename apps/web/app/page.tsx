"use client";

import {
  ApprovalCard,
  MoveProgress,
  TaskCard,
  type TaskCardProps,
} from "@moveros/ui";

const tasks: TaskCardProps[] = [
  {
    title: "Get moving quotes",
    description: "I found 4 movers for your route and drafted outreach.",
    agentType: "quote",
    agentLabel: "QuoteAgent",
    priority: "high",
    status: "awaiting_approval",
    dueLabel: "Due in 6 days",
  },
  {
    title: "Compare internet providers",
    description: "Checking availability at your new address…",
    agentType: "internet",
    agentLabel: "InternetAgent",
    priority: "medium",
    status: "agent_working",
  },
  {
    title: "Transfer electricity",
    agentType: "utility",
    agentLabel: "UtilityAgent",
    priority: "critical",
    status: "overdue",
    dueLabel: "Overdue by 2 days",
  },
  {
    title: "Forward your mail (USPS)",
    agentType: "address",
    agentLabel: "AddressAgent",
    priority: "medium",
    status: "completed",
    dueLabel: "Done",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-12 px-8 py-16">
      <header className="flex flex-col items-center gap-6 text-center">
        <MoveProgress daysUntilMove={32} tasksCompleted={8} taskCount={12} />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
            Your move to Austin
          </h1>
          <p className="mt-1 text-neutral-600">
            Warm Command Center · Soft Depth / Tactile — component kit preview.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          Timeline
        </h2>
        {tasks.map((t) => (
          <TaskCard
            key={t.title}
            {...t}
            onReview={() => undefined}
            onSkip={() => undefined}
          />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          Approval inbox
        </h2>
        <ApprovalCard
          title="Send quote request to Allied Van Lines"
          body="They serve your route and had the best reviews of the four. I drafted a request for a binding estimate."
          agentType="quote"
          agentLabel="QuoteAgent"
          priority="high"
          emailDraft={{
            to: "quotes@alliedvanlines.com",
            subject: "Binding estimate request — 2BR, Chicago → Austin, June 14",
            body: "Hi Allied team,\n\nI'm moving a 2-bedroom apartment from Chicago to Austin on June 14 and would like a binding estimate…",
          }}
          onApprove={() => undefined}
          onEdit={() => undefined}
          onReject={() => undefined}
        />
      </section>
    </main>
  );
}
