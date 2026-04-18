import { useMemo } from 'react';
import type { BusinessAnalysis, IdeaFilterData, YesNoUnsure } from '../types';
import { TOOLTIPS } from '../constants';
import type { Health } from '../calculations';
import {
  Card,
  Field,
  HealthBadge,
  NumberInput,
  TextInput,
  Tooltip,
} from '../components/ui';

type Verdict = 'pursue' | 'investigate' | 'drop';

export function IdeaFilter({
  analysis,
  onChange,
  onGoToAnalyzer,
}: {
  analysis: BusinessAnalysis;
  onChange: (
    patch: Partial<BusinessAnalysis> | ((a: BusinessAnalysis) => BusinessAnalysis)
  ) => void;
  onGoToAnalyzer: () => void;
}) {
  const f = analysis.ideaFilter;
  const { problem, wtp, reach, verdict } = useMemo(() => score(f), [f]);

  const update = (patch: Partial<IdeaFilterData>) =>
    onChange({ ideaFilter: { ...analysis.ideaFilter, ...patch } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Idea Filter</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Three filters before you model unit economics. If the problem isn't real, people
          won't pay, or you can't reach them — no spreadsheet fixes that.
        </p>
      </div>

      <VerdictCard verdict={verdict} f={f} onGoToAnalyzer={onGoToAnalyzer} />

      {/* Filter 1 — problem */}
      <Card
        title="Filter 1 · Is the problem acute, frequent, AND expensive?"
        right={<HealthBadge health={problem} label={healthLabel(problem)} />}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          All three must be true. Missing one usually means the problem is real but not
          worth paying to solve.
        </p>
        <Field label="One-line problem statement (whose problem, what pain)">
          <TextInput
            value={f.problemStatement}
            onChange={(v) => update({ problemStatement: v })}
            placeholder="e.g. Small landlords lose 2-3 days of rent every handover"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <YesNoField
            label="Acute?"
            tooltip={TOOLTIPS.problemAcute}
            value={f.problemAcute}
            onChange={(v) => update({ problemAcute: v })}
          />
          <YesNoField
            label="Frequent?"
            tooltip={TOOLTIPS.problemFrequent}
            value={f.problemFrequent}
            onChange={(v) => update({ problemFrequent: v })}
          />
          <YesNoField
            label="Expensive?"
            tooltip={TOOLTIPS.problemExpensive}
            value={f.problemExpensive}
            onChange={(v) => update({ problemExpensive: v })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field
            label="Annual cost of the problem to one customer (£)"
            tooltip={TOOLTIPS.problemAnnualCost}
          >
            <NumberInput
              value={f.problemAnnualCost}
              onChange={(v) => update({ problemAnnualCost: v })}
            />
          </Field>
          <Field label="Evidence (conversations, data, workarounds you have seen)">
            <TextInput
              value={f.problemEvidence}
              onChange={(v) => update({ problemEvidence: v })}
              placeholder="Specific people, specific complaints, specific costs"
            />
          </Field>
        </div>
      </Card>

      {/* Filter 2 — WTP */}
      <Card
        title="Filter 2 · Will anyone actually pay?"
        right={<HealthBadge health={wtp} label={healthLabel(wtp)} />}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          "That's a great idea, I'd use it" is not willingness to pay. Money or a price
          attached to a commitment is.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <YesNoField
            label="Precedent — are they already paying something to manage this?"
            tooltip={TOOLTIPS.wtpPrecedent}
            value={f.wtpPrecedent}
            onChange={(v) => update({ wtpPrecedent: v })}
          />
          <YesNoField
            label='Commitment — has anyone said "I would pay £X"?'
            tooltip={TOOLTIPS.wtpCommitment}
            value={f.wtpCommitment}
            onChange={(v) => update({ wtpCommitment: v })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="Price at least one prospect named (£)" tooltip={TOOLTIPS.wtpPrice}>
            <NumberInput
              value={f.wtpPrice}
              onChange={(v) => update({ wtpPrice: v })}
            />
          </Field>
          <Field label="Evidence (competitors they pay, tools they use, direct quotes)">
            <TextInput
              value={f.wtpEvidence}
              onChange={(v) => update({ wtpEvidence: v })}
              placeholder="Quotes beat summaries"
            />
          </Field>
        </div>
        {priceVsCostFlag(f)}
      </Card>

      {/* Filter 3 — reach */}
      <Card
        title="Filter 3 · Can you actually reach them?"
        right={<HealthBadge health={reach} label={healthLabel(reach)} />}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          A real channel, a real list, a real outreach test. "Run some ads" is not a
          reachability plan.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <YesNoField
            label="Can you name 3+ places they spend time?"
            tooltip={TOOLTIPS.reachCanName}
            value={f.reachCanName}
            onChange={(v) => update({ reachCanName: v })}
          />
          <YesNoField
            label="Have you listed 20+ named prospects?"
            tooltip={TOOLTIPS.reachHaveList}
            value={f.reachHaveList}
            onChange={(v) => update({ reachHaveList: v })}
          />
          <YesNoField
            label="Have you actually tested outreach?"
            tooltip={TOOLTIPS.reachTestedOutreach}
            value={f.reachTestedOutreach}
            onChange={(v) => update({ reachTestedOutreach: v })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="Channels you believe work (comma-separated)">
            <TextInput
              value={f.reachChannels}
              onChange={(v) => update({ reachChannels: v })}
              placeholder="e.g. r/landlords, LinkedIn, local meetups"
            />
          </Field>
          <Field label="Evidence (replies, clicks, subscribers, conversations)">
            <TextInput
              value={f.reachEvidence}
              onChange={(v) => update({ reachEvidence: v })}
              placeholder="Numbers, not vibes"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}

function YesNoField({
  label,
  tooltip,
  value,
  onChange,
}: {
  label: string;
  tooltip?: string;
  value: YesNoUnsure;
  onChange: (v: YesNoUnsure) => void;
}) {
  const opts: { key: YesNoUnsure; label: string }[] = [
    { key: 'yes', label: 'Yes' },
    { key: 'unsure', label: 'Unsure' },
    { key: 'no', label: 'No' },
  ];
  return (
    <div>
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div className="flex gap-1">
        {opts.map((o) => {
          const active = value === o.key;
          const activeStyle =
            o.key === 'yes'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-800'
              : o.key === 'no'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-800'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800';
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(active ? '' : o.key)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs border transition ${
                active
                  ? activeStyle
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VerdictCard({
  verdict,
  f,
  onGoToAnalyzer,
}: {
  verdict: Verdict;
  f: IdeaFilterData;
  onGoToAnalyzer: () => void;
}) {
  const copy: Record<Verdict, { icon: string; title: string; body: string; health: Health }> = {
    pursue: {
      icon: '🟢',
      title: 'Pursue — the filter says go',
      body: 'Problem is real, someone will pay, you can reach them. Now model the unit economics and stress-test.',
      health: 'healthy',
    },
    investigate: {
      icon: '🟡',
      title: 'Investigate — close but not proven',
      body: 'At least one filter is unsure. Run the specific experiments below before building anything.',
      health: 'caution',
    },
    drop: {
      icon: '🔴',
      title: 'Drop — at least one filter is failing',
      body: "If the problem isn't acute/frequent/expensive, nobody will pay, or you can't reach them — you don't have a business. Pick a different idea.",
      health: 'danger',
    },
  };
  const v = copy[verdict];
  const gaps = listGaps(f);

  const disabled = !f.problemStatement.trim();

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{v.icon}</div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{v.title}</div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{v.body}</p>
        </div>
        {verdict === 'pursue' && (
          <button
            onClick={onGoToAnalyzer}
            className="self-start px-3 py-1.5 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition"
          >
            Open Analyzer →
          </button>
        )}
      </div>
      {gaps.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            What to do next
          </div>
          <ul className="list-disc ml-5 text-sm space-y-1">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}
      {disabled && (
        <div className="mt-3 text-xs text-slate-500">
          Write the one-line problem statement to activate the verdict.
        </div>
      )}
    </Card>
  );
}

// --- scoring -------------------------------------------------------------

function score(f: IdeaFilterData): {
  problem: Health;
  wtp: Health;
  reach: Health;
  verdict: Verdict;
} {
  const problem = scoreProblem(f);
  const wtp = scoreWtp(f);
  const reach = scoreReach(f);
  let verdict: Verdict;
  if ([problem, wtp, reach].includes('danger')) verdict = 'drop';
  else if (problem === 'healthy' && wtp === 'healthy' && reach === 'healthy')
    verdict = 'pursue';
  else verdict = 'investigate';
  return { problem, wtp, reach, verdict };
}

function scoreProblem(f: IdeaFilterData): Health {
  const answers = [f.problemAcute, f.problemFrequent, f.problemExpensive];
  const yes = answers.filter((a) => a === 'yes').length;
  const no = answers.filter((a) => a === 'no').length;
  if (no >= 1) return 'danger';
  if (yes === 3) return 'healthy';
  if (yes >= 1) return 'caution';
  return 'caution';
}

function scoreWtp(f: IdeaFilterData): Health {
  if (f.wtpPrecedent === 'no' && f.wtpCommitment === 'no') return 'danger';
  if (f.wtpPrecedent === 'yes' && f.wtpCommitment === 'yes') return 'healthy';
  if (f.wtpPrecedent === 'yes' || f.wtpCommitment === 'yes') return 'caution';
  return 'caution';
}

function scoreReach(f: IdeaFilterData): Health {
  if (f.reachCanName === 'no') return 'danger';
  const answers = [f.reachCanName, f.reachHaveList, f.reachTestedOutreach];
  const yes = answers.filter((a) => a === 'yes').length;
  if (yes === 3) return 'healthy';
  if (yes >= 1) return 'caution';
  return 'caution';
}

function priceVsCostFlag(f: IdeaFilterData) {
  if (f.wtpPrice <= 0 || f.problemAnnualCost <= 0) return null;
  const ratio = f.wtpPrice / f.problemAnnualCost;
  if (ratio > 0.4) {
    return (
      <div className="mt-3 rounded-md bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 p-3 text-xs text-yellow-800 dark:text-yellow-200">
        Quoted price is {(ratio * 100).toFixed(0)}% of the annual pain cost. Customers rarely pay
        more than 20-30% of the cost of the problem — pressure-test this number.
      </div>
    );
  }
  return null;
}

function listGaps(f: IdeaFilterData): string[] {
  const gaps: string[] = [];
  if (f.problemAcute !== 'yes')
    gaps.push('Confirm the problem is acute with at least 3 direct customer quotes.');
  if (f.problemFrequent !== 'yes')
    gaps.push('Confirm the problem hits often enough to stay top-of-mind.');
  if (f.problemExpensive !== 'yes')
    gaps.push('Estimate the £/year cost of the problem — if it is cheap, nobody will pay.');
  if (f.wtpPrecedent !== 'yes')
    gaps.push('Find 3 examples of customers already spending on this problem today.');
  if (f.wtpCommitment !== 'yes')
    gaps.push('Get one prospect to name a specific £ they would pay.');
  if (f.reachCanName !== 'yes')
    gaps.push('Identify 3 specific places your customer already gathers.');
  if (f.reachHaveList !== 'yes')
    gaps.push('Build a list of 20+ named prospects with contact info.');
  if (f.reachTestedOutreach !== 'yes')
    gaps.push('Run one real outreach test — cold email or DM — and log replies.');
  return gaps.slice(0, 5);
}

function healthLabel(h: Health): string {
  return h === 'healthy' ? 'Green' : h === 'caution' ? 'Yellow' : 'Red';
}
