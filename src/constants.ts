import type { BusinessAnalysis, LineItem, FixedItem, ScorecardAnswers } from './types';
import { uid } from './storage';

export const INDUSTRIES = [
  'SaaS / Software',
  'E-commerce',
  'Services / Agency',
  'Shortlet / Hospitality',
  'Restaurant / Food',
  'Retail',
  'Manufacturing',
  'Marketplace',
  'Media / Content',
  'Other',
];

export const PRICING_MODELS = [
  'One-time sale',
  'Subscription (monthly)',
  'Subscription (annual)',
  'Per-use / Pay-per-transaction',
  'Usage-based',
  'Licensing',
  'Freemium + upgrades',
  'Other',
];

export const MOATS: { key: string; label: string; explain: string }[] = [
  {
    key: 'network',
    label: 'Network effects',
    explain: 'Each new user makes the product more valuable for existing users.',
  },
  {
    key: 'tech',
    label: 'Proprietary technology',
    explain: 'Patents, unique algorithms, or hard-to-replicate technology.',
  },
  {
    key: 'brand',
    label: 'Brand',
    explain: 'Customers pay more because of who you are, not what you make.',
  },
  {
    key: 'switching',
    label: 'Switching costs',
    explain: 'It is painful (time, data, integration) for customers to leave.',
  },
  {
    key: 'data',
    label: 'Unique data',
    explain: 'You have data competitors cannot easily acquire.',
  },
  {
    key: 'regulatory',
    label: 'Regulatory / licensing',
    explain: 'You have permission or certification others lack.',
  },
  {
    key: 'scale',
    label: 'Cost advantage at scale',
    explain: 'You produce or deliver cheaper than anyone else can.',
  },
  {
    key: 'exclusive',
    label: 'Exclusive relationships / contracts',
    explain: 'Locked-in suppliers, distribution, or channel partners.',
  },
  {
    key: 'none',
    label: 'None of the above',
    explain: 'No defensibility. Competition will erode your margin over time.',
  },
];

export function defaultVariableCosts(): LineItem[] {
  return [
    { id: uid(), name: 'Platform / marketplace fees', amount: 15, type: 'percent' },
    { id: uid(), name: 'Payment processing', amount: 2.9, type: 'percent' },
    { id: uid(), name: 'Materials / COGS', amount: 0, type: 'fixed' },
    { id: uid(), name: 'Fulfillment / delivery', amount: 0, type: 'fixed' },
    { id: uid(), name: 'Per-unit labor', amount: 0, type: 'fixed' },
    { id: uid(), name: 'Consumables', amount: 0, type: 'fixed' },
  ];
}

export function defaultFixedCosts(): FixedItem[] {
  return [
    { id: uid(), name: 'Rent', amount: 0 },
    { id: uid(), name: 'Salaries', amount: 0 },
    { id: uid(), name: 'Software subscriptions', amount: 0 },
    { id: uid(), name: 'Insurance', amount: 0 },
    { id: uid(), name: 'Utilities (standing)', amount: 0 },
    { id: uid(), name: 'Accounting', amount: 0 },
    { id: uid(), name: 'Marketing baseline', amount: 0 },
  ];
}

export function defaultScorecard(): ScorecardAnswers {
  return {
    q1Validated: false,
    q1Sources: '',
    q2Moats: [],
    q2Explain: '',
    q3RaisePrice: '',
    q3Undercut: '',
    q3MakerTaker: '',
    q4Runway: 0,
    q4Regulatory: '',
    q4Macro: '',
  };
}

export function newAnalysis(name = 'New business'): BusinessAnalysis {
  const now = Date.now();
  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    name,
    description: '',
    pricingModel: PRICING_MODELS[0],
    industry: INDUSTRIES[0],
    unitDefinition: 'one sale',
    pricePerUnit: 100,
    unitsPerMonth: 50,
    variableCosts: defaultVariableCosts(),
    fixedCosts: defaultFixedCosts(),
    setupCost: 0,
    cashReserve: 0,
    scorecard: defaultScorecard(),
    chat: [],
  };
}

export const TOOLTIPS: Record<string, string> = {
  pricePerUnit:
    'The price a customer pays for one unit. Why it matters: every other metric depends on this. Rule of thumb: set by value delivered, not by your costs.',
  unitsPerMonth:
    'Your honest projection of how many units you will sell each month. Why it matters: revenue = price × volume. Rule of thumb: forecast low, then stress-test even lower.',
  unitDefinition:
    'What counts as one unit for your business — one booking, one subscription month, one sandwich. Why it matters: without a clear unit, you cannot compute per-unit economics.',
  variableCosts:
    'Costs that scale with each unit sold. Why it matters: they determine whether each individual sale is profitable at all. Rule of thumb: know every variable cost to the penny.',
  fixedCosts:
    'Costs you pay whether or not a customer shows up. Why it matters: fixed costs are the meter that runs before you earn anything. Rule of thumb: keep them as low as possible until unit economics are proven.',
  setupCost:
    'One-time investment before your first sale. Why it matters: you only stop losing money once profit exceeds setup cost. Rule of thumb: the bigger this is, the more important margins become.',
  cashReserve:
    'Cash in the bank that can absorb losses. Why it matters: runway = reserve / monthly loss. Rule of thumb: 6 months minimum. 12 months if the model is unproven.',
  contributionMargin:
    'What is left from each sale after variable costs. This pays your fixed costs and eventually your profit. Rule of thumb: below 20% is dangerous for most businesses — a single bad month can wipe you out.',
  grossMargin:
    'Revenue minus variable costs, as a percent of revenue. Why it matters: it sets the ceiling on profitability. Rule of thumb: SaaS 70-90%, services 30-60%, physical goods 20-40%, commodities 5-15%.',
  breakeven:
    'The number of units per month where revenue covers fixed costs. Below it you lose money. Rule of thumb: if your projected volume is less than 1.3x your breakeven, the business is fragile.',
  safetyMargin:
    'How far above breakeven your projected volume is. Why it matters: this is your buffer against bad months. Rule of thumb: 30%+ is healthy, 0-30% is tight, negative means you are already losing money.',
  monthsToBreakeven:
    'How many months of profit it takes to recover your setup cost. Why it matters: long paybacks concentrate risk. Rule of thumb: under 12 months is good, over 36 is a red flag unless you have deep capital.',
  runway:
    'Months before cash reserves run out if you keep losing money at the current rate. Why it matters: runway is oxygen. Rule of thumb: protect it — every month of runway is optionality.',
  monthlyProfit:
    'Revenue minus all costs for a month. Why it matters: profit, not revenue, is what you actually keep. Rule of thumb: revenue is ego, profit is sanity, cash is king.',
};
