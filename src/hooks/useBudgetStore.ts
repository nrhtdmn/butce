import { useCallback, useEffect, useMemo, useState } from 'react';
import { seedState } from '../data/seed';
import type {
  AppSettings,
  AppState,
  Budget,
  Category,
  Goal,
  Transaction,
} from '../types';
import { currentMonth, uid } from '../utils/format';

const STORAGE_KEY = 'denge-budget-v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
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

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetData = useCallback(() => {
    setState(structuredClone(seedState));
  }, []);

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
    updateSettings,
    resetData,
    spentByCategory,
  };
}

export type BudgetStore = ReturnType<typeof useBudgetStore>;
