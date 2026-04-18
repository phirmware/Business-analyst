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

export type Section = 'analyzer' | 'stress' | 'scorecard' | 'library' | 'ai' | 'compare' | 'settings';
