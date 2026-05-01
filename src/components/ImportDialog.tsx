import { useRef, useState } from 'react';
import type { BusinessAnalysis } from '../types';
import type { ExportFile } from '../export-import';
import { validateImportFile } from '../export-import';
import { uid, hydrate } from '../storage';
import { Button } from './ui';
import { DialogOverlay } from './ExportDialog';

type Step = 'pick' | 'preview' | 'collision';

export function ImportDialog({
  existingAnalyses,
  onImport,
  onClose,
}: {
  existingAnalyses: BusinessAnalysis[];
  onImport: (business: BusinessAnalysis, replaceId?: string) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>('pick');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [parsedFile, setParsedFile] = useState<ExportFile | null>(null);
  const [versionWarning, setVersionWarning] = useState('');
  const [collision, setCollision] = useState<BusinessAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please select a .json file exported from this app.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const result = validateImportFile(raw);
        if (result.kind === 'invalid') {
          setError(result.reason);
          return;
        }
        setError('');
        if (result.kind === 'newer') {
          setVersionWarning(
            'This file was created with a newer version of the app. Some data may not be recognised.'
          );
        } else if (result.kind === 'older') {
          setVersionWarning(
            'This file was created with an older version of the app. It will be migrated automatically.'
          );
        } else {
          setVersionWarning('');
        }
        setParsedFile(result.file);
        const existing = existingAnalyses.find(
          (a) => a.id === result.file.business.id
        );
        if (existing) {
          setCollision(existing);
          setStep('collision');
        } else {
          setStep('preview');
        }
      } catch {
        setError('Could not parse the file. Make sure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const doImport = (opts: { copy: boolean; replaceId?: string }) => {
    if (!parsedFile) return;
    let business = hydrate({
      ...parsedFile.business,
      editHistory: parsedFile.editHistory,
    });
    if (opts.copy) {
      business = {
        ...business,
        id: uid(),
        name: business.name + ' (Imported)',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    onImport(business, opts.replaceId);
  };

  const lastEditor =
    parsedFile?.editHistory?.length
      ? parsedFile.editHistory[parsedFile.editHistory.length - 1]
      : null;

  return (
    <DialogOverlay onClose={onClose}>
      <div className="p-6">
        {step === 'pick' && (
          <>
            <h2 className="text-lg font-semibold mb-1">Import Analysis</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Open a <strong>.json</strong> file exported from Business Reality Check.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition ${
                dragging
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="text-3xl">📂</span>
              <span className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Drop a file here, or tap to browse
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </>
        )}

        {step === 'preview' && parsedFile && (
          <>
            <h2 className="text-lg font-semibold mb-1">Review Import</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Confirm details before adding this analysis to your library.
            </p>

            <div className="rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 mb-4 space-y-1.5">
              <div className="font-semibold text-sm">{parsedFile.business.name}</div>
              {lastEditor && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Last edited by <strong>{lastEditor.editor}</strong> on{' '}
                  {new Date(lastEditor.editedAt).toLocaleDateString()}
                  {lastEditor.notes && ` — "${lastEditor.notes}"`}
                </div>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Exported {new Date(parsedFile.exportedAt).toLocaleString()}
              </div>
              {parsedFile.editHistory.length > 0 && (
                <div className="text-xs text-slate-400">
                  {parsedFile.editHistory.length} edit{parsedFile.editHistory.length !== 1 ? 's' : ''} in history
                </div>
              )}
            </div>

            {versionWarning && (
              <div className="mb-4 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                {versionWarning}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={() => doImport({ copy: false })}>Import</Button>
            </div>
          </>
        )}

        {step === 'collision' && parsedFile && collision && (
          <>
            <h2 className="text-lg font-semibold mb-1">Analysis Already Exists</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              You already have an analysis with the same ID. Choose how to proceed.
            </p>

            <div className="rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 mb-4 space-y-3 text-xs">
              <div>
                <div className="font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] mb-1">Your version</div>
                <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{collision.name}</div>
                <div className="text-slate-500 dark:text-slate-400">
                  Updated {new Date(collision.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <div className="font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] mb-1">Imported version</div>
                <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{parsedFile.business.name}</div>
                {lastEditor ? (
                  <div className="text-slate-500 dark:text-slate-400">
                    Edited by <strong>{lastEditor.editor}</strong> on{' '}
                    {new Date(lastEditor.editedAt).toLocaleString()}
                    {lastEditor.notes && ` — "${lastEditor.notes}"`}
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400">
                    Exported {new Date(parsedFile.exportedAt).toLocaleString()}
                  </div>
                )}
                {(() => {
                  const importedTime = lastEditor
                    ? new Date(lastEditor.editedAt).getTime()
                    : new Date(parsedFile.exportedAt).getTime();
                  const diff = importedTime - collision.updatedAt;
                  if (Math.abs(diff) < 60_000) return null;
                  return (
                    <div className={`mt-1 font-medium ${diff > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {diff > 0 ? '↑ Imported is newer' : '↓ Imported is older'}
                    </div>
                  );
                })()}
              </div>
            </div>

            {versionWarning && (
              <div className="mb-4 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                {versionWarning}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="secondary" onClick={() => doImport({ copy: true })}>
                Import as copy
              </Button>
              <Button
                variant="danger"
                onClick={() => doImport({ copy: false, replaceId: collision.id })}
              >
                Replace existing
              </Button>
            </div>
          </>
        )}
      </div>
    </DialogOverlay>
  );
}
