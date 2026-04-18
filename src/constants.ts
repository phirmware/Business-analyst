import type {
  BusinessAnalysis,
  DistributionData,
  FixedItem,
  IdeaFilterData,
  LineItem,
  ScorecardAnswers,
} from './types';
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
    q5Notes: '',
  };
}

export interface DistributionStrategy {
  key: string;
  label: string;
  icon: string;
  tagline: string;
  whenItWorks: string;
  whenItFails: string;
  industries: string[];
  pricingModels: string[];
  minPrice: number;
  maxPrice: number;
  checklist: { id: string; label: string }[];
}

export const DISTRIBUTION_STRATEGIES: DistributionStrategy[] = [
  {
    key: 'content-seo',
    label: 'Organic content & SEO',
    icon: '📝',
    tagline: 'Build an audience that finds you through search and sharing.',
    whenItWorks:
      'B2B SaaS, info-products, or any problem people actively Google. Compounds over 6-18 months.',
    whenItFails:
      'Commodity products with no search intent, or urgent/local purchases where customers do not research.',
    industries: ['SaaS / Software', 'Services / Agency', 'Media / Content', 'E-commerce'],
    pricingModels: [
      'Subscription (monthly)',
      'Subscription (annual)',
      'Licensing',
      'Freemium + upgrades',
      'One-time sale',
    ],
    minPrice: 10,
    maxPrice: 100000,
    checklist: [
      { id: 'keywords', label: 'Identify 20+ keywords your exact customer searches' },
      { id: 'calendar', label: 'Publish cadence defined (e.g. 2 posts/week for 6 months)' },
      { id: 'distribution', label: 'Distribution plan for each post (newsletter, social, SEO)' },
      { id: 'metrics', label: 'Measure signups/trials per post, not pageviews' },
    ],
  },
  {
    key: 'paid-ads',
    label: 'Paid acquisition (ads)',
    icon: '💸',
    tagline: 'Spend money to reach specific customers predictably.',
    whenItWorks:
      'Clear LTV, measurable conversion, and CAC well below contribution. Works for most consumer products.',
    whenItFails:
      'Low-margin products (ads eat the margin), long sales cycles without mid-funnel nurture, or when LTV is unknown.',
    industries: [
      'E-commerce',
      'SaaS / Software',
      'Services / Agency',
      'Shortlet / Hospitality',
      'Marketplace',
    ],
    pricingModels: [
      'One-time sale',
      'Subscription (monthly)',
      'Subscription (annual)',
      'Freemium + upgrades',
      'Per-use / Pay-per-transaction',
    ],
    minPrice: 15,
    maxPrice: 100000,
    checklist: [
      { id: 'ltv', label: 'LTV estimated from cohort data or defensible proxy' },
      { id: 'cac-target', label: 'Target CAC set (usually < 1/3 of LTV)' },
      { id: 'creative', label: '3+ ad creatives ready for A/B testing' },
      { id: 'landing', label: 'Landing page with tracked conversion goal' },
      { id: 'budget', label: 'Test budget scoped (£500-£2000 to reach statistical signal)' },
    ],
  },
  {
    key: 'sales-outbound',
    label: 'Direct sales / outbound',
    icon: '📞',
    tagline: 'Go find customers one at a time — cold email, LinkedIn, calls.',
    whenItWorks:
      'High-ACV B2B (£2k+ annual contract). Labor-intensive but buying intent is explicit.',
    whenItFails:
      'Low-priced products (cost per touch exceeds margin), or consumer products where cold outreach annoys.',
    industries: ['SaaS / Software', 'Services / Agency', 'Manufacturing', 'Other'],
    pricingModels: [
      'Subscription (annual)',
      'Licensing',
      'One-time sale',
      'Usage-based',
      'Other',
    ],
    minPrice: 500,
    maxPrice: 1000000,
    checklist: [
      { id: 'icp', label: 'Ideal customer profile (ICP) written down precisely' },
      { id: 'list', label: '200+ named prospects in a list with contact info' },
      { id: 'scripts', label: 'Cold email + call scripts drafted and reviewed' },
      { id: 'crm', label: 'Pipeline tracking set up (even a spreadsheet)' },
      { id: 'cadence', label: 'Weekly outreach volume target (e.g. 100 emails/week)' },
    ],
  },
  {
    key: 'community',
    label: 'Community & creator-led',
    icon: '🫂',
    tagline: 'Get adopted inside a niche community where your customer already hangs out.',
    whenItWorks:
      'Passionate niches (dev tools, hobbies, creative software). Works when you are a credible member yourself.',
    whenItFails:
      'Generic mass-market products, or if you are seen as a drive-by marketer rather than a real participant.',
    industries: ['SaaS / Software', 'Media / Content', 'E-commerce', 'Other'],
    pricingModels: [
      'Subscription (monthly)',
      'Freemium + upgrades',
      'One-time sale',
      'Usage-based',
      'Other',
    ],
    minPrice: 0,
    maxPrice: 10000,
    checklist: [
      { id: 'communities', label: 'Identified 3-5 communities where your customer is active' },
      { id: 'participation', label: 'Contributed genuinely (no product pitch) for 2+ weeks' },
      { id: 'permission', label: 'Checked community rules on self-promotion' },
      { id: 'creators', label: 'Listed 5-10 creators/voices who reach the same audience' },
    ],
  },
  {
    key: 'marketplace',
    label: 'Marketplace / platform',
    icon: '🏪',
    tagline: 'List where demand already exists: App Store, Etsy, Amazon, Airbnb, Shopify App Store.',
    whenItWorks:
      'Marketplace-native categories. Demand is instant. Usually works when you are #1-3 in a narrow niche.',
    whenItFails:
      'Platforms take a tax (15-30%), own the customer, and can change rules overnight. Hard to build a moat.',
    industries: [
      'E-commerce',
      'Shortlet / Hospitality',
      'Marketplace',
      'Retail',
      'SaaS / Software',
      'Media / Content',
    ],
    pricingModels: [
      'One-time sale',
      'Per-use / Pay-per-transaction',
      'Subscription (monthly)',
      'Usage-based',
    ],
    minPrice: 1,
    maxPrice: 100000,
    checklist: [
      { id: 'platform', label: 'Chosen the one platform where your customer buys' },
      { id: 'listing', label: 'Optimized listing: keywords, reviews plan, photography' },
      { id: 'take-rate', label: 'Platform take-rate modeled into variable costs' },
      { id: 'off-platform', label: 'Plan to capture customer off-platform (newsletter, direct site)' },
    ],
  },
  {
    key: 'partnerships',
    label: 'Partnerships & channel',
    icon: '🤝',
    tagline: 'Integrate with / resell through businesses that already have your customer.',
    whenItWorks:
      'B2B with clear complementary products. Partner has a sales motion; you bolt on.',
    whenItFails:
      'No revenue share large enough to motivate the partner, or the partner sees you as competition.',
    industries: ['SaaS / Software', 'Services / Agency', 'Manufacturing', 'Other'],
    pricingModels: [
      'Subscription (annual)',
      'Licensing',
      'Usage-based',
      'One-time sale',
      'Other',
    ],
    minPrice: 100,
    maxPrice: 1000000,
    checklist: [
      { id: 'targets', label: '5-10 candidate partners mapped with decision-makers' },
      { id: 'rev-share', label: 'Revenue share / referral fee that motivates the partner' },
      { id: 'integration', label: 'Technical or process integration story written down' },
      { id: 'co-marketing', label: 'Co-marketing or co-selling plan (not just a logo swap)' },
    ],
  },
  {
    key: 'local-physical',
    label: 'Physical / local presence',
    icon: '📍',
    tagline: 'Foot traffic, local ads, flyers, events, word of mouth in a defined area.',
    whenItWorks:
      'Local services, restaurants, retail, shortlets. Geography defines the market.',
    whenItFails:
      'Scalable/remote products where spending on local channels caps you at local TAM.',
    industries: [
      'Restaurant / Food',
      'Retail',
      'Services / Agency',
      'Shortlet / Hospitality',
      'Other',
    ],
    pricingModels: ['One-time sale', 'Per-use / Pay-per-transaction', 'Usage-based', 'Other'],
    minPrice: 1,
    maxPrice: 10000,
    checklist: [
      { id: 'catchment', label: 'Defined catchment area (postcodes, mile radius)' },
      { id: 'reviews', label: 'Google Business Profile claimed, review flywheel planned' },
      { id: 'referrals', label: 'Referral or loyalty mechanism in place' },
      { id: 'local-ads', label: 'Local channel tested (flyers, local paper, community board, events)' },
    ],
  },
];

