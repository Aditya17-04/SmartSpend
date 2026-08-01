import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Category } from '../types/finance';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getDaysSince(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Dining':    '#F97316',
  'Transport':        '#3B82F6',
  'Shopping':         '#EC4899',
  'Entertainment':    '#8B5CF6',
  'Bills & Utilities':'#6B7280',
  'Health':           '#10B981',
  'Travel':           '#06B6D4',
  'Education':        '#F59E0B',
  'Salary':           '#22C55E',
  'Freelance':        '#A78BFA',
  'Investment':       '#34D399',
  'Rent':             '#EF4444',
  'Groceries':        '#84CC16',
  'Insurance':        '#64748B',
  'Other':            '#94A3B8',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  'Food & Dining':    '🍽️',
  'Transport':        '🚗',
  'Shopping':         '🛍️',
  'Entertainment':    '🎬',
  'Bills & Utilities':'⚡',
  'Health':           '💊',
  'Travel':           '✈️',
  'Education':        '📚',
  'Salary':           '💰',
  'Freelance':        '💻',
  'Investment':       '📈',
  'Rent':             '🏠',
  'Groceries':        '🛒',
  'Insurance':        '🛡️',
  'Other':            '📦',
};

export function getCategoryColor(category: Category): string {
  return CATEGORY_COLORS[category] ?? '#94A3B8';
}

export function getCategoryIcon(category: Category): string {
  return CATEGORY_ICONS[category] ?? '📦';
}

export function calcBudgetHealth(spent: number, limit: number): 'good' | 'warning' | 'critical' {
  const pct = spent / limit;
  if (pct >= 0.9) return 'critical';
  if (pct >= 0.7) return 'warning';
  return 'good';
}

export function isCurrentMonth(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function isLastMonth(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
}
