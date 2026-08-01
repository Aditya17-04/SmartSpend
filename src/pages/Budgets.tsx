import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, Info } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import type { Budget, Category } from '../types/finance';
import { EmptyState } from '../components/shared/EmptyState';

function BudgetRow({ bs, onUpdate }: {
  bs: { budget: Budget; spent: number; pct: number; health: string };
  onUpdate: (b: Budget) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [limitVal, setLimitVal] = useState(String(bs.budget.limit));

  const available = bs.budget.limit - bs.spent;
  const isOver = available < 0;
  const isWarn = !isOver && bs.pct >= 80;

  const save = () => {
    onUpdate({ ...bs.budget, limit: Math.abs(Number(limitVal)) || bs.budget.limit });
    setEditing(false);
  };

  const catIcon = CATEGORY_ICONS[bs.budget.category] ?? '📦';
  const catColor = CATEGORY_COLORS[bs.budget.category] ?? '#94A3B8';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="grid grid-cols-[36px_1fr_100px_100px_110px_36px] items-center gap-0 px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors group text-sm"
    >
      {/* Icon */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: `${catColor}20` }}>
        {catIcon}
      </div>

      {/* Category + bar */}
      <div className="px-3 min-w-0">
        <p className="text-white font-medium text-sm truncate">{bs.budget.category}</p>
        <div className="mt-1.5 h-1.5 bg-white/8 rounded-full overflow-hidden w-full max-w-[180px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(bs.pct, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: isOver ? '#EF4444' : isWarn ? '#F59E0B' : catColor }}
          />
        </div>
      </div>

      {/* Budgeted */}
      <div className="text-right">
        {editing ? (
          <input
            type="number"
            value={limitVal}
            onChange={e => setLimitVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
            className="w-full bg-white/10 border border-violet-500/50 rounded-lg px-2 py-1 text-white text-sm font-mono text-right focus:outline-none"
          />
        ) : (
          <span className="text-white/60 font-mono">{formatCurrency(bs.budget.limit)}</span>
        )}
      </div>

      {/* Activity / Spent */}
      <div className="text-right">
        <span className="text-white font-mono">{formatCurrency(bs.spent)}</span>
        <p className="text-white/30 text-xs">{bs.pct.toFixed(0)}%</p>
      </div>

      {/* Available */}
      <div className="text-right pr-2">
        <span className={`font-mono font-bold ${isOver ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-emerald-400'}`}>
          {isOver ? '-' : '+'}{formatCurrency(Math.abs(available))}
        </span>
        <p className={`text-xs ${isOver ? 'text-red-400/60' : isWarn ? 'text-yellow-400/60' : 'text-emerald-400/60'}`}>
          {isOver ? 'Overspent' : isWarn ? 'Almost done' : 'Available'}
        </p>
      </div>

      {/* Edit */}
      <button onClick={() => setEditing(v => !v)}
        className="p-1.5 text-white/20 hover:text-white hover:bg-white/8 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
        {editing ? <Check size={14} className="text-emerald-400" onClick={save} /> : <Edit2 size={14} />}
      </button>
    </motion.div>
  );
}

export function Budgets() {
  const { categoryBudgetStatus, thisMonthIncome, thisMonthSpent, totalBudgeted, toBeBudgeted, updateBudget, hasData } = useFinance();

  if (!hasData) {
    return (
      <EmptyState
        icon="💰"
        title="No Budget Data"
        description="Connect your accounts and your budgets will be set up automatically."
        showSyncAction
      />
    );
  }

  const assignedTotal = categoryBudgetStatus.reduce((s, b) => s + b.budget.limit, 0);
  const onTrack = categoryBudgetStatus.filter(b => b.health === 'good').length;
  const overBudget = categoryBudgetStatus.filter(b => b.health === 'critical').length;
  const nearLimit = categoryBudgetStatus.filter(b => b.health === 'warning').length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-white text-2xl font-bold">Budget Manager</h1>
        <p className="text-white/40 text-sm mt-0.5">Zero-based budgeting — assign every rupee of income</p>
      </motion.div>

      {/* Top allocation cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Monthly Income', value: thisMonthIncome, color: 'text-emerald-400', sub: 'Total credited this month' },
          { label: 'Total Assigned', value: assignedTotal, color: 'text-violet-400', sub: 'Across all budget categories' },
          { label: 'Total Spent', value: thisMonthSpent, color: 'text-orange-400', sub: 'Transactions so far' },
          { label: 'To Be Assigned', value: toBeBudgeted, color: toBeBudgeted >= 0 ? 'text-emerald-400' : 'text-red-400', sub: toBeBudgeted >= 0 ? 'Unallocated income' : 'Over-allocated!' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass-card py-4">
            <p className="text-white/40 text-xs mb-1">{item.label}</p>
            <p className={`text-xl font-black font-mono ${item.color}`}>{formatCurrency(item.value)}</p>
            <p className="text-white/25 text-xs mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick stats row */}
      <div className="flex gap-3 text-sm flex-wrap">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {onTrack} On Track
        </span>
        {nearLimit > 0 && <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          {nearLimit} Near Limit
        </span>}
        {overBudget > 0 && <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {overBudget} Overspent
        </span>}
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 ml-auto">
          <Info size={12} /> Click a budget amount to edit it
        </span>
      </div>

      {/* Budget Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[36px_1fr_100px_100px_110px_36px] gap-0 px-4 py-2.5 bg-white/4 border-b border-white/8">
          <div />
          <div className="px-3 text-xs font-semibold text-white/35 uppercase tracking-wider">Category</div>
          <div className="text-xs font-semibold text-white/35 uppercase tracking-wider text-right">Budgeted</div>
          <div className="text-xs font-semibold text-white/35 uppercase tracking-wider text-right">Activity</div>
          <div className="text-xs font-semibold text-white/35 uppercase tracking-wider text-right pr-2">Available</div>
          <div />
        </div>

        {/* Rows */}
        {categoryBudgetStatus.map((bs, i) => (
          <motion.div key={bs.budget.category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
            <BudgetRow bs={bs} onUpdate={updateBudget} />
          </motion.div>
        ))}

        {/* Footer total */}
        <div className="grid grid-cols-[36px_1fr_100px_100px_110px_36px] gap-0 px-4 py-3 bg-white/4 border-t border-white/8 text-sm font-bold">
          <div />
          <div className="px-3 text-white/50">Total</div>
          <div className="text-right font-mono text-white/60">{formatCurrency(assignedTotal)}</div>
          <div className="text-right font-mono text-white">{formatCurrency(thisMonthSpent)}</div>
          <div className={`text-right pr-2 font-mono ${thisMonthIncome - thisMonthSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {thisMonthIncome >= thisMonthSpent ? '+' : '-'}{formatCurrency(Math.abs(thisMonthIncome - thisMonthSpent))}
          </div>
          <div />
        </div>
      </div>
    </div>
  );
}
