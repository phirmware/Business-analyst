import type {
  BusinessAnalysis,
  FixedItem,
  LineItem,
  UsagePricingData,
} from './types';
import { DECILE_SHAPES } from './constants';

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

// -----------------------------------------------------------------------------
// Usage-based pricing
// -----------------------------------------------------------------------------

export interface UsageEconomics {
  // Per consumption unit
  pricePerConsumptionUnit: number;
  variableCostPerConsumptionUnit: number;
  contributionPerConsumptionUnit: number;
  consumptionMarginPct: number;
  thirdPartyCostPerConsumptionUnit: number;
  supplierDependencyPct: number; // 0–100, share of variable cost that is third-party

  // Per paying customer (monthly)
  avgRevenuePerCustomer: number;
  avgVariableCostPerCustomer: number;
  avgContributionPerCustomer: number;
  baseFee: number;

  // Percentile contribution (to expose whale-and-mouse)
  p25Contribution: number;
  p50Contribution: number;
  p75Contribution: number;
  p90Contribution: number;

  // Acquisition / retention
  directCAC: number;
  freeTierDragPerPaying: number;
  trueCAC: number;
  effectiveLifetimeMonths: number;
  ltv: number;
  ltvToCacRatio: number; // LTV / trueCAC, or Infinity if trueCAC=0
  paybackMonths: number; // trueCAC / avgContribution, Infinity if ≤0

  // Concentration (revenue share by decile, lowest → highest usage)
  decileRevenueShare: number[];
  top10PctShare: number; // % of revenue from top decile
  top20PctShare: number; // % of revenue from top 2 deciles

  // Business-level monthly
  payingCustomers: number;
  monthlyRevenue: number;
  monthlyVariableCosts: number;
  monthlyFixedCosts: number;
  monthlyProfit: number;
  annualProfit: number;
}

function lineItemCostAt(items: LineItem[], price: number, variablePct: number): number {
  return items.reduce((sum, it) => {
    const adj = applyVariance(it.amount, variablePct);
    if (it.type === 'percent') return sum + (price * adj) / 100;
    return sum + adj;
  }, 0);
}

function thirdPartyCostAt(items: LineItem[], price: number, variablePct: number): number {
  return items.reduce((sum, it) => {
    if (!it.isThirdParty) return sum;
    const adj = applyVariance(it.amount, variablePct);
    if (it.type === 'percent') return sum + (price * adj) / 100;
    return sum + adj;
  }, 0);
}

// NRR expansion (monthly). If NRR=100 -> 0 expansion; >100 -> positive; <100 -> negative.
function monthlyExpansionPct(nrrPct: number): number {
  const annualExpansion = (nrrPct || 100) - 100; // e.g. +5 or -15
  // Distribute annual expansion linearly across 12 months as a rough monthly figure.
  return annualExpansion / 12;
}

export function effectiveLifetime(u: UsagePricingData): number {
  if (u.customerLifetimeMonths && u.customerLifetimeMonths > 0) {
    return u.customerLifetimeMonths;
  }
  const churn = Math.max(0, u.monthlyChurnPct || 0);
  const expansion = monthlyExpansionPct(u.nrrPct);
  const net = Math.max(0.5, churn - expansion); // floor at 0.5%/mo to avoid absurd lifetimes
  return 100 / net; // months; e.g. 5%/mo net churn → 20 months
}

