import type { Account, Transaction, Budget, SavingsGoal, MonthlyHistory, RecurringTransaction } from '../types/finance';

export const syncedAccounts: Account[] = [
  { id: 'acc-1', name: 'HDFC Savings',       bankName: 'HDFC Bank',           type: 'savings',    balance: 84320,   accountNumber: '****4821', color: '#6C63FF', icon: '🏦' },
  { id: 'acc-2', name: 'SBI Salary',          bankName: 'State Bank of India', type: 'salary',     balance: 52100,   accountNumber: '****7743', color: '#10B981', icon: '💼' },
  { id: 'acc-3', name: 'ICICI Credit Card',   bankName: 'ICICI Bank',          type: 'credit',     balance: -18450,  limit: 150000, accountNumber: '****9912', color: '#F59E0B', icon: '💳' },
  { id: 'acc-4', name: 'Paytm Wallet',        bankName: 'Paytm',               type: 'wallet',     balance: 3200,    accountNumber: '****5566', color: '#3B82F6', icon: '📱' },
  { id: 'acc-5', name: 'Zerodha Demat',       bankName: 'Zerodha',             type: 'investment', balance: 145000,  accountNumber: '****2290', color: '#EC4899', icon: '📈' },
  { id: 'acc-6', name: 'Home Loan',           bankName: 'HDFC Bank',           type: 'loan',       balance: -2800000,accountNumber: '****0043', color: '#EF4444', icon: '🏠' },
];

const daysAgo = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString(); };

