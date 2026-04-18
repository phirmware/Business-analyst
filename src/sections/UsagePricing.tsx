import { useMemo } from 'react';
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

  return (
    <>
      {/* Consumption economics */}
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

      {/* Customer behaviour */}
      <Card title="Customer behaviour (consumption distribution)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="hidden md:block" />
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="p25 (low)" tooltip={TOOLTIPS.percentileUnits}>
            <NumberInput
              value={u.p25Units}
              onChange={(v) => patchUsage({ p25Units: v })}
            />
          </Field>
          <Field label="p50 (median)">
            <NumberInput
              value={u.p50Units}
              onChange={(v) => patchUsage({ p50Units: v })}
            />
          </Field>
          <Field label="p75">
            <NumberInput
              value={u.p75Units}
              onChange={(v) => patchUsage({ p75Units: v })}
            />
          </Field>
          <Field label="p90 (whale)">
            <NumberInput
              value={u.p90Units}
              onChange={(v) => patchUsage({ p90Units: v })}
            />
          </Field>
        </div>
      </Card>

      {/* Acquisition funnel */}
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

      {/* Retention */}
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
    ue.ltvToCacRatio >= 3
      ? 'healthy'
      : ue.ltvToCacRatio >= 1.5
      ? 'caution'
      : 'danger';
  const supplierHealth =
    ue.supplierDependencyPct < 40
      ? 'healthy'
      : ue.supplierDependencyPct < 70
      ? 'caution'
      : 'danger';
  const whaleHealth =
    ue.top10PctShare < 35
      ? 'healthy'
      : ue.top10PctShare < 55
      ? 'caution'
      : 'danger';
  const paybackHealth =
    !isFinite(ue.paybackMonths)
      ? 'danger'
      : ue.paybackMonths <= 6
      ? 'healthy'
      : ue.paybackMonths <= 18
      ? 'caution'
      : 'danger';
  const marginHealth =
    ue.consumptionMarginPct >= 40
      ? 'healthy'
      : ue.consumptionMarginPct >= 15
      ? 'caution'
      : 'danger';

  return (
    <>
      {/* Top-line usage metrics */}
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

      {/* Secondary usage metrics */}
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

      {/* Percentile ladder */}
      <Card title="Contribution across customer percentiles (monthly)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PctBlock
            label="p25 (low)"
            units={u.p25Units}
            contribution={ue.p25Contribution}
            unitLabel={unitLabel}
          />
          <PctBlock
            label="p50 (median)"
            units={u.p50Units}
            contribution={ue.p50Contribution}
            unitLabel={unitLabel}
          />
          <PctBlock
            label="p75"
            units={u.p75Units}
            contribution={ue.p75Contribution}
            unitLabel={unitLabel}
          />
          <PctBlock
            label="p90 (whale)"
            units={u.p90Units}
            contribution={ue.p90Contribution}
            unitLabel={unitLabel}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          If p25 is negative and p90 is huge, you have a whale-and-mouse business — one churn event can collapse revenue.
        </p>
      </Card>

      {/* Revenue concentration chart */}
      <Card title="Revenue concentration by usage decile">
        <ConcentrationChart deciles={ue.decileRevenueShare} />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Left decile = lowest-usage 10% of customers. Right decile = top 10%. Power-law means the rightmost bar dwarfs the rest.
        </p>
      </Card>

      {/* Business-level monthly summary */}
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
            health={
              ue.monthlyProfit > 0 ? 'healthy' : ue.monthlyProfit === 0 ? 'caution' : 'danger'
            }
          />
        </Card>
      </div>
    </>
  );
}

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
    contribution > 0
      ? 'text-healthy'
      : contribution === 0
      ? 'text-caution'
      : 'text-danger';
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={`text-lg md:text-xl font-semibold ${color}`}>
        {formatGBP(contribution)}
      </div>
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
          <ReTooltip
            formatter={(v: number) => `${v.toFixed(1)}%`}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend />
          <Bar dataKey="share" name="Revenue share" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={d.decile}
                fill={i === data.length - 1 ? '#dc2626' : i >= data.length - 2 ? '#f59e0b' : '#6366f1'}
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

