import { UI_PACKAGE } from "@moveros/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-4xl font-bold tracking-tight">MoverOS</h1>
      <p className="text-lg text-neutral-600">
        Web foundation is live. Design system, auth, and the agent loop come
        next.
      </p>
      <p className="font-mono text-sm text-neutral-400">
        monorepo wired · imports {UI_PACKAGE}
      </p>
    </main>
  );
}
