import { useEffect, useMemo, useRef, useState } from 'react';
import type { BusinessAnalysis, CostType, FixedItem, LineItem, PricingMode } from '../types';
import {
  calcJCurve,
  calcUnitEconomics,
  calcUsageEconomics,
  formatGBP,
  formatNum,
  formatPct,
  getJCurveStats,
  healthContribution,
  healthProfit,
  healthSafety,
  isUsageMode,
} from '../calculations';
import { INDUSTRIES, PRICING_MODE_OPTIONS, PRICING_MODELS, TOOLTIPS } from '../constants';
import { UsagePricingInputs, UsageUnitMetrics, UsageMonthlyMetrics, UsageCustomerMetrics } from './UsagePricing';
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
import { SetupRecoveryInputs } from '../components/SetupRecoveryInputs';
import { JCurveChart } from '../components/JCurveChart';
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
  const ue2 = useMemo(() => (usageMode ? calcUsageEconomics(analysis) : null), [analysis, usageMode]);
  const jCurvePoints = useMemo(() => {
    const contrib = usageMode
      ? (ue2?.avgContributionPerCustomer ?? 0)
      : ue.contributionPerUnit;
    const fixed = usageMode
      ? (ue2?.monthlyFixedCosts ?? 0)
      : ue.totalFixedCosts;
    return calcJCurve(contrib, fixed, analysis.setupCost, analysis.setupRecovery);
  }, [analysis, usageMode, ue, ue2]);
  const jStats = useMemo(() => getJCurveStats(jCurvePoints), [jCurvePoints]);
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

      <SetupRecoveryInputs analysis={analysis} onChange={onChange} />

      {/* Usage mode outputs — 3 grouped sections */}
      {usageMode && ue2 && (
        <>
          <SectionDivider
            title={`Per ${analysis.usagePricing.consumptionUnitLabel || 'unit'} of service`}
            sub="Economics of delivering one unit — these numbers don't change with customer count"
          />
          <UsageUnitMetrics analysis={analysis} />

          <SectionDivider
            title="This month"
            sub={`At your current ${ue2.payingCustomers} paying customer${ue2.payingCustomers !== 1 ? 's' : ''} — change the paying customers input above to update`}
          />
          <UsageMonthlyMetrics analysis={analysis} />
          <BreakevenCombinations
            fixedCosts={ue2.monthlyFixedCosts}
            contribPerUnit={ue2.contributionPerConsumptionUnit}
            avgUnitsPerCustomer={analysis.usagePricing.averageUnitsPerCustomer}
            unitLabel={analysis.usagePricing.consumptionUnitLabel || 'unit'}
            currentCustomers={analysis.unitsPerMonth}
          />

          <SectionDivider
            title="Customer growth & setup recovery"
            sub="How long until the business pays for itself — driven by your customer ramp model below"
          />
          <UsageCustomerMetrics analysis={analysis} />
          <SetupRecoveryInputs analysis={analysis} onChange={onChange} />
          <JCurveMetrics jStats={jStats} setupCost={analysis.setupCost} />
          <Card>
            <JCurveChart points={jCurvePoints} />
          </Card>
        </>
      )}

      {/* Flat mode J-curve recovery metrics + chart */}
      {!usageMode && (
        <>
          <JCurveMetrics jStats={jStats} setupCost={analysis.setupCost} />
          <Card>
            <JCurveChart points={jCurvePoints} />
          </Card>
        </>
      )}

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

