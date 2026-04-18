import { useMemo, useState } from 'react';
import type { BusinessAnalysis } from '../types';
import {
  calcUnitEconomics,
  calcUsageEconomics,
  formatGBP,
  formatNum,
  formatPct,
  healthContribution,
  healthProfit,
  isUsageMode,
  type Variances,
  zeroVariances,
} from '../calculations';
import { Button, Card, HealthBadge, Metric } from '../components/ui';

interface Scenario {
  key: string;
  label: string;
  description: string;
  variances: Variances;
}

interface UsageScenario {
  key: string;
  label: string;
  description: string;
  apply: (a: BusinessAnalysis) => BusinessAnalysis;
}

function deepCopyAnalysis(a: BusinessAnalysis): BusinessAnalysis {
  return {
    ...a,
    variableCosts: a.variableCosts.map((v) => ({ ...v })),
    fixedCosts: a.fixedCosts.map((f) => ({ ...f })),
    usagePricing: {
      ...a.usagePricing,
      consumptionVariableCosts: a.usagePricing.consumptionVariableCosts.map((v) => ({ ...v })),
    },
  };
}

const USAGE_SCENARIOS: UsageScenario[] = [
  {
    key: 'usage-base',
    label: 'Base case',
    description: 'Your usage inputs as entered.',
    apply: (a) => a,
  },
  {
    key: 'top-whale-leaves',
    label: 'Top customer leaves',
    description: 'Your biggest whale churns. Revenue collapses by the top-1% share of the decile curve.',
    apply: (a) => {
      const ue = calcUsageEconomics(a);
      // top 1% ≈ ~40% of top decile for power-law, ~20% for moderate, ~10% for flat
      const factor = a.usagePricing.distributionShape === 'power-law' ? 0.4 : a.usagePricing.distributionShape === 'moderate' ? 0.2 : 0.1;
      const top1Share = (ue.top10PctShare / 100) * factor;
      const next = deepCopyAnalysis(a);
      next.usagePricing.averageUnitsPerCustomer = Math.max(
        0,
        next.usagePricing.averageUnitsPerCustomer * (1 - top1Share)
      );
      return next;
    },
  },
  {
    key: 'top-decile-churns',
    label: 'Top 10% churn',
    description: 'Whole top decile of customers leaves. Revenue falls by top-10% share.',
    apply: (a) => {
      const ue = calcUsageEconomics(a);
      const shareLost = ue.top10PctShare / 100;
      const next = deepCopyAnalysis(a);
      next.usagePricing.averageUnitsPerCustomer = Math.max(
        0,
        next.usagePricing.averageUnitsPerCustomer * (1 - shareLost)
      );
      // Also shrink paying customer count by ~10%
      next.unitsPerMonth = Math.max(0, next.unitsPerMonth * 0.9);
      return next;
    },
  },
  {
    key: 'supplier-shock',
    label: 'Supplier shock +40%',
    description: 'Third-party supplier raises prices 40%. Only flagged 3rd-party costs move.',
    apply: (a) => {
      const next = deepCopyAnalysis(a);
      next.usagePricing.consumptionVariableCosts = next.usagePricing.consumptionVariableCosts.map((c) =>
        c.isThirdParty ? { ...c, amount: c.amount * 1.4 } : c
      );
      return next;
    },
  },
  {
    key: 'free-tier-abuse',
    label: 'Conversion halved',
    description: 'Free-tier converts at half the current rate. True CAC explodes.',
    apply: (a) => {
      const next = deepCopyAnalysis(a);
      next.usagePricing.conversionRatePct = Math.max(0.1, next.usagePricing.conversionRatePct / 2);
      return next;
    },
  },
  {
    key: 'nrr-flips',
    label: 'NRR flips to 85%',
    description: 'Expansion stalls and contraction kicks in. LTV compresses.',
    apply: (a) => {
      const next = deepCopyAnalysis(a);
      next.usagePricing.nrrPct = 85;
      return next;
    },
  },
];

const SCENARIOS: Scenario[] = [
  {
    key: 'base',
    label: 'Base case',
    description: 'Your inputs as entered.',
    variances: { revenuePct: 0, volumePct: 0, variablePct: 0, fixedPct: 0 },
  },
  {
    key: 'skeptic',
    label: 'Skeptical investor',
    description: 'Revenue -40%, costs +30%. The gold standard test.',
    variances: { revenuePct: -40, volumePct: 0, variablePct: 30, fixedPct: 30 },
  },
  {
    key: 'slow',
    label: 'Slow month',
    description: 'Volume -50% for a single month.',
    variances: { revenuePct: 0, volumePct: -50, variablePct: 0, fixedPct: 0 },
  },
  {
    key: 'twoBad',
    label: 'Two bad months',
    description: 'Two consecutive months at half volume.',
    variances: { revenuePct: 0, volumePct: -50, variablePct: 0, fixedPct: 0 },
  },
  {
    key: 'bestGone',
    label: 'Best customer leaves',
    description: '20% of revenue disappears permanently.',
    variances: { revenuePct: -20, volumePct: 0, variablePct: 0, fixedPct: 0 },
  },
  {
    key: 'recession',
    label: 'Recession',
    description: 'Revenue -30%, volume -25%.',
    variances: { revenuePct: -30, volumePct: -25, variablePct: 0, fixedPct: 0 },
  },
  {
    key: 'priceWar',
    label: 'Price war',
    description: 'Match a competitor price drop: price -20%.',
    variances: { revenuePct: -20, volumePct: 0, variablePct: 0, fixedPct: 0 },
  },
  {
    key: 'costShock',
    label: 'Cost shock',
    description: 'Key input cost jumps 40%.',
    variances: { revenuePct: 0, volumePct: 0, variablePct: 40, fixedPct: 40 },
  },
];

