import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react';
import React from 'react';
import type { Account, Transaction, Budget, SavingsGoal, MonthlyHistory, CategorySpend, Alert, RecurringTransaction, TransactionStatus } from '../types/finance';
import { mockAccounts, mockTransactions, mockBudgets, mockSavingsGoals, mockMonthlyHistory, mockRecurring, syncedAccounts, syncedTransactions, syncedBudgets, syncedGoals, syncedHistory, syncedRecurring } from '../data/mockData';
import { isCurrentMonth, isLastMonth, CATEGORY_COLORS, CATEGORY_ICONS, calcBudgetHealth } from '../lib/utils';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  monthlyBudget?: number;
  goals: SavingsGoal[];
  history: MonthlyHistory[];
  recurring: RecurringTransaction[];
}

type Action =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'UPDATE_TRANSACTION_STATUS'; payload: { id: string; status: TransactionStatus } }
  | { type: 'IMPORT_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_GOAL'; payload: SavingsGoal }
  | { type: 'UPDATE_GOAL'; payload: SavingsGoal }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'SET_MONTHLY_BUDGET'; payload: number }
  | { type: 'ADD_RECURRING'; payload: RecurringTransaction }
  | { type: 'UPDATE_RECURRING'; payload: RecurringTransaction }
  | { type: 'DELETE_RECURRING'; payload: string }
  | { type: 'SYNC_DATA' }
  | { type: 'RESET' };

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'UPDATE_TRANSACTION_STATUS':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        ),
      };
    case 'IMPORT_TRANSACTIONS':
      return { ...state, transactions: [...action.payload, ...state.transactions] };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'UPDATE_BUDGET': {
      const exists = state.budgets.some(b => b.category === action.payload.category);
      return {
        ...state,
        budgets: exists 
          ? state.budgets.map(b => b.category === action.payload.category ? action.payload : b)
          : [...state.budgets, action.payload],
      };
    }
    case 'SET_MONTHLY_BUDGET':
      return {
        ...state,
        monthlyBudget: action.payload,
      };
    case 'ADD_RECURRING':
      return { ...state, recurring: [...state.recurring, action.payload] };
    case 'UPDATE_RECURRING':
      return { ...state, recurring: state.recurring.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RECURRING':
      return { ...state, recurring: state.recurring.filter(r => r.id !== action.payload) };
    case 'SYNC_DATA':
      return state; // no-op: keep current data
    case 'RESET':
      return emptyState;
    default:
      return state;
  }
}

const emptyState: FinanceState = {
  accounts: [
    { id: 'acc-1', name: 'Cash', bankName: 'Cash', type: 'cash', balance: 0, accountNumber: '', color: '#10B981', icon: '💵' },
    { id: 'acc-2', name: 'UPI', bankName: 'UPI', type: 'upi', balance: 0, accountNumber: '', color: '#6C63FF', icon: '📱' },
  ],
  transactions: [],
  budgets: [],
  monthlyBudget: 0,
  goals: [],
  history: [],
  recurring: [],
};

const DATA_VERSION = 'v11-clean-zero-static-data';

function loadInitialState(): FinanceState {
  try {
    const raw = localStorage.getItem('smart-spend-finance') || localStorage.getItem('wellsy-finance');
    const ver = localStorage.getItem('smart-spend-finance-version') || localStorage.getItem('wellsy-finance-version');
    if (raw && ver === DATA_VERSION) return JSON.parse(raw) as FinanceState;
  } catch {}
  return emptyState;
}

