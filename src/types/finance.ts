export type Category = string;

export type AccountType = 'cash' | 'upi';
export type TransactionType = 'debit' | 'credit';
export type TransactionStatus = 'pending' | 'cleared' | 'reconciled';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  bankName: string;
  type: AccountType;
  balance: number;
  limit?: number;
  accountNumber: string;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  title: string;
  merchant: string;
  category: Category;
  amount: number;
  type: TransactionType;
  date: string;
  status: TransactionStatus;
  note?: string;
  isRecurring?: boolean;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  merchant: string;
  category: Category;
  amount: number;
  type: TransactionType;
  accountId: string;
  frequency: RecurringFrequency;
  nextDate: string;
  isActive: boolean;
  note?: string;
}

export interface Budget {
  category: Category;
  limit: number;
  color: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  targetDate: string;
  color: string;
}

export interface MonthlyHistory {
  month: string;
  income: number;
  spent: number;
  saved: number;
}

export interface CategorySpend {
  category: Category;
  amount: number;
  prevAmount: number;
  color: string;
  icon: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  icon: string;
  category?: Category;
}

export interface CategoryConfig {
  name: Category;
  icon: string;
  color: string;
}
