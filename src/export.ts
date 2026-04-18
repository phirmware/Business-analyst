import type { BusinessAnalysis } from './types';
import {
  calcUnitEconomics,
  calcUsageEconomics,
  formatGBP,
  formatPct,
  formatNum,
  isUsageMode,
} from './calculations';
import { DISTRIBUTION_STRATEGIES, PRICING_MODE_OPTIONS } from './constants';

export function analysisToMarkdown(a: BusinessAnalysis): string {
  const ue = calcUnitEconomics(a);
  const vc = a.variableCosts
    .map((v) => `- ${v.name}: ${v.type === 'percent' ? v.amount + '%' : '£' + v.amount}`)
    .join('\n');
  const fc = a.fixedCosts.map((f) => `- ${f.name}: £${f.amount}/mo`).join('\n');
  const moats = a.scorecard.q2Moats.length
    ? a.scorecard.q2Moats.join(', ')
    : '(none selected)';
  const strategyLabel = (key: string) =>
    DISTRIBUTION_STRATEGIES.find((s) => s.key === key)?.label || '(none)';
  const d = a.distribution;
  const cacRatio =
    d.estimatedCAC > 0 && ue.contributionPerUnit > 0
      ? (d.estimatedCAC / ue.contributionPerUnit).toFixed(1) + '× contribution'
      : '—';
  const modeLabel =
    PRICING_MODE_OPTIONS.find((p) => p.key === a.pricingMode)?.label || a.pricingMode;
  const usageBlock = isUsageMode(a) ? usageMarkdown(a) : '';
  return `# Business Reality Check — ${a.name}

_Exported ${new Date().toLocaleString()}_

## Context
- **Description:** ${a.description || '—'}
- **Industry:** ${a.industry}
- **Pricing model:** ${a.pricingModel}
- **Pricing mode:** ${modeLabel}
- **Unit:** ${a.unitDefinition}

## Inputs
- **Price per unit:** £${a.pricePerUnit}
- **Units / month:** ${a.unitsPerMonth}
- **Setup cost:** £${a.setupCost}
- **Cash reserve:** £${a.cashReserve}

### Variable costs per unit
${vc || '(none)'}

### Fixed costs per month
${fc || '(none)'}

## Results
- **Contribution margin:** ${formatGBP(ue.contributionPerUnit)} (${formatPct(ue.contributionMarginPct)})
- **Gross margin:** ${formatPct(ue.grossMarginPct)}
- **Breakeven:** ${formatNum(ue.breakevenUnits, 1)} units/mo
- **Monthly profit:** ${formatGBP(ue.monthlyProfit)}
- **Annual profit:** ${formatGBP(ue.annualProfit)}
- **Safety margin:** ${formatPct(ue.safetyMarginPct)}
- **Time to breakeven (setup):** ${isFinite(ue.monthsToBreakeven) ? ue.monthsToBreakeven.toFixed(1) + ' months' : 'never at current projection'}
- **Runway:** ${ue.monthlyProfit >= 0 ? 'profitable' : isFinite(ue.runwayMonths) ? ue.runwayMonths.toFixed(1) + ' months' : '—'}

## Scorecard answers
- **Q1 validated with research:** ${a.scorecard.q1Validated ? 'yes' : 'no'} — sources: ${a.scorecard.q1Sources || '—'}
- **Q2 moats:** ${moats}
- **Q2 moat explanation:** ${a.scorecard.q2Explain || '—'}
- **Q3 raise price 10%:** ${a.scorecard.q3RaisePrice || '—'}
- **Q3 undercut defense:** ${a.scorecard.q3Undercut || '—'}
- **Q3 price maker/taker:** ${a.scorecard.q3MakerTaker || '—'}
- **Q4 runway (months):** ${a.scorecard.q4Runway}
- **Q4 regulatory risks:** ${a.scorecard.q4Regulatory || '—'}
- **Q4 macro risks:** ${a.scorecard.q4Macro || '—'}
- **Q5 notes:** ${a.scorecard.q5Notes || '—'}

${usageBlock}## Distribution
- **Primary channel:** ${strategyLabel(d.primaryStrategyKey)}
- **Secondary channel:** ${strategyLabel(d.secondaryStrategyKey)}
- **Estimated CAC:** ${d.estimatedCAC > 0 ? '£' + d.estimatedCAC : '—'} (${cacRatio})
- **Channel tested:** ${d.channelTested || '—'}
- **Test result:** ${d.testResult || '—'}
- **Notes:** ${d.notes || '—'}

## Idea filter
- **Problem statement:** ${a.ideaFilter.problemStatement || '—'}
- **Acute / Frequent / Expensive:** ${yn(a.ideaFilter.problemAcute)} / ${yn(a.ideaFilter.problemFrequent)} / ${yn(a.ideaFilter.problemExpensive)}
- **Annual cost to customer:** ${a.ideaFilter.problemAnnualCost > 0 ? '£' + a.ideaFilter.problemAnnualCost : '—'}
- **Problem evidence:** ${a.ideaFilter.problemEvidence || '—'}
- **Precedent paying / specific commitment:** ${yn(a.ideaFilter.wtpPrecedent)} / ${yn(a.ideaFilter.wtpCommitment)}
- **Prospect-quoted price:** ${a.ideaFilter.wtpPrice > 0 ? '£' + a.ideaFilter.wtpPrice : '—'}
- **WTP evidence:** ${a.ideaFilter.wtpEvidence || '—'}
- **Can name channels / has list / tested outreach:** ${yn(a.ideaFilter.reachCanName)} / ${yn(a.ideaFilter.reachHaveList)} / ${yn(a.ideaFilter.reachTestedOutreach)}
- **Channels:** ${a.ideaFilter.reachChannels || '—'}
- **Reach evidence:** ${a.ideaFilter.reachEvidence || '—'}
`;
}

