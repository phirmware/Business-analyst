import { useEffect, useMemo, useState, useCallback, useReducer } from 'react';
import type { AppSettings, BusinessAnalysis, Section } from './types';
import {
  defaultSettings,
  loadAnalyses,
  loadSettings,
  saveAnalyses,
  saveSettings,
  uid,
} from './storage';
import { newAnalysis } from './constants';
import { Analyzer } from './sections/Analyzer';
import { IdeaFilter } from './sections/IdeaFilter';
import { StressTest } from './sections/StressTest';
import { Scorecard } from './sections/Scorecard';
import { Distribution } from './sections/Distribution';
import { Library } from './sections/Library';
import { AIAdvisor } from './sections/AIAdvisor';
import { Compare } from './sections/Compare';
import { Settings as SettingsView } from './sections/Settings';
import { Onboarding } from './sections/Onboarding';
import { Button } from './components/ui';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'filter', label: 'Idea Filter', icon: '🧪' },
  { key: 'analyzer', label: 'Analyzer', icon: '📊' },
  { key: 'stress', label: 'Stress Test', icon: '🔥' },
  { key: 'scorecard', label: 'Scorecard', icon: '📝' },
  { key: 'distribute', label: 'Distribution', icon: '📣' },
  { key: 'library', label: 'Learning Library', icon: '📚' },
  { key: 'ai', label: 'AI Advisor', icon: '🤖' },
  { key: 'compare', label: 'Compare', icon: '⚖️' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

interface Toast {
  id: number;
  message: string;
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [analyses, setAnalyses] = useState<BusinessAnalysis[]>([]);
  const [section, setSection] = useState<Section>('analyzer');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [, tick] = useReducer((x: number) => x + 1, 0);

  // Load from storage once on mount
  useEffect(() => {
    const s = loadSettings();
    const list = loadAnalyses();
    setSettings(s);
    setAnalyses(list);
    setLoaded(true);
  }, []);

  // Persist + track last-saved for the topbar indicator
  useEffect(() => {
    if (!loaded) return;
    saveSettings(settings);
    setLastSaved(Date.now());
  }, [settings, loaded]);
  useEffect(() => {
    if (!loaded) return;
    saveAnalyses(analyses);
    setLastSaved(Date.now());
  }, [analyses, loaded]);

  // Tick once every 15s so the "Saved X ago" label re-renders
  useEffect(() => {
    const t = setInterval(() => tick(), 15000);
    return () => clearInterval(t);
  }, []);

  // Multi-tab sync: reload when another tab writes to our storage keys
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'brc.analyses.v1') setAnalyses(loadAnalyses());
      if (e.key === 'brc.settings.v1') setSettings(loadSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings.darkMode]);

  const active = useMemo(
    () => analyses.find((a) => a.id === settings.activeId) || null,
    [analyses, settings.activeId]
  );

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  const updateActive = useCallback(
    (patch: Partial<BusinessAnalysis> | ((a: BusinessAnalysis) => BusinessAnalysis)) => {
      if (!active) return;
      setAnalyses((list) =>
        list.map((a) => {
          if (a.id !== active.id) return a;
          const updated = typeof patch === 'function' ? patch(a) : { ...a, ...patch };
          return { ...updated, updatedAt: Date.now() };
        })
      );
    },
    [active]
  );

  const createAnalysis = useCallback(
    (name?: string) => {
      const fresh = newAnalysis(name);
      setAnalyses((list) => [fresh, ...list]);
      setSettings((s) => ({ ...s, activeId: fresh.id }));
      setLastCreatedId(fresh.id);
      setSection('analyzer');
      showToast(`Created "${fresh.name}" — rename it to get started.`);
      return fresh;
    },
    [showToast]
  );

  const deleteAnalysis = useCallback(
    (id: string) => {
      const source = analyses.find((a) => a.id === id);
      setAnalyses((list) => list.filter((a) => a.id !== id));
      setSettings((s) => (s.activeId === id ? { ...s, activeId: null } : s));
      if (source) showToast(`Deleted "${source.name}".`);
    },
    [analyses, showToast]
  );

  const duplicateAnalysis = useCallback(
    (id: string) => {
      const source = analyses.find((a) => a.id === id);
      if (!source) return;
      const copy = {
        ...source,
        id: uid(),
        name: source.name + ' (copy)',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chat: [],
      };
      setAnalyses((list) => [copy, ...list]);
      setSettings((s) => ({ ...s, activeId: copy.id }));
      setLastCreatedId(copy.id);
      showToast(`Duplicated as "${copy.name}".`);
    },
    [analyses, showToast]
  );

  if (!loaded) return null;

  // Onboarding
  if (!settings.onboardingCompleted) {
    return (
      <Onboarding
        onComplete={(a) => {
          setAnalyses((list) => [a, ...list]);
          setSettings((s) => ({
            ...s,
            activeId: a.id,
            onboardingCompleted: true,
          }));
          setSection('analyzer');
        }}
        onSkip={() => {
          const fresh = newAnalysis('My business');
          setAnalyses((list) => [fresh, ...list]);
          setSettings((s) => ({
            ...s,
            activeId: fresh.id,
            onboardingCompleted: true,
          }));
          setSection('analyzer');
        }}
      />
    );
  }

  // Ensure there is an active analysis for sections that need it
  const needsActive = section !== 'library' && section !== 'settings' && section !== 'compare';
  if (needsActive && !active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">No analysis selected</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Create a new business analysis to get started.
          </p>
          <Button onClick={() => createAnalysis()}>+ New analysis</Button>
        </div>
      </div>
    );
  }

  const shouldAutoFocusName = !!(active && lastCreatedId === active.id);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="flex items-center gap-3 px-4 md:px-6 py-3">
          <button
            className="md:hidden p-1 text-slate-600 dark:text-slate-300"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧮</span>
            <span className="font-semibold hidden sm:inline">Business Reality Check</span>
          </div>
          <div className="flex-1" />
          <SavedIndicator lastSaved={lastSaved} />
          <BusinessSelector
            analyses={analyses}
            activeId={settings.activeId}
            onSelect={(id) => setSettings((s) => ({ ...s, activeId: id }))}
            onNew={() => createAnalysis()}
            onDuplicate={duplicateAnalysis}
            onDelete={deleteAnalysis}
          />
          <Button
            variant="ghost"
            onClick={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))}
            className="!px-2"
          >
            {settings.darkMode ? '☀️' : '🌙'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } md:block w-56 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shrink-0 no-print`}
        >
          <nav className="flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSection(s.key);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition ${
                  section === s.key
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {section === 'filter' && active && (
            <IdeaFilter
              analysis={active}
              onChange={updateActive}
              onGoToAnalyzer={() => setSection('analyzer')}
            />
          )}
          {section === 'analyzer' && active && (
            <Analyzer
              analysis={active}
              onChange={updateActive}
              autoFocusName={shouldAutoFocusName}
            />
          )}
          {section === 'stress' && active && (
            <StressTest analysis={active} />
          )}
          {section === 'scorecard' && active && (
            <Scorecard analysis={active} onChange={updateActive} />
          )}
          {section === 'distribute' && active && (
            <Distribution analysis={active} onChange={updateActive} />
          )}
          {section === 'library' && <Library />}
          {section === 'ai' && active && (
            <AIAdvisor
              analysis={active}
              onChange={updateActive}
              settings={settings}
              onSettings={() => setSection('settings')}
            />
          )}
          {section === 'compare' && <Compare analyses={analyses} />}
          {section === 'settings' && (
            <SettingsView settings={settings} onChange={setSettings} />
          )}
        </main>
      </div>

      <ToastView toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function SavedIndicator({ lastSaved }: { lastSaved: number | null }) {
  if (!lastSaved) return null;
  return (
    <span
      className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 px-2 tabular-nums"
      title={new Date(lastSaved).toLocaleString()}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-healthy" />
      Saved {relativeTime(lastSaved)}
    </span>
  );
}

function relativeTime(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: Toast | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast?.id, onDismiss]);
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-xs no-print"
    >
      {toast.message}
    </div>
  );
}

function BusinessSelector({
  analyses,
  activeId,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
}: {
  analyses: BusinessAnalysis[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = analyses.find((a) => a.id === activeId);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 max-w-[200px]"
      >
        <span className="font-medium truncate">{active?.name || 'No analysis'}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg z-20">
            <div className="p-2 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  onNew();
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                + New analysis
              </button>
            </div>
            <div className="p-1">
              {analyses.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500">No saved analyses yet.</div>
              )}
              {analyses.map((a) => (
                <div
                  key={a.id}
                  className={`group flex items-start justify-between gap-2 px-2 py-1.5 rounded-md text-sm ${
                    a.id === activeId ? 'bg-indigo-50 dark:bg-indigo-950/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      onSelect(a.id);
                      setOpen(false);
                    }}
                  >
                    <div className="font-medium truncate">{a.name}</div>
                    <div className="text-xs text-slate-500">
                      Updated {new Date(a.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      title="Duplicate"
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => onDuplicate(a.id)}
                    >
                      ⧉
                    </button>
                    <button
                      title="Delete"
                      className="text-xs text-slate-500 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Delete "${a.name}"?`)) onDelete(a.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
