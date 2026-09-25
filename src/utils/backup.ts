import type { AppState } from '../types';

const BACKUP_VERSION = 1;

export interface BackupFile {
  app: 'DENGE';
  version: number;
  exportedAt: string;
  data: AppState;
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.transactions) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.budgets) &&
    Array.isArray(v.goals) &&
    !!v.settings &&
    typeof v.settings === 'object'
  );
}

function normalizeImported(data: AppState): AppState {
  return {
    ...data,
    debts: data.debts ?? [],
    receivables: data.receivables ?? [],
    installments: data.installments ?? [],
  };
}

export function buildBackup(state: AppState): BackupFile {
  return {
    app: 'DENGE',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
}

export function parseBackup(raw: string): AppState {
  const parsed = JSON.parse(raw) as unknown;

  if (isAppState(parsed)) return normalizeImported(parsed);

  if (parsed && typeof parsed === 'object') {
    const file = parsed as Partial<BackupFile>;
    if (file.app === 'DENGE' && isAppState(file.data)) {
      return normalizeImported(file.data);
    }
  }

  throw new Error('Geçersiz yedek dosyası');
}

export function downloadBackup(state: AppState) {
  const backup = buildBackup(state);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `denge-yedek-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseBackup(String(reader.result ?? '')));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsText(file);
  });
}
