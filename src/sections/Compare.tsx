import { useMemo, useState } from 'react';
import type { BusinessAnalysis } from '../types';
import {
  calcUnitEconomics,
  formatGBP,
  formatNum,
  formatPct,
  healthContribution,
  healthProfit,
  healthSafety,
  type Health,
} from '../calculations';
import { Card, inputClass } from '../components/ui';

export function Compare({ analyses }: { analyses: BusinessAnalysis[] }) {
  const [leftId, setLeftId] = useState(analyses[0]?.id ?? '');
  const [rightId, setRightId] = useState(analyses[1]?.id ?? analyses[0]?.id ?? '');

  const left = analyses.find((a) => a.id === leftId) || null;
  const right = analyses.find((a) => a.id === rightId) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compare</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Put two saved analyses side by side. Let the numbers decide.
        </p>
      </div>

      {analyses.length < 2 && (
        <Card>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Save at least two analyses to use compare mode.
          </div>
        </Card>
      )}

      {analyses.length >= 2 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Business A">
            <select
              className={inputClass}
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
            >
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <AnalysisLabels analyses={analyses} id={leftId} />
          </Card>
          <Card title="Business B">
            <select
              className={inputClass}
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
            >
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <AnalysisLabels analyses={analyses} id={rightId} />
          </Card>
        </div>
      )}

      {left && right && <ComparisonTable left={left} right={right} />}
    </div>
  );
}

function AnalysisLabels({
  analyses,
  id,
}: {
  analyses: BusinessAnalysis[];
  id: string;
}) {
  const a = analyses.find((x) => x.id === id);
  if (!a) return null;
  return (
    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
      <div className="font-medium text-slate-800 dark:text-slate-200">{a.name}</div>
      <div>{a.industry} · {a.pricingModel}</div>
    </div>
  );
}

function ComparisonTable({
  left,
  right,
}: {
  left: BusinessAnalysis;
  right: BusinessAnalysis;
}) {
  const l = useMemo(() => calcUnitEconomics(left), [left]);
  const r = useMemo(() => calcUnitEconomics(right), [right]);

  const rows: {
    label: string;
    lv: string;
    rv: string;
    lh?: Health;
    rh?: Health;
  }[] = [
    {
      label: 'Price per unit',
      lv: formatGBP(l.pricePerUnit),
      rv: formatGBP(r.pricePerUnit),
    },
    {
      label: 'Contribution margin',
      lv: `${formatGBP(l.contributionPerUnit)} (${formatPct(l.contributionMarginPct)})`,
      rv: `${formatGBP(r.contributionPerUnit)} (${formatPct(r.contributionMarginPct)})`,
      lh: healthContribution(l.contributionMarginPct),
      rh: healthContribution(r.contributionMarginPct),
    },
    {
      label: 'Gross margin',
      lv: formatPct(l.grossMarginPct),
      rv: formatPct(r.grossMarginPct),
    },
    {
      label: 'Breakeven / month',
      lv: formatNum(l.breakevenUnits, 1),
      rv: formatNum(r.breakevenUnits, 1),
    },
    {
      label: 'Monthly profit',
      lv: formatGBP(l.monthlyProfit),
      rv: formatGBP(r.monthlyProfit),
      lh: healthProfit(l.monthlyProfit),
      rh: healthProfit(r.monthlyProfit),
    },
    {
      label: 'Safety margin',
      lv: formatPct(l.safetyMarginPct),
      rv: formatPct(r.safetyMarginPct),
      lh: healthSafety(l.safetyMarginPct),
      rh: healthSafety(r.safetyMarginPct),
    },
    {
      label: 'Setup cost',
      lv: formatGBP(l.setupCost),
      rv: formatGBP(r.setupCost),
    },
    {
      label: 'Cash reserve',
      lv: formatGBP(l.cashReserve),
      rv: formatGBP(r.cashReserve),
    },
    {
      label: 'Moats selected',
      lv: left.scorecard.q2Moats.join(', ') || '—',
      rv: right.scorecard.q2Moats.join(', ') || '—',
    },
    {
      label: 'Pricing power',
      lv: `${left.scorecard.q3MakerTaker || '—'} / raise 10%: ${left.scorecard.q3RaisePrice || '—'}`,
      rv: `${right.scorecard.q3MakerTaker || '—'} / raise 10%: ${right.scorecard.q3RaisePrice || '—'}`,
    },
  ];

  return (
    <Card title="Side-by-side">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <th className="text-left py-2"></th>
            <th className="text-left py-2">{left.name}</th>
            <th className="text-left py-2">{right.name}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="py-2 pr-4 text-slate-500">{row.label}</td>
              <td className={`py-2 pr-4 font-mono ${color(row.lh)}`}>{row.lv}</td>
              <td className={`py-2 pr-4 font-mono ${color(row.rh)}`}>{row.rv}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function color(h?: Health): string {
  if (!h) return '';
  return h === 'healthy' ? 'text-healthy' : h === 'caution' ? 'text-caution' : 'text-danger';
}
