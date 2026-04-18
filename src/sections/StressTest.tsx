import { useMemo, useState } from 'react';
import type { BusinessAnalysis } from '../types';
import {
  calcUnitEconomics,
  formatGBP,
  formatNum,
  formatPct,
  healthContribution,
  healthProfit,
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
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-2">
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
        <div className="grid md:grid-cols-2 gap-6">
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

      <div className="grid md:grid-cols-4 gap-4">
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

      <Card title="Survival matrix">
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
