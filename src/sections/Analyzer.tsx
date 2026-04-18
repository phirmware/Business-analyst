import { useEffect, useMemo, useRef } from 'react';
import type { BusinessAnalysis, CostType, FixedItem, LineItem, PricingMode } from '../types';
import {
  calcUnitEconomics,
  formatGBP,
  formatNum,
  formatPct,
  healthContribution,
  healthProfit,
  healthSafety,
  isUsageMode,
} from '../calculations';
import { INDUSTRIES, PRICING_MODE_OPTIONS, PRICING_MODELS, TOOLTIPS } from '../constants';
import { UsagePricingHealth, UsagePricingInputs } from './UsagePricing';
import { uid } from '../storage';
import { exportAnalysisMarkdown, downloadPdf } from '../export';
import {
  Button,
  Card,
  Field,
  HealthBadge,
  Metric,
  NumberInput,
  Select,
  TextInput,
  Tooltip,
  inputClass,
} from '../components/ui';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceDot,
  Area,
  ComposedChart,
  BarChart,
  Bar,
} from 'recharts';

export function Analyzer({
  analysis,
  onChange,
  autoFocusName = false,
}: {
  analysis: BusinessAnalysis;
  onChange: (patch: Partial<BusinessAnalysis> | ((a: BusinessAnalysis) => BusinessAnalysis)) => void;
  autoFocusName?: boolean;
}) {
  const ue = useMemo(() => calcUnitEconomics(analysis), [analysis]);
  const usageMode = isUsageMode(analysis);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocusName && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [autoFocusName, analysis.id]);

  const addVariable = () =>
    onChange((a) => ({
      ...a,
      variableCosts: [
        ...a.variableCosts,
        { id: uid(), name: 'New cost', amount: 0, type: 'fixed' },
      ],
    }));
  const updateVariable = (id: string, patch: Partial<LineItem>) =>
    onChange((a) => ({
      ...a,
      variableCosts: a.variableCosts.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  const removeVariable = (id: string) =>
    onChange((a) => ({
      ...a,
      variableCosts: a.variableCosts.filter((v) => v.id !== id),
    }));

  const addFixed = () =>
    onChange((a) => ({
      ...a,
      fixedCosts: [...a.fixedCosts, { id: uid(), name: 'New cost', amount: 0 }],
    }));
  const updateFixed = (id: string, patch: Partial<FixedItem>) =>
    onChange((a) => ({
      ...a,
      fixedCosts: a.fixedCosts.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  const removeFixed = (id: string) =>
    onChange((a) => ({
      ...a,
      fixedCosts: a.fixedCosts.filter((f) => f.id !== id),
    }));

  return (
    <div className="space-y-6">
      {/* Header with prominent business name */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Business name
          </label>
          <input
            ref={nameRef}
            value={analysis.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Name this analysis…"
            className="mt-1 w-full bg-transparent text-2xl font-semibold border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 dark:hover:border-slate-600 focus:outline-none px-0 py-1 transition"
          />
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter your numbers. Everything updates live — saved automatically.
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => exportAnalysisMarkdown(analysis)}>
            Export MD
          </Button>
          <Button variant="secondary" onClick={() => downloadPdf()}>Export PDF</Button>
        </div>
      </div>

      {/* Context */}
      <Card title="Business context">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="One-line description">
            <TextInput
              value={analysis.description}
              onChange={(v) => onChange({ description: v })}
              placeholder="What you sell, to whom"
            />
          </Field>
          <Field label="Industry">
            <Select
              value={analysis.industry}
              onChange={(v) => onChange({ industry: v })}
              options={INDUSTRIES}
            />
          </Field>
          <Field label="Pricing model">
            <Select
              value={analysis.pricingModel}
              onChange={(v) => onChange({ pricingModel: v })}
              options={PRICING_MODELS}
            />
          </Field>
        </div>
      </Card>

      {/* Pricing mode selector */}
      <Card title="How do you charge?">
        <div className="mb-3 text-xs text-slate-500 dark:text-slate-400 flex items-start">
          <span>
            Flat pricing uses simple per-unit economics. Usage pricing adds whale-and-mouse risk, free-tier drag, and supplier dependency — we model those separately.
          </span>
          <Tooltip text={TOOLTIPS.pricingMode} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {PRICING_MODE_OPTIONS.map((opt) => {
            const selected = analysis.pricingMode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onChange({ pricingMode: opt.key as PricingMode })}
                className={`text-left rounded-md border p-3 transition ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.blurb}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Revenue per unit (flat-pricing) */}
      {!usageMode && (
      <>
      <Card title="Revenue per unit">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Price charged per unit (£)" tooltip={TOOLTIPS.pricePerUnit}>
            <NumberInput
              value={analysis.pricePerUnit}
              onChange={(v) => onChange({ pricePerUnit: v })}
            />
          </Field>
          <Field label='Definition of "unit"' tooltip={TOOLTIPS.unitDefinition}>
            <TextInput
              value={analysis.unitDefinition}
              onChange={(v) => onChange({ unitDefinition: v })}
              placeholder="one booking / one month / one sandwich"
            />
          </Field>
          <Field label="Units sold per month" tooltip={TOOLTIPS.unitsPerMonth}>
            <NumberInput
              value={analysis.unitsPerMonth}
              onChange={(v) => onChange({ unitsPerMonth: v })}
            />
          </Field>
        </div>
      </Card>

      {/* Variable */}
      <Card
        title="Variable costs per unit"
        right={
          <Button variant="secondary" onClick={addVariable}>
            + Add line
          </Button>
        }
      >
        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400 flex items-center">
          Scale with each sale. Use £ for fixed amounts or % for percent-of-revenue.
          <Tooltip text={TOOLTIPS.variableCosts} />
        </div>
        <div className="space-y-2">
          {analysis.variableCosts.map((item) => (
            <LineItemRow
              key={item.id}
              item={item}
              onChange={(patch) => updateVariable(item.id, patch)}
              onRemove={() => removeVariable(item.id)}
            />
          ))}
          {analysis.variableCosts.length === 0 && (
            <div className="text-sm text-slate-500">No variable costs yet.</div>
          )}
        </div>
        <div className="mt-3 text-sm font-medium">
          Total per unit:{' '}
          <span className="font-mono">
            {formatGBP(ue.variableCostPerUnit)}
          </span>
        </div>
      </Card>
      </>
      )}

      {/* Usage-mode inputs */}
      {usageMode && (
        <>
          <Card title="Paying customers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Paying customers / month" tooltip={TOOLTIPS.unitsPerMonth}>
                <NumberInput
                  value={analysis.unitsPerMonth}
                  onChange={(v) => onChange({ unitsPerMonth: v })}
                />
              </Field>
              <Field label='Unit label (for chat context)' tooltip={TOOLTIPS.unitDefinition}>
                <TextInput
                  value={analysis.unitDefinition}
                  onChange={(v) => onChange({ unitDefinition: v })}
                  placeholder="one customer / one account"
                />
              </Field>
            </div>
          </Card>
          <UsagePricingInputs analysis={analysis} onChange={onChange} />
        </>
      )}

      {/* Fixed */}
      <Card
        title="Fixed monthly costs"
        right={
          <Button variant="secondary" onClick={addFixed}>
            + Add line
          </Button>
        }
      >
        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400 flex items-center">
          Paid every month whether or not a customer shows up.
          <Tooltip text={TOOLTIPS.fixedCosts} />
        </div>
        <div className="space-y-2">
          {analysis.fixedCosts.map((item) => (
            <FixedItemRow
              key={item.id}
              item={item}
              onChange={(patch) => updateFixed(item.id, patch)}
              onRemove={() => removeFixed(item.id)}
            />
          ))}
          {analysis.fixedCosts.length === 0 && (
            <div className="text-sm text-slate-500">No fixed costs yet.</div>
          )}
        </div>
        <div className="mt-3 text-sm font-medium">
          Total per month:{' '}
          <span className="font-mono">{formatGBP(ue.totalFixedCosts)}</span>
        </div>
      </Card>

      <Card title="Setup & cash">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Setup cost, one-time (£)" tooltip={TOOLTIPS.setupCost}>
            <NumberInput
              value={analysis.setupCost}
              onChange={(v) => onChange({ setupCost: v })}
            />
          </Field>
          <Field label="Cash reserve (£)" tooltip={TOOLTIPS.cashReserve}>
            <NumberInput
              value={analysis.cashReserve}
              onChange={(v) => onChange({ cashReserve: v })}
            />
          </Field>
        </div>
      </Card>

      {/* Usage mode outputs */}
      {usageMode && <UsagePricingHealth analysis={analysis} />}

      {/* Key metrics — flat mode only */}
      {!usageMode && (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Metric
            label="Contribution margin"
            value={formatGBP(ue.contributionPerUnit)}
            sub={formatPct(ue.contributionMarginPct) + ' of price'}
            health={healthContribution(ue.contributionMarginPct)}
            tooltip={TOOLTIPS.contributionMargin}
            large
          />
        </Card>
        <Card>
          <Metric
            label="Breakeven"
            value={`${formatNum(ue.breakevenUnits, 1)} / mo`}
            sub="Units needed to cover fixed"
            health={isFinite(ue.breakevenUnits) ? 'healthy' : 'danger'}
            tooltip={TOOLTIPS.breakeven}
            large
          />
        </Card>
        <Card>
          <Metric
            label="Monthly profit"
            value={formatGBP(ue.monthlyProfit)}
            sub={`Annual: ${formatGBP(ue.annualProfit)}`}
            health={healthProfit(ue.monthlyProfit)}
            tooltip={TOOLTIPS.monthlyProfit}
            large
          />
        </Card>
        <Card>
          <Metric
            label="Safety margin"
            value={formatPct(ue.safetyMarginPct)}
            sub="Projected volume above breakeven"
            health={healthSafety(ue.safetyMarginPct)}
            tooltip={TOOLTIPS.safetyMargin}
            large
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Metric
            label="Gross margin"
            value={formatPct(ue.grossMarginPct)}
            tooltip={TOOLTIPS.grossMargin}
          />
        </Card>
        <Card>
          <Metric
            label="Time to breakeven (setup)"
            value={isFinite(ue.monthsToBreakeven) ? `${ue.monthsToBreakeven.toFixed(1)} months` : 'Never'}
            sub={`Setup ${formatGBP(ue.setupCost)}`}
            tooltip={TOOLTIPS.monthsToBreakeven}
            health={
              !isFinite(ue.monthsToBreakeven)
                ? 'danger'
                : ue.monthsToBreakeven < 12
                ? 'healthy'
                : ue.monthsToBreakeven < 36
                ? 'caution'
                : 'danger'
            }
          />
        </Card>
        <Card>
          <Metric
            label="Runway"
            value={
              ue.monthlyProfit >= 0
                ? 'Profitable'
                : isFinite(ue.runwayMonths)
                ? `${ue.runwayMonths.toFixed(1)} months`
                : '—'
            }
            sub={`Reserve ${formatGBP(ue.cashReserve)}`}
            tooltip={TOOLTIPS.runway}
            health={
              ue.monthlyProfit >= 0
                ? 'healthy'
                : ue.runwayMonths >= 12
                ? 'healthy'
                : ue.runwayMonths >= 6
                ? 'caution'
                : 'danger'
            }
          />
        </Card>
      </div>

      {/* Unit economics card */}
      <UnitEconomicsCard analysis={analysis} />

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Cost breakdown (monthly)">
          <CostDonut
            variable={ue.totalVariableCosts}
            fixed={ue.totalFixedCosts}
          />
        </Card>
        <Card title="Profit waterfall">
          <ProfitWaterfall
            revenue={ue.revenue}
            variable={ue.totalVariableCosts}
            fixed={ue.totalFixedCosts}
          />
        </Card>
      </div>

      <Card title="Breakeven chart">
        <BreakevenChart
          pricePerUnit={ue.pricePerUnit}
          variableCost={ue.variableCostPerUnit}
          fixedCost={ue.totalFixedCosts}
          projected={ue.unitsPerMonth}
          breakeven={ue.breakevenUnits}
        />
      </Card>
      </>
      )}
    </div>
  );
}

function LineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <input
        className={`${inputClass} col-span-5`}
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <div className="col-span-3">
        <NumberInput value={item.amount} onChange={(v) => onChange({ amount: v })} />
      </div>
      <select
        className={`${inputClass} col-span-3`}
        value={item.type}
        onChange={(e) => onChange({ type: e.target.value as CostType })}
      >
        <option value="fixed">£ per unit</option>
        <option value="percent">% of price</option>
      </select>
      <button
        className="col-span-1 text-slate-400 hover:text-red-500 text-lg"
        onClick={onRemove}
        aria-label="Remove"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

function FixedItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: FixedItem;
  onChange: (patch: Partial<FixedItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <input
        className={`${inputClass} col-span-7`}
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <div className="col-span-4">
        <NumberInput value={item.amount} onChange={(v) => onChange({ amount: v })} />
      </div>
      <button
        className="col-span-1 text-slate-400 hover:text-red-500 text-lg"
        onClick={onRemove}
        aria-label="Remove"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

function UnitEconomicsCard({ analysis }: { analysis: BusinessAnalysis }) {
  const ue = calcUnitEconomics(analysis);
  return (
    <Card title={`Per-unit breakdown (1 × ${analysis.unitDefinition})`}>
      <div className="font-mono text-sm space-y-1">
        <Row label="Revenue in" value={formatGBP(ue.pricePerUnit)} positive />
        {analysis.variableCosts.map((v) => {
          const amount =
            v.type === 'percent' ? (ue.pricePerUnit * v.amount) / 100 : v.amount;
          if (!amount) return null;
          return (
            <Row
              key={v.id}
              label={`  – ${v.name}${v.type === 'percent' ? ` (${v.amount}%)` : ''}`}
              value={`- ${formatGBP(amount)}`}
            />
          );
        })}
        <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
        <Row
          label="Contribution margin"
          value={`${formatGBP(ue.contributionPerUnit)}  (${formatPct(ue.contributionMarginPct)})`}
          bold
          positive={ue.contributionPerUnit >= 0}
        />
      </div>
    </Card>
  );
}

function Row({
  label,
  value,
  bold = false,
  positive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
}) {
  const color =
    positive === undefined
      ? ''
      : positive
      ? 'text-healthy'
      : 'text-danger';
  return (
    <div className={`flex justify-between gap-4 ${bold ? 'font-semibold' : ''} ${color}`}>
      <span className="whitespace-pre">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CostDonut({ variable, fixed }: { variable: number; fixed: number }) {
  const data = [
    { name: 'Variable (monthly)', value: Math.max(0, variable), color: '#6366f1' },
    { name: 'Fixed (monthly)', value: Math.max(0, fixed), color: '#f59e0b' },
  ];
  const total = data[0].value + data[1].value;
  if (total === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-500">
        Add costs to see the breakdown.
      </div>
    );
  }
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <ReTooltip
            formatter={(v: number) => formatGBP(v)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProfitWaterfall({
  revenue,
  variable,
  fixed,
}: {
  revenue: number;
  variable: number;
  fixed: number;
}) {
  const contribution = revenue - variable;
  const profit = contribution - fixed;
  const data = [
    { name: 'Revenue', value: revenue, color: '#16a34a' },
    { name: '– Variable', value: -variable, color: '#6366f1' },
    { name: 'Contribution', value: contribution, color: '#0ea5e9' },
    { name: '– Fixed', value: -fixed, color: '#f59e0b' },
    { name: 'Profit', value: profit, color: profit >= 0 ? '#16a34a' : '#dc2626' },
  ];
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" className="dark:opacity-20" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatGBP(v)} />
          <ReTooltip formatter={(v: number) => formatGBP(v)} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BreakevenChart({
  pricePerUnit,
  variableCost,
  fixedCost,
  projected,
  breakeven,
}: {
  pricePerUnit: number;
  variableCost: number;
  fixedCost: number;
  projected: number;
  breakeven: number;
}) {
  const maxUnit = Math.max(
    breakeven * 2,
    projected * 1.5,
    10,
    isFinite(breakeven) ? breakeven + 10 : 100
  );
  const steps = 20;
  const data = Array.from({ length: steps + 1 }, (_, i) => {
    const u = (i * maxUnit) / steps;
    const revenue = u * pricePerUnit;
    const totalCost = fixedCost + u * variableCost;
    return {
      units: Math.round(u),
      revenue,
      totalCost,
      profit: revenue - totalCost,
    };
  });

  return (
    <div className="h-72">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" className="dark:opacity-20" />
          <XAxis
            dataKey="units"
            tick={{ fontSize: 12 }}
            label={{ value: 'Units / month', position: 'insideBottom', offset: -5, fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatGBP(v)} />
          <ReTooltip formatter={(v: number) => formatGBP(v)} contentStyle={{ fontSize: 12 }} />
          <Legend />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="transparent"
            fill="#16a34a"
            fillOpacity={0.12}
            name="Profit region"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="totalCost"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
            name="Total cost"
          />
          {isFinite(breakeven) && (
            <ReferenceDot
              x={Math.round(breakeven)}
              y={breakeven * pricePerUnit}
              r={6}
              fill="#0ea5e9"
              stroke="white"
              label={{ value: 'Breakeven', position: 'top', fontSize: 11 }}
            />
          )}
          {projected > 0 && (
            <ReferenceDot
              x={Math.round(projected)}
              y={projected * pricePerUnit}
              r={5}
              fill="#6366f1"
              stroke="white"
              label={{ value: 'You', position: 'bottom', fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// HealthBadge referenced elsewhere
export { HealthBadge };
