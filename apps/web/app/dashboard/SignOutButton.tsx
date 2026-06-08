"use client";

import { useRouter } from "next/navigation";
import { Button } from "@moveros/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/auth/sign-in");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