export const syncedTransactions: Transaction[] = [
  { id: 't1',  accountId: 'acc-2', title: 'July Salary',         merchant: 'Employer Inc.',   category: 'Salary',           amount: 85000, type: 'credit', date: daysAgo(2),  status: 'reconciled' },
  { id: 't2',  accountId: 'acc-3', title: 'Swiggy Order',        merchant: 'Swiggy',          category: 'Food & Dining',    amount: 520,   type: 'debit',  date: daysAgo(1),  status: 'cleared' },
  { id: 't3',  accountId: 'acc-4', title: 'Ola Ride',            merchant: 'Ola Cabs',        category: 'Transport',        amount: 210,   type: 'debit',  date: daysAgo(1),  status: 'cleared' },
  { id: 't4',  accountId: 'acc-1', title: 'Netflix Premium',     merchant: 'Netflix',         category: 'Entertainment',    amount: 649,   type: 'debit',  date: daysAgo(2),  status: 'cleared',  isRecurring: true },
  { id: 't5',  accountId: 'acc-3', title: 'Amazon Shopping',     merchant: 'Amazon',          category: 'Shopping',         amount: 3499,  type: 'debit',  date: daysAgo(3),  status: 'cleared' },
  { id: 't6',  accountId: 'acc-1', title: 'Electricity Bill',    merchant: 'MSEDCL',          category: 'Bills & Utilities',amount: 1850,  type: 'debit',  date: daysAgo(3),  status: 'cleared',  isRecurring: true },
  { id: 't7',  accountId: 'acc-3', title: 'Zomato Order',        merchant: 'Zomato',          category: 'Food & Dining',    amount: 680,   type: 'debit',  date: daysAgo(4),  status: 'pending' },
  { id: 't8',  accountId: 'acc-1', title: 'Spotify Premium',     merchant: 'Spotify',         category: 'Entertainment',    amount: 119,   type: 'debit',  date: daysAgo(4),  status: 'cleared',  isRecurring: true },
  { id: 't9',  accountId: 'acc-4', title: 'Metro Card Recharge', merchant: 'Delhi Metro',     category: 'Transport',        amount: 500,   type: 'debit',  date: daysAgo(5),  status: 'cleared' },
  { id: 't10', accountId: 'acc-3', title: 'BigBasket Groceries', merchant: 'BigBasket',       category: 'Groceries',        amount: 2100,  type: 'debit',  date: daysAgo(5),  status: 'cleared' },
  { id: 't11', accountId: 'acc-1', title: 'Gym Membership',      merchant: 'Cult.fit',        category: 'Health',           amount: 1999,  type: 'debit',  date: daysAgo(6),  status: 'cleared',  isRecurring: true },
  { id: 't12', accountId: 'acc-4', title: 'Coffee - Starbucks',  merchant: 'Starbucks',       category: 'Food & Dining',    amount: 450,   type: 'debit',  date: daysAgo(6),  status: 'pending' },
  { id: 't13', accountId: 'acc-3', title: 'Myntra Order',        merchant: 'Myntra',          category: 'Shopping',         amount: 1799,  type: 'debit',  date: daysAgo(7),  status: 'cleared' },
  { id: 't14', accountId: 'acc-1', title: 'Freelance Payment',   merchant: 'Client A',        category: 'Freelance',        amount: 12000, type: 'credit', date: daysAgo(7),  status: 'cleared' },
  { id: 't15', accountId: 'acc-4', title: 'Rapido Bike',         merchant: 'Rapido',          category: 'Transport',        amount: 65,    type: 'debit',  date: daysAgo(8),  status: 'pending' },
  { id: 't16', accountId: 'acc-3', title: 'Swiggy Order',        merchant: 'Swiggy',          category: 'Food & Dining',    amount: 390,   type: 'debit',  date: daysAgo(8),  status: 'cleared' },
  { id: 't17', accountId: 'acc-1', title: 'Jio Postpaid Bill',   merchant: 'Jio',             category: 'Bills & Utilities',amount: 499,   type: 'debit',  date: daysAgo(9),  status: 'cleared',  isRecurring: true },
  { id: 't18', accountId: 'acc-3', title: 'Pharmeasy Order',     merchant: 'Pharmeasy',       category: 'Health',           amount: 780,   type: 'debit',  date: daysAgo(9),  status: 'cleared' },
  { id: 't19', accountId: 'acc-4', title: 'PVR Movies',          merchant: 'PVR Cinemas',     category: 'Entertainment',    amount: 890,   type: 'debit',  date: daysAgo(10), status: 'cleared' },
  { id: 't20', accountId: 'acc-3', title: 'Udemy Course',        merchant: 'Udemy',           category: 'Education',        amount: 449,   type: 'debit',  date: daysAgo(10), status: 'cleared' },
  { id: 't21', accountId: 'acc-4', title: 'Petrol - BPCL',       merchant: 'BPCL Pump',       category: 'Transport',        amount: 1200,  type: 'debit',  date: daysAgo(11), status: 'cleared' },
  { id: 't22', accountId: 'acc-3', title: 'Dunzo Delivery',      merchant: 'Dunzo',           category: 'Food & Dining',    amount: 280,   type: 'debit',  date: daysAgo(11), status: 'cleared' },
  { id: 't23', accountId: 'acc-1', title: 'SIP Investment',      merchant: 'Zerodha Coin',    category: 'Investment',       amount: 5000,  type: 'debit',  date: daysAgo(12), status: 'reconciled', isRecurring: true },
  { id: 't24', accountId: 'acc-3', title: 'Puma Sneakers',       merchant: 'Puma Store',      category: 'Shopping',         amount: 4299,  type: 'debit',  date: daysAgo(12), status: 'cleared' },
  { id: 't25', accountId: 'acc-4', title: 'Blinkit Groceries',   merchant: 'Blinkit',         category: 'Groceries',        amount: 650,   type: 'debit',  date: daysAgo(13), status: 'pending' },
  { id: 't26', accountId: 'acc-1', title: 'House Rent',          merchant: 'Landlord',        category: 'Rent',             amount: 22000, type: 'debit',  date: daysAgo(14), status: 'reconciled', isRecurring: true },
  { id: 't27', accountId: 'acc-6', title: 'Home Loan EMI',       merchant: 'HDFC Bank',       category: 'Bills & Utilities',amount: 28500, type: 'debit',  date: daysAgo(14), status: 'reconciled', isRecurring: true },
  { id: 't28', accountId: 'acc-3', title: 'LIC Premium',         merchant: 'LIC India',       category: 'Insurance',        amount: 8200,  type: 'debit',  date: daysAgo(15), status: 'reconciled', isRecurring: true },
  { id: 't29', accountId: 'acc-1', title: 'Amazon Shopping',     merchant: 'Amazon',          category: 'Shopping',         amount: 2199,  type: 'debit',  date: daysAgo(35), status: 'reconciled' },
  { id: 't30', accountId: 'acc-1', title: 'Electricity Bill',    merchant: 'MSEDCL',          category: 'Bills & Utilities',amount: 1720,  type: 'debit',  date: daysAgo(35), status: 'reconciled', isRecurring: true },
  { id: 't31', accountId: 'acc-4', title: 'Ola Ride',            merchant: 'Ola Cabs',        category: 'Transport',        amount: 180,   type: 'debit',  date: daysAgo(36), status: 'reconciled' },
  { id: 't32', accountId: 'acc-3', title: 'BigBasket Groceries', merchant: 'BigBasket',       category: 'Groceries',        amount: 1890,  type: 'debit',  date: daysAgo(37), status: 'reconciled' },
  { id: 't33', accountId: 'acc-1', title: 'Netflix Premium',     merchant: 'Netflix',         category: 'Entertainment',    amount: 649,   type: 'debit',  date: daysAgo(38), status: 'reconciled', isRecurring: true },
  { id: 't34', accountId: 'acc-2', title: 'June Salary',         merchant: 'Employer Inc.',   category: 'Salary',           amount: 85000, type: 'credit', date: daysAgo(32), status: 'reconciled' },
  { id: 't35', accountId: 'acc-1', title: 'House Rent',          merchant: 'Landlord',        category: 'Rent',             amount: 22000, type: 'debit',  date: daysAgo(44), status: 'reconciled', isRecurring: true },
  { id: 't36', accountId: 'acc-6', title: 'Home Loan EMI',       merchant: 'HDFC Bank',       category: 'Bills & Utilities',amount: 28500, type: 'debit',  date: daysAgo(44), status: 'reconciled', isRecurring: true },
  { id: 't37', accountId: 'acc-1', title: 'SIP Investment',      merchant: 'Zerodha Coin',    category: 'Investment',       amount: 5000,  type: 'debit',  date: daysAgo(42), status: 'reconciled', isRecurring: true },
  { id: 't38', accountId: 'acc-1', title: 'Freelance Payment',   merchant: 'Client B',        category: 'Freelance',        amount: 8000,  type: 'credit', date: daysAgo(44), status: 'reconciled' },
  { id: 't39', accountId: 'acc-2', title: 'May Salary',          merchant: 'Employer Inc.',   category: 'Salary',           amount: 85000, type: 'credit', date: daysAgo(63), status: 'reconciled' },
  { id: 't40', accountId: 'acc-1', title: 'Freelance Payment',   merchant: 'Client C',        category: 'Freelance',        amount: 15000, type: 'credit', date: daysAgo(73), status: 'reconciled' },
];

