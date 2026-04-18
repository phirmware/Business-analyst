import type { BusinessAnalysis } from './types';
import { calcUnitEconomics, formatGBP, formatPct, formatNum } from './calculations';

export function analysisToMarkdown(a: BusinessAnalysis): string {
  const ue = calcUnitEconomics(a);
  const vc = a.variableCosts
    .map((v) => `- ${v.name}: ${v.type === 'percent' ? v.amount + '%' : '£' + v.amount}`)
    .join('\n');
  const fc = a.fixedCosts.map((f) => `- ${f.name}: £${f.amount}/mo`).join('\n');
  const moats = a.scorecard.q2Moats.length
    ? a.scorecard.q2Moats.join(', ')
    : '(none selected)';
  return `# Business Reality Check — ${a.name}

_Exported ${new Date().toLocaleString()}_

## Context
- **Description:** ${a.description || '—'}
- **Industry:** ${a.industry}
- **Pricing model:** ${a.pricingModel}
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
