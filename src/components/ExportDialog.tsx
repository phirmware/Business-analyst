import { useState } from 'react';
import type { BusinessAnalysis } from '../types';
import { createExportFile, downloadExportFile } from '../export-import';
import { Button, Field, TextInput, inputClass } from './ui';

export function ExportDialog({
  analysis,
  onClose,
  onExported,
}: {
  analysis: BusinessAnalysis;
  onClose: () => void;
  onExported: () => void;
}) {
  const [editorName, setEditorName] = useState('');
  const [notes, setNotes] = useState('');
  const [includeChat, setIncludeChat] = useState(false);

  const handleDownload = () => {
    const file = createExportFile(analysis, {
      editorName,
      notes,
      includeChat,
      existingHistory: analysis.editHistory,
    });
    downloadExportFile(file);
    onExported();
    onClose();
  };

  const editCount = (analysis.editHistory ?? []).length;

  return (
    <DialogOverlay onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-1">Export Analysis</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Download <strong>{analysis.name}</strong> as a portable JSON file you can share with a
          collaborator. They can fill in additional sections and send it back.
        </p>

        {editCount > 0 && (
          <div className="mb-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2">
            This analysis has been exported and re-imported {editCount} time
            {editCount !== 1 ? 's' : ''} before. A new entry will be appended to its edit history.
          </div>
        )}

        <div className="space-y-4 mb-4">
          <Field label="Your name (optional — shown in the file's edit history)">
            <TextInput
              value={editorName}
              onChange={setEditorName}
              placeholder="e.g. Sam"
            />
          </Field>
          <Field label="Export notes (optional)">
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please fill in the Distribution Planner section"
            />
          </Field>
          <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              checked={includeChat}
              onChange={(e) => setIncludeChat(e.target.checked)}
            />
            <span>
              Include AI Advisor chat history{' '}
              <span className="text-slate-400 text-xs">(may contain sensitive details)</span>
            </span>
          </label>
          {includeChat && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-2">
              Your AI conversations will be included in the file.
            </p>
          )}
        </div>

        <div className="rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 mb-5">
          This file contains all the analysis data for this business. Don't share it publicly if
          you've entered sensitive information.
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>Download</Button>
        </div>
      </div>
    </DialogOverlay>
  );
}

export function DialogOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        {children}
      </div>
    </div>
  );
}
