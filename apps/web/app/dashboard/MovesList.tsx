"use client";

import Link from "next/link";
import { Button } from "@moveros/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Proves the end-to-end stack: Supabase JWT → tRPC httpBatchLink → server
 * createTRPCContext → scopedDb(userId) → moves owned by this user.
 */
export function MovesList() {
  const moves = trpc.moves.list.useQuery();

  if (moves.isLoading) {
    return <p className="text-[15px] text-neutral-500">Loading your moves…</p>;
  }
  if (moves.error) {
    return (
      <p className="text-[15px] text-error">
        Couldn’t load moves: {moves.error.message}
      </p>
    );
  }
  if (!moves.data || moves.data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-surface-card/60 p-6 text-center">
        <p className="text-[15px] text-neutral-600">No moves yet.</p>
        <Link href="/onboarding" className="mt-3 inline-block">
          <Button size="sm">Start your move</Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {moves.data.map((m) => (
        <li
          key={m.id}
          className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-card p-4 shadow-e1"
        >
          <span className="font-medium text-neutral-900">
            {m.destinationCity ?? "New move"}
          </span>
          <span className="font-mono text-[12px] text-neutral-500">{m.status}</span>
        </li>
      ))}
    </ul>
  );
}
