import { useState } from 'react';
import type { BusinessAnalysis } from '../types';
import { newAnalysis, INDUSTRIES, PRICING_MODELS } from '../constants';
import { Button, Field, NumberInput, Select, TextInput } from '../components/ui';

export function Onboarding({
  onComplete,
  onSkip,
}: {
  onComplete: (a: BusinessAnalysis) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BusinessAnalysis>(() => newAnalysis('My business'));

  const update = (patch: Partial<BusinessAnalysis>) => setDraft({ ...draft, ...patch });

  const steps = [
    {
      title: 'Welcome to Business Reality Check',
      body: (
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            This tool exists because most businesses fail not in execution, but in the model
            itself. Picking the right business is 80% of the outcome.
          </p>
          <p>
            In five minutes, you'll enter your numbers, see your unit economics, stress-test
            them, score the business against four critical questions, and (optionally) get a
            skeptical AI critique.
          </p>
          <p className="font-medium text-slate-800 dark:text-slate-100">
            The goal: make self-deception structurally impossible.
          </p>
        </div>
      ),
    },
    {
      title: 'What is the business?',
      body: (
        <div className="space-y-3">
          <Field label="Business name">
            <TextInput
              value={draft.name}
              onChange={(v) => update({ name: v })}
              placeholder="e.g. Pocket Accountant"
            />
          </Field>
          <Field label="One-line description">
            <TextInput
              value={draft.description}
              onChange={(v) => update({ description: v })}
              placeholder="What you sell, to whom"
            />
          </Field>
          <Field label="Industry / category">
            <Select
              value={draft.industry}
              onChange={(v) => update({ industry: v })}
              options={INDUSTRIES}
            />
          </Field>
          <Field label="Pricing model">
            <Select
              value={draft.pricingModel}
              onChange={(v) => update({ pricingModel: v })}
              options={PRICING_MODELS}
            />
          </Field>
        </div>
      ),
    },
    {
      title: 'Start with your price per customer',
      body: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            What do you charge for <strong>one unit</strong>? A unit could be one booking,
            one subscription month, one sandwich — whatever you sell.
          </p>
          <Field label='Definition of "unit"'>
            <TextInput
              value={draft.unitDefinition}
              onChange={(v) => update({ unitDefinition: v })}
              placeholder="e.g. one subscription month"
            />
          </Field>
          <Field label="Price per unit (£)">
            <NumberInput
              value={draft.pricePerUnit}
              onChange={(v) => update({ pricePerUnit: v })}
            />
          </Field>
          <Field label="Realistic units sold per month">
            <NumberInput
              value={draft.unitsPerMonth}
              onChange={(v) => update({ unitsPerMonth: v })}
            />
          </Field>
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
            Forecast low, then stress-test even lower. Optimism is a tax you pay later.
          </div>
        </div>
      ),
    },
    {
      title: 'You can now head to the Analyzer',
      body: (
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            We've created a draft with sensible defaults. In the Analyzer you can add variable
            costs (per-unit) and fixed costs (monthly), plus setup cost and cash reserve.
          </p>
          <p>
            Then try to <strong>kill</strong> your business in Stress Test. If it dies when
            revenue drops 40% and costs rise 30%, it is too fragile. Revise, or pick a
            different business.
          </p>
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-1 text-sm text-slate-500">
          <span>🧮</span>
          <span>Business Reality Check</span>
          <span className="ml-auto text-xs">
            Step {step + 1} / {steps.length}
          </span>
        </div>
        <h1 className="text-2xl font-semibold mb-4">{steps[step].title}</h1>
        <div className="mb-6">{steps[step].body}</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Skip setup
          </Button>
          <div className="flex-1" />
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {!last && (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          )}
          {last && <Button onClick={() => onComplete(draft)}>Start analyzing</Button>}
        </div>
      </div>
    </div>
  );
}
