import { useState } from 'react';
import type { BusinessAnalysis, Note, Section } from '../types';
import { uid } from '../storage';
import { Button, inputClass } from '../components/ui';

const TAGGABLE_SECTIONS: { key: Section; label: string }[] = [
  { key: 'filter', label: 'Idea Filter' },
  { key: 'analyzer', label: 'Analyzer' },
  { key: 'stress', label: 'Stress Test' },
  { key: 'scorecard', label: 'Scorecard' },
  { key: 'distribute', label: 'Distribution' },
  { key: 'ai', label: 'AI Advisor' },
];

function relativeDate(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return 'just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}

function tagLabel(key: Section | ''): string {
  return TAGGABLE_SECTIONS.find((s) => s.key === key)?.label ?? '';
}

export function Notes({
  analysis,
  onChange,
}: {
  analysis: BusinessAnalysis;
  onChange: (patch: Partial<BusinessAnalysis>) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    analysis.notes.length > 0 ? analysis.notes[0].id : null
  );

  const notes = analysis.notes;
  const selected = notes.find((n) => n.id === selectedId) ?? null;

  const addNote = () => {
    const note: Note = {
      id: uid(),
      title: '',
      content: '',
      sectionTag: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onChange({ notes: [note, ...notes] });
    setSelectedId(note.id);
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    onChange({
      notes: notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
      ),
    });
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    onChange({ notes: remaining });
    if (selectedId === id) {
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Notes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Record decisions, assumptions, and open questions for this analysis.
          Notes are included when you export.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 min-h-[500px]">
        {/* Left panel — note list */}
        <div className="md:w-64 shrink-0 flex flex-col gap-2">
          <Button onClick={addNote} className="w-full">+ New note</Button>

          {notes.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center mt-4">
              No notes yet.
            </p>
          ) : (
            <div className="flex flex-col gap-1 mt-1">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedId(note.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                    note.id === selectedId
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="font-medium truncate text-slate-800 dark:text-slate-100">
                    {note.title || 'Untitled note'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {note.sectionTag && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium">
                        {tagLabel(note.sectionTag)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {relativeDate(note.updatedAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel — editor */}
        <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              Select a note or create one
            </div>
          ) : (
            <div className="flex flex-col gap-4 h-full">
              <input
                type="text"
                className={inputClass}
                placeholder="Note title"
                value={selected.title}
                onChange={(e) => updateNote(selected.id, { title: e.target.value })}
              />

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tag to section (optional)
                </label>
                <select
                  className={inputClass}
                  value={selected.sectionTag}
                  onChange={(e) =>
                    updateNote(selected.id, { sectionTag: e.target.value as Section | '' })
                  }
                >
                  <option value="">No tag</option>
                  {TAGGABLE_SECTIONS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                className={`${inputClass} flex-1 resize-none min-h-[280px]`}
                placeholder="Write your note here — decisions, assumptions, open questions…"
                value={selected.content}
                onChange={(e) => updateNote(selected.id, { content: e.target.value })}
              />

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-400">
                  Last updated {relativeDate(selected.updatedAt)}
                </span>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Delete this note?')) deleteNote(selected.id);
                  }}
                >
                  Delete note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
