import { useCallback, useEffect, useMemo, useState } from 'react';
import { emptyState, seedState } from '../data/seed';
import type {
  AppSettings,
  AppState,
  Bill,
  Budget,
  CalendarEvent,
  Category,
  Debt,
  Goal,
  Installment,
  Receivable,
  Transaction,
} from '../types';
import { currentMonth, uid } from '../utils/format';
import {
  ensureSystemCategory,
  installmentRemaining,
  makeTx,
  normalizeAppState,
  unpaidBillsTotal,
} from '../utils/finance';

const STORAGE_KEY = 'denge-budget-v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeAppState(JSON.parse(raw) as Partial<AppState>, seedState);
  } catch {
    /* ignore */
  }
  return structuredClone(seedState);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
    () => state.debts.filter((d) => d.status === 'active').reduce((s, d) => s + d.remaining, 0),
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

  const installmentDebt = useMemo(
    () =>
      state.installments
        .filter((i) => i.status === 'active')
        .reduce((s, i) => s + installmentRemaining(i), 0),
    [state.installments],
  );

  const totalBillsDue = useMemo(() => unpaidBillsTotal(state.bills), [state.bills]);

  const totalLiabilities = totalDebt + installmentDebt + totalBillsDue;

  const netWorth = balance - totalDebt - installmentDebt + totalReceivable;

  const calendarEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    for (const d of state.debts.filter((x) => x.status === 'active')) {
      events.push({
        id: `debt-${d.id}`,
        date: d.dueDate,
        title: `Borç: ${d.title}`,
        amount: d.remaining,
        kind: 'debt',
        status: d.status,
      });
    }
    for (const r of state.receivables.filter((x) => x.status === 'active')) {
      events.push({
        id: `recv-${r.id}`,
        date: r.dueDate,
        title: `Alacak: ${r.title}`,
        amount: r.remaining,
        kind: 'receivable',
        status: r.status,
      });
    }
    for (const i of state.installments.filter((x) => x.status === 'active')) {
      events.push({
        id: `inst-${i.id}`,
        date: i.nextDueDate,
        title: `Taksit: ${i.title}`,
        amount: i.monthlyAmount,
        kind: 'installment',
        status: i.status,
      });
    }
    for (const b of state.bills.filter((x) => x.status === 'pending')) {
      events.push({
        id: `bill-${b.id}`,
        date: b.dueDate,
        title: `Fatura: ${b.title}`,
        amount: b.amount,
        kind: 'bill',
        status: b.status,
      });
    }
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [state.debts, state.receivables, state.installments, state.bills]);

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
      return { ...s, budgets: [...s.budgets, { ...budget, id: uid('b') }] };
    });
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setState((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    setState((s) => ({ ...s, goals: [...s.goals, { ...goal, id: uid('g') }] }));
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

  /** Borç ödemesi → gider + bakiyeden düşer */
  const payDebt = useCallback((id: string, amount: number) => {
    if (amount <= 0) return;
    setState((s) => {
      const debt = s.debts.find((d) => d.id === id);
      if (!debt || debt.status === 'paid') return s;
      const pay = Math.min(amount, debt.remaining);
      const remaining = Math.max(0, debt.remaining - pay);
      const { categories, categoryId } = ensureSystemCategory(s.categories, 'debt');
      const tx = makeTx(categoryId, pay, 'expense', `Borç ödemesi: ${debt.title}`, todayIso());
      return {
        ...s,
        categories,
        transactions: [tx, ...s.transactions],
        debts: s.debts.map((d) =>
          d.id === id
            ? {
                ...d,
                remaining,
                lastPaymentDate: todayIso(),
                status: remaining <= 0 ? 'paid' : 'active',
              }
            : d,
        ),
      };
    });
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

  /** Tahsilat → gelir + bakiyeye eklenir */
  const collectReceivable = useCallback((id: string, amount: number) => {
    if (amount <= 0) return;
    setState((s) => {
      const item = s.receivables.find((r) => r.id === id);
      if (!item || item.status === 'paid') return s;
      const pay = Math.min(amount, item.remaining);
      const remaining = Math.max(0, item.remaining - pay);
      const { categories, categoryId } = ensureSystemCategory(s.categories, 'receivable');
      const tx = makeTx(categoryId, pay, 'income', `Alacak tahsilatı: ${item.title}`, todayIso());
      return {
        ...s,
        categories,
        transactions: [tx, ...s.transactions],
        receivables: s.receivables.map((r) =>
          r.id === id
            ? {
                ...r,
                remaining,
                lastPaymentDate: todayIso(),
                status: remaining <= 0 ? 'paid' : 'active',
              }
            : r,
        ),
      };
    });
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

  /** Taksit ödemesi → gider */
  const payInstallment = useCallback((id: string) => {
    setState((s) => {
      const item = s.installments.find((i) => i.id === id);
      if (!item || item.status === 'paid') return s;
      const paidCount = Math.min(item.totalCount, item.paidCount + 1);
      const next = new Date(item.nextDueDate + 'T12:00:00');
      next.setMonth(next.getMonth() + 1);
      const { categories, categoryId } = ensureSystemCategory(s.categories, 'installment');
      const tx = makeTx(
        categoryId,
        item.monthlyAmount,
        'expense',
        `Taksit: ${item.title} (${paidCount}/${item.totalCount})`,
        todayIso(),
      );
      return {
        ...s,
        categories,
        transactions: [tx, ...s.transactions],
        installments: s.installments.map((i) =>
          i.id === id
            ? {
                ...i,
                paidCount,
                lastPaymentDate: todayIso(),
                nextDueDate: next.toISOString().slice(0, 10),
                status: paidCount >= i.totalCount ? 'paid' : 'active',
              }
            : i,
        ),
      };
    });
  }, []);

  const addBill = useCallback((bill: Omit<Bill, 'id'>) => {
    setState((s) => ({ ...s, bills: [{ ...bill, id: uid('f') }, ...s.bills] }));
  }, []);

  const updateBill = useCallback((id: string, patch: Partial<Bill>) => {
    setState((s) => ({
      ...s,
      bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setState((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
  }, []);

  /** Fatura/ekstre ödemesi → gider */
  const payBill = useCallback((id: string) => {
    setState((s) => {
      const bill = s.bills.find((b) => b.id === id);
      if (!bill || bill.status === 'paid') return s;
      const { categories, categoryId } = ensureSystemCategory(s.categories, 'bill');
      const tx = makeTx(
        categoryId,
        bill.amount,
        'expense',
        `Fatura/ekstre: ${bill.title}`,
        todayIso(),
      );
      return {
        ...s,
        categories,
        transactions: [tx, ...s.transactions],
        bills: s.bills.map((b) =>
          b.id === id
            ? { ...b, status: 'paid', lastPaymentDate: todayIso() }
            : b,
        ),
      };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetData = useCallback(() => {
    setState(structuredClone(emptyState));
  }, []);

  const importState = useCallback((next: AppState) => {
    setState(normalizeAppState(next, emptyState));
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
    installmentDebt,
    totalBillsDue,
    totalLiabilities,
    netWorth,
    calendarEvents,
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
    payDebt,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    collectReceivable,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    payInstallment,
    addBill,
    updateBill,
    deleteBill,
    payBill,
    updateSettings,
    resetData,
    importState,
    getExportState,
    spentByCategory,
  };
}

export type BudgetStore = ReturnType<typeof useBudgetStore>;
