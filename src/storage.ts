import type {
  AiProvider,
  AppSettings,
  BusinessAnalysis,
  DistributionData,
  IdeaFilterData,
} from './types';

const ANALYSES_KEY = 'brc.analyses.v1';
const SETTINGS_KEY = 'brc.settings.v1';

export const PROVIDER_PRESETS: Record<AiProvider, { label: string; baseURL: string; model: string; note?: string }> = {
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  openrouter: {
    label: 'OpenRouter (any model)',
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-sonnet-4.5',
    note: 'Lets you use Claude, Gemini, Llama, etc. through one key.',
  },
  anthropic: {
    label: 'Anthropic (OpenAI-compatible endpoint)',
    baseURL: 'https://api.anthropic.com/v1/',
    model: 'claude-sonnet-4-5',
    note: 'Point OpenAI SDK at Anthropic with your Anthropic key.',
  },
  custom: {
    label: 'Custom (any OpenAI-compatible endpoint)',
    baseURL: '',
    model: '',
  },
};

export const defaultSettings: AppSettings = {
  provider: 'openai',
  apiKey: '',
  baseURL: PROVIDER_PRESETS.openai.baseURL,
  model: PROVIDER_PRESETS.openai.model,
  darkMode: false,
  onboardingCompleted: false,
  activeId: null,
};

const DEFAULT_DISTRIBUTION: DistributionData = {
  primaryStrategyKey: '',
  secondaryStrategyKey: '',
  estimatedCAC: 0,
  channelTested: '',
  testResult: '',
  checklistProgress: {},
  notes: '',
};

const DEFAULT_IDEA_FILTER: IdeaFilterData = {
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

function hydrate(a: BusinessAnalysis): BusinessAnalysis {
  return {
    ...a,
    distribution: { ...DEFAULT_DISTRIBUTION, ...(a.distribution ?? {}) },
    ideaFilter: { ...DEFAULT_IDEA_FILTER, ...(a.ideaFilter ?? {}) },
    scorecard: { ...a.scorecard, q5Notes: a.scorecard?.q5Notes ?? '' },
  };
}

export function loadAnalyses(): BusinessAnalysis[] {
  try {
    const raw = localStorage.getItem(ANALYSES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as BusinessAnalysis[];
    return Array.isArray(list) ? list.map(hydrate) : [];
  } catch {
    return [];
  }
}

export function saveAnalyses(list: BusinessAnalysis[]) {
  localStorage.setItem(ANALYSES_KEY, JSON.stringify(list));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings> & {
      anthropicApiKey?: string;
      anthropicModel?: string;
    };
    // Migrate: previous schema used anthropicApiKey / anthropicModel directly.
    if (parsed.anthropicApiKey && !parsed.apiKey) {
      return {
        ...defaultSettings,
        ...parsed,
        provider: 'anthropic',
        apiKey: parsed.anthropicApiKey,
        baseURL: PROVIDER_PRESETS.anthropic.baseURL,
        model: parsed.anthropicModel || PROVIDER_PRESETS.anthropic.model,
      };
    }
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}