export function defaultDistribution(): DistributionData {
  return {
    primaryStrategyKey: '',
    secondaryStrategyKey: '',
    estimatedCAC: 0,
    channelTested: '',
    testResult: '',
    checklistProgress: {},
    notes: '',
  };
}

export function defaultIdeaFilter(): IdeaFilterData {
  return {
    problemStatement: '',
    problemAcute: '',
    problemFrequent: '',
    problemExpensive: '',
    problemAnnualCost: 0,
    problemEvidence: '',
    wtpPrecedent: '',
    wtpCommitment: '',
    wtpPrice: 0,
    wtpEvidence: '',
    reachCanName: '',
    reachHaveList: '',
    reachTestedOutreach: '',
    reachChannels: '',
    reachEvidence: '',
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
    distribution: defaultDistribution(),
    ideaFilter: defaultIdeaFilter(),
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
  estimatedCAC:
    'Customer Acquisition Cost — what you expect to spend to land one paying customer through this channel. Why it matters: if CAC exceeds a few months of contribution margin, the channel burns cash. Rule of thumb: CAC should be under 1/3 of lifetime contribution from that customer.',
  distributionFit:
    'How well a channel matches your industry, pricing model, and price point. A high fit score does not guarantee success — it just means the channel is not obviously wrong for your business.',
  problemAcute:
    'Acute means the problem hurts in the moment — not mildly inconvenient. If someone can shrug it off, they will not pay to fix it.',
  problemFrequent:
    'Frequent means it happens often enough to be top-of-mind. Once-a-year problems are hard to sell against — the urgency fades before they buy.',
  problemExpensive:
    'Expensive means the problem has a real cost in money, time, or risk. If it costs them nothing to live with, any price is too high.',
  problemAnnualCost:
    'Rough £ value of the pain to one customer per year — money lost, hours wasted × their hourly rate, or damage risk. Why it matters: WTP is usually 10-30% of the cost of the problem.',
  wtpPrecedent:
    'Are people already paying something — an existing tool, a workaround, a consultant, a spreadsheet with a subscription — to manage this? Precedent is the single strongest WTP signal.',
  wtpCommitment:
    'Has a specific prospect told you "I would pay £X for this" with a price attached? Vague interest does not count. Soft commitments predict nothing.',
  wtpPrice:
    'The price at least one prospect verbally committed to pay. Rule of thumb: discount verbal commitments by 70% to estimate real conversion.',
  reachCanName:
    'Can you name 3 specific places (subreddits, LinkedIn groups, conferences, publications) where your exact customer actually spends time?',
  reachHaveList:
    'Have you compiled a list of at least 20 named prospects with contact info? If not, you are guessing at your market.',
  reachTestedOutreach:
    'Have you reached out — cold email, DM, conversation — and heard back? Plans to test do not count. Only actual tests.',
};
