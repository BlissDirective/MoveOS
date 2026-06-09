import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MovesList } from "./MovesList";
import { ApprovalInbox } from "./ApprovalInbox";
import { NylasConnection } from "./NylasConnection";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Your moves
          </h1>
          <p className="font-mono text-[12px] text-neutral-500">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <NylasConnection />

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          Needs your approval
        </h2>
        <ApprovalInbox />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          Your moves
        </h2>
        <MovesList />
      </section>
    </main>
  );
}
