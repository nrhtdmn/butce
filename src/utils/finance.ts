import type { AppState, Bill, Category, Transaction, TransactionType } from '../types';
import { uid } from './format';

const SYSTEM_CATS: Record<
  string,
  { name: string; type: TransactionType; icon: string; color: string }
> = {
  debt: { name: 'Borç ödemesi', type: 'expense', icon: 'wallet', color: '#E76F51' },
  installment: { name: 'Taksit', type: 'expense', icon: 'bag', color: '#457B9D' },
  bill: { name: 'Fatura / Ekstre', type: 'expense', icon: 'bolt', color: '#E9C46A' },
  receivable: { name: 'Alacak tahsilatı', type: 'income', icon: 'trending', color: '#2A9D8F' },
};

export function ensureSystemCategory(
  categories: Category[],
  key: keyof typeof SYSTEM_CATS,
): { categories: Category[]; categoryId: string } {
  const def = SYSTEM_CATS[key];
  const existing = categories.find((c) => c.name === def.name && c.type === def.type);
  if (existing) return { categories, categoryId: existing.id };
  const cat: Category = { id: uid('c'), ...def };
  return { categories: [...categories, cat], categoryId: cat.id };
}

export function makeTx(
  categoryId: string,
  amount: number,
  type: TransactionType,
  note: string,
  date = new Date().toISOString().slice(0, 10),
): Transaction {
  return { id: uid('t'), amount, type, categoryId, note, date };
}

export function installmentRemaining(i: {
  totalAmount: number;
  monthlyAmount: number;
  totalCount: number;
  paidCount: number;
}): number {
  return Math.max(0, (i.totalCount - i.paidCount) * i.monthlyAmount);
}

export function unpaidBillsTotal(bills: Bill[]): number {
  return bills.filter((b) => b.status === 'pending').reduce((s, b) => s + b.amount, 0);
}

export function normalizeAppState(raw: Partial<AppState> | null, fallback: AppState): AppState {
  if (!raw) return structuredClone(fallback);
  return {
    settings: { ...fallback.settings, ...raw.settings },
    transactions: raw.transactions ?? [],
    categories: raw.categories ?? [],
    budgets: raw.budgets ?? [],
    goals: raw.goals ?? [],
    debts: raw.debts ?? [],
    receivables: raw.receivables ?? [],
    installments: raw.installments ?? [],
    bills: raw.bills ?? [],
  };
}
