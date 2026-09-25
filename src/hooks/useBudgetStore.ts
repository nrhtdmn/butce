import { useCallback, useEffect, useMemo, useState } from 'react';
import { emptyState, seedState } from '../data/seed';
import type {
  AppSettings,
  AppState,
  Budget,
  Category,
  Debt,
  Goal,
  Installment,
  Receivable,
  Transaction,
} from '../types';
import { currentMonth, uid } from '../utils/format';

const STORAGE_KEY = 'denge-budget-v1';

function normalizeState(raw: Partial<AppState> | null): AppState {
  const base = structuredClone(seedState);
  if (!raw) return base;
  return {
    settings: { ...base.settings, ...raw.settings },
    transactions: raw.transactions ?? [],
    categories: raw.categories ?? [],
    budgets: raw.budgets ?? [],
    goals: raw.goals ?? [],
    debts: raw.debts ?? [],
    receivables: raw.receivables ?? [],
    installments: raw.installments ?? [],
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    /* ignore */
  }
  return structuredClone(seedState);
}

export function useBudgetStore() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const month = currentMonth();

  const monthTx = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(month)),
    [state.transactions, month],
  );

  const income = useMemo(
    () => monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTx],
  );

  const expense = useMemo(
    () => monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTx],
  );

  const balance = useMemo(() => {
    const allInc = state.transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const allExp = state.transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return state.settings.startBalance + allInc - allExp;
  }, [state.transactions, state.settings.startBalance]);

  const totalDebt = useMemo(
    () =>
      state.debts
        .filter((d) => d.status === 'active')
        .reduce((s, d) => s + d.remaining, 0),
    [state.debts],
  );

  const totalReceivable = useMemo(
    () =>
      state.receivables
        .filter((r) => r.status === 'active')
        .reduce((s, r) => s + r.remaining, 0),
    [state.receivables],
  );

  const monthlyInstallments = useMemo(
    () =>
      state.installments
        .filter((i) => i.status === 'active')
        .reduce((s, i) => s + i.monthlyAmount, 0),
    [state.installments],
  );

  const netWorth = balance - totalDebt + totalReceivable;

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    setState((s) => ({
      ...s,
      transactions: [{ ...tx, id: uid('t') }, ...s.transactions],
    }));
  }, []);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setState((s) => ({
      ...s,
      categories: [...s.categories, { ...cat, id: uid('c') }],
    }));
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      transactions: s.transactions.filter((t) => t.categoryId !== id),
      budgets: s.budgets.filter((b) => b.categoryId !== id),
    }));
  }, []);

  const upsertBudget = useCallback((budget: Omit<Budget, 'id'> & { id?: string }) => {
    setState((s) => {
      const existing = s.budgets.find(
        (b) => b.categoryId === budget.categoryId && b.month === budget.month,
      );
      if (existing) {
        return {
          ...s,
          budgets: s.budgets.map((b) =>
            b.id === existing.id ? { ...b, limit: budget.limit } : b,
          ),
        };
      }
      return {
        ...s,
        budgets: [...s.budgets, { ...budget, id: uid('b') }],
      };
    });
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setState((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    setState((s) => ({
      ...s,
      goals: [...s.goals, { ...goal, id: uid('g') }],
    }));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, []);

  const addDebt = useCallback((debt: Omit<Debt, 'id'>) => {
    setState((s) => ({ ...s, debts: [{ ...debt, id: uid('d') }, ...s.debts] }));
  }, []);

  const updateDebt = useCallback((id: string, patch: Partial<Debt>) => {
    setState((s) => ({
      ...s,
      debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setState((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) }));
  }, []);

  const addReceivable = useCallback((item: Omit<Receivable, 'id'>) => {
    setState((s) => ({
      ...s,
      receivables: [{ ...item, id: uid('r') }, ...s.receivables],
    }));
  }, []);

  const updateReceivable = useCallback((id: string, patch: Partial<Receivable>) => {
    setState((s) => ({
      ...s,
      receivables: s.receivables.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteReceivable = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      receivables: s.receivables.filter((r) => r.id !== id),
    }));
  }, []);

  const addInstallment = useCallback((item: Omit<Installment, 'id'>) => {
    setState((s) => ({
      ...s,
      installments: [{ ...item, id: uid('i') }, ...s.installments],
    }));
  }, []);

  const updateInstallment = useCallback((id: string, patch: Partial<Installment>) => {
    setState((s) => ({
      ...s,
      installments: s.installments.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const deleteInstallment = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      installments: s.installments.filter((i) => i.id !== id),
    }));
  }, []);

  const payInstallment = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      installments: s.installments.map((i) => {
        if (i.id !== id || i.status === 'paid') return i;
        const paidCount = Math.min(i.totalCount, i.paidCount + 1);
        const next = new Date(i.nextDueDate + 'T12:00:00');
        next.setMonth(next.getMonth() + 1);
        return {
          ...i,
          paidCount,
          nextDueDate: next.toISOString().slice(0, 10),
          status: paidCount >= i.totalCount ? 'paid' : 'active',
        };
      }),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetData = useCallback(() => {
    setState(structuredClone(emptyState));
  }, []);

  const importState = useCallback((next: AppState) => {
    setState(normalizeState(next));
  }, []);

  const getExportState = useCallback((): AppState => structuredClone(state), [state]);

  const spentByCategory = useCallback(
    (categoryId: string, forMonth = month) =>
      state.transactions
        .filter(
          (t) =>
            t.categoryId === categoryId &&
            t.type === 'expense' &&
            t.date.startsWith(forMonth),
        )
        .reduce((s, t) => s + t.amount, 0),
    [state.transactions, month],
  );

  return {
    ...state,
    month,
    monthTx,
    income,
    expense,
    balance,
    totalDebt,
    totalReceivable,
    monthlyInstallments,
    netWorth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    upsertBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addDebt,
    updateDebt,
    deleteDebt,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    payInstallment,
    updateSettings,
    resetData,
    importState,
    getExportState,
    spentByCategory,
  };
}

export type BudgetStore = ReturnType<typeof useBudgetStore>;
