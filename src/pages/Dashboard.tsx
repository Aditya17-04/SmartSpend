import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Zap, Eye, EyeOff, ChevronRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import { EmptyState } from '../components/shared/EmptyState';

const ITEM = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export function Dashboard() {
  const {
    state, hasData, totalBalance, thisMonthIncome, thisMonthSpent,
    categorySpends, recentTransactions, categoryBudgetStatus,
  } = useFinance();

  const [balanceVisible, setBalanceVisible] = useState(true);

  if (!hasData) {
    return (
      <EmptyState
        icon="👋"
        title="Welcome to SmartSpend!"
        description="Add your daily income and expense transactions to see your balance, spending, and budget at a glance."
      />
    );
  }

  // Budget overall
  const totalBudget = state.budgets.reduce((s, b) => s + b.limit, 0);
  const budgetUsedPct = totalBudget > 0 ? Math.min((thisMonthSpent / totalBudget) * 100, 100) : 0;
  const budgetRemaining = Math.max(totalBudget - thisMonthSpent, 0);
  const isOverBudget = thisMonthSpent > totalBudget;

  const topCategories = categorySpends.slice(0, 4);

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="show" className="space-y-5 pb-4">

      {/* ── Balance Card ── */}
      <motion.div variants={ITEM}
        className="relative rounded-3xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #1D4ED8 60%, #0EA5E9 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-blue-400/20 blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/70 text-sm font-medium">Total Balance</p>
            <button onClick={() => setBalanceVisible(v => !v)} className="text-white/60 hover:text-white transition-colors">
              {balanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <h2 className="text-white text-4xl font-black tracking-tight mb-4">
            {balanceVisible ? formatCurrency(totalBalance) : '₹ ••••••'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownLeft size={14} className="text-emerald-300" />
                <span className="text-white/60 text-xs font-medium">Income</span>
              </div>
              <p className="text-white font-bold text-lg leading-none">{formatCurrency(thisMonthIncome)}</p>
            </div>
            <div className="bg-white/15 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight size={14} className="text-red-300" />
                <span className="text-white/60 text-xs font-medium">Spent</span>
              </div>
              <p className="text-white font-bold text-lg leading-none">{formatCurrency(thisMonthSpent)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Budget Progress ── */}
      <motion.div variants={ITEM} className="glass-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-base">Monthly Budget</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {isOverBudget
                ? `Over by ${formatCurrency(thisMonthSpent - totalBudget)}`
                : `${formatCurrency(budgetRemaining)} remaining`}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-black font-mono ${isOverBudget ? 'text-red-400' : budgetUsedPct >= 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {budgetUsedPct.toFixed(0)}%
            </p>
            <p className="text-white/30 text-xs">used</p>
          </div>
        </div>

        {/* Bar */}
        <div className="h-3 bg-white/8 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${budgetUsedPct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{
              background: isOverBudget
                ? '#EF4444'
                : budgetUsedPct >= 80
                ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                : 'linear-gradient(90deg, #6C63FF, #3B82F6)',
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-white/30">
          <span>₹0</span>
          <span className="font-medium text-white/50">{formatCurrency(totalBudget)} budget</span>
        </div>

        {budgetUsedPct >= 80 && !isOverBudget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium">
            <Zap size={13} /> You're close to your budget limit — slow down on spending!
          </motion.div>
        )}
        {isOverBudget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            <Zap size={13} /> Budget exceeded! Consider reviewing your expenses.
          </motion.div>
        )}
      </motion.div>

      {/* ── Spending Trend Mini Chart ── */}
      <motion.div variants={ITEM} className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-violet-400" />
          <h3 className="text-white font-bold text-base">Spending This Week</h3>
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={state.history.slice(-6)}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }}
                formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Spent']}
              />
              <Area type="monotone" dataKey="spent" stroke="#6C63FF" strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Top Spending Categories ── */}
      {topCategories.length > 0 && (
        <motion.div variants={ITEM} className="glass-card">
          <h3 className="text-white font-bold text-base mb-4">Where You're Spending</h3>
          <div className="space-y-3">
            {topCategories.map(cs => {
              const catTotal = categorySpends.reduce((s, c) => s + c.amount, 0);
              const pct = catTotal > 0 ? (cs.amount / catTotal) * 100 : 0;
              return (
                <div key={cs.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{CATEGORY_ICONS[cs.category] ?? '📦'}</span>
                      <span className="text-white/80 text-sm">{cs.category}</span>
                    </div>
                    <span className="text-white font-semibold text-sm font-mono">{formatCurrency(cs.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: CATEGORY_COLORS[cs.category] ?? '#6C63FF' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Recent Expenses ── */}
      <motion.div variants={ITEM} className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base">Recent Expenses</h3>
          <span className="text-violet-400 text-xs font-medium">Last 5</span>
        </div>
        <div className="space-y-3">
          {recentTransactions.filter(t => t.type === 'debit').slice(0, 5).map((txn, i) => {
            const icon = CATEGORY_ICONS[txn.category] ?? '📦';
            const color = CATEGORY_COLORS[txn.category] ?? '#94A3B8';
            return (
              <motion.div key={txn.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${color}20` }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{txn.title}</p>
                  <p className="text-white/35 text-xs">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>
                <p className="text-white font-bold text-sm font-mono flex-shrink-0">-{formatCurrency(txn.amount)}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}
