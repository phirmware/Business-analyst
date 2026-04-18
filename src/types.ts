export type CostType = 'fixed' | 'percent';

export interface LineItem {
  id: string;
  name: string;
  amount: number;
  type: CostType; // 'fixed' = £, 'percent' = % of revenue (only meaningful for variable)
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
  // Unit economics
  unitDefinition: string;
  pricePerUnit: number;
  unitsPerMonth: number;
  variableCosts: LineItem[];
  fixedCosts: FixedItem[];
  setupCost: number;
  cashReserve: number;
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
