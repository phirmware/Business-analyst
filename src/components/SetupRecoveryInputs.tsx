import { useState } from 'react';
import type { BusinessAnalysis, CustomerRampModel, SetupRecovery } from '../types';
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
            How fast will customers grow?
          </span>
          <span className="ml-2 text-xs text-slate-400">
            {r.rampModel === 'steady'
              ? `Steady ${r.steadyCustomers} customers`
              : r.rampModel === 'linear'
              ? `${r.linearStart} → ${r.linearEnd} customers over 12 months`
              : 'Custom ramp'}
          </span>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Used to model how setup costs are recovered over time. Customers here means paying
            customers (or units sold per month for flat pricing).
          </p>

          {/* Model selector */}
          <div className="flex flex-wrap gap-3">
            {(
              [
                { key: 'steady', label: 'Steady-state' },
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

          {/* Steady-state */}
          {r.rampModel === 'steady' && (
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Paying customers (constant)
              </label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={r.steadyCustomers}
                onChange={(e) => update({ steadyCustomers: Math.max(0, Number(e.target.value)) })}
              />
              <p className="text-xs text-slate-400 mt-1">
                Assumes this many customers from day one — optimistic, useful as a quick estimate.
              </p>
            </div>
          )}

          {/* Linear ramp */}
          {r.rampModel === 'linear' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Customers at month 1
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
                  Customers at month 12
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
                Linearly interpolated month by month. Held constant after month 12.
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
                    <th className="text-left pb-1 font-medium">Paying customers</th>
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