function yn(v: string): string {
  return v === '' ? '—' : v;
}

function usageMarkdown(a: BusinessAnalysis): string {
  const u = a.usagePricing;
  const ue = calcUsageEconomics(a);
  const unit = u.consumptionUnitLabel || 'unit';
  const third = u.consumptionVariableCosts
    .filter((c) => c.isThirdParty)
    .map((c) => `${c.name} (${c.type === 'percent' ? c.amount + '%' : '£' + c.amount})`)
    .join(', ') || '—';
  const ltvCac = isFinite(ue.ltvToCacRatio) ? `${ue.ltvToCacRatio.toFixed(1)}×` : '—';
  return `## Usage-based pricing
- **Consumption unit:** ${unit}
- **Price / ${unit}:** ${formatGBP(u.pricePerConsumptionUnit)}
- **Variable cost / ${unit}:** ${formatGBP(ue.variableCostPerConsumptionUnit)} (3rd-party: ${formatGBP(ue.thirdPartyCostPerConsumptionUnit)} — ${third})
- **Per-unit margin:** ${formatPct(ue.consumptionMarginPct)}
- **Monthly base fee:** ${formatGBP(u.baseFee)}
- **Avg ${unit}/customer/mo:** ${formatNum(u.averageUnitsPerCustomer)} — distribution: ${u.distributionShape}
- **Percentile usage (p25 / p50 / p75 / p90):** ${formatNum(u.p25Units)} / ${formatNum(u.p50Units)} / ${formatNum(u.p75Units)} / ${formatNum(u.p90Units)}
- **Percentile contribution (p25 / p50 / p75 / p90):** ${formatGBP(ue.p25Contribution)} / ${formatGBP(ue.p50Contribution)} / ${formatGBP(ue.p75Contribution)} / ${formatGBP(ue.p90Contribution)}
- **Top 10% / Top 20% revenue share:** ${formatPct(ue.top10PctShare)} / ${formatPct(ue.top20PctShare)}
- **Supplier dependency:** ${formatPct(ue.supplierDependencyPct)}
- **Free-tier ${unit}/user/mo:** ${formatNum(u.freeTierUnits)} at ${u.conversionRatePct}% conversion
- **Direct CAC / free-tier drag / True CAC:** ${formatGBP(u.directCAC)} / ${formatGBP(ue.freeTierDragPerPaying)} / ${formatGBP(ue.trueCAC)}
- **Monthly churn:** ${u.monthlyChurnPct}% | **NRR:** ${u.nrrPct}% | **Lifetime:** ${ue.effectiveLifetimeMonths.toFixed(1)} mo
- **LTV:** ${formatGBP(ue.ltv)} | **LTV : True-CAC:** ${ltvCac} | **Payback:** ${isFinite(ue.paybackMonths) ? ue.paybackMonths.toFixed(1) + ' mo' : '—'}
- **Monthly profit (usage-model):** ${formatGBP(ue.monthlyProfit)} | **Annual:** ${formatGBP(ue.annualProfit)}

`;
}

export function exportAnalysisMarkdown(a: BusinessAnalysis) {
  const md = analysisToMarkdown(a);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slug(a.name)}-reality-check.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPdf() {
  // Uses the browser print dialog — user picks "Save as PDF".
  // Our CSS hides `.no-print` nodes for a clean output.
  window.print();
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'analysis';
}
