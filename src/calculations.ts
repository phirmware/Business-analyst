import type { BusinessAnalysis, LineItem, FixedItem } from './types';

export interface Variances {
  revenuePct: number; // -50 .. +50
  volumePct: number; // -70 .. +50
  variablePct: number; // -20 .. +50
  fixedPct: number; // -20 .. +100
}

export const zeroVariances: Variances = {
  revenuePct: 0,
  volumePct: 0,
  variablePct: 0,
  fixedPct: 0,
};

export interface UnitEconomics {
  pricePerUnit: number;
  unitsPerMonth: number;
  variableCostPerUnit: number;
  contributionPerUnit: number;
  contributionMarginPct: number;
  grossMarginPct: number;
  totalVariableCosts: number;
  totalFixedCosts: number;
  revenue: number;
  monthlyProfit: number;
  annualProfit: number;
  breakevenUnits: number;
  safetyMarginPct: number;
  setupCost: number;
  monthsToBreakeven: number; // includes setup cost recovery; Infinity if not reachable
  cashReserve: number;
  runwayMonths: number; // months before cash reserve runs out if losing money; Infinity if profitable
}

export function applyVariance(n: number, pct: number): number {
  return n * (1 + pct / 100);
}

export function variableCostPerUnit(
  items: LineItem[],
  pricePerUnit: number,
  variablePct: number
): number {
  return items.reduce((sum, it) => {
    const adjusted = applyVariance(it.amount, variablePct);
    if (it.type === 'percent') return sum + (pricePerUnit * adjusted) / 100;
    return sum + adjusted;
  }, 0);
}

export function totalFixed(items: FixedItem[], fixedPct: number): number {
  return items.reduce((sum, it) => sum + applyVariance(it.amount, fixedPct), 0);
}

export function calcUnitEconomics(
  a: BusinessAnalysis,
  v: Variances = zeroVariances
): UnitEconomics {
  const pricePerUnit = applyVariance(a.pricePerUnit || 0, v.revenuePct);
  const unitsPerMonth = Math.max(0, applyVariance(a.unitsPerMonth || 0, v.volumePct));
  const variableCost = variableCostPerUnit(a.variableCosts, pricePerUnit, v.variablePct);
  const fixed = totalFixed(a.fixedCosts, v.fixedPct);
  const contribution = pricePerUnit - variableCost;
  const revenue = pricePerUnit * unitsPerMonth;
  const totalVar = variableCost * unitsPerMonth;
  const monthlyProfit = revenue - totalVar - fixed;
  const annualProfit = monthlyProfit * 12;
  const contributionMarginPct = pricePerUnit > 0 ? (contribution / pricePerUnit) * 100 : 0;
  const grossMarginPct = revenue > 0 ? ((revenue - totalVar) / revenue) * 100 : 0;
  const breakevenUnits = contribution > 0 ? fixed / contribution : Infinity;
  const safetyMarginPct =
    breakevenUnits > 0 && isFinite(breakevenUnits)
      ? ((unitsPerMonth - breakevenUnits) / breakevenUnits) * 100
      : unitsPerMonth > 0
      ? Infinity
      : 0;
  const monthsToBreakeven =
    monthlyProfit > 0 ? (a.setupCost || 0) / monthlyProfit : Infinity;
  const runwayMonths =
    monthlyProfit >= 0 ? Infinity : (a.cashReserve || 0) / -monthlyProfit;

  return {
    pricePerUnit,
    unitsPerMonth,
    variableCostPerUnit: variableCost,
    contributionPerUnit: contribution,
    contributionMarginPct,
    grossMarginPct,
    totalVariableCosts: totalVar,
    totalFixedCosts: fixed,
    revenue,
    monthlyProfit,
    annualProfit,
    breakevenUnits,
    safetyMarginPct,
    setupCost: a.setupCost || 0,
    monthsToBreakeven,
    cashReserve: a.cashReserve || 0,
    runwayMonths,
  };
}

export type Health = 'healthy' | 'caution' | 'danger';

export function healthContribution(pct: number): Health {
  if (pct >= 30) return 'healthy';
  if (pct >= 10) return 'caution';
  return 'danger';
}

export function healthSafety(pct: number): Health {
  if (!isFinite(pct)) return 'healthy';
  if (pct >= 30) return 'healthy';
  if (pct >= 0) return 'caution';
  return 'danger';
}

export function healthProfit(profit: number): Health {
  if (profit > 0) return 'healthy';
  if (profit === 0) return 'caution';
  return 'danger';
}

export function formatGBP(n: number): string {
  if (!isFinite(n)) return '∞';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return (
    sign +
    '£' +
    abs.toLocaleString('en-GB', { maximumFractionDigits: abs < 100 ? 2 : 0 })
  );
}

export function formatPct(n: number): string {
  if (!isFinite(n)) return '∞%';
  return `${n.toFixed(1)}%`;
}

export function formatNum(n: number, digits = 0): string {
  if (!isFinite(n)) return '∞';
  return n.toLocaleString('en-GB', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
