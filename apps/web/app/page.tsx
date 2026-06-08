const elevations = ["e0", "e1", "e2", "e3", "e4"] as const;
const brandSteps = [100, 300, 500, 700, 900] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-8 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">
          MoverOS
        </h1>
        <p className="max-w-prose text-lg text-neutral-600">
          Warm Command Center · Soft Depth / Tactile. Design tokens are live —
          components come next.
        </p>
        <p className="font-mono text-sm text-neutral-400">
          design.md → @moveros/ui/theme
        </p>
      </header>

      {/* Brand ramp */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Warm Sage
        </h2>
        <div className="flex gap-2">
          {brandSteps.map((step) => (
            <div
              key={step}
              className="flex h-16 flex-1 items-end rounded-md p-2"
              style={{ background: `var(--color-brand-${step})` }}
            >
              <span className="font-mono text-[11px] text-neutral-50/90">
                {step}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Elevation ladder */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Soft Depth — elevation
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {elevations.map((e) => (
            <div
              key={e}
              className="flex h-20 items-center justify-center rounded-lg bg-surface-card font-mono text-sm text-neutral-600"
              style={{ boxShadow: `var(--shadow-${e})` }}
            >
              {e}
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <section className="flex items-center gap-3">
        <button className="rounded-md bg-brand-500 px-5 py-2.5 font-medium text-white shadow-e1 transition-transform active:translate-y-px">
          Review &amp; Approve
        </button>
        <button className="rounded-sm border border-neutral-300 bg-surface-card px-5 py-2.5 font-medium text-neutral-700 shadow-e1">
          Skip for now
        </button>
        <span className="rounded-pill bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700">
          Review required
        </span>
      </section>
    </main>
  );
}
