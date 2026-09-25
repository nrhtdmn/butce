export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note: string;
  date: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  month: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  color: string;
}

export type DebtStatus = 'active' | 'paid';
export type BillStatus = 'pending' | 'paid';
export type BillKind = 'utility' | 'statement' | 'subscription' | 'other';

export interface Debt {
  id: string;
  title: string;
  creditor: string;
  total: number;
  remaining: number;
  dueDate: string;
  lastPaymentDate?: string;
  interestRate: number;
  note: string;
  status: DebtStatus;
}

export interface Receivable {
  id: string;
  title: string;
  debtor: string;
  total: number;
  remaining: number;
  dueDate: string;
  lastPaymentDate?: string;
  note: string;
  status: DebtStatus;
}

export interface Installment {
  id: string;
  title: string;
  totalAmount: number;
  monthlyAmount: number;
  totalCount: number;
  paidCount: number;
  nextDueDate: string;
  lastPaymentDate?: string;
  note: string;
  status: DebtStatus;
}

export interface Bill {
  id: string;
  title: string;
  provider: string;
  amount: number;
  dueDate: string;
  lastPaymentDate?: string;
  kind: BillKind;
  note: string;
  status: BillStatus;
}

export interface AppSettings {
  currency: string;
  locale: string;
  name: string;
  startBalance: number;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  receivables: Receivable[];
  installments: Installment[];
  bills: Bill[];
  settings: AppSettings;
}

export type PageId =
  | 'dashboard'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'goals'
  | 'debts'
  | 'receivables'
  | 'installments'
  | 'bills'
  | 'calendar'
  | 'advice'
  | 'reports'
  | 'settings';

export type AdviceLevel = 'good' | 'warn' | 'tip' | 'alert';

export interface AdviceItem {
  id: string;
  level: AdviceLevel;
  title: string;
  body: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  amount: number;
  kind: 'debt' | 'receivable' | 'installment' | 'bill';
  status: string;
}
