import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MoveTimeline } from "./MoveTimeline";

export default async function MovePage({
  params,
}: {
  params: Promise<{ moveId: string }>;
}) {
  const { moveId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <Link href="/dashboard" className="text-[14px] font-medium text-brand-600 hover:text-brand-700">
        ← Dashboard
      </Link>
      <MoveTimeline moveId={moveId} />
    </main>
  );
}
