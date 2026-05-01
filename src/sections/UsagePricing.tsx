import { useMemo, useState } from 'react';
import type { BusinessAnalysis, CostType, LineItem, UsageDistributionShape } from '../types';
import {
  calcUsageEconomics,
  formatGBP,
  formatNum,
  formatPct,
} from '../calculations';
import {
  DISTRIBUTION_SHAPE_LABEL,
  TOOLTIPS,
} from '../constants';
import { uid } from '../storage';
import {
  Button,
  Card,
  Field,
  Metric,
  NumberInput,
  TextInput,
  Tooltip,
  inputClass,
} from '../components/ui';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ─── Customer Behaviour section data ─────────────────────────────────────────

const DATA_SOURCE_OPTIONS = [
  {
    title: 'I have real customer data',
    body: 'Export your usage logs. Calculate the 25th, 50th, 75th, and 90th percentile of monthly usage per customer. Plug those in. Best accuracy.',
  },
  {
    title: 'I have a little data',
    body: 'Use what you have, even 10–20 customers. The numbers will be noisy but directionally useful. Mark the analysis as provisional.',
  },
  {
    title: "I'm pre-launch and modelling",
    body: 'Use the helper below. Pick a realistic median, choose a distribution shape, let the tool suggest percentiles, then adjust based on your judgment.',
  },
];

type PctKey = 'p25Units' | 'p50Units' | 'p75Units' | 'p90Units';
interface PercentileEntry {
  key: PctKey;
  label: string;
  helper: string;
  tooltip: string;
}
const PERCENTILE_CONFIG: PercentileEntry[] = [
  {
    key: 'p25Units',
    label: 'p25 — Low-usage customer',
    helper: '25% of your customers use less than this. Your light users.',
    tooltip:
      "If contribution margin at p25 is negative, you're losing money on a quarter of your customer base. Whales are subsidising them. This is a hidden killer in usage businesses with free tiers or low minimums.",
  },
  {
    key: 'p50Units',
    label: 'p50 — Median (typical)',
    helper: 'The middle customer — half use less, half use more. More honest than "average," which gets distorted by whales.',
    tooltip:
      "This is your real \"typical\" customer. If you're estimating without data, start here — what does one realistic customer look like in a month?",
  },
  {
    key: 'p75Units',
    label: 'p75 — Power user',
    helper: 'Only 25% of customers use more than this. Your engaged users.',
    tooltip:
      'Healthy contribution margin here means your engaged customers are clearly profitable. Often where most of your usable revenue lives.',
  },
  {
    key: 'p90Units',
    label: 'p90 — Whale',
    helper: 'Only 10% of customers use more than this. Your heavy users — often drive most revenue.',
    tooltip:
      'In a power-law distribution, p90 customers can be 50–100× heavier than p25 customers. If you lose a few of these, your business changes overnight. Concentration risk lives here.',
  },
];

const SHAPE_MULTIPLIERS: Record<UsageDistributionShape, { p25: number; p75: number; p90: number }> = {
  flat:        { p25: 0.7,  p75: 1.3, p90: 1.7 },
  moderate:    { p25: 0.3,  p75: 3.0, p90: 8.0 },
  'power-law': { p25: 0.1,  p75: 8.0, p90: 50.0 },
};

const SHAPE_DESCRIPTIONS: Record<UsageDistributionShape, { label: string; blurb: string; range: string }> = {
  flat: {
    label: 'Flat distribution',
    blurb: 'Customers use roughly the same amount. Common in consumer subscriptions or simple tools where the product has a natural usage ceiling.',
    range: 'p90 ≈ 1.5–2× p50',
  },
  moderate: {
    label: 'Moderate power law',
    blurb: 'Some customers use much more than others, but no extreme whales. Typical of most B2B SaaS.',
    range: 'p90 ≈ 5–10× p50',
  },
  'power-law': {
    label: 'Heavy power law',
    blurb: 'A small number of whales drive most revenue. Common in APIs, developer tools, and infrastructure — anywhere customer size varies wildly.',
    range: 'p90 ≈ 30–100× p50',
  },
};

