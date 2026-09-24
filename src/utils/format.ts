import type { AppSettings } from '../types';

export function formatMoney(amount: number, settings: AppSettings): string {
  return new Intl.NumberFormat(settings.locale, {
    style: 'currency',
    currency: settings.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(iso: string, locale = 'tr-TR'): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function currentMonth(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(ym: string, locale = 'tr-TR'): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}
