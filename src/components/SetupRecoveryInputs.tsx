import { useState } from 'react';
import type { BusinessAnalysis, CustomerRampModel, SetupRecovery } from '../types';
import { isUsageMode } from '../calculations';
import { inputClass } from './ui';

const CUSTOM_MONTHS = [1, 3, 6, 12, 24] as const;

export function SetupRecoveryInputs({
  analysis,
  onChange,
}: {
  analysis: BusinessAnalysis;
  onChange: (patch: Partial<BusinessAnalysis>) => void;
}) {
  const [open, setOpen] = useState(false);
  const r = analysis.setupRecovery;
  const usageMode = isUsageMode(analysis);
  // Constant mode follows the main monthly volume input — one source of truth.
  const constantVolume = Math.max(0, analysis.unitsPerMonth || 0);
  const volumeLabel = usageMode ? 'paying customers' : (analysis.unitDefinition || 'unit') + 's';
  const volumeInputName = usageMode ? '"Paying customers / month"' : '"Units sold per month"';

  const update = (patch: Partial<SetupRecovery>) =>
    onChange({ setupRecovery: { ...r, ...patch } });

  const updateCustomPoint = (idx: number, value: number) => {
    const pts = [...r.customPoints] as [number, number, number, number, number];
    pts[idx] = Math.max(0, value);
    update({ customPoints: pts });
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            How does your monthly volume develop?
          </span>
          <span className="ml-2 text-xs text-slate-400">
            {r.rampModel === 'steady'
              ? `Constant ${constantVolume} ${volumeLabel}/month (your monthly volume)`
              : r.rampModel === 'linear'
              ? `${r.linearStart} → ${r.linearEnd} over 12 months`
              : 'Custom ramp'}
          </span>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Used only to model how the setup cost is recovered over time (the J-curve below).
            Volume here means {volumeLabel} per month.
          </p>

          {/* Model selector */}
          <div className="flex flex-wrap gap-3">
            {(
              [
                { key: 'steady', label: 'Constant (no growth)' },
                { key: 'linear', label: 'Linear ramp' },
                { key: 'custom', label: 'Custom' },
              ] as { key: CustomerRampModel; label: string }[]
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="rampModel"
                  value={key}
                  checked={r.rampModel === key}
                  onChange={() => update({ rampModel: key })}
                  className="accent-indigo-600"
                />
                {label}
              </label>
            ))}
          </div>

          {/* Constant — reads the main monthly volume input, no separate number */}
          {r.rampModel === 'steady' && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 max-w-lg">
              <div className="text-sm text-slate-700 dark:text-slate-200">
                Uses your monthly volume from above:{' '}
                <strong>
                  {constantVolume} {volumeLabel}/month
                </strong>
                , the same every month.
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Right for businesses without a growth curve — a shortlet that gets booked
                roughly the same number of nights each month, a stall, a clinic at capacity.
                There is one number to keep honest: {volumeInputName}. To see how bad months
                hit it, use the Stress Test.
              </p>
            </div>
          )}

          {/* Linear ramp */}
          {r.rampModel === 'linear' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Volume at month 1
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={r.linearStart}
                  onChange={(e) => update({ linearStart: Math.max(0, Number(e.target.value)) })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Volume at month 12
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={r.linearEnd}
                  onChange={(e) => update({ linearEnd: Math.max(0, Number(e.target.value)) })}
                />
              </div>
              <p className="col-span-full text-xs text-slate-400">
                Linearly interpolated month by month. Held constant after month 12. Note this is
                separate from the monthly volume above — the headline metrics use that number,
                the J-curve uses this ramp.
              </p>
            </div>
          )}

          {/* Custom */}
          {r.rampModel === 'custom' && (
            <div>
              <table className="text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 dark:text-slate-400">
                    <th className="text-left pr-6 pb-1 font-medium">Month</th>
                    <th className="text-left pb-1 font-medium">Volume ({volumeLabel})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {CUSTOM_MONTHS.map((m, i) => (
                    <tr key={m}>
                      <td className="py-1.5 pr-6 text-slate-600 dark:text-slate-300">
                        Month {m}
                      </td>
                      <td className="py-1.5">
                        <input
                          type="number"
                          min={0}
                          className={`${inputClass} w-28`}
                          value={r.customPoints[i]}
                          onChange={(e) => updateCustomPoint(i, Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-400 mt-2">
                Values between months are linearly interpolated.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
