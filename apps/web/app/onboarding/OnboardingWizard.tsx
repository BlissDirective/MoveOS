"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Stepper } from "@moveros/ui";
import { trpc } from "@/lib/trpc/client";

const STEPS = ["Route", "Date", "Home", "Items", "Review"];

const HOME_SIZES = [
  ["studio", "Studio"],
  ["1br", "1 bedroom"],
  ["2br", "2 bedrooms"],
  ["3br", "3 bedrooms"],
  ["4br_plus", "4+ bedrooms"],
] as const;

const MOVE_TYPES = [
  ["", "Not sure"],
  ["local", "Local"],
  ["long_distance", "Long distance"],
  ["interstate", "Interstate"],
] as const;

const SPECIAL_ITEMS = [
  "Piano",
  "Artwork",
  "Gun safe",
  "Large appliances",
  "Pool table",
  "Antiques",
  "Houseplants",
  "Vehicle",
];

type Form = {
  originCity: string;
  originState: string;
  originZip: string;
  destinationCity: string;
  destinationState: string;
  destinationZip: string;
  moveDate: string;
  moveType: "" | "local" | "long_distance" | "interstate";
  homeSize: "" | "studio" | "1br" | "2br" | "3br" | "4br_plus";
  specialItems: string[];
  packing: "self" | "full_service";
};

const EMPTY: Form = {
  originCity: "",
  originState: "",
  originZip: "",
  destinationCity: "",
  destinationState: "",
  destinationZip: "",
  moveDate: "",
  moveType: "",
  homeSize: "",
  specialItems: [],
  packing: "self",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);

  const create = trpc.moves.create.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleItem(item: string) {
    setForm((f) => ({
      ...f,
      specialItems: f.specialItems.includes(item)
        ? f.specialItems.filter((i) => i !== item)
        : [...f.specialItems, item],
    }));
  }

  const canAdvance =
    (step === 0 &&
      form.originCity &&
      form.originState &&
      form.destinationCity &&
      form.destinationState) ||
    (step === 1 && form.moveDate) ||
    (step === 2 && form.homeSize) ||
    step === 3 ||
    step === 4;

  function submit() {
    if (!form.homeSize) return;
    create.mutate({
      originCity: form.originCity,
      originState: form.originState,
      originZip: form.originZip || undefined,
      destinationCity: form.destinationCity,
      destinationState: form.destinationState,
      destinationZip: form.destinationZip || undefined,
      moveDate: form.moveDate,
      homeSize: form.homeSize,
      moveType: form.moveType || undefined,
      specialItems: form.specialItems,
      usageProfile: { packing: form.packing },
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-surface-border bg-surface-card p-6 shadow-e2">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          Set up your move
        </h1>
        <p className="text-[14px] text-neutral-500">
          A few details and your agents start planning.
        </p>
      </div>

      <Stepper steps={STEPS} current={step} />

      {step === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="From city" htmlFor="oc" className="col-span-2">
              <Input id="oc" value={form.originCity} onChange={(e) => set("originCity", e.target.value)} />
            </Field>
            <Field label="State" htmlFor="os">
              <Input id="os" value={form.originState} onChange={(e) => set("originState", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="To city" htmlFor="dc" className="col-span-2">
              <Input id="dc" value={form.destinationCity} onChange={(e) => set("destinationCity", e.target.value)} />
            </Field>
            <Field label="State" htmlFor="ds">
              <Input id="ds" value={form.destinationState} onChange={(e) => set("destinationState", e.target.value)} />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <Field label="Move date" htmlFor="md">
            <Input id="md" type="date" value={form.moveDate} onChange={(e) => set("moveDate", e.target.value)} />
          </Field>
          <Field label="Move type" htmlFor="mt">
            <Select id="mt" value={form.moveType} onChange={(e) => set("moveType", e.target.value as Form["moveType"])}>
              {MOVE_TYPES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <Field label="Home size" htmlFor="hs">
            <Select id="hs" value={form.homeSize} onChange={(e) => set("homeSize", e.target.value as Form["homeSize"])}>
              <option value="">Select…</option>
              {HOME_SIZES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Packing" htmlFor="pk">
            <Select id="pk" value={form.packing} onChange={(e) => set("packing", e.target.value as Form["packing"])}>
              <option value="self">I&apos;ll pack myself</option>
              <option value="full_service">I want full-service packing</option>
            </Select>
          </Field>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-medium text-neutral-700">
            Anything that needs special handling?
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_ITEMS.map((item) => {
              const on = form.specialItems.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleItem(item)}
                  className={
                    "rounded-pill border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                    (on
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-neutral-200 bg-surface-card text-neutral-600 hover:bg-neutral-50")
                  }
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <dl className="flex flex-col gap-2 rounded-md bg-surface-sunken p-4 text-[14px] shadow-[var(--shadow-inset)]">
          <Row label="Route" value={`${form.originCity}, ${form.originState} → ${form.destinationCity}, ${form.destinationState}`} />
          <Row label="Date" value={form.moveDate} />
          <Row label="Home" value={HOME_SIZES.find((h) => h[0] === form.homeSize)?.[1] ?? "—"} />
          <Row label="Special items" value={form.specialItems.length ? form.specialItems.join(", ") : "None"} />
        </dl>
      ) : null}

      {create.error ? (
        <p className="text-[13px] text-error">{create.error.message}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={step === 0 || create.isPending}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="sm" disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button size="sm" isLoading={create.isPending} onClick={submit}>
            Create move
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-800">{value}</dd>
    </div>
  );
}