export const syncedRecurring: RecurringTransaction[] = [
  { id: 'r1', title: 'Netflix Premium',  merchant: 'Netflix',      category: 'Entertainment',    amount: 649,   type: 'debit',  accountId: 'acc-1', frequency: 'monthly',   nextDate: addDays(5),  isActive: true },
  { id: 'r2', title: 'Spotify Premium',  merchant: 'Spotify',      category: 'Entertainment',    amount: 119,   type: 'debit',  accountId: 'acc-1', frequency: 'monthly',   nextDate: addDays(8),  isActive: true },
  { id: 'r3', title: 'Gym Membership',   merchant: 'Cult.fit',     category: 'Health',           amount: 1999,  type: 'debit',  accountId: 'acc-1', frequency: 'monthly',   nextDate: addDays(3),  isActive: true },
  { id: 'r4', title: 'Jio Postpaid',     merchant: 'Jio',          category: 'Bills & Utilities',amount: 499,   type: 'debit',  accountId: 'acc-1', frequency: 'monthly',   nextDate: addDays(18), isActive: true },
  { id: 'r5', title: 'House Rent',       merchant: 'Landlord',     category: 'Rent',             amount: 22000, type: 'debit',  accountId: 'acc-1', frequency: 'monthly',   nextDate: addDays(14), isActive: true },
  { id: 'r6', title: 'Home Loan EMI',    merchant: 'HDFC Bank',    category: 'Bills & Utilities',amount: 28500, type: 'debit',  accountId: 'acc-6', frequency: 'monthly',   nextDate: addDays(14), isActive: true, note: '20 year term, 8.5% p.a.' },
  { id: 'r7', title: 'SIP Investment',   merchant: 'Zerodha Coin', category: 'Investment',       amount: 5000,  type: 'debit',  accountId: 'acc-1', frequency: 'monthly',   nextDate: addDays(10), isActive: true, note: 'Axis Bluechip Fund' },
  { id: 'r8', title: 'Electricity Bill', merchant: 'MSEDCL',       category: 'Bills & Utilities',amount: 1850,  type: 'debit',  accountId: 'acc-1', frequency: 'monthly',   nextDate: addDays(25), isActive: true },
  { id: 'r9', title: 'LIC Premium',      merchant: 'LIC India',    category: 'Insurance',        amount: 8200,  type: 'debit',  accountId: 'acc-1', frequency: 'quarterly', nextDate: addDays(75), isActive: true },
  { id: 'r10',title: 'Salary Credit',   merchant: 'Employer Inc.', category: 'Salary',           amount: 85000, type: 'credit', accountId: 'acc-2', frequency: 'monthly',   nextDate: addDays(1),  isActive: true },
];

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const syncedBudgets: Budget[] = [
  { category: 'Food & Dining',    limit: 6000,  color: '#F97316' },
  { category: 'Groceries',        limit: 4000,  color: '#84CC16' },
  { category: 'Shopping',         limit: 6000,  color: '#EC4899' },
  { category: 'Transport',        limit: 3000,  color: '#3B82F6' },
  { category: 'Entertainment',    limit: 2500,  color: '#8B5CF6' },
  { category: 'Bills & Utilities',limit: 35000, color: '#6B7280' },
  { category: 'Health',           limit: 3000,  color: '#10B981' },
  { category: 'Education',        limit: 2000,  color: '#F59E0B' },
  { category: 'Rent',             limit: 22000, color: '#EF4444' },
  { category: 'Investment',       limit: 10000, color: '#6C63FF' },
  { category: 'Insurance',        limit: 9000,  color: '#64748B' },
];