interface FinanceContextValue {
  state: FinanceState;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
  importTransactions: (txns: Transaction[]) => void;
  addGoal: (g: SavingsGoal) => void;
  updateGoal: (g: SavingsGoal) => void;
  updateBudget: (b: Budget) => void;
  setMonthlyBudget: (amount: number) => void;
  addRecurring: (r: RecurringTransaction) => void;
  updateRecurring: (r: RecurringTransaction) => void;
  deleteRecurring: (id: string) => void;
  syncData: () => void;
  resetData: () => void;
  totalBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  thisMonthIncome: number;
  thisMonthSpent: number;
  thisMonthSaved: number;
  lastMonthSpent: number;
  categorySpends: CategorySpend[];
  categoryBudgetStatus: Array<{ budget: Budget; spent: number; pct: number; health: string }>;
  alerts: Alert[];
  recentTransactions: Transaction[];
  budgetScore: number;
  totalBudgeted: number;
  toBeBudgeted: number;
  hasData: boolean;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    localStorage.setItem('smart-spend-finance', JSON.stringify(state));
    localStorage.setItem('smart-spend-finance-version', DATA_VERSION);
  }, [state]);

  const hasData = true;

  // Ensure unmatched transactions fallback to primary account
  const defaultAccId = state.accounts[0]?.id ?? 'acc-1';

  // Calculate dynamic balances for each account based purely on manual transactions
  const accountsWithDynamicBalance = useMemo(() => {
    return state.accounts.map((acc, idx) => {
      const isPrimary = idx === 0;
      const totalCredit = state.transactions
        .filter(t => t.accountId === acc.id || (isPrimary && !state.accounts.some(a => a.id === t.accountId)))
        .filter(t => t.type === 'credit')
        .reduce((s, t) => s + t.amount, 0);
      const totalDebit = state.transactions
        .filter(t => t.accountId === acc.id || (isPrimary && !state.accounts.some(a => a.id === t.accountId)))
        .filter(t => t.type === 'debit')
        .reduce((s, t) => s + t.amount, 0);
      return {
        ...acc,
        balance: totalCredit - totalDebit,
      };
    });
  }, [state.accounts, state.transactions]);

  const totalAssets = accountsWithDynamicBalance.filter((a: Account) => a.balance > 0).reduce((s: number, a: Account) => s + a.balance, 0);
  const totalLiabilities = accountsWithDynamicBalance.filter((a: Account) => a.balance < 0).reduce((s: number, a: Account) => s + Math.abs(a.balance), 0);
  const totalBalance = totalAssets - totalLiabilities;

  // Identify latest transaction date for fallback when current calendar month has no data
  const latestTxnDate = useMemo(() => {
    if (state.transactions.length === 0) return new Date();
    const sorted = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const d = new Date(sorted[0].date);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [state.transactions]);

  // Active month transactions: use current calendar month if it has data; otherwise fallback to latest month with data
  const activeMonthTxns = useMemo(() => {
    const current = state.transactions.filter(t => isCurrentMonth(t.date));
    if (current.length > 0) return current;
    if (state.transactions.length === 0) return [];
    return state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === latestTxnDate.getFullYear() && d.getMonth() === latestTxnDate.getMonth();
    });
  }, [state.transactions, latestTxnDate]);

  const lastMonthTxns = useMemo(() => {
    return state.transactions.filter(t => isLastMonth(t.date));
  }, [state.transactions]);

  const thisMonthIncome = activeMonthTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const thisMonthSpent = activeMonthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const thisMonthSaved = thisMonthIncome - thisMonthSpent;
  const lastMonthSpent = lastMonthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  const spendByCategory = new Map<string, number>();
  const prevSpendByCategory = new Map<string, number>();
  activeMonthTxns.filter(t => t.type === 'debit').forEach(t => spendByCategory.set(t.category, (spendByCategory.get(t.category) ?? 0) + t.amount));
  lastMonthTxns.filter(t => t.type === 'debit').forEach(t => prevSpendByCategory.set(t.category, (prevSpendByCategory.get(t.category) ?? 0) + t.amount));

  const categorySpends: CategorySpend[] = Array.from(spendByCategory.entries())
    .map(([cat, amount]) => ({
      category: cat as CategorySpend['category'],
      amount,
      prevAmount: prevSpendByCategory.get(cat) ?? 0,
      color: CATEGORY_COLORS[cat as CategorySpend['category']] ?? '#94A3B8',
      icon: CATEGORY_ICONS[cat as CategorySpend['category']] ?? '📦',
    }))
    .sort((a, b) => b.amount - a.amount);

  const categoryBudgetStatus = state.budgets.map(budget => {
    const spent = spendByCategory.get(budget.category) ?? 0;
    const pct = Math.min((spent / (budget.limit || 1)) * 100, 100);
    return { budget, spent, pct, health: calcBudgetHealth(spent, budget.limit) };
  });

  const totalBudgeted = state.budgets.reduce((s, b) => s + b.limit, 0);
  const toBeBudgeted = Math.max(0, thisMonthIncome - totalBudgeted);

  const overBudgetCount = categoryBudgetStatus.filter(s => s.health === 'critical').length;
  const warningCount = categoryBudgetStatus.filter(s => s.health === 'warning').length;
  const budgetScore = Math.max(0, 100 - overBudgetCount * 20 - warningCount * 8);

  const alerts: Alert[] = [];
  categoryBudgetStatus.forEach(({ budget, spent, pct, health }) => {
    if (health === 'critical') alerts.push({ id: `crit-${budget.category}`, severity: 'critical', title: `${budget.category} Budget Exceeded!`, message: `Spent ₹${spent.toLocaleString('en-IN')} of ₹${budget.limit.toLocaleString('en-IN')} (${pct.toFixed(0)}%).`, icon: '🚨', category: budget.category });
    else if (health === 'warning') alerts.push({ id: `warn-${budget.category}`, severity: 'warning', title: `${budget.category} at ${pct.toFixed(0)}%`, message: `₹${spent.toLocaleString('en-IN')} used of ₹${budget.limit.toLocaleString('en-IN')} budget. Slow down to stay on track.`, icon: '⚠️', category: budget.category });
  });
  categorySpends.forEach(cs => {
    if (cs.prevAmount > 0 && cs.amount > cs.prevAmount * 1.4) {
      const pct = Math.round(((cs.amount - cs.prevAmount) / cs.prevAmount) * 100);
      alerts.push({ id: `spike-${cs.category}`, severity: 'warning', title: `${cs.category} spending up ${pct}%`, message: `₹${cs.amount.toLocaleString('en-IN')} this month vs ₹${cs.prevAmount.toLocaleString('en-IN')} last month.`, icon: '📈', category: cs.category });
    }
  });
  if (alerts.length === 0 && hasData) alerts.push({ id: 'all-good', severity: 'info', title: "You're doing great! 🎉", message: 'All budgets on track and spending looks healthy this month.', icon: '✅' });

  // Compute dynamic monthly history from transactions
  const dynamicHistory = useMemo(() => {
    if (state.transactions.length === 0) return [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map = new Map<string, { month: string; spent: number; income: number; sortKey: string }>();

    state.transactions.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;

      if (!map.has(sortKey)) {
        map.set(sortKey, { month: label, spent: 0, income: 0, sortKey });
      }
      const entry = map.get(sortKey)!;
      if (t.type === 'debit') entry.spent += t.amount;
      else if (t.type === 'credit') entry.income += t.amount;
    });

    return Array.from(map.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(e => ({ month: e.month, spent: e.spent, income: e.income, saved: e.income - e.spent }));
  }, [state.transactions]);

  const recentTransactions = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <FinanceContext.Provider value={{
      state: { 
        ...state, 
        accounts: accountsWithDynamicBalance,
        history: dynamicHistory.length > 0 ? dynamicHistory : state.history,
      },
      hasData, totalBalance, totalAssets, totalLiabilities,
      thisMonthIncome, thisMonthSpent, thisMonthSaved, lastMonthSpent,
      categorySpends, categoryBudgetStatus, alerts, recentTransactions, budgetScore,
      totalBudgeted, toBeBudgeted,
      addTransaction: t => dispatch({ type: 'ADD_TRANSACTION', payload: t }),
      updateTransaction: t => dispatch({ type: 'UPDATE_TRANSACTION', payload: t }),
      deleteTransaction: id => dispatch({ type: 'DELETE_TRANSACTION', payload: id }),
      updateTransactionStatus: (id, status) => dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { id, status } }),
      importTransactions: txns => dispatch({ type: 'IMPORT_TRANSACTIONS', payload: txns }),
      addGoal: g => dispatch({ type: 'ADD_GOAL', payload: g }),
      updateGoal: g => dispatch({ type: 'UPDATE_GOAL', payload: g }),
      updateBudget: b => dispatch({ type: 'UPDATE_BUDGET', payload: b }),
      setMonthlyBudget: amount => dispatch({ type: 'SET_MONTHLY_BUDGET', payload: amount }),
      addRecurring: r => dispatch({ type: 'ADD_RECURRING', payload: r }),
      updateRecurring: r => dispatch({ type: 'UPDATE_RECURRING', payload: r }),
      deleteRecurring: id => dispatch({ type: 'DELETE_RECURRING', payload: id }),
      syncData: () => dispatch({ type: 'SYNC_DATA' }),
      resetData: () => dispatch({ type: 'RESET' }),
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be inside FinanceProvider');
  return ctx;
}