// ─── Main Input Component ────────────────────────────────────────────────────

export function UsagePricingInputs({
  analysis,
  onChange,
}: {
  analysis: BusinessAnalysis;
  onChange: (
    patch: Partial<BusinessAnalysis> | ((a: BusinessAnalysis) => BusinessAnalysis)
  ) => void;
}) {
  const u = analysis.usagePricing;
  const [showDataSource, setShowDataSource] = useState(true);
  const [showHelper, setShowHelper] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [helperShape, setHelperShape] = useState<UsageDistributionShape>('moderate');

  const patchUsage = (patch: Partial<BusinessAnalysis['usagePricing']>) =>
    onChange((a) => ({ ...a, usagePricing: { ...a.usagePricing, ...patch } }));

  const addConsumptionCost = () =>
    patchUsage({
      consumptionVariableCosts: [
        ...u.consumptionVariableCosts,
        { id: uid(), name: 'New cost', amount: 0, type: 'fixed' },
      ],
    });
  const updateConsumptionCost = (id: string, patch: Partial<LineItem>) =>
    patchUsage({
      consumptionVariableCosts: u.consumptionVariableCosts.map((v) =>
        v.id === id ? { ...v, ...patch } : v
      ),
    });
  const removeConsumptionCost = (id: string) =>
    patchUsage({
      consumptionVariableCosts: u.consumptionVariableCosts.filter((v) => v.id !== id),
    });

  const shapeOptions: UsageDistributionShape[] = ['flat', 'moderate', 'power-law'];
  const unitLabel = u.consumptionUnitLabel || 'consumption units';

  return (
    <>
      {/* ── Consumption economics ─────────────────────────────────────── */}
      <Card title="Consumption economics (per usage unit)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Consumption unit" tooltip={TOOLTIPS.consumptionUnitLabel}>
            <TextInput
              value={u.consumptionUnitLabel}
              onChange={(v) => patchUsage({ consumptionUnitLabel: v })}
              placeholder="API call / message / GB"
            />
          </Field>
          <Field
            label={`Price per ${u.consumptionUnitLabel || 'unit'} (£)`}
            tooltip={TOOLTIPS.pricePerConsumptionUnit}
          >
            <NumberInput
              value={u.pricePerConsumptionUnit}
              onChange={(v) => patchUsage({ pricePerConsumptionUnit: v })}
              step="0.0001"
            />
          </Field>
          <Field label="Monthly base fee (£)" tooltip={TOOLTIPS.baseFee}>
            <NumberInput
              value={u.baseFee}
              onChange={(v) => patchUsage({ baseFee: v })}
            />
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
              Variable cost per {u.consumptionUnitLabel || 'unit'}. Check "3rd-party" if cost depends on an upstream vendor.
              <Tooltip text={TOOLTIPS.supplierDependency} />
            </div>
            <Button variant="secondary" onClick={addConsumptionCost}>
              + Add line
            </Button>
          </div>
          <div className="space-y-2">
            {u.consumptionVariableCosts.map((item) => (
              <ConsumptionCostRow
                key={item.id}
                item={item}
                onChange={(patch) => updateConsumptionCost(item.id, patch)}
                onRemove={() => removeConsumptionCost(item.id)}
              />
            ))}
            {u.consumptionVariableCosts.length === 0 && (
              <div className="text-sm text-slate-500">No consumption costs yet.</div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Customer behaviour ────────────────────────────────────────── */}
      <Card>
        {/* Section header */}
        <h2 className="text-base font-semibold mb-2">
          Describe the shape of your customer usage
        </h2>

        {/* "Where do these numbers come from?" dismissible banner */}
        {showDataSource && (
          <div className="mb-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                Where do these numbers come from?
              </span>
              <button
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg leading-none shrink-0"
                onClick={() => setShowDataSource(false)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DATA_SOURCE_OPTIONS.map((opt) => (
                <div
                  key={opt.title}
                  className="rounded-md bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 p-2"
                >
                  <div className="text-xs font-medium mb-1 text-indigo-800 dark:text-indigo-300">
                    {opt.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{opt.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intro paragraph */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Imagine lining up all your customers from smallest to largest by how much they use your
          product each month. We&apos;re asking you to mark four points along that line. This tells
          us the <em>shape</em> of your customer base — not just the average, which often lies.
          Enter the number of <strong>{unitLabel}</strong> one customer at each point uses{' '}
          <strong>in one month</strong>.
        </p>

        {/* Avg units + distribution shape */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Field
            label={`Avg ${u.consumptionUnitLabel || 'units'} / customer / month`}
            tooltip={TOOLTIPS.averageUnitsPerCustomer}
          >
            <NumberInput
              value={u.averageUnitsPerCustomer}
              onChange={(v) => patchUsage({ averageUnitsPerCustomer: v })}
            />
          </Field>
          <Field label="Distribution shape" tooltip={TOOLTIPS.distributionShape}>
            <select
              className={inputClass}
              value={u.distributionShape}
              onChange={(e) =>
                patchUsage({ distributionShape: e.target.value as UsageDistributionShape })
              }
            >
              {shapeOptions.map((s) => (
                <option key={s} value={s}>
                  {DISTRIBUTION_SHAPE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Two-column: percentile inputs left, live preview chart right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            {PERCENTILE_CONFIG.map((pc) => (
              <Field key={pc.key} label={pc.label} tooltip={pc.tooltip}>
                <NumberInput
                  value={u[pc.key]}
                  onChange={(v) =>
                    patchUsage({ [pc.key]: v } as Partial<BusinessAnalysis['usagePricing']>)
                  }
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pc.helper}</p>
              </Field>
            ))}
          </div>
          <DistributionPreviewChart
            p25={u.p25Units}
            p50={u.p50Units}
            p75={u.p75Units}
            p90={u.p90Units}
            unitLabel={unitLabel}
          />
        </div>

        {/* Collapsible percentile helper */}
        <div className="mt-5">
          <button
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            onClick={() => setShowHelper((v) => !v)}
          >
            <span className="w-3 inline-block">{showHelper ? '▾' : '▸'}</span>
            Not sure what numbers to enter? Use this helper.
          </button>
          {showHelper && (
            <PercentileHelper
              u={u}
              unitLabel={unitLabel}
              helperShape={helperShape}
              setHelperShape={setHelperShape}
              onSuggest={(patch) => patchUsage(patch)}
            />
          )}
        </div>

        {/* Collapsible worked example */}
        <div className="mt-3">
          <button
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            onClick={() => setShowExample((v) => !v)}
          >
            <span className="w-3 inline-block">{showExample ? '▾' : '▸'}</span>
            See a worked example
          </button>
          {showExample && <WorkedExample />}
        </div>
      </Card>

      {/* ── Acquisition funnel ────────────────────────────────────────── */}
      <Card title="Acquisition funnel & True CAC">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label={`Free-tier ${u.consumptionUnitLabel || 'units'} / user / mo`}
            tooltip={TOOLTIPS.freeTierUnits}
          >
            <NumberInput
              value={u.freeTierUnits}
              onChange={(v) => patchUsage({ freeTierUnits: v })}
            />
          </Field>
          <Field label="Free → paid conversion (%)" tooltip={TOOLTIPS.conversionRatePct}>
            <NumberInput
              value={u.conversionRatePct}
              onChange={(v) => patchUsage({ conversionRatePct: v })}
              step="0.1"
            />
          </Field>
          <Field label="Direct CAC (£ / paying)" tooltip={TOOLTIPS.directCAC}>
            <NumberInput
              value={u.directCAC}
              onChange={(v) => patchUsage({ directCAC: v })}
            />
          </Field>
        </div>
      </Card>

      {/* ── Retention ─────────────────────────────────────────────────── */}
      <Card title="Retention & expansion">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Monthly churn (%)" tooltip={TOOLTIPS.monthlyChurnPct}>
            <NumberInput
              value={u.monthlyChurnPct}
              onChange={(v) => patchUsage({ monthlyChurnPct: v })}
              step="0.1"
            />
          </Field>
          <Field label="Net Revenue Retention (%)" tooltip={TOOLTIPS.nrrPct}>
            <NumberInput
              value={u.nrrPct}
              onChange={(v) => patchUsage({ nrrPct: v })}
            />
          </Field>
          <Field label="Override lifetime (months, 0=auto)">
            <NumberInput
              value={u.customerLifetimeMonths}
              onChange={(v) => patchUsage({ customerLifetimeMonths: v })}
            />
          </Field>
        </div>
      </Card>
    </>
  );
}

// ─── Health outputs ──────────────────────────────────────────────────────────

export function UsagePricingHealth({ analysis }: { analysis: BusinessAnalysis }) {
  const ue = useMemo(() => calcUsageEconomics(analysis), [analysis]);
  const u = analysis.usagePricing;
  const unitLabel = u.consumptionUnitLabel || 'unit';

  const p25Health =
    ue.p25Contribution >= 0 && ue.avgContributionPerCustomer > 0
      ? 'healthy'
      : ue.p25Contribution >= 0
      ? 'caution'
      : 'danger';
  const ltvCacHealth =
    ue.ltvToCacRatio >= 3 ? 'healthy' : ue.ltvToCacRatio >= 1.5 ? 'caution' : 'danger';
  const supplierHealth =
    ue.supplierDependencyPct < 40 ? 'healthy' : ue.supplierDependencyPct < 70 ? 'caution' : 'danger';
  const whaleHealth =
    ue.top10PctShare < 35 ? 'healthy' : ue.top10PctShare < 55 ? 'caution' : 'danger';
  const paybackHealth =
    !isFinite(ue.paybackMonths)
      ? 'danger'
      : ue.paybackMonths <= 6
      ? 'healthy'
      : ue.paybackMonths <= 18
      ? 'caution'
      : 'danger';
  const marginHealth =
    ue.consumptionMarginPct >= 40 ? 'healthy' : ue.consumptionMarginPct >= 15 ? 'caution' : 'danger';

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Metric
            label="True CAC"
            value={formatGBP(ue.trueCAC)}
            sub={`Direct ${formatGBP(ue.directCAC)} + free-tier drag ${formatGBP(ue.freeTierDragPerPaying)}`}
            tooltip={TOOLTIPS.trueCAC}
            large
          />
        </Card>
        <Card>
          <Metric
            label="LTV"
            value={formatGBP(ue.ltv)}
            sub={`Lifetime ${ue.effectiveLifetimeMonths.toFixed(1)} mo · avg contrib ${formatGBP(ue.avgContributionPerCustomer)}/mo`}
            large
          />
        </Card>
        <Card>
          <Metric
            label="LTV : True-CAC"
            value={isFinite(ue.ltvToCacRatio) ? `${ue.ltvToCacRatio.toFixed(1)}×` : '∞'}
            sub="Healthy ≥ 3× · Fragile < 1.5×"
            health={ltvCacHealth}
            large
          />
        </Card>
        <Card>
          <Metric
            label="CAC payback"
            value={isFinite(ue.paybackMonths) ? `${ue.paybackMonths.toFixed(1)} mo` : 'Never'}
            sub="Months until a paying customer recovers True CAC"
            health={paybackHealth}
            large
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Metric
            label="Per-unit margin"
            value={formatPct(ue.consumptionMarginPct)}
            sub={`${formatGBP(ue.contributionPerConsumptionUnit)} contribution / ${unitLabel}`}
            health={marginHealth}
          />
        </Card>
        <Card>
          <Metric
            label="Supplier dependency"
            value={formatPct(ue.supplierDependencyPct)}
            sub={`3rd-party ${formatGBP(ue.thirdPartyCostPerConsumptionUnit)} / ${unitLabel}`}
            health={supplierHealth}
            tooltip={TOOLTIPS.supplierDependency}
          />
        </Card>
        <Card>
          <Metric
            label="Top 10% of customers"
            value={formatPct(ue.top10PctShare) + ' of revenue'}
            sub={`Top 20%: ${formatPct(ue.top20PctShare)} — whale-and-mouse exposure`}
            health={whaleHealth}
          />
        </Card>
        <Card>
          <Metric
            label="p25 customer contribution"
            value={formatGBP(ue.p25Contribution) + '/mo'}
            sub={
              ue.p25Contribution < 0
                ? 'Low-usage customers are loss-making — raise base fee or gate free tier'
                : 'Low-usage customer pays for themselves'
            }
            health={p25Health}
          />
        </Card>
      </div>

      <Card title="Contribution across customer percentiles (monthly)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PctBlock label="p25 (low)" units={u.p25Units} contribution={ue.p25Contribution} unitLabel={unitLabel} />
          <PctBlock label="p50 (median)" units={u.p50Units} contribution={ue.p50Contribution} unitLabel={unitLabel} />
          <PctBlock label="p75" units={u.p75Units} contribution={ue.p75Contribution} unitLabel={unitLabel} />
          <PctBlock label="p90 (whale)" units={u.p90Units} contribution={ue.p90Contribution} unitLabel={unitLabel} />
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          If p25 is negative and p90 is huge, you have a whale-and-mouse business — one churn event can collapse revenue.
        </p>
      </Card>

      <Card title="Revenue concentration by usage decile">
        <ConcentrationChart deciles={ue.decileRevenueShare} />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Left decile = lowest-usage 10% of customers. Right decile = top 10%. Power-law means the rightmost bar dwarfs the rest.
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Metric
            label="Paying customers / mo"
            value={formatNum(ue.payingCustomers)}
            sub="Uses the 'Units sold per month' field above"
          />
        </Card>
        <Card>
          <Metric
            label="Monthly revenue"
            value={formatGBP(ue.monthlyRevenue)}
            sub={`ARPU ${formatGBP(ue.avgRevenuePerCustomer)}`}
          />
        </Card>
        <Card>
          <Metric
            label="Monthly variable cost"
            value={formatGBP(ue.monthlyVariableCosts)}
            sub={`Per customer: ${formatGBP(ue.avgVariableCostPerCustomer)}`}
          />
        </Card>
        <Card>
          <Metric
            label="Monthly profit (usage)"
            value={formatGBP(ue.monthlyProfit)}
            sub={`Annual: ${formatGBP(ue.annualProfit)}`}
            health={ue.monthlyProfit > 0 ? 'healthy' : ue.monthlyProfit === 0 ? 'caution' : 'danger'}
          />
        </Card>
      </div>
    </>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PctBlock({
  label,
  units,
  contribution,
  unitLabel,
}: {
  label: string;
  units: number;
  contribution: number;
  unitLabel: string;
}) {
  const color =
    contribution > 0 ? 'text-healthy' : contribution === 0 ? 'text-caution' : 'text-danger';
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={`text-lg md:text-xl font-semibold ${color}`}>{formatGBP(contribution)}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {formatNum(units)} {unitLabel}/mo
      </div>
    </div>
  );
}

function ConcentrationChart({ deciles }: { deciles: number[] }) {
  const data = deciles.map((share, i) => ({
    decile: `${i * 10}-${(i + 1) * 10}%`,
    share: share * 100,
  }));
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" className="dark:opacity-20" />
          <XAxis
            dataKey="decile"
            tick={{ fontSize: 11 }}
            label={{ value: 'Customer decile (usage)', position: 'insideBottom', offset: -5, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            label={{ value: 'Share of revenue', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <ReTooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ fontSize: 12 }} />
          <Legend />
          <Bar dataKey="share" name="Revenue share" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={d.decile}
                fill={
                  i === data.length - 1 ? '#dc2626' : i >= data.length - 2 ? '#f59e0b' : '#6366f1'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ConsumptionCostRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={`${inputClass} flex-1 min-w-[9rem]`}
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <div className="w-24">
        <NumberInput value={item.amount} onChange={(v) => onChange({ amount: v })} step="0.0001" />
      </div>
      <select
        className={`${inputClass} w-32`}
        value={item.type}
        onChange={(e) => onChange({ type: e.target.value as CostType })}
      >
        <option value="fixed">£ per unit</option>
        <option value="percent">% of price</option>
      </select>
      <label className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
        <input
          type="checkbox"
          checked={!!item.isThirdParty}
          onChange={(e) => onChange({ isThirdParty: e.target.checked })}
        />
        3rd-party
      </label>
      <button
        className="text-slate-400 hover:text-red-500 text-lg px-1"
        onClick={onRemove}
        aria-label="Remove"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Customer Behaviour helpers ───────────────────────────────────────────────

function ShapeSVG({ shape }: { shape: UsageDistributionShape }) {
  const d: Record<UsageDistributionShape, string> = {
    flat:        'M2,24 C15,22 28,21 40,20 S54,19 62,18',
    moderate:    'M2,29 C10,27 20,23 32,17 S50,7  62,2',
    'power-law': 'M2,31 C20,30 35,28 46,22 S57,10 62,1',
  };
  return (
    <svg width="64" height="32" viewBox="0 0 64 32" aria-hidden="true" className="shrink-0">
      <path d={d[shape]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DistributionPreviewChart({
  p25, p50, p75, p90, unitLabel,
}: {
  p25: number; p50: number; p75: number; p90: number; unitLabel: string;
}) {
  const data = [
    { pct: 25, units: p25 },
    { pct: 50, units: p50 },
    { pct: 75, units: p75 },
    { pct: 90, units: p90 },
  ];
  const ratio = p25 > 0 ? p90 / p25 : null;
  const isHeavy = ratio !== null && ratio > 20;

  return (
    <div>
      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        Your customer base, visualised
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        {ratio !== null ? (
          <>
            Your p90 customer uses <strong>{ratio.toFixed(0)}×</strong> more than your p25 customer.
          </>
        ) : (
          'Enter p25 and p90 values to see the ratio.'
        )}
      </p>
      {isHeavy && (
        <div className="text-xs rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-1 mb-2">
          Heavy power law. Expect significant whale dependency — check the concentration metrics below.
        </div>
      )}
      <div className="h-44">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 24, left: 10 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" className="dark:opacity-20" />
            <XAxis
              dataKey="pct"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `p${v}`}
              label={{ value: 'Percentile', position: 'insideBottom', offset: -14, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              label={{ value: unitLabel, angle: -90, position: 'insideLeft', fontSize: 10, dy: 30 }}
              width={55}
            />
            <ReTooltip
              formatter={(v: number) => [`${formatNum(v)} ${unitLabel}`, 'Usage']}
              labelFormatter={(l) => `p${l}`}
              contentStyle={{ fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="units"
              stroke="#6366f1"
              fill="#6366f133"
              strokeWidth={2}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PercentileHelper({
  u,
  unitLabel,
  helperShape,
  setHelperShape,
  onSuggest,
}: {
  u: BusinessAnalysis['usagePricing'];
  unitLabel: string;
  helperShape: UsageDistributionShape;
  setHelperShape: (s: UsageDistributionShape) => void;
  onSuggest: (patch: Partial<BusinessAnalysis['usagePricing']>) => void;
}) {
  const shapeOrder: UsageDistributionShape[] = ['flat', 'moderate', 'power-law'];
  return (
    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 space-y-5">
      {/* Step 1 */}
      <div>
        <div className="text-sm font-medium mb-1">
          Step 1 — Pick your best guess at the median (p50).
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          What does one realistic, typical customer actually use in a month? Think of one persona,
          not the whole market.{' '}
          {u.p50Units > 0 ? (
            <>
              You currently have <strong>{formatNum(u.p50Units)}</strong> {unitLabel} entered as
              your p50 — that&apos;s what the tool will use as the median.
            </>
          ) : (
            <>Enter a p50 value in the inputs above first.</>
          )}
        </p>
      </div>

      {/* Step 2 */}
      <div>
        <div className="text-sm font-medium mb-2">
          Step 2 — Pick the shape of your customer base.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {shapeOrder.map((s) => {
            const desc = SHAPE_DESCRIPTIONS[s];
            const selected = helperShape === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setHelperShape(s)}
                className={`text-left rounded-md border p-3 transition ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`mb-1 ${
                    selected
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <ShapeSVG shape={s} />
                </div>
                <div className="font-medium text-sm mb-1 text-slate-800 dark:text-slate-200">
                  {desc.label}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{desc.blurb}</div>
                <div className="mt-1 text-[10px] font-mono text-slate-500">{desc.range}</div>
              </button>
            );
          })}
        </div>

        {/* Hint card */}
        <div className="mt-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs">
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">
            How do I figure out my shape?
          </div>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>
              <strong>Building for consumers?</strong> They&apos;re similar to each other →
              likely <strong>flat</strong>.
            </li>
            <li>
              <strong>Building for small businesses?</strong> They range from 1-person to 50-person
              → likely <strong>moderate power law</strong>.
            </li>
            <li>
              <strong>Building an API or tool with no customer-size limit?</strong> A freelancer and
              a 10,000-person company could both sign up → likely <strong>heavy power law</strong>.
            </li>
          </ul>
          <p className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
            The broader the customer-size range you serve, the heavier the power law. This is one of
            the most consistent patterns in SaaS.
          </p>
        </div>
      </div>

      {/* Step 3 */}
      <div>
        <div className="text-sm font-medium mb-2">Step 3 — Auto-suggest percentiles.</div>
        <Button
          variant="secondary"
          disabled={u.p50Units <= 0}
          onClick={() => {
            if (u.p50Units <= 0) return;
            const m = SHAPE_MULTIPLIERS[helperShape];
            onSuggest({
              p25Units: Math.round(u.p50Units * m.p25),
              p75Units: Math.round(u.p50Units * m.p75),
              p90Units: Math.round(u.p50Units * m.p90),
            });
          }}
        >
          Suggest percentiles based on my median
        </Button>
        {u.p50Units <= 0 && (
          <p className="text-xs text-slate-400 mt-1">Enter a p50 value in the inputs above first.</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          These are starting estimates. Replace them with real data if you have it.
        </p>
      </div>
    </div>
  );
}

function WorkedExample() {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
      <div className="text-sm font-medium mb-2">
        Example: AI transcription service charging £0.10 per minute
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
        If you expect a moderate power law (typical B2B SaaS):
      </p>
      <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300 mb-3">
        <li><strong>p25:</strong> 100 minutes/month — a small podcaster</li>
        <li><strong>p50:</strong> 300 minutes/month — a typical small business</li>
        <li><strong>p75:</strong> 800 minutes/month — an active content creator</li>
        <li><strong>p90:</strong> 2,000 minutes/month — a whale: a podcast network or call-centre pilot</li>
      </ul>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Your whales use 20× more than your low-usage customers. The tool will now check whether your
        p25 customer is even profitable after fixed per-customer costs — and whether you&apos;re
        dangerously dependent on the p90 whales.
      </p>
    </div>
  );
}
