import { useMemo } from 'react';
import type { BusinessAnalysis, DistributionData } from '../types';
import { DISTRIBUTION_STRATEGIES, TOOLTIPS, type DistributionStrategy } from '../constants';
import { calcUnitEconomics, formatGBP, formatPct, type Health } from '../calculations';
import {
  Button,
  Card,
  Field,
  HealthBadge,
  Metric,
  NumberInput,
  TextInput,
} from '../components/ui';

export function Distribution({
  analysis,
  onChange,
}: {
  analysis: BusinessAnalysis;
  onChange: (
    patch: Partial<BusinessAnalysis> | ((a: BusinessAnalysis) => BusinessAnalysis)
  ) => void;
}) {
  const ue = useMemo(() => calcUnitEconomics(analysis), [analysis]);
  const d = analysis.distribution;

  const ranked = useMemo(() => rankStrategies(analysis), [analysis]);
  const top2Keys = ranked.slice(0, 2).map((r) => r.strategy.key);

  const primary =
    DISTRIBUTION_STRATEGIES.find((s) => s.key === d.primaryStrategyKey) ||
    ranked[0]?.strategy ||
    null;
  const secondary =
    DISTRIBUTION_STRATEGIES.find((s) => s.key === d.secondaryStrategyKey) ||
    (ranked[1]?.strategy && ranked[1].strategy.key !== primary?.key ? ranked[1].strategy : null);

  const cacHealth = cacHealthForAnalysis(d.estimatedCAC, ue.contributionPerUnit);

  const update = (patch: Partial<DistributionData>) =>
    onChange({ distribution: { ...analysis.distribution, ...patch } });

  const toggleChecklist = (strategyKey: string, itemId: string) => {
    const current = d.checklistProgress[strategyKey] || [];
    const next = current.includes(itemId)
      ? current.filter((x) => x !== itemId)
      : [...current, itemId];
    update({ checklistProgress: { ...d.checklistProgress, [strategyKey]: next } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Distribution Planner</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          How will your customers find you? The best product dies without a channel.
        </p>
      </div>

      {/* Recommendation callout */}
      <Card title="Recommended for your business">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Based on your industry, pricing model, and price point — not a guarantee, just a
          filter against obviously-wrong channels.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {ranked.slice(0, 2).map(({ strategy, score }) => (
            <StrategyCard
              key={strategy.key}
              strategy={strategy}
              score={score}
              compact
              onPick={
                d.primaryStrategyKey === strategy.key
                  ? undefined
                  : () =>
                      update({
                        primaryStrategyKey:
                          d.primaryStrategyKey === strategy.key ? '' : strategy.key,
                        secondaryStrategyKey:
                          d.secondaryStrategyKey === strategy.key
                            ? d.primaryStrategyKey || ''
                            : d.secondaryStrategyKey,
                      })
              }
              picked={
                d.primaryStrategyKey === strategy.key || d.secondaryStrategyKey === strategy.key
              }
            />
          ))}
        </div>
      </Card>

      {/* Strategy picker */}
      <Card title="Your channels">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Field label="Primary channel (where you will focus first)">
            <StrategySelect
              value={d.primaryStrategyKey}
              onChange={(v) => update({ primaryStrategyKey: v })}
              exclude={d.secondaryStrategyKey}
            />
          </Field>
          <Field label="Secondary channel (backup / complementary)">
            <StrategySelect
              value={d.secondaryStrategyKey}
              onChange={(v) => update({ secondaryStrategyKey: v })}
              exclude={d.primaryStrategyKey}
            />
          </Field>
        </div>
        {!primary && (
          <div className="text-sm text-slate-500">
            Pick a primary channel to see its starter checklist and fit notes.
          </div>
        )}
      </Card>

      {/* CAC reality check */}
      <Card title="CAC reality check">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Field label="Estimated CAC (£ per customer)" tooltip={TOOLTIPS.estimatedCAC}>
            <NumberInput
              value={d.estimatedCAC}
              onChange={(v) => update({ estimatedCAC: v })}
            />
          </Field>
          <Metric
            label="Contribution / unit"
            value={formatGBP(ue.contributionPerUnit)}
            sub={`${formatPct(ue.contributionMarginPct)} of price`}
          />
          <Metric
            label="CAC vs. contribution"
            value={
              d.estimatedCAC <= 0
                ? '—'
                : ue.contributionPerUnit <= 0
                ? '∞'
                : `${(d.estimatedCAC / ue.contributionPerUnit).toFixed(1)}×`
            }
            sub={cacCopy(d.estimatedCAC, ue.contributionPerUnit)}
            health={cacHealth}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Rule of thumb: CAC should be recovered in under 6 months of contribution for
          subscription, and from the first sale for one-time products. Above 12 months you
          are effectively financing growth — only safe if runway and LTV justify it.
        </p>
      </Card>

      {/* Channel tests (evidence) */}
      <Card title="Evidence from real tests">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Plans are cheap. What have you actually tried?
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Which channel have you tested?">
            <TextInput
              value={d.channelTested}
              onChange={(v) => update({ channelTested: v })}
              placeholder="e.g. LinkedIn outbound, Google ads for [term], posted in [subreddit]"
            />
          </Field>
          <Field label="What happened? (replies, signups, cost per lead)">
            <TextInput
              value={d.testResult}
              onChange={(v) => update({ testResult: v })}
              placeholder="Numbers are better than vibes"
            />
          </Field>
        </div>
      </Card>

      {/* Starter checklists for picked channels */}
      {primary && (
        <ChannelDetail
          strategy={primary}
          badgeLabel="Primary"
          progress={d.checklistProgress[primary.key] || []}
          onToggle={(id) => toggleChecklist(primary.key, id)}
        />
      )}
      {secondary && secondary.key !== primary?.key && (
        <ChannelDetail
          strategy={secondary}
          badgeLabel="Secondary"
          progress={d.checklistProgress[secondary.key] || []}
          onToggle={(id) => toggleChecklist(secondary.key, id)}
        />
      )}

      {/* All strategies reference */}
      <Card title="All 7 channels ranked for this business">
        <div className="grid md:grid-cols-2 gap-3">
          {ranked.map(({ strategy, score }) => (
            <StrategyCard
              key={strategy.key}
              strategy={strategy}
              score={score}
              highlighted={top2Keys.includes(strategy.key)}
              picked={
                d.primaryStrategyKey === strategy.key || d.secondaryStrategyKey === strategy.key
              }
              compact
            />
          ))}
        </div>
      </Card>

      <Card title="Notes">
        <textarea
          className="w-full min-h-[120px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Open questions, experiments you plan to run, partners you want to contact…"
          value={d.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </Card>
    </div>
  );
}

function StrategyCard({
  strategy,
  score,
  compact = false,
  highlighted = false,
  picked = false,
  onPick,
}: {
  strategy: DistributionStrategy;
  score: number;
  compact?: boolean;
  highlighted?: boolean;
  picked?: boolean;
  onPick?: () => void;
}) {
  const fit = fitLabel(score);
  return (
    <div
      className={`rounded-lg border p-3 transition ${
        picked
          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
          : highlighted
          ? 'border-indigo-200 dark:border-indigo-900'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{strategy.icon}</span>
          <span className="font-medium text-sm">{strategy.label}</span>
        </div>
        <HealthBadge health={fit.health} label={fit.label} />
      </div>
      {!compact && (
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{strategy.tagline}</p>
      )}
      {compact && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {strategy.tagline}
        </p>
      )}
      {onPick && (
        <div className="mt-2">
          <Button variant="secondary" onClick={onPick} className="!py-1 !text-xs">
            {picked ? 'Selected' : 'Make primary'}
          </Button>
        </div>
      )}
    </div>
  );
}

function ChannelDetail({
  strategy,
  badgeLabel,
  progress,
  onToggle,
}: {
  strategy: DistributionStrategy;
  badgeLabel: string;
  progress: string[];
  onToggle: (id: string) => void;
}) {
  const done = progress.length;
  const total = strategy.checklist.length;
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span>{strategy.icon}</span>
          <span>{strategy.label}</span>
          <span className="text-[10px] uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
            {badgeLabel}
          </span>
        </span>
      }
      right={
        <span className="text-xs text-slate-500 tabular-nums">
          {done}/{total} done
        </span>
      }
    >
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            When it works
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200">{strategy.whenItWorks}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            When it fails
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200">{strategy.whenItFails}</p>
        </div>
      </div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        Starter checklist
      </div>
      <div className="space-y-2">
        {strategy.checklist.map((item) => {
          const checked = progress.includes(item.id);
          return (
            <label
              key={item.id}
              className="flex items-start gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.id)}
                className="mt-0.5"
              />
              <span className={checked ? 'line-through text-slate-400' : ''}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

function StrategySelect({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">— pick a channel —</option>
      {DISTRIBUTION_STRATEGIES.filter((s) => s.key !== exclude).map((s) => (
        <option key={s.key} value={s.key}>
          {s.icon} {s.label}
        </option>
      ))}
    </select>
  );
}

// --- scoring -------------------------------------------------------------

function rankStrategies(
  a: BusinessAnalysis
): { strategy: DistributionStrategy; score: number }[] {
  return DISTRIBUTION_STRATEGIES.map((strategy) => ({
    strategy,
    score: fitScore(a, strategy),
  })).sort((x, y) => y.score - x.score);
}

function fitScore(a: BusinessAnalysis, s: DistributionStrategy): number {
  let score = 0;
  if (s.industries.includes(a.industry)) score += 3;
  if (s.pricingModels.includes(a.pricingModel)) score += 2;
  if (a.pricePerUnit >= s.minPrice && a.pricePerUnit <= s.maxPrice) score += 2;
  // Paid ads need margin to survive CAC
  if (s.key === 'paid-ads') {
    const ue = calcUnitEconomics(a);
    if (ue.contributionMarginPct >= 40) score += 1;
    else if (ue.contributionMarginPct < 15) score -= 2;
  }
  // Sales outbound needs ticket size
  if (s.key === 'sales-outbound' && a.pricePerUnit < 500) score -= 2;
  return score;
}

function fitLabel(score: number): { label: string; health: Health } {
  if (score >= 6) return { label: 'Strong fit', health: 'healthy' };
  if (score >= 3) return { label: 'Plausible', health: 'caution' };
  return { label: 'Poor fit', health: 'danger' };
}

export function cacHealthForAnalysis(cac: number, contribution: number): Health {
  if (cac <= 0 || contribution <= 0) return 'caution';
  const ratio = cac / contribution;
  if (ratio <= 3) return 'healthy';
  if (ratio <= 8) return 'caution';
  return 'danger';
}

function cacCopy(cac: number, contribution: number): string {
  if (cac <= 0) return 'Enter an estimate';
  if (contribution <= 0) return 'Fix unit economics first';
  const months = cac / contribution;
  if (months <= 1) return 'Recovered in first sale';
  if (months <= 6) return `~${months.toFixed(1)} contributions to recover`;
  if (months <= 12) return `Tight — ${months.toFixed(1)}× contribution`;
  return `Burns cash — ${months.toFixed(1)}× contribution`;
}