export const syncedGoals: SavingsGoal[] = [
  { id: 'goal-1', title: 'Emergency Fund', targetAmount: 300000, currentAmount: 84320, emoji: '🛡️', targetDate: '2026-12-31', color: '#6C63FF' },
  { id: 'goal-2', title: 'Goa Vacation',   targetAmount: 50000,  currentAmount: 32000, emoji: '🏖️', targetDate: '2026-10-01', color: '#F59E0B' },
  { id: 'goal-3', title: 'New Laptop',     targetAmount: 120000, currentAmount: 45000, emoji: '💻', targetDate: '2027-03-01', color: '#10B981' },
];

export const syncedHistory: MonthlyHistory[] = [
  { month: 'Feb', income: 94000,  spent: 58200, saved: 35800 },
  { month: 'Mar', income: 96000,  spent: 61500, saved: 34500 },
  { month: 'Apr', income: 95000,  spent: 64300, saved: 30700 },
  { month: 'May', income: 100000, spent: 57800, saved: 42200 },
  { month: 'Jun', income: 93000,  spent: 66100, saved: 26900 },
  { month: 'Jul', income: 97000,  spent: 52700, saved: 44300 },
];

// Empty state for new users (pre-onboarding)
export const mockAccounts: Account[] = [];
export const mockTransactions: Transaction[] = [];
export const mockBudgets: Budget[] = [];
export const mockSavingsGoals: SavingsGoal[] = [];
export const mockRecurring: RecurringTransaction[] = [];
export const mockMonthlyHistory: MonthlyHistory[] = [
  { month: 'Feb', income: 0, spent: 0, saved: 0 },
  { month: 'Mar', income: 0, spent: 0, saved: 0 },
  { month: 'Apr', income: 0, spent: 0, saved: 0 },
  { month: 'May', income: 0, spent: 0, saved: 0 },
  { month: 'Jun', income: 0, spent: 0, saved: 0 },
  { month: 'Jul', income: 0, spent: 0, saved: 0 },
];