export function StressTest({ analysis }: { analysis: BusinessAnalysis }) {
  const [v, setV] = useState<Variances>(zeroVariances);
  const [monthsMultiplier, setMonthsMultiplier] = useState(1);
  const usageMode = isUsageMode(analysis);

  const base = useMemo(() => calcUnitEconomics(analysis), [analysis]);
  const stressed = useMemo(() => calcUnitEconomics(analysis, v), [analysis, v]);

  const applyScenario = (s: Scenario) => {
    setV(s.variances);
    setMonthsMultiplier(s.key === 'twoBad' ? 2 : 1);
  };

  const verdict = (profit: number, runway: number) => {
    if (profit >= 0) return { kind: 'healthy' as const, label: 'Business survives' };
    if (runway >= 6) return { kind: 'caution' as const, label: 'Survives short-term' };
    return { kind: 'danger' as const, label: 'Business dies' };
  };

  const cumulativeLoss = stressed.monthlyProfit < 0 ? stressed.monthlyProfit * monthsMultiplier : 0;
  const runwayAfter =
    stressed.monthlyProfit >= 0
      ? Infinity
      : (analysis.cashReserve + cumulativeLoss) / -stressed.monthlyProfit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stress Test</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Try to kill your business on paper before you risk real money.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-200">
        <strong>Margin of safety rule.</strong> A good business survives the skeptical investor
        test. If it dies when you cut revenue 40% and raise costs 30%, it is too fragile.
        Revise the model or pick a different business.
      </div>

      <Card title="Scenarios">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => applyScenario(s)}
              className="text-left rounded-md border border-slate-200 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <div className="font-medium text-sm">{s.label}</div>
              <div className="text-xs text-slate-500 mt-1">{s.description}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Sliders">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Slider
            label="Revenue per unit"
            min={-50}
            max={50}
            value={v.revenuePct}
            onChange={(n) => setV({ ...v, revenuePct: n })}
          />
          <Slider
            label="Unit volume"
            min={-70}
            max={50}
            value={v.volumePct}
            onChange={(n) => setV({ ...v, volumePct: n })}
          />
          <Slider
            label="Variable cost"
            min={-20}
            max={50}
            value={v.variablePct}
            onChange={(n) => setV({ ...v, variablePct: n })}
          />
          <Slider
            label="Fixed cost"
            min={-20}
            max={100}
            value={v.fixedPct}
            onChange={(n) => setV({ ...v, fixedPct: n })}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => setV(zeroVariances)}>
            Reset to base
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Metric
            label="Contribution margin"
            value={formatGBP(stressed.contributionPerUnit)}
            sub={formatPct(stressed.contributionMarginPct)}
            health={healthContribution(stressed.contributionMarginPct)}
            large
          />
        </Card>
        <Card>
          <Metric
            label="Breakeven"
            value={`${formatNum(stressed.breakevenUnits, 1)} / mo`}
            health={isFinite(stressed.breakevenUnits) ? 'healthy' : 'danger'}
            large
          />
        </Card>
        <Card>
          <Metric
            label="Monthly profit"
            value={formatGBP(stressed.monthlyProfit)}
            sub={`Base: ${formatGBP(base.monthlyProfit)}`}
            health={healthProfit(stressed.monthlyProfit)}
            large
          />
        </Card>
        <Card>
          <Metric
            label={`Runway${monthsMultiplier > 1 ? ` (after ${monthsMultiplier} bad mo)` : ''}`}
            value={
              stressed.monthlyProfit >= 0
                ? 'Profitable'
                : isFinite(runwayAfter)
                ? `${runwayAfter.toFixed(1)} mo`
                : '—'
            }
            sub={`Reserve ${formatGBP(analysis.cashReserve)}`}
            health={
              stressed.monthlyProfit >= 0
                ? 'healthy'
                : runwayAfter >= 6
                ? 'caution'
                : 'danger'
            }
            large
          />
        </Card>
      </div>

      <Card title="Verdict under current scenario">
        {(() => {
          const vr = verdict(stressed.monthlyProfit, runwayAfter);
          return (
            <div className="flex items-center gap-3">
              <HealthBadge health={vr.kind} label={vr.label} />
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Monthly profit: {formatGBP(stressed.monthlyProfit)}. Runway:{' '}
                {stressed.monthlyProfit >= 0
                  ? 'profitable'
                  : isFinite(runwayAfter)
                  ? `${runwayAfter.toFixed(1)} months`
                  : '—'}
                .
              </div>
            </div>
          );
        })()}
      </Card>

      {usageMode && <UsageSurvivalMatrix analysis={analysis} />}

      <Card title="Survival matrix (flat pricing)">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left py-2 pr-4">Scenario</th>
                <th className="text-right py-2 pr-4">Contribution</th>
                <th className="text-right py-2 pr-4">Breakeven</th>
                <th className="text-right py-2 pr-4">Monthly profit</th>
                <th className="text-right py-2 pr-4">Runway</th>
                <th className="text-left py-2">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {SCENARIOS.map((s) => {
                const r = calcUnitEconomics(analysis, s.variances);
                const months = s.key === 'twoBad' ? 2 : 1;
                const loss = r.monthlyProfit < 0 ? r.monthlyProfit * months : 0;
                const runway =
                  r.monthlyProfit >= 0
                    ? Infinity
                    : (analysis.cashReserve + loss) / -r.monthlyProfit;
                const vr = verdict(r.monthlyProfit, runway);
                const health = healthContribution(r.contributionMarginPct);
                return (
                  <tr key={s.key} className="align-middle">
                    <td className="py-2 pr-4">
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs text-slate-500">{s.description}</div>
                    </td>
                    <td
                      className={`py-2 pr-4 text-right font-mono ${
                        health === 'healthy'
                          ? 'text-healthy'
                          : health === 'caution'
                          ? 'text-caution'
                          : 'text-danger'
                      }`}
                    >
                      {formatPct(r.contributionMarginPct)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {formatNum(r.breakevenUnits, 1)}
                    </td>
                    <td
                      className={`py-2 pr-4 text-right font-mono ${
                        r.monthlyProfit >= 0 ? 'text-healthy' : 'text-danger'
                      }`}
                    >
                      {formatGBP(r.monthlyProfit)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {r.monthlyProfit >= 0
                        ? '∞'
                        : isFinite(runway)
                        ? runway.toFixed(1) + ' mo'
                        : '—'}
                    </td>
                    <td className="py-2">
                      <HealthBadge health={vr.kind} label={vr.label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function UsageSurvivalMatrix({ analysis }: { analysis: BusinessAnalysis }) {
  return (
    <Card title="Usage-mode survival matrix">
      <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Usage-specific failure modes: whale churn, supplier shocks, free-tier abuse, NRR collapse. Verdict uses LTV:True-CAC ≥ 1.5 as minimum viability.
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="text-left py-2 pr-4">Scenario</th>
              <th className="text-right py-2 pr-4">Monthly profit</th>
              <th className="text-right py-2 pr-4">True CAC</th>
              <th className="text-right py-2 pr-4">LTV</th>
              <th className="text-right py-2 pr-4">LTV:CAC</th>
              <th className="text-left py-2">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {USAGE_SCENARIOS.map((s) => {
              const modified = s.apply(analysis);
              const ue = calcUsageEconomics(modified);
              const survives =
                ue.monthlyProfit >= 0 && isFinite(ue.ltvToCacRatio) && ue.ltvToCacRatio >= 1.5;
              const fragile =
                ue.monthlyProfit >= 0 || (isFinite(ue.ltvToCacRatio) && ue.ltvToCacRatio >= 1);
              const kind: 'healthy' | 'caution' | 'danger' = survives
                ? 'healthy'
                : fragile
                ? 'caution'
                : 'danger';
              const label = survives ? 'Survives' : fragile ? 'Fragile' : 'Breaks';
              const ratio = isFinite(ue.ltvToCacRatio)
                ? `${ue.ltvToCacRatio.toFixed(1)}×`
                : '∞';
              return (
                <tr key={s.key} className="align-middle">
                  <td className="py-2 pr-4">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-slate-500">{s.description}</div>
                  </td>
                  <td
                    className={`py-2 pr-4 text-right font-mono ${
                      ue.monthlyProfit >= 0 ? 'text-healthy' : 'text-danger'
                    }`}
                  >
                    {formatGBP(ue.monthlyProfit)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">{formatGBP(ue.trueCAC)}</td>
                  <td className="py-2 pr-4 text-right font-mono">{formatGBP(ue.ltv)}</td>
                  <td
                    className={`py-2 pr-4 text-right font-mono ${
                      isFinite(ue.ltvToCacRatio) && ue.ltvToCacRatio >= 3
                        ? 'text-healthy'
                        : isFinite(ue.ltvToCacRatio) && ue.ltvToCacRatio >= 1.5
                        ? 'text-caution'
                        : 'text-danger'
                    }`}
                  >
                    {ratio}
                  </td>
                  <td className="py-2">
                    <HealthBadge health={kind} label={label} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium">{label}</div>
        <div
          className={`font-mono text-sm ${
            value < 0 ? 'text-danger' : value > 0 ? 'text-healthy' : 'text-slate-500'
          }`}
        >
          {value > 0 ? '+' : ''}
          {value}%
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{min}%</span>
        <span>0%</span>
        <span>+{max}%</span>
      </div>
    </div>
  );
}
