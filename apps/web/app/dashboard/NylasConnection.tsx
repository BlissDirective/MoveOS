"use client";

import { Button } from "@moveros/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Email-sending connection status. Links to the Nylas hosted-auth flow
 * (/api/nylas/connect) when no grant is stored yet.
 */
export function NylasConnection() {
  const me = trpc.me.get.useQuery();
  if (me.isLoading) return null;

  const email = me.data?.nylasEmail;
  return (
    <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-card p-4 shadow-e1">
      <div>
        <p className="text-[14px] font-medium text-neutral-900">Email sending</p>
        <p className="text-[13px] text-neutral-500">
          {email
            ? `Connected · ${email}`
            : "Connect your inbox so MoverOS can send approved emails on your behalf."}
        </p>
      </div>
      {email ? (
        <span className="font-mono text-[12px] text-brand-600">connected</span>
      ) : (
        <a href="/api/nylas/connect">
          <Button size="sm" variant="secondary">
            Connect email
          </Button>
        </a>
      )}
    </div>
  );
}
