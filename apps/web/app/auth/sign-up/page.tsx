import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "../AuthForm";

export default async function SignUpPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <AuthForm mode="sign-up" />
    </main>
  );
}
