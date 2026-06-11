"use client";

import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@moveros/trpc";
import { ApprovalCard, Button, Field, Input, Textarea } from "@moveros/ui";
import { trpc } from "@/lib/trpc/client";

type PendingApproval =
  inferRouterOutputs<AppRouter>["approvals"]["listPending"][number];

interface IspRecommendation {
  offerId: string;
  provider: string;
  fitReason: string;
  estimatedPriceLabel: string;
}

/** Internet approval items carry agent picks in outputData.recommendations. */
function ispRecommendations(item: PendingApproval): IspRecommendation[] {
  if (item.agentType !== "internet") return [];
  const recs = (item.outputData as { recommendations?: unknown }).recommendations;
  if (!Array.isArray(recs)) return [];
  return recs.filter(
    (r): r is IspRecommendation =>
      typeof r === "object" &&
      r !== null &&
      typeof (r as IspRecommendation).offerId === "string" &&
      typeof (r as IspRecommendation).provider === "string",
  );
}

export function ApprovalInbox() {
  const pending = trpc.approvals.listPending.useQuery();

  if (pending.isLoading) {
    return <p className="text-[14px] text-neutral-500">Loading approvals…</p>;
  }
  if (pending.error) {
    return (
      <p className="text-[14px] text-error">
        Couldn’t load approvals: {pending.error.message}
      </p>
    );
  }
  if (!pending.data || pending.data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-[14px] text-neutral-500">
        Nothing needs your approval right now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.data.map((item) => (
        <ApprovalInboxItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function ApprovalInboxItem({ item }: { item: PendingApproval }) {
  const utils = trpc.useUtils();
  const refresh = () => utils.approvals.listPending.invalidate();

  const approve = trpc.approvals.approve.useMutation({ onSuccess: refresh });
  const reject = trpc.approvals.reject.useMutation({ onSuccess: refresh });
  const edit = trpc.approvals.edit.useMutation({
    onSuccess: () => {
      setEditing(false);
      refresh();
    },
  });

  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(item.emailBody ?? "");
  const [to, setTo] = useState(item.emailTo ?? "");
  const busy = approve.isPending || reject.isPending || edit.isPending;

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-accent-200 bg-surface-card p-5 shadow-e2">
        <h3 className="text-[18px] font-semibold text-neutral-900">{item.title}</h3>
        {item.requiresEmailSend ? (
          <Field label="To" htmlFor={`to-${item.id}`}>
            <Input
              id={`to-${item.id}`}
              type="email"
              placeholder="mover@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        ) : null}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-40"
        />
        <div className="flex gap-2">
          <Button
            size="md"
            isLoading={edit.isPending}
            onClick={() =>
              edit.mutate({
                approvalId: item.id,
                body,
                emailTo: to.trim() || undefined,
              })
            }
          >
            Approve &amp; Send
          </Button>
          <Button size="md" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const emailDraft =
    item.requiresEmailSend && item.emailTo
      ? {
          to: item.emailTo,
          subject: item.emailSubject ?? "",
          body: item.emailBody ?? "",
        }
      : undefined;

  const recs = ispRecommendations(item);

  return (
    <div className="flex flex-col gap-2">
      <ApprovalCard
        title={item.title}
        body={item.body}
        agentType={item.agentType}
        priority={item.priority}
        emailDraft={emailDraft}
        onApprove={busy ? undefined : () => approve.mutate({ approvalId: item.id })}
        onEdit={
          item.requiresEmailSend && !busy
            ? () => {
                setBody(item.emailBody ?? "");
                setTo(item.emailTo ?? "");
                setEditing(true);
              }
            : undefined
        }
        onReject={busy ? undefined : () => reject.mutate({ approvalId: item.id })}
      />
      {recs.length > 0 ? (
        <ul className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-4 shadow-[var(--shadow-inset)]">
          {recs.map((rec) => (
            <li
              key={rec.offerId}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-neutral-900">
                  {rec.provider}
                  <span className="ml-2 font-mono text-[11px] font-normal text-neutral-500">
                    {rec.estimatedPriceLabel}
                  </span>
                </p>
                <p className="text-[13px] leading-5 text-neutral-600">
                  {rec.fitReason}
                </p>
              </div>
              <a
                href={`/api/affiliate/click?offer=${encodeURIComponent(rec.offerId)}&moveId=${item.moveId}&approval=${item.id}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="shrink-0 rounded-md bg-brand-500 px-3 py-1.5 text-[13px] font-medium text-white shadow-e1 transition hover:bg-brand-600 active:translate-y-px active:shadow-e0"
              >
                Check availability
              </a>
            </li>
          ))}
          <li className="text-[11px] text-neutral-400">
            MoverOS may earn a commission if you sign up — it never affects the
            ranking above.
          </li>
        </ul>
      ) : null}
    </div>
  );
}
