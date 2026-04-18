export type CostType = 'fixed' | 'percent';

export interface LineItem {
  id: string;
  name: string;
  amount: number;
  type: CostType; // 'fixed' = £, 'percent' = % of revenue (only meaningful for variable)
  isThirdParty?: boolean; // flag: depends on a third-party supplier (API, platform, upstream vendor)
}

export type PricingMode =
  | 'flat-subscription'
  | 'one-time'
  | 'usage'
  | 'hybrid'
  | 'tiered';

export type UsageDistributionShape = 'flat' | 'moderate' | 'power-law';

export interface UsagePricingData {
  // Consumption economics — what the unit of usage actually is
  consumptionUnitLabel: string; // e.g. "API call", "message", "GB processed"
  pricePerConsumptionUnit: number; // £ per consumption unit
  consumptionVariableCosts: LineItem[]; // variable cost per consumption unit (supplier APIs etc.)
  baseFee: number; // optional monthly base fee charged on top of usage
  // Customer behaviour — distribution of usage across customers
  averageUnitsPerCustomer: number; // mean consumption units / paying customer / month
  distributionShape: UsageDistributionShape; // flat / moderate / power-law
  p25Units: number;
  p50Units: number;
  p75Units: number;
  p90Units: number;
  // Acquisition funnel — free tier cost included in True CAC
  freeTierUnits: number; // units consumed by a typical free user per month
  conversionRatePct: number; // % of free users who convert to paying
  directCAC: number; // £ spent on ads/sales per paying customer (excludes free-tier drag)
  // Retention & expansion
  monthlyChurnPct: number; // % of paying customers lost per month
  nrrPct: number; // Net Revenue Retention — 100 = flat, >100 = expansion, <100 = contraction
  customerLifetimeMonths: number; // optional override; if 0, derived from churn
}

export interface FixedItem {
  id: string;
  name: string;
  amount: number;
}

export interface ScorecardAnswers {
  q1Validated: boolean;
  q1Sources: string;
  q2Moats: string[];
  q2Explain: string;
  q3RaisePrice: 'yes' | 'no' | 'unsure' | '';
  q3Undercut: string;
  q3MakerTaker: 'maker' | 'taker' | '';
  q4Runway: number;
  q4Regulatory: string;
  q4Macro: string;
  q5Notes: string;
}

export interface DistributionData {
  primaryStrategyKey: string;
  secondaryStrategyKey: string;
  estimatedCAC: number;
  channelTested: string;
  testResult: string;
  checklistProgress: Record<string, string[]>;
  notes: string;
}

export type YesNoUnsure = 'yes' | 'no' | 'unsure' | '';

export interface IdeaFilterData {
  // Filter 1 — problem severity (acute, frequent, expensive)
  problemStatement: string;
  problemAcute: YesNoUnsure;
  problemFrequent: YesNoUnsure;
  problemExpensive: YesNoUnsure;
  problemAnnualCost: number;
  problemEvidence: string;
  // Filter 2 — willingness to pay
  wtpPrecedent: YesNoUnsure;
  wtpCommitment: YesNoUnsure;
  wtpPrice: number;
  wtpEvidence: string;
  // Filter 3 — reachability
  reachCanName: YesNoUnsure;
  reachHaveList: YesNoUnsure;
  reachTestedOutreach: YesNoUnsure;
  reachChannels: string;
  reachEvidence: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BusinessAnalysis {
  id: string;
  createdAt: number;
  updatedAt: number;
  // Context
  name: string;
  description: string;
  pricingModel: string;
  industry: string;
  pricingMode: PricingMode;
  // Unit economics (flat-pricing inputs; in usage mode `unitsPerMonth` is reused as "paying customers")
  unitDefinition: string;
  pricePerUnit: number;
  unitsPerMonth: number;
  variableCosts: LineItem[];
  fixedCosts: FixedItem[];
  setupCost: number;
  cashReserve: number;
  // Usage-based pricing (only loaded when pricingMode in usage/hybrid/tiered)
  usagePricing: UsagePricingData;
  // Scorecard
  scorecard: ScorecardAnswers;
  // Distribution
  distribution: DistributionData;
  // Idea filter (problem/WTP/reach gate before modelling)
  ideaFilter: IdeaFilterData;
  // AI chat
  chat: ChatMessage[];
}

export type AiProvider = 'openai' | 'openrouter' | 'anthropic' | 'custom';

export interface AppSettings {
  provider: AiProvider;
  apiKey: string;
  baseURL: string;
  model: string;
  darkMode: boolean;
  onboardingCompleted: boolean;
  activeId: string | null;
}

export type Section =
  | 'filter'
  | 'analyzer'
  | 'stress'
  | 'scorecard'
  | 'distribute'
  | 'library'
  | 'ai'
  | 'compare'
  | 'settings';
