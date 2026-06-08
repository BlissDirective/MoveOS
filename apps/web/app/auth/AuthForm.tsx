"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Field, Input } from "@moveros/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

const COPY: Record<Mode, { title: string; cta: string; alt: string; altHref: string; altLabel: string }> = {
  "sign-in": {
    title: "Welcome back",
    cta: "Sign in",
    alt: "New here?",
    altHref: "/auth/sign-up",
    altLabel: "Create an account",
  },
  "sign-up": {
    title: "Create your account",
    cta: "Sign up",
    alt: "Already have an account?",
    altHref: "/auth/sign-in",
    altLabel: "Sign in",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);
  const copy = COPY[mode];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If email confirmation is on, there's no session yet.
        if (!data.session) {
          setSentConfirmation(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (sentConfirmation) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface-card p-6 shadow-e2">
        <h1 className="text-xl font-semibold text-neutral-900">Check your inbox</h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          We sent a confirmation link to <span className="font-medium">{email}</span>.
          Confirm it, then sign in.
        </p>
        <Link
          href="/auth/sign-in"
          className="mt-4 inline-block text-[14px] font-medium text-brand-600 hover:text-brand-700"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-lg border border-surface-border bg-surface-card p-6 shadow-e2"
    >
      <h1 className="text-xl font-semibold text-neutral-900">{copy.title}</h1>

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {error ? <p className="text-[13px] text-error">{error}</p> : null}

      <Button type="submit" isLoading={pending} className="w-full">
        {copy.cta}
      </Button>

      <p className="text-center text-[13px] text-neutral-500">
        {copy.alt}{" "}
        <Link href={copy.altHref} className="font-medium text-brand-600 hover:text-brand-700">
          {copy.altLabel}
        </Link>
      </p>
    </form>
  );
}
