import { useMemo } from 'react';
import type { BusinessAnalysis, ScorecardAnswers } from '../types';
import {
  calcUnitEconomics,
  formatGBP,
  formatPct,
  type Health,
} from '../calculations';
import { DISTRIBUTION_STRATEGIES, MOATS } from '../constants';
import { cacHealthForAnalysis } from './Distribution';
import {
  Card,
  Field,
  HealthBadge,
  NumberInput,
  Select,
  TextInput,
} from '../components/ui';

type Score = {
  q1: Health;
  q2: Health;
  q3: Health;
  q4: Health;
  q5: Health;
  overall: Health;
};

export function Scorecard({
  analysis,
  onChange,
}: {
  analysis: BusinessAnalysis;
  onChange: (
    patch: Partial<BusinessAnalysis> | ((a: BusinessAnalysis) => BusinessAnalysis)
  ) => void;
}) {
  const ue = useMemo(() => calcUnitEconomics(analysis), [analysis]);
  const s = analysis.scorecard;

  const update = (patch: Partial<ScorecardAnswers>) =>
    onChange({ scorecard: { ...analysis.scorecard, ...patch } });

  const score: Score = useMemo(() => computeScore(analysis), [analysis]);

  // Stress survival
  const stressed = useMemo(
    () =>
      calcUnitEconomics(analysis, {
        revenuePct: -30,
        volumePct: 0,
        variablePct: 0,
        fixedPct: 0,
      }),
    [analysis]
  );
  const survives30 = stressed.monthlyProfit >= 0 || (s.q4Runway >= 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scorecard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Five critical questions. Answer honestly. The model does the rest.
        </p>
      </div>

      <FinalVerdict analysis={analysis} score={score} />

      {/* Q1 */}
      <Card
        title="Q1 · Unit economics"
        right={<HealthBadge health={score.q1} label={healthLabel(score.q1)} />}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Do the per-unit numbers actually work, and are they based on real research — not
          optimism?
        </p>
        <div className="grid md:grid-cols-3 gap-4 mb-4 font-mono text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500">Contribution</div>
            <div>{formatGBP(ue.contributionPerUnit)} ({formatPct(ue.contributionMarginPct)})</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Gross margin</div>
            <div>{formatPct(ue.grossMarginPct)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Breakeven</div>
            <div>
              {isFinite(ue.breakevenUnits) ? ue.breakevenUnits.toFixed(1) + ' units/mo' : '—'}
            </div>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm mb-3">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={s.q1Validated}
            onChange={(e) => update({ q1Validated: e.target.checked })}
          />
          <span>I have validated these numbers with real research, not guesses.</span>
        </label>
        <Field label="What sources did you use?">
          <TextInput
            value={s.q1Sources}
            onChange={(v) => update({ q1Sources: v })}
            placeholder="e.g. competitor pricing pages, industry reports, user interviews"
          />
        </Field>
      </Card>

      {/* Q2 */}
      <Card
        title="Q2 · Moat (competitive advantage)"
        right={<HealthBadge health={score.q2} label={healthLabel(score.q2)} />}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          What protects your margins from being competed away?
        </p>
        <div className="grid md:grid-cols-2 gap-2 mb-3">
          {MOATS.map((m) => {
            const checked = s.q2Moats.includes(m.key);
            const isNone = m.key === 'none';
            return (
              <label
                key={m.key}
                className={`flex items-start gap-2 p-2 rounded-md border text-sm cursor-pointer ${
                  checked
                    ? isNone
                      ? 'border-red-300 bg-red-50 dark:bg-red-950/30'
                      : 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...s.q2Moats, m.key]
                      : s.q2Moats.filter((k) => k !== m.key);
                    update({ q2Moats: next });
                  }}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium">{m.label}</div>
                  <div className="text-xs text-slate-500">{m.explain}</div>
                </div>
              </label>
            );
          })}
        </div>
        <Field label='Explain your moat. Why can a competitor not copy this in 6 months?'>
          <TextInput
            value={s.q2Explain}
            onChange={(v) => update({ q2Explain: v })}
            placeholder="Be specific. 'We execute better' is not a moat."
          />
        </Field>
        {s.q2Moats.includes('none') && (
          <div className="mt-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200">
            Without a moat, competition will erode your margins toward zero. Either build one,
            or accept that this will always be a grind.
          </div>
        )}
      </Card>

      {/* Q3 */}
      <Card
        title="Q3 · Pricing power"
        right={<HealthBadge health={score.q3} label={healthLabel(score.q3)} />}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Can you raise prices 10% without losing most customers?">
            <Select
              value={s.q3RaisePrice || 'unsure'}
              onChange={(v) => update({ q3RaisePrice: v as any })}
              options={['yes', 'no', 'unsure']}
            />
          </Field>
          <Field label="Price maker or price taker?">
            <Select
              value={s.q3MakerTaker || 'taker'}
              onChange={(v) => update({ q3MakerTaker: v as any })}
              options={['maker', 'taker']}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Why can't competitors undercut you?">
            <TextInput
              value={s.q3Undercut}
              onChange={(v) => update({ q3Undercut: v })}
              placeholder="Switching costs, brand, unique capability, etc."
            />
          </Field>
        </div>
      </Card>

      {/* Q4 */}
      <Card
        title="Q4 · Downside risk"
        right={<HealthBadge health={score.q4} label={healthLabel(score.q4)} />}
      >
        <div className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          If revenue drops 30% for 3 months, do you survive? At your current inputs:{' '}
          <strong
            className={
              survives30 ? 'text-healthy' : 'text-danger'
            }
          >
            {survives30 ? 'yes' : 'no'}
          </strong>
          .
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Total runway (months of cash)">
            <NumberInput
              value={s.q4Runway}
              onChange={(v) => update({ q4Runway: v })}
            />
          </Field>
        </div>
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <Field label="Regulatory risks that could kill this">
            <TextInput
              value={s.q4Regulatory}
              onChange={(v) => update({ q4Regulatory: v })}
              placeholder="Licensing, councils, GDPR, platform rules…"
            />
          </Field>
          <Field label="Macro risks (recession, tech shift, etc.)">
            <TextInput
              value={s.q4Macro}
              onChange={(v) => update({ q4Macro: v })}
            />
          </Field>
        </div>
      </Card>

      {/* Q5 */}
      <Card
        title="Q5 · Distribution reality"
        right={<HealthBadge health={score.q5} label={healthLabel(score.q5)} />}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Can you actually reach your customer, at a cost the unit economics can absorb? Great
          products die in silence without a channel. Auto-scored from the Distribution
          Planner.
        </p>
        <DistributionSubScores analysis={analysis} />
        <div className="mt-4">
          <Field label="Anything else about distribution worth noting?">
            <TextInput
              value={s.q5Notes}
              onChange={(v) => update({ q5Notes: v })}
              placeholder="Existing audience, unfair channel advantage, pending partnership…"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}

function DistributionSubScores({ analysis }: { analysis: BusinessAnalysis }) {
  const ue = calcUnitEconomics(analysis);
  const d = analysis.distribution;
  const primary = DISTRIBUTION_STRATEGIES.find((s) => s.key === d.primaryStrategyKey);
  const channelNamed = !!primary;
  const channelTested = d.channelTested.trim().length >= 3 && d.testResult.trim().length >= 3;
  const cacHealth = cacHealthForAnalysis(d.estimatedCAC, ue.contributionPerUnit);
  const rows: { label: string; met: Health; detail: string }[] = [
    {
      label: 'Primary channel selected',
      met: channelNamed ? 'healthy' : 'danger',
      detail: primary ? `${primary.icon} ${primary.label}` : 'Not picked yet',
    },
    {
      label: 'Tested a channel (not just planned)',
      met: channelTested ? 'healthy' : 'caution',
      detail: channelTested ? d.channelTested : 'No test logged',
    },
    {
      label: 'CAC fits unit economics',
      met: d.estimatedCAC <= 0 ? 'caution' : cacHealth,
      detail:
        d.estimatedCAC <= 0
          ? 'No CAC estimate'
          : ue.contributionPerUnit <= 0
          ? 'Contribution ≤ 0 — CAC cannot be recovered'
          : `CAC £${d.estimatedCAC.toFixed(0)} vs contribution ${formatGBP(
              ue.contributionPerUnit
            )}`,
    },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className="rounded-md border border-slate-200 dark:border-slate-800 p-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-medium">{r.label}</div>
            <HealthBadge health={r.met} label={healthLabel(r.met)} />
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate" title={r.detail}>
            {r.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

function computeScore(a: BusinessAnalysis): Score {
  const ue = calcUnitEconomics(a);
  const s = a.scorecard;
  const d = a.distribution;

  // Q1: margin + validated
  let q1: Health;
  if (ue.contributionMarginPct >= 30 && s.q1Validated) q1 = 'healthy';
  else if (ue.contributionMarginPct >= 10 || s.q1Validated) q1 = 'caution';
  else q1 = 'danger';

  // Q2: moat
  let q2: Health;
  if (s.q2Moats.includes('none')) q2 = 'danger';
  else if (s.q2Moats.length === 0 || !s.q2Explain.trim()) q2 = 'caution';
  else if (s.q2Moats.length >= 1 && s.q2Explain.trim().length >= 30) q2 = 'healthy';
  else q2 = 'caution';

  // Q3: pricing
  let q3: Health;
  if (s.q3MakerTaker === 'taker') q3 = 'danger';
  else if (s.q3RaisePrice === 'yes' && s.q3MakerTaker === 'maker' && s.q3Undercut.trim().length >= 20)
    q3 = 'healthy';
  else q3 = 'caution';

  // Q4: downside
  const survives30 = ue.monthlyProfit >= 0 || s.q4Runway >= 6;
  let q4: Health;
  if (s.q4Runway >= 12 && survives30) q4 = 'healthy';
  else if (s.q4Runway >= 6 || survives30) q4 = 'caution';
  else q4 = 'danger';

  // Q5: distribution reality (auto-scored from distribution data)
  const channelNamed = !!d.primaryStrategyKey;
  const channelTested =
    d.channelTested.trim().length >= 3 && d.testResult.trim().length >= 3;
  const cacHealth = cacHealthForAnalysis(d.estimatedCAC, ue.contributionPerUnit);
  const cacOk = d.estimatedCAC > 0 && cacHealth === 'healthy';
  let q5: Health;
  if (channelNamed && channelTested && cacOk) q5 = 'healthy';
  else if (!channelNamed || cacHealth === 'danger') q5 = 'danger';
  else q5 = 'caution';

  // Overall (weighted) — q1, q4, q5 carry more weight
  const scoreMap = { healthy: 2, caution: 1, danger: 0 } as const;
  const weights = { q1: 3, q2: 2, q3: 2, q4: 3, q5: 3 };
  const raw =
    scoreMap[q1] * weights.q1 +
    scoreMap[q2] * weights.q2 +
    scoreMap[q3] * weights.q3 +
    scoreMap[q4] * weights.q4 +
    scoreMap[q5] * weights.q5;
  const max = 2 * (weights.q1 + weights.q2 + weights.q3 + weights.q4 + weights.q5);
  const ratio = raw / max;
  const anyDanger = [q1, q2, q3, q4, q5].includes('danger');
  let overall: Health;
  if (anyDanger) overall = 'danger';
  else if (ratio >= 0.8) overall = 'healthy';
  else overall = 'caution';
  return { q1, q2, q3, q4, q5, overall };
}

function healthLabel(h: Health): string {
  return h === 'healthy' ? 'Green' : h === 'caution' ? 'Yellow' : 'Red';
}

function FinalVerdict({
  analysis,
  score,
}: {
  analysis: BusinessAnalysis;
  score: Score;
}) {
  const ue = calcUnitEconomics(analysis);
  const verdicts: Record<Health, { title: string; body: string; icon: string }> = {
    healthy: {
      icon: '🟢',
      title: 'Green light — strong fundamentals',
      body: 'Unit economics work, there is a plausible moat, you have pricing power, and the downside is survivable. Move forward, but keep stress-testing as assumptions meet reality.',
    },
    caution: {
      icon: '🟡',
      title: 'Yellow light — viable but fragile',
      body: 'The model can work, but specific weaknesses need fixing before you commit real capital. Identify the weakest link below and address it first.',
    },
    danger: {
      icon: '🔴',
      title: 'Red light — structurally broken',
      body: 'One or more fundamentals are broken. Patching around it will not save the business. Rework the model — or pick a different one.',
    },
  };
  const vr = verdicts[score.overall];

  const issues: string[] = [];
  if (score.q1 === 'danger') issues.push('Unit economics do not work, or the numbers are unvalidated guesses.');
  if (score.q1 === 'caution') issues.push('Unit economics are borderline, or you have not validated them with real data.');
  if (score.q2 === 'danger') issues.push('No moat selected — margins will be competed to zero.');
  if (score.q2 === 'caution') issues.push('Moat is unclear or unexplained. Name it precisely or you do not have one.');
  if (score.q3 === 'danger') issues.push('You are a price-taker. You cannot control your own margin.');
  if (score.q3 === 'caution') issues.push('Pricing power is weak or uncertain. Find a reason customers pay more.');
  if (score.q4 === 'danger') issues.push('Downside kills you — insufficient runway, no survival path in a downturn.');
  if (score.q4 === 'caution') issues.push('Downside is survivable but tight. A single bad quarter could end the business.');
  if (score.q5 === 'danger') issues.push('No plausible way to reach customers at a cost the margins can absorb.');
  if (score.q5 === 'caution') issues.push('Distribution is vague or untested — you are guessing at CAC.');

  const recs: string[] = [];
  if (ue.contributionMarginPct < 20)
    recs.push('Either raise price or cut variable cost until contribution margin clears 20%.');
  if (!isFinite(ue.breakevenUnits))
    recs.push('Contribution is ≤ 0 per unit — every sale loses money. Fix this before anything else.');
  if (analysis.scorecard.q2Moats.includes('none'))
    recs.push('Invest in building at least one moat (brand, switching cost, data, scale, regulatory).');
  if (analysis.scorecard.q3MakerTaker === 'taker')
    recs.push('Differentiate or segment so you stop being a price-taker.');
  if (analysis.scorecard.q4Runway < 6)
    recs.push('Build to at least 6 months of runway before launching, 12 if unproven.');
  if (!analysis.distribution.primaryStrategyKey)
    recs.push('Pick a primary distribution channel and run one real test — plans do not count.');
  else if (analysis.distribution.estimatedCAC > 0 && ue.contributionPerUnit > 0) {
    const ratio = analysis.distribution.estimatedCAC / ue.contributionPerUnit;
    if (ratio > 8)
      recs.push(
        `CAC is ${ratio.toFixed(1)}× contribution per unit — either push contribution up, CAC down, or pick a cheaper channel.`
      );
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{vr.icon}</div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{vr.title}</div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{vr.body}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
        <ScorePill label="Q1 Unit econ" health={score.q1} />
        <ScorePill label="Q2 Moat" health={score.q2} />
        <ScorePill label="Q3 Pricing" health={score.q3} />
        <ScorePill label="Q4 Downside" health={score.q4} />
        <ScorePill label="Q5 Distribution" health={score.q5} />
      </div>
      {(issues.length > 0 || recs.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">What's broken</div>
            <ul className="list-disc ml-5 text-sm space-y-1">
              {issues.length ? issues.map((i) => <li key={i}>{i}</li>) : <li className="text-slate-500">Nothing flagged.</li>}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Specific fixes</div>
            <ul className="list-disc ml-5 text-sm space-y-1">
              {recs.length ? recs.map((r) => <li key={r}>{r}</li>) : <li className="text-slate-500">No specific fixes suggested.</li>}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

function ScorePill({ label, health }: { label: string; health: Health }) {
  const bg =
    health === 'healthy'
      ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900'
      : health === 'caution'
      ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900'
      : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900';
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${bg}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="font-semibold">{healthLabel(health)}</div>
    </div>
  );
}
