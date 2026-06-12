"use client";

import { Button, MoveProgress, TaskCard } from "@moveros/ui";
import { trpc } from "@/lib/trpc/client";
import { daysUntil, dueLabel } from "@/lib/format";

export function MoveTimeline({ moveId }: { moveId: string }) {
  const utils = trpc.useUtils();
  const move = trpc.moves.get.useQuery({ moveId });
  const tasks = trpc.moves.tasks.useQuery({ moveId });

  const refreshTasks = () => {
    utils.moves.tasks.invalidate({ moveId });
    utils.moves.get.invalidate({ moveId });
  };
  const complete = trpc.tasks.complete.useMutation({ onSuccess: refreshTasks });
  const skip = trpc.tasks.skip.useMutation({ onSuccess: refreshTasks });
  const requestQuotes = trpc.moves.requestQuotes.useMutation({
    onSuccess: () => utils.approvals.listPending.invalidate(),
  });
  const requestInternet = trpc.moves.requestInternet.useMutation({
    onSuccess: () => utils.approvals.listPending.invalidate(),
  });
  const requestUtilities = trpc.moves.requestUtilities.useMutation({
    onSuccess: () => utils.approvals.listPending.invalidate(),
  });
  const requestServices = trpc.moves.requestServices.useMutation({
    onSuccess: () => utils.approvals.listPending.invalidate(),
  });
  const anyAgentKicked =
    requestQuotes.isSuccess ||
    requestInternet.isSuccess ||
    requestUtilities.isSuccess ||
    requestServices.isSuccess;

  if (move.error) {
    return <p className="text-[15px] text-error">{move.error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {move.data ? (
        <header className="flex flex-col items-center gap-4 text-center">
          <MoveProgress
            daysUntilMove={daysUntil(move.data.moveDate)}
            tasksCompleted={move.data.tasksCompleted}
            taskCount={move.data.taskCount}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {move.data.destinationCity
              ? `Your move to ${move.data.destinationCity}`
              : "Your move"}
          </h1>
          <div className="flex flex-col items-center gap-1">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                isLoading={requestQuotes.isPending}
                disabled={requestQuotes.isSuccess}
                onClick={() => requestQuotes.mutate({ moveId })}
              >
                Get moving quotes
              </Button>
              <Button
                size="sm"
                variant="secondary"
                isLoading={requestInternet.isPending}
                disabled={requestInternet.isSuccess}
                onClick={() => requestInternet.mutate({ moveId })}
              >
                Find internet options
              </Button>
              <Button
                size="sm"
                variant="secondary"
                isLoading={requestUtilities.isPending}
                disabled={requestUtilities.isSuccess}
                onClick={() => requestUtilities.mutate({ moveId })}
              >
                Plan utilities
              </Button>
              <Button
                size="sm"
                variant="secondary"
                isLoading={requestServices.isPending}
                disabled={requestServices.isSuccess}
                onClick={() => requestServices.mutate({ moveId })}
              >
                Suggest services
              </Button>
            </div>
            {anyAgentKicked ? (
              <p className="text-[12px] text-neutral-500">
                Working on it — check the approval inbox in a moment.
              </p>
            ) : null}
          </div>
        </header>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          Timeline
        </h2>
        {tasks.isLoading ? (
          <p className="text-[15px] text-neutral-500">Loading tasks…</p>
        ) : tasks.error ? (
          <p className="text-[15px] text-error">{tasks.error.message}</p>
        ) : !tasks.data || tasks.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-[15px] text-neutral-500">
            Your agents are still building this timeline — check back shortly.
          </p>
        ) : (
          tasks.data.map((t) => {
            const busy = complete.isPending || skip.isPending;
            return (
              <TaskCard
                key={t.id}
                title={t.title}
                description={t.description ?? undefined}
                agentType={t.agentType}
                priority={t.priority}
                status={t.status}
                dueLabel={dueLabel(t.dueDate)}
                onComplete={busy ? undefined : () => complete.mutate({ taskId: t.id })}
                onSkip={busy ? undefined : () => skip.mutate({ taskId: t.id })}
              />
            );
          })
        )}
      </section>
    </div>
  );
}
