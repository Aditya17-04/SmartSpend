import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import React from 'react';
import type { Account, Transaction, Budget, SavingsGoal, MonthlyHistory, CategorySpend, Alert, RecurringTransaction, TransactionStatus } from '../types/finance';
import { mockAccounts, mockTransactions, mockBudgets, mockSavingsGoals, mockMonthlyHistory, mockRecurring, syncedAccounts, syncedTransactions, syncedBudgets, syncedGoals, syncedHistory, syncedRecurring } from '../data/mockData';
import { isCurrentMonth, isLastMonth, CATEGORY_COLORS, CATEGORY_ICONS, calcBudgetHealth } from '../lib/utils';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
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
  | { type: 'ADD_RECURRING'; payload: RecurringTransaction }
  | { type: 'UPDATE_RECURRING'; payload: RecurringTransaction }
  | { type: 'DELETE_RECURRING'; payload: string }
  | { type: 'SYNC_DATA' }
  | { type: 'RESET' };

const emptyState: FinanceState = {
  accounts: mockAccounts,
  transactions: mockTransactions,
  budgets: mockBudgets,
  goals: mockSavingsGoals,
  history: mockMonthlyHistory,
  recurring: mockRecurring,
};

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
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => b.category === action.payload.category ? action.payload : b),
      };
    case 'ADD_RECURRING':
      return { ...state, recurring: [...state.recurring, action.payload] };
    case 'UPDATE_RECURRING':
      return { ...state, recurring: state.recurring.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RECURRING':
      return { ...state, recurring: state.recurring.filter(r => r.id !== action.payload) };
    case 'SYNC_DATA':
      return { accounts: syncedAccounts, transactions: syncedTransactions, budgets: syncedBudgets, goals: syncedGoals, history: syncedHistory, recurring: syncedRecurring };
    case 'RESET':
      return emptyState;
    default:
      return state;
  }
}

const DATA_VERSION = 'v4-money-manager';

function loadInitialState(): FinanceState {
  try {
    const raw = localStorage.getItem('wellsy-finance');
    const ver = localStorage.getItem('wellsy-finance-version');
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
    localStorage.setItem('wellsy-finance', JSON.stringify(state));
    localStorage.setItem('wellsy-finance-version', DATA_VERSION);
  }, [state]);

  const hasData = state.accounts.length > 0;

  const totalAssets = state.accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = state.accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
  const totalBalance = totalAssets - totalLiabilities;

  const thisMonthTxns = state.transactions.filter(t => isCurrentMonth(t.date));
  const lastMonthTxns = state.transactions.filter(t => isLastMonth(t.date));
  const thisMonthIncome = thisMonthTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const thisMonthSpent = thisMonthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const thisMonthSaved = thisMonthIncome - thisMonthSpent;
  const lastMonthSpent = lastMonthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  const spendByCategory = new Map<string, number>();
  const prevSpendByCategory = new Map<string, number>();
  thisMonthTxns.filter(t => t.type === 'debit').forEach(t => spendByCategory.set(t.category, (spendByCategory.get(t.category) ?? 0) + t.amount));
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

  const recentTransactions = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <FinanceContext.Provider value={{
      state, hasData, totalBalance, totalAssets, totalLiabilities,
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
