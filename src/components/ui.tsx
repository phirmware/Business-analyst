import React from 'react';
import type { Health } from '../calculations';

export function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-block ml-1 align-middle group">
      <span className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">
        ⓘ
      </span>
      <span className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-72 rounded-lg bg-slate-900 text-slate-100 text-xs p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity dark:bg-slate-700">
        {text}
      </span>
    </span>
  );
}

export function Card({
  title,
  right,
  children,
  className = '',
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm ${className}`}
    >
      {(title || right) && (
        <div className="flex items-start justify-between mb-4 gap-3">
          {title && (
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {title}
            </h3>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Metric({
  label,
  value,
  sub,
  health,
  tooltip,
  large = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  health?: Health;
  tooltip?: string;
  large?: boolean;
}) {
  const healthClass =
    health === 'healthy'
      ? 'text-healthy'
      : health === 'caution'
      ? 'text-caution'
      : health === 'danger'
      ? 'text-danger'
      : 'text-slate-900 dark:text-slate-50';
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div
        className={`font-semibold ${healthClass} ${large ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export function HealthBadge({ health, label }: { health: Health; label: string }) {
  const classes = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    caution: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }[health];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${classes}`}>
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          health === 'healthy' ? 'bg-healthy' : health === 'caution' ? 'bg-caution' : 'bg-danger'
        }`}
      />
      {label}
    </span>
  );
}

export function Field({
  label,
  tooltip,
  children,
  className = '',
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  step = 'any',
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  min?: number;
  step?: string | number;
}) {
  return (
    <input
      type="number"
      className={inputClass}
      value={Number.isFinite(value) ? value : 0}
      min={min}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? 0 : parseFloat(v));
      }}
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      className={inputClass}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[] | T[];
}) {
  return (
    <select
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost:
      'hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
