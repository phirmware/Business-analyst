import type { BusinessAnalysis, EditHistoryEntry } from './types';

export const SCHEMA_VERSION = 1;
const MAGIC = 'business-reality-check' as const;
const APP_VERSION = '1.0.0';

export interface ExportFile {
  magic: typeof MAGIC;
  schemaVersion: number;
  exportedAt: string;    // ISO 8601
  exportedBy: string;
  appVersion: string;
  business: BusinessAnalysis;
  editHistory: EditHistoryEntry[];
}

export interface ExportOptions {
  editorName: string;
  notes: string;
  includeChat: boolean;
  existingHistory?: EditHistoryEntry[];
}

export type ImportValidation =
  | { kind: 'ok'; file: ExportFile }
  | { kind: 'invalid'; reason: string }
  | { kind: 'older'; file: ExportFile }
  | { kind: 'newer'; file: ExportFile };

export function createExportFile(
  analysis: BusinessAnalysis,
  opts: ExportOptions
): ExportFile {
  const business: BusinessAnalysis = opts.includeChat
    ? analysis
    : { ...analysis, chat: [] };

  const newEntry: EditHistoryEntry = {
    editor: opts.editorName || 'Anonymous',
    editedAt: new Date().toISOString(),
    notes: opts.notes || 'Exported analysis',
  };

  return {
    magic: MAGIC,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: opts.editorName,
    appVersion: APP_VERSION,
    business,
    editHistory: [...(opts.existingHistory ?? []), newEntry],
  };
}

export function downloadExportFile(file: ExportFile): void {
  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFilename(file.business.name);
  link.click();
  URL.revokeObjectURL(url);
}

export function exportFilename(name: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `business-reality-check_${slugify(name)}_${today}.json`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'analysis';
}

export function validateImportFile(raw: unknown): ImportValidation {
  if (!raw || typeof raw !== 'object') {
    return { kind: 'invalid', reason: 'Not a valid JSON object.' };
  }
  const f = raw as Record<string, unknown>;
  if (f.magic !== MAGIC) {
    return {
      kind: 'invalid',
      reason:
        "This doesn't look like a Business Reality Check export file. Make sure it ends in .json and was exported from this app.",
    };
  }
  if (typeof f.schemaVersion !== 'number') {
    return { kind: 'invalid', reason: 'Missing schemaVersion field.' };
  }
  if (!f.business || typeof f.business !== 'object') {
    return { kind: 'invalid', reason: 'Missing business data.' };
  }
  const typed = raw as ExportFile;
  if (f.schemaVersion > SCHEMA_VERSION) return { kind: 'newer', file: typed };
  if (f.schemaVersion < SCHEMA_VERSION) return { kind: 'older', file: typed };
  return { kind: 'ok', file: typed };
}
