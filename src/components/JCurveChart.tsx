import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { JCurvePoint } from '../types';
import { getJCurveStats } from '../calculations';

function fmtGBP(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}£${(abs / 1_000).toFixed(1)}k`;
  return `${sign}£${abs.toFixed(0)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const cumulative: number = payload[0]?.payload?.cumulative ?? 0;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-slate-600 dark:text-slate-400 mb-1">Month {label}</div>
      <div className={`font-semibold ${cumulative >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        Cumulative: {fmtGBP(cumulative)}
      </div>
    </div>
  );
}

export function JCurveChart({ points }: { points: JCurvePoint[] }) {
  const stats = getJCurveStats(points);
  const neverRecovers = stats.setupRecoveryMonth === Infinity;
  const neverOp = stats.operationalBreakevenMonth === Infinity;

  const chartData = points.map((p) => ({
    month: p.month,
    neg: Math.min(0, p.cumulative),
    pos: Math.max(0, p.cumulative),
    cumulative: p.cumulative,
  }));

  const opMonth = isFinite(stats.operationalBreakevenMonth) ? stats.operationalBreakevenMonth : null;
  const recMonth = isFinite(stats.setupRecoveryMonth) ? stats.setupRecoveryMonth : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Cumulative cash (J-curve)
        </h4>
        <div className="flex items-center gap-3 ml-auto text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-300" /> Cash in
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-400" /> Cash produced
          </span>
        </div>
      </div>

      {neverRecovers && (
        <div className="mb-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
          {neverOp
            ? 'Business does not reach operational breakeven within 60 months at this customer ramp.'
            : 'Business reaches monthly profitability but does not fully recover setup costs within 60 months.'}
        </div>
      )}

      {/* Legend for reference lines */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-2">
        {opMonth && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-dashed border-indigo-500" />
            Month {opMonth}: monthly profit turns positive
          </span>
        )}
        {recMonth && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-green-600" />
            Month {recMonth}: setup costs fully recovered
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `M${v}`}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={fmtGBP}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Red fill below zero */}
          <Area
            type="monotone"
            dataKey="neg"
            fill="#fca5a5"
            stroke="none"
            fillOpacity={0.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />
          {/* Green fill above zero */}
          <Area
            type="monotone"
            dataKey="pos"
            fill="#86efac"
            stroke="none"
            fillOpacity={0.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />

          {/* The actual J-curve line */}
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#475569"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            legendType="none"
          />

          {/* Zero baseline */}
          <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />

          {/* Operational breakeven */}
          {opMonth && (
            <ReferenceLine
              x={opMonth}
              stroke="#6366f1"
              strokeDasharray="5 3"
              strokeWidth={1.5}
            />
          )}

          {/* Setup recovery */}
          {recMonth && (
            <ReferenceLine
              x={recMonth}
              stroke="#16a34a"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