function SectionDivider({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="pt-2 pb-1 border-b border-slate-200 dark:border-slate-700">
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function JCurveMetrics({
  jStats,
  setupCost,
}: {
  jStats: ReturnType<typeof getJCurveStats>;
  setupCost: number;
}) {
  const fmtMonths = (n: number) => (isFinite(n) ? `${Math.round(n)} months` : 'Never');
  const opHealth = !isFinite(jStats.operationalBreakevenMonth)
    ? 'danger'
    : jStats.operationalBreakevenMonth <= 6
    ? 'healthy'
    : jStats.operationalBreakevenMonth <= 18
    ? 'caution'
    : 'danger';
  const recHealth = !isFinite(jStats.setupRecoveryMonth)
    ? 'danger'
    : jStats.setupRecoveryMonth <= 12
    ? 'healthy'
    : jStats.setupRecoveryMonth <= 36
    ? 'caution'
    : 'danger';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card>
        <Metric
          label="Monthly profit+ begins"
          value={fmtMonths(jStats.operationalBreakevenMonth)}
          sub="First month revenue exceeds costs"
          health={opHealth}
          tooltip="The first month where revenue from your projected customer ramp exceeds all costs (variable + fixed). Before this point the business loses money every month."
        />
      </Card>
      <Card>
        <Metric
          label="Setup cost recovered"
          value={fmtMonths(jStats.setupRecoveryMonth)}
          sub={`Setup: ${formatGBP(setupCost)}`}
          health={recHealth}
          tooltip="How many months until cumulative profit pays back the setup investment. This is your true breakout point — when the business has paid for itself. Often much later than operational breakeven."
        />
      </Card>
      <Card className="col-span-2 md:col-span-1">
        <Metric
          label="Total cash to breakout"
          value={formatGBP(jStats.totalCashNeeded)}
          sub="Setup + all losses before profitability"
          health={jStats.totalCashNeeded === 0 ? 'healthy' : 'caution'}
          tooltip="Your real funding requirement: setup cost plus every losing month before the business turns profitable. Many founders only budget the setup cost and run out of cash during the ramp."
        />
      </Card>
    </div>
  );
}

function BreakevenCombinations({
  fixedCosts,
  contribPerUnit,
  avgUnitsPerCustomer,
  unitLabel,
  currentCustomers,
}: {
  fixedCosts: number;
  contribPerUnit: number;
  avgUnitsPerCustomer: number;
  unitLabel: string;
  currentCustomers: number;
}) {
  if (contribPerUnit <= 0) return null;

  const breakevenUnits = fixedCosts / contribPerUnit;
  const label = unitLabel.toLowerCase();
  const defaultCustomers = Math.max(1, currentCustomers);

  const [customers, setCustomers] = useState(defaultCustomers);
  const [unitsPerCustomer, setUnitsPerCustomer] = useState(avgUnitsPerCustomer);

  const totalUnits = customers * unitsPerCustomer;
  const monthlyProfit = totalUnits * contribPerUnit - fixedCosts;
  const gap = totalUnits - breakevenUnits;
  const aboveBreakeven = gap >= 0;

  const maxCustomers = Math.max(30, defaultCustomers * 3);
  const maxUnitsPerCustomer = Math.max(40, avgUnitsPerCustomer * 4);

  return (
    <Card title={`${unitLabel} breakeven explorer`}>
      {/* Breakeven anchor */}
      <div className="mb-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Breakeven target: </span>
        <strong className="text-slate-800 dark:text-slate-100">
          {Math.ceil(breakevenUnits)} {label}s / month
        </strong>
        <span className="text-slate-400 dark:text-slate-500 ml-2 text-xs">
          (£{fixedCosts.toFixed(0)} fixed costs ÷ £{contribPerUnit.toFixed(2)} margin per {label})
        </span>
      </div>

      {/* Sliders */}
      <div className="space-y-5 mb-6">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Number of customers
            </label>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {customers}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxCustomers}
            value={customers}
            onChange={(e) => setCustomers(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>1</span><span>{maxCustomers}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {unitLabel}s per customer per month
            </label>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {unitsPerCustomer}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxUnitsPerCustomer}
            value={unitsPerCustomer}
            onChange={(e) => setUnitsPerCustomer(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>1</span><span>{maxUnitsPerCustomer}</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={`rounded-xl p-4 border ${
        aboveBreakeven
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
      }`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">
              Total {label}s
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {totalUnits}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              vs {Math.ceil(breakevenUnits)} needed
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">
              {aboveBreakeven ? 'Surplus' : 'Shortfall'}
            </div>
            <div className={`text-2xl font-bold ${aboveBreakeven ? 'text-healthy' : 'text-danger'}`}>
              {aboveBreakeven ? '+' : ''}{Math.round(gap)} {label}s
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {aboveBreakeven ? 'above breakeven' : 'below breakeven'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">
              Monthly profit
            </div>
            <div className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-healthy' : 'text-danger'}`}>
              {monthlyProfit >= 0 ? '+' : ''}£{Math.round(monthlyProfit).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">after fixed costs</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => { setCustomers(defaultCustomers); setUnitsPerCustomer(avgUnitsPerCustomer); }}
        className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        Reset to model defaults ({defaultCustomers} customers × {avgUnitsPerCustomer} {label}s)
      </button>
    </Card>
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
