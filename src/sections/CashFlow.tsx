import { useMemo } from 'react';
import type { BusinessAnalysis } from '../types';
import {
  calcUnitEconomics,
  calcUsageEconomics,
  formatGBP,
  formatNum,
  formatPct,
  healthProfit,
  isUsageMode,
  type Health,
} from '../calculations';
import { Card, HealthBadge, Metric } from '../components/ui';

interface FlowModel {
  modeLabel: string;
  unitLabel: string;
  customerLabel: string;
  revenue: number;
  variableCosts: number;
  contribution: number;
  fixedCosts: number;
  profit: number;
  unitRevenue: number;
  unitVariableCost: number;
  unitContribution: number;
  unitMarginPct: number;
  customerRevenue?: number;
  customerVariableCost?: number;
  customerContribution?: number;
  revenueFormula: string;
  variableFormula: string;
  contributionFormula: string;
  fixedFormula: string;
  profitFormula: string;
}

export function CashFlow({ analysis }: { analysis: BusinessAnalysis }) {
  const model = useMemo(() => buildFlowModel(analysis), [analysis]);
  const profitHealth = healthProfit(model.profit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold">Cash Flow</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
            A one-month simulation of how money moves through this business. Revenue comes in,
            variable costs leave with each unit, contribution pays the fixed costs, and whatever
            remains is operating profit or loss.
          </p>
        </div>
        <div className="self-start shrink-0">
          <HealthBadge health={profitHealth} label={model.profit >= 0 ? 'Cash positive' : 'Cash leaking'} />
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Customer revenue" value={formatGBP(model.revenue)} />
          <Metric
            label="Variable costs"
            value={formatGBP(model.variableCosts)}
            health={model.variableCosts > model.revenue ? 'danger' : undefined}
          />
          <Metric
            label="Contribution"
            value={formatGBP(model.contribution)}
            health={model.contribution > 0 ? 'healthy' : 'danger'}
          />
          <Metric
            label={model.profit >= 0 ? 'Monthly profit' : 'Monthly loss'}
            value={formatGBP(model.profit)}
            health={profitHealth}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Card title="Monthly money flow" className="min-w-0 overflow-hidden">
          <MoneyFlowDiagram model={model} />
        </Card>

        <div className="space-y-6 min-w-0">
          <Card title="How to read it">
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                This is not a new calculation. It is the Analyzer math shown as a flow, so you can
                see which part of the business is doing the work.
              </p>
              <p>
                If contribution is healthy but profit is weak, fixed costs are too heavy for the
                current volume. If contribution is weak, the business is broken at the unit level
                before fixed costs even matter.
              </p>
            </div>
          </Card>

          <Card title="Formula trail">
            <div className="space-y-3 text-sm">
              <FormulaRow label="Revenue" value={model.revenueFormula} />
              <FormulaRow label="Variable costs" value={model.variableFormula} />
              <FormulaRow label="Contribution" value={model.contributionFormula} />
              <FormulaRow label="Fixed costs" value={model.fixedFormula} />
              <FormulaRow label="Profit / loss" value={model.profitFormula} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={`${capitalize(model.unitLabel)} economics`}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MiniNumber label="Revenue in" value={formatGBP(model.unitRevenue)} tone="blue" />
              <MiniNumber label="Costs out" value={formatGBP(model.unitVariableCost)} tone="red" />
              <MiniNumber label="Margin left" value={formatGBP(model.unitContribution)} tone={model.unitContribution >= 0 ? 'green' : 'red'} />
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-300">
              Per {model.unitLabel}, the business keeps{' '}
              <span className={model.unitContribution >= 0 ? 'font-semibold text-healthy' : 'font-semibold text-danger'}>
                {formatGBP(model.unitContribution)}
              </span>{' '}
              after variable costs. That is a {formatPct(model.unitMarginPct)} margin.
            </div>
          </div>
        </Card>

        <Card title={model.customerLabel}>
          {model.customerRevenue == null ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              In flat pricing, the customer-month view is the same as the unit view unless your unit
              definition is a customer or subscription month.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MiniNumber label="Revenue/customer" value={formatGBP(model.customerRevenue)} tone="blue" />
                <MiniNumber label="Cost/customer" value={formatGBP(model.customerVariableCost ?? 0)} tone="red" />
                <MiniNumber
                  label="Contribution/customer"
                  value={formatGBP(model.customerContribution ?? 0)}
                  tone={(model.customerContribution ?? 0) >= 0 ? 'green' : 'red'}
                />
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-300">
                This uses the current average usage per paying customer. For usage businesses, this
                is where “more customers” and “more usage per customer” meet.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function buildFlowModel(analysis: BusinessAnalysis): FlowModel {
  if (isUsageMode(analysis)) {
    const u = calcUsageEconomics(analysis);
    const label = analysis.usagePricing.consumptionUnitLabel || 'consumption unit';
    const averageUnits = analysis.usagePricing.averageUnitsPerCustomer || 0;
    const customerCount = u.payingCustomers;
    const unitContribution = u.contributionPerConsumptionUnit;

    return {
      modeLabel: 'Usage pricing',
      unitLabel: label,
      customerLabel: 'Average paying customer / month',
      revenue: u.monthlyRevenue,
      variableCosts: u.monthlyVariableCosts,
      contribution: u.monthlyRevenue - u.monthlyVariableCosts,
      fixedCosts: u.monthlyFixedCosts,
      profit: u.monthlyProfit,
      unitRevenue: u.pricePerConsumptionUnit,
      unitVariableCost: u.variableCostPerConsumptionUnit,
      unitContribution,
      unitMarginPct: u.consumptionMarginPct,
      customerRevenue: u.avgRevenuePerCustomer,
      customerVariableCost: u.avgVariableCostPerCustomer,
      customerContribution: u.avgContributionPerCustomer,
      revenueFormula:
        u.baseFee > 0
          ? `${formatNum(customerCount, 0)} customers × (${formatNum(averageUnits, 1)} ${label} × ` +
            `${formatGBP(u.pricePerConsumptionUnit)} + ${formatGBP(u.baseFee)} base fee)`
          : `${formatNum(customerCount, 0)} customers × ${formatNum(averageUnits, 1)} ${label}/customer × ` +
            `${formatGBP(u.pricePerConsumptionUnit)}`,
      variableFormula:
        `${formatNum(customerCount, 0)} customers × ${formatNum(averageUnits, 1)} ${label}/customer × ` +
        `${formatGBP(u.variableCostPerConsumptionUnit)}`,
      contributionFormula: `${formatGBP(u.monthlyRevenue)} - ${formatGBP(u.monthlyVariableCosts)}`,
      fixedFormula: `Sum of ${analysis.fixedCosts.length} monthly fixed cost line items`,
      profitFormula:
        `${formatGBP(u.monthlyRevenue)} - ${formatGBP(u.monthlyVariableCosts)} - ${formatGBP(u.monthlyFixedCosts)}`,
    };
  }

  const e = calcUnitEconomics(analysis);
  const unit = analysis.unitDefinition || 'unit';

  return {
    modeLabel: 'Flat pricing',
    unitLabel: unit,
    customerLabel: 'Customer / month',
    revenue: e.revenue,
    variableCosts: e.totalVariableCosts,
    contribution: e.revenue - e.totalVariableCosts,
    fixedCosts: e.totalFixedCosts,
    profit: e.monthlyProfit,
    unitRevenue: e.pricePerUnit,
    unitVariableCost: e.variableCostPerUnit,
    unitContribution: e.contributionPerUnit,
    unitMarginPct: e.contributionMarginPct,
    revenueFormula: `${formatNum(e.unitsPerMonth, 0)} ${unit}s × ${formatGBP(e.pricePerUnit)}`,
    variableFormula: `${formatNum(e.unitsPerMonth, 0)} ${unit}s × ${formatGBP(e.variableCostPerUnit)}`,
    contributionFormula: `${formatGBP(e.revenue)} - ${formatGBP(e.totalVariableCosts)}`,
    fixedFormula: `Sum of ${analysis.fixedCosts.length} monthly fixed cost line items`,
    profitFormula:
      `${formatGBP(e.revenue)} - ${formatGBP(e.totalVariableCosts)} - ${formatGBP(e.totalFixedCosts)}`,
  };
}

function MoneyFlowDiagram({ model }: { model: FlowModel }) {
  const max = Math.max(1, model.revenue, model.variableCosts, model.contribution, model.fixedCosts, Math.abs(model.profit));
  const varPct = widthPct(model.variableCosts, max);
  const contributionPct = widthPct(model.contribution, max);
  const fixedPct = widthPct(model.fixedCosts, max);
  const profitPct = widthPct(Math.abs(model.profit), max);

  return (
    <div className="space-y-5">
      <FlowMotionStyles />
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1">{model.modeLabel}</span>
        <span>One month, using current Analyzer inputs</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_0.8fr_minmax(0,1fr)_0.8fr_minmax(0,1fr)] gap-2 sm:gap-3 lg:items-center">
        <FlowNode
          title="Customer revenue"
          amount={model.revenue}
          sub={model.revenueFormula}
          tone="blue"
          width={100}
        />
        <FlowArrow label="variable costs leave" />
        <FlowNode
          title="Variable costs"
          amount={model.variableCosts}
          sub={model.variableFormula}
          tone="red"
          width={varPct}
        />
        <FlowArrow label="what remains" />
        <FlowNode
          title="Contribution"
          amount={model.contribution}
          sub={model.contributionFormula}
          tone={model.contribution >= 0 ? 'green' : 'red'}
          width={contributionPct}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_0.8fr_minmax(0,1fr)_0.8fr_minmax(0,1fr)] gap-2 sm:gap-3 lg:items-center">
        <div className="hidden lg:block" />
        <div className="hidden lg:block" />
        <FlowNode
          title="Fixed costs"
          amount={model.fixedCosts}
          sub={model.fixedFormula}
          tone="amber"
          width={fixedPct}
        />
        <FlowArrow label="after fixed costs" />
        <FlowNode
          title={model.profit >= 0 ? 'Operating profit' : 'Operating loss'}
          amount={model.profit}
          sub={model.profitFormula}
          tone={model.profit >= 0 ? 'green' : 'red'}
          width={profitPct}
        />
      </div>
    </div>
  );
}

function FlowNode({
  title,
  amount,
  sub,
  tone,
  width,
}: {
  title: string;
  amount: number;
  sub: string;
  tone: Tone;
  width: number;
}) {
  const styles = toneStyles(tone);
  return (
    <div className={`min-w-0 rounded-xl border p-3 sm:p-4 ${styles.box}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </div>
          <div className={`mt-1 break-words text-xl sm:text-2xl font-semibold tabular-nums ${styles.text}`}>
            {formatGBP(amount)}
          </div>
        </div>
        <span className={`h-3 w-3 rounded-full mt-1 ${styles.dot}`} />
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/70 dark:bg-slate-950/50 overflow-hidden">
        <div
          className={`cash-flow-bar relative h-full overflow-hidden rounded-full ${styles.bar}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-3 break-words rounded-md bg-white/60 dark:bg-slate-950/40 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        {sub}
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 lg:flex-col lg:gap-2">
      <div className="hidden lg:block w-full min-w-20">
        <svg viewBox="0 0 160 34" className="cash-flow-arrow h-9 w-full" aria-hidden="true">
          <defs>
            <marker
              id={`arrow-${slug(label)}`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L8,4 L0,8 Z" className="fill-slate-400 dark:fill-slate-500" />
            </marker>
          </defs>
          <path
            d="M8 17 H150"
            className="cash-flow-path stroke-slate-300 dark:stroke-slate-700"
            markerEnd={`url(#arrow-${slug(label)})`}
          />
          <circle className="cash-flow-pulse fill-indigo-500" r="3" cy="17" />
          <circle className="cash-flow-pulse cash-flow-pulse-delay fill-indigo-400" r="2.5" cy="17" />
        </svg>
      </div>
      <div className="relative flex h-16 w-full items-center justify-center lg:hidden">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-300 dark:bg-slate-700" />
        <div className="cash-flow-mobile-dot absolute left-1/2 top-1 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-500" />
        <div
          className="absolute bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-slate-400 dark:border-t-slate-500"
          aria-hidden="true"
        />
        <span className="relative z-10 max-w-[82%] rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-center shadow-sm">
          {label}
        </span>
      </div>
      <span className="hidden max-w-full rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-center shadow-sm lg:inline-block">
        {label}
      </span>
    </div>
  );
}

function FlowMotionStyles() {
  return (
    <style>
      {`
        .cash-flow-path {
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-dasharray: 7 7;
          animation: cash-flow-dash 1.25s linear infinite;
        }

        .cash-flow-pulse {
          animation: cash-flow-pulse 2.1s ease-in-out infinite;
        }

        .cash-flow-pulse-delay {
          animation-delay: 0.85s;
        }

        .cash-flow-mobile-dot {
          animation: cash-flow-mobile-dot 1.8s ease-in-out infinite;
        }

        .cash-flow-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 42%;
          transform: translateX(-120%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent);
          animation: cash-flow-sheen 2.6s ease-in-out infinite;
        }

        @keyframes cash-flow-dash {
          to { stroke-dashoffset: -14; }
        }

        @keyframes cash-flow-pulse {
          0% { transform: translateX(10px); opacity: 0; }
          15% { opacity: 1; }
          82% { opacity: 1; }
          100% { transform: translateX(140px); opacity: 0; }
        }

        @keyframes cash-flow-sheen {
          0%, 35% { transform: translateX(-120%); }
          75%, 100% { transform: translateX(260%); }
        }

        @keyframes cash-flow-mobile-dot {
          0% { transform: translate(-50%, 0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(-50%, 46px); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cash-flow-path,
          .cash-flow-pulse,
          .cash-flow-mobile-dot,
          .cash-flow-bar::after {
            animation: none;
          }
        }
      `}
    </style>
  );
}

function FormulaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}

type Tone = 'blue' | 'red' | 'green' | 'amber';

function MiniNumber({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const styles = toneStyles(tone);
  return (
    <div className={`min-w-0 rounded-lg border p-3 ${styles.box}`}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={`mt-1 break-words text-base sm:text-lg font-semibold tabular-nums ${styles.text}`}>{value}</div>
    </div>
  );
}

function widthPct(value: number, max: number) {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.max(8, Math.min(100, (Math.abs(value) / max) * 100));
}

function capitalize(s: string) {
  if (!s) return 'Unit';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function toneStyles(tone: Tone): {
  box: string;
  text: string;
  dot: string;
  bar: string;
} {
  if (tone === 'blue') {
    return {
      box: 'border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
      bar: 'bg-blue-500',
    };
  }
  if (tone === 'red') {
    return {
      box: 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500',
      bar: 'bg-red-500',
    };
  }
  if (tone === 'green') {
    return {
      box: 'border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-300',
      dot: 'bg-green-500',
      bar: 'bg-green-500',
    };
  }
  return {
    box: 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  };
}