export function calcUsageEconomics(
  a: BusinessAnalysis,
  v: Variances = zeroVariances
): UsageEconomics {
  const u = a.usagePricing;

  // Per-consumption-unit
  const price = applyVariance(u.pricePerConsumptionUnit || 0, v.revenuePct);
  const variableCostPerConsumption = lineItemCostAt(
    u.consumptionVariableCosts,
    price,
    v.variablePct
  );
  const thirdPartyCost = thirdPartyCostAt(u.consumptionVariableCosts, price, v.variablePct);
  const contribution = price - variableCostPerConsumption;
  const consumptionMarginPct = price > 0 ? (contribution / price) * 100 : 0;
  const supplierDependencyPct =
    variableCostPerConsumption > 0 ? (thirdPartyCost / variableCostPerConsumption) * 100 : 0;

  // Per customer (monthly)
  const avgUnits = Math.max(0, applyVariance(u.averageUnitsPerCustomer || 0, v.volumePct));
  const baseFee = u.baseFee || 0;
  const avgRevenuePerCustomer = avgUnits * price + baseFee;
  const avgVariableCostPerCustomer = avgUnits * variableCostPerConsumption;
  const avgContributionPerCustomer = avgRevenuePerCustomer - avgVariableCostPerCustomer;

  const contributionAt = (units: number) => baseFee + units * contribution;
  const p25Contribution = contributionAt(Math.max(0, u.p25Units || 0));
  const p50Contribution = contributionAt(Math.max(0, u.p50Units || 0));
  const p75Contribution = contributionAt(Math.max(0, u.p75Units || 0));
  const p90Contribution = contributionAt(Math.max(0, u.p90Units || 0));

  // True CAC — direct + free-tier drag
  const conversion = Math.max(0.01, u.conversionRatePct || 0) / 100;
  const freeTierVariableCost = (u.freeTierUnits || 0) * variableCostPerConsumption;
  const freeTierDragPerPaying = freeTierVariableCost / conversion; // each paying customer "carries" 1/conversion free users
  const trueCAC = (u.directCAC || 0) + freeTierDragPerPaying;

  // LTV via effective lifetime × contribution
  const lifetime = effectiveLifetime(u);
  const cappedLifetime = Math.min(lifetime, 60);
  const ltv = avgContributionPerCustomer * cappedLifetime;
  const ltvToCacRatio = trueCAC > 0 ? ltv / trueCAC : Infinity;
  const paybackMonths =
    avgContributionPerCustomer > 0 ? trueCAC / avgContributionPerCustomer : Infinity;

  // Concentration
  const decile = DECILE_SHAPES[u.distributionShape] || DECILE_SHAPES['moderate'];
  const top10PctShare = (decile[9] || 0) * 100;
  const top20PctShare = ((decile[9] || 0) + (decile[8] || 0)) * 100;

  // Business-level monthly (payingCustomers reused from unitsPerMonth)
  const payingCustomers = Math.max(0, applyVariance(a.unitsPerMonth || 0, v.volumePct));
  const monthlyRevenue = avgRevenuePerCustomer * payingCustomers;
  const monthlyVariableCosts = avgVariableCostPerCustomer * payingCustomers;
  const monthlyFixedCosts = totalFixed(a.fixedCosts, v.fixedPct);
  const monthlyProfit = monthlyRevenue - monthlyVariableCosts - monthlyFixedCosts;

  return {
    pricePerConsumptionUnit: price,
    variableCostPerConsumptionUnit: variableCostPerConsumption,
    contributionPerConsumptionUnit: contribution,
    consumptionMarginPct,
    thirdPartyCostPerConsumptionUnit: thirdPartyCost,
    supplierDependencyPct,
    avgRevenuePerCustomer,
    avgVariableCostPerCustomer,
    avgContributionPerCustomer,
    baseFee,
    p25Contribution,
    p50Contribution,
    p75Contribution,
    p90Contribution,
    directCAC: u.directCAC || 0,
    freeTierDragPerPaying,
    trueCAC,
    effectiveLifetimeMonths: lifetime,
    ltv,
    ltvToCacRatio,
    paybackMonths,
    decileRevenueShare: decile.slice(),
    top10PctShare,
    top20PctShare,
    payingCustomers,
    monthlyRevenue,
    monthlyVariableCosts,
    monthlyFixedCosts,
    monthlyProfit,
    annualProfit: monthlyProfit * 12,
  };
}

export function isUsageMode(a: BusinessAnalysis): boolean {
  return (
    a.pricingMode === 'usage' ||
    a.pricingMode === 'hybrid' ||
    a.pricingMode === 'tiered'
  );
}
