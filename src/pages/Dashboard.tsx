import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Plus, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { StatCard } from '../components/shared/StatCard';
import { TransactionRow } from '../components/shared/TransactionRow';
import { AddTransactionModal } from '../components/shared/AddTransactionModal';
import { EmptyState } from '../components/shared/EmptyState';
import { formatCurrency } from '../lib/utils';

const RADIAN = Math.PI / 180;

export function Dashboard() {
  const {
    totalBalance, thisMonthIncome, thisMonthSpent, thisMonthSaved,
    lastMonthSpent, recentTransactions, categorySpends, budgetScore, state, hasData,
  } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);

  if (!hasData) {
    return (
      <EmptyState 
        icon="👋" 
        title="Welcome to Wellsy!" 
        description="Connect your first bank account to see your dashboard come to life with automatic insights and budgeting." 
        showSyncAction 
      />
    );
  }

  const spentTrend = lastMonthSpent > 0
    ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100
    : 0;

  const topCategories = categorySpends.slice(0, 5);
  const pieData = topCategories.map(cs => ({ name: cs.category, value: cs.amount, fill: cs.color }));

  const scoreData = [{ value: budgetScore, fill: budgetScore >= 70 ? '#10B981' : budgetScore >= 40 ? '#F59E0B' : '#EF4444' }];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-white text-2xl font-bold">Good afternoon, Wellsy 👋</h1>
          <p className="text-white/40 text-sm mt-1">Here's your financial overview for July 2026</p>
        </div>
        <motion.button
          onClick={() => setModalOpen(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Transaction
        </motion.button>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={totalBalance}
          icon="💼"
          color="linear-gradient(135deg, #6C63FF, #3B82F6)"
          delay={0}
          trend={2.4}
          trendLabel="vs last month"
        />
        <StatCard
          label="Monthly Income"
          value={thisMonthIncome}
          icon="💰"
          color="linear-gradient(135deg, #10B981, #059669)"
          delay={0.05}
          trend={5.3}
          trendLabel="vs June"
        />
        <StatCard
          label="Spent This Month"
          value={thisMonthSpent}
          icon="🛍️"
          color="linear-gradient(135deg, #F97316, #EF4444)"
          delay={0.1}
          trend={-spentTrend}
          trendLabel={`vs ₹${Math.round(lastMonthSpent / 1000)}k last month`}
        />
        <StatCard
          label="Saved This Month"
          value={thisMonthSaved}
          icon="🎯"
          color="linear-gradient(135deg, #8B5CF6, #EC4899)"
          delay={0.15}
          trendLabel={`${thisMonthIncome > 0 ? ((thisMonthSaved / thisMonthIncome) * 100).toFixed(0) : 0}% of income`}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-semibold text-lg">Spending Breakdown</h2>
              <p className="text-white/40 text-sm">This month's top categories</p>
            </div>
            <span className="text-white/30 text-xs">{formatCurrency(thisMonthSpent)} total</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), '']}
                    contentStyle={{ background: '#141F38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-3 w-full">
              {topCategories.map((cs, i) => {
                const pct = thisMonthSpent > 0 ? (cs.amount / thisMonthSpent) * 100 : 0;
                return (
                  <motion.div
                    key={cs.category}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{cs.icon}</span>
                        <span className="text-white/70 text-sm">{cs.category}</span>
                      </div>
                      <span className="text-white text-sm font-semibold">{formatCurrency(cs.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: cs.color }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Budget health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card flex flex-col items-center justify-center"
        >
          <h2 className="text-white font-semibold text-lg mb-1 self-start">Budget Health</h2>
          <p className="text-white/40 text-sm mb-4 self-start">How you're tracking this month</p>

          <div className="w-40 h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={scoreData} startAngle={220} endAngle={-40}>
                <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{budgetScore}</span>
              <span className="text-white/40 text-xs">/ 100</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className={`text-sm font-semibold ${budgetScore >= 70 ? 'text-emerald-400' : budgetScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {budgetScore >= 70 ? '🟢 Excellent' : budgetScore >= 40 ? '🟡 Needs Attention' : '🔴 Over Budget'}
            </p>
            <p className="text-white/30 text-xs mt-1">Based on {state.budgets.length} categories</p>
          </div>

          {/* Account mini list */}
          <div className="mt-5 w-full space-y-2">
            {state.accounts.slice(0, 3).map(acc => (
              <div key={acc.id} className="flex items-center gap-2">
                <span className="text-sm">{acc.icon}</span>
                <span className="text-white/50 text-xs flex-1 truncate">{acc.name}</span>
                <span className={`text-xs font-semibold ${acc.balance < 0 ? 'text-red-400' : 'text-white/80'}`}>
                  {acc.balance < 0 ? '−' : ''}{formatCurrency(acc.balance)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-semibold text-lg">Recent Transactions</h2>
          <button className="flex items-center gap-1 text-violet-400 text-sm hover:text-violet-300 transition-colors">
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {recentTransactions.slice(0, 8).map((t, i) => (
            <TransactionRow key={t.id} transaction={t} index={i} />
          ))}
        </div>
      </motion.div>

      <AddTransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
