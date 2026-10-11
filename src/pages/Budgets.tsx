import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Check, 
  AlertTriangle, 
  Bell, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Calendar as CalendarIcon, 
  Plus, 
  Wallet,
  CheckCircle2,
  SlidersHorizontal,
  PlusCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import type { Budget, Category } from '../types/finance';
import { EmptyState } from '../components/shared/EmptyState';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/* ── Circular Progress Ring Component ──────────────── */
function CircularProgress({ pct, size = 136, strokeWidth = 11 }: { pct: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const color = pct > 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#22C55E';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {pct.toFixed(0)}%
        </span>
        <span className="text-[10px] sm:text-[11px] text-white/50 font-medium leading-tight mt-0.5">
          of budget used
        </span>
      </div>
    </div>
  );
}

/* ── Set / Edit Overall Monthly Budget Modal ───────── */
function SetMonthlyBudgetModal({ 
  current, 
  onSave, 
  onClose 
}: {
  current: number; 
  onSave: (val: number) => void; 
  onClose: () => void;
}) {
  const [val, setVal] = useState(String(current || ''));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.96 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        exit={{ y: 50, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl border border-white/10 p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
              💰
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                {current > 0 ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
              </h3>
              <p className="text-white/40 text-xs">Total spending limit for this month</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-white/40 text-xs mb-1 font-medium">Monthly Amount</p>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-white/40 text-3xl font-light">₹</span>
            <input 
              type="number" 
              value={val} 
              onChange={e => setVal(e.target.value)} 
              placeholder="20000" 
              autoFocus
              className="bg-transparent text-white text-4xl font-extrabold w-48 text-center focus:outline-none placeholder:text-white/15 font-mono" 
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button 
            onClick={onClose} 
            className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { 
              const num = Math.abs(Number(val));
              onSave(isNaN(num) ? current : num); 
              onClose(); 
            }}
            disabled={!val || Number(val) <= 0}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-black text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
          >
            Save Budget
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Set / Edit Individual Category Budget Modal ───── */
function EditCategoryBudgetModal({ 
  category, 
  current, 
  onSave, 
  onClose 
}: {
  category: Category; 
  current: number; 
  onSave: (v: number) => void; 
  onClose: () => void;
}) {
  const [val, setVal] = useState(String(current || ''));
  const icon = CATEGORY_ICONS[category] ?? '📦';

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.96 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        exit={{ y: 50, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl border border-white/10 p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              {icon}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{category}</h3>
              <p className="text-white/40 text-xs">Set optional category limit</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-white/40 text-xs mb-1 font-medium">Category Limit</p>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-white/40 text-3xl font-light">₹</span>
            <input 
              type="number" 
              value={val} 
              onChange={e => setVal(e.target.value)} 
              placeholder="5000" 
              autoFocus
              className="bg-transparent text-white text-4xl font-extrabold w-44 text-center focus:outline-none placeholder:text-white/15 font-mono" 
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button 
            onClick={onClose} 
            className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { 
              const num = Math.abs(Number(val));
              onSave(isNaN(num) ? 0 : num); 
              onClose(); 
            }}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
          >
            Save Limit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Budget Screen ────────────────────────────── */
export function Budgets() {
  const { state, hasData, setMonthlyBudget, updateBudget } = useFinance();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showSetMonthlyModal, setShowSetMonthlyModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Auto-switch to active month if current calendar month has no data
  useEffect(() => {
    if (state.transactions.length > 0) {
      const hasCurrent = state.transactions.some(t => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
      if (!hasCurrent) {
        const sorted = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        if (latest) {
          const d = new Date(latest.date);
          if (!isNaN(d.getTime())) {
            setSelectedYear(d.getFullYear());
            setSelectedMonth(d.getMonth());
          }
        }
      }
    }
  }, [state.transactions.length]);

  // Filter transactions for chosen month
  const monthTxns = useMemo(() => {
    return state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [state.transactions, selectedYear, selectedMonth]);

  // Aggregate debit spend by category for chosen month
  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTxns
      .filter(t => t.type === 'debit')
      .forEach(t => {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      });
    return map;
  }, [monthTxns]);

  // Total spending from Expenses data
  const monthSpent = useMemo(() => {
    return monthTxns
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxns]);

  // Determine effective monthly budget
  const effectiveMonthlyBudget = state.monthlyBudget && state.monthlyBudget > 0
    ? state.monthlyBudget
    : state.budgets.reduce((s, b) => s + b.limit, 0);

  const hasBudgetConfigured = effectiveMonthlyBudget > 0;

  // Percentage & remaining calculations
  const overallPct = hasBudgetConfigured ? (monthSpent / effectiveMonthlyBudget) * 100 : 0;
  const remaining = effectiveMonthlyBudget - monthSpent;
  const isOverBudget = remaining < 0;

  // Build combined list of categories for secondary Category Budgets section
  const allCategoryStatus = useMemo(() => {
    // Collect all categories that either have a budget or have spend in this month
    const categorySet = new Set<string>();
    state.budgets.forEach(b => categorySet.add(b.category));
    spendByCategory.forEach((_, cat) => categorySet.add(cat));

    return Array.from(categorySet).map(cat => {
      const existingBudget = state.budgets.find(b => b.category === cat);
      const limit = existingBudget ? existingBudget.limit : 0;
      const spent = spendByCategory.get(cat) ?? 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      
      // Dynamic status: below 80% = On Track, 80-100% = Near Limit, above 100% = Over Budget
      let health: 'good' | 'warning' | 'critical' | 'none' = 'none';
      if (limit > 0) {
        if (pct > 100) health = 'critical';
        else if (pct >= 80) health = 'warning';
        else health = 'good';
      }

      return {
        category: cat,
        limit,
        spent,
        pct,
        health,
        remaining: limit > 0 ? limit - spent : 0,
        hasLimit: limit > 0,
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [state.budgets, spendByCategory]);

  // Dynamic status counters for the 3 cards
  // below 80% = On Track, 80-100% = Near Limit, above 100% = Over Budget
  const onTrackCount = useMemo(() => {
    const withLimit = allCategoryStatus.filter(c => c.hasLimit && c.health === 'good').length;
    if (withLimit > 0) return withLimit;
    // If no category limits are set yet, evaluate overall monthly budget
    return hasBudgetConfigured && overallPct < 80 ? 1 : 0;
  }, [allCategoryStatus, hasBudgetConfigured, overallPct]);

  const nearLimitCount = useMemo(() => {
    const withLimit = allCategoryStatus.filter(c => c.hasLimit && c.health === 'warning').length;
    if (withLimit > 0) return withLimit;
    return hasBudgetConfigured && overallPct >= 80 && overallPct <= 100 ? 1 : 0;
  }, [allCategoryStatus, hasBudgetConfigured, overallPct]);

  const overBudgetCount = useMemo(() => {
    const withLimit = allCategoryStatus.filter(c => c.hasLimit && c.health === 'critical').length;
    if (withLimit > 0) return withLimit;
    return hasBudgetConfigured && overallPct > 100 ? 1 : 0;
  }, [allCategoryStatus, hasBudgetConfigured, overallPct]);

  // Next reset date calculation
  const nextMonthIdx = (selectedMonth + 1) % 12;
  const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
  const resetText = `Resets on 1st ${MONTH_NAMES[nextMonthIdx]} ${nextYear}`;

  const currentEditingCategoryBudget = editingCategory
    ? allCategoryStatus.find(c => c.category === editingCategory)
    : null;

  return (
    <div className="space-y-5 pb-8">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">Budget</h1>
          <p className="text-white/50 text-sm mt-0.5 font-medium">Stay on track. Spend wisely.</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowMonthDropdown(v => !v)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#1C1C1E] border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <CalendarIcon size={15} className="text-white/60" />
              <span>{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
              <ChevronDown size={14} className="text-white/40" />
            </button>

            <AnimatePresence>
              {showMonthDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-[#1C1C1E] border border-white/10 rounded-2xl p-2 shadow-2xl z-30 space-y-1"
                >
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {MONTH_NAMES.map((m, idx) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedMonth(idx);
                          setShowMonthDropdown(false);
                        }}
                        className={`py-2 text-xs font-semibold rounded-xl transition-colors ${
                          selectedMonth === idx 
                            ? 'bg-emerald-500 text-black' 
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Edit / Set Budget Button */}
          <button 
            onClick={() => setShowSetMonthlyModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#1C1C1E] border border-white/10 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-all shadow-sm"
          >
            <Edit3 size={15} />
            <span>{hasBudgetConfigured ? 'Edit Budget' : 'Set Budget'}</span>
          </button>
        </div>
      </div>

      {/* ── Empty Budget State Callout (When No Monthly Budget Set) ── */}
      {!hasBudgetConfigured && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-[#1C1C1E] to-[#1C1C1E] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl flex-shrink-0">
              💡
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg">No Monthly Budget Set</h3>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                Set a monthly spending limit to track your expenses and get automatic alerts when reaching 80% or 100%.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowSetMonthlyModal(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 self-start sm:self-auto flex-shrink-0"
          >
            <PlusCircle size={17} />
            <span>Set Monthly Budget</span>
          </button>
        </motion.div>
      )}

      {/* ── Main Monthly Budget Card ── */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 bg-[#1C1C1E] border border-white/10 relative overflow-hidden shadow-xl"
      >
        {/* Background ambient gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Info Left, Donut + Graphic Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white/60 text-sm font-semibold tracking-wide">Monthly Budget</p>
                  <button 
                    onClick={() => setShowSetMonthlyModal(true)}
                    className="text-white/40 hover:text-emerald-400 transition-colors p-0.5"
                    title="Edit Monthly Budget"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5">
                  {hasBudgetConfigured ? formatCurrency(effectiveMonthlyBudget) : '₹0'}
                </h2>
              </div>

              {/* Reset date badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{resetText}</span>
              </div>

              {/* Spent & Remaining stats */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8 pt-1">
                <div>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Spent</p>
                  <p className="text-white font-bold text-base sm:text-lg font-mono mt-0.5 truncate">
                    {formatCurrency(monthSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Remaining</p>
                  <p className={`font-bold text-base sm:text-lg font-mono mt-0.5 truncate ${
                    !hasBudgetConfigured 
                      ? 'text-white/60' 
                      : isOverBudget 
                        ? 'text-rose-400' 
                        : 'text-emerald-400'
                  }`}>
                    {!hasBudgetConfigured 
                      ? '—' 
                      : isOverBudget 
                        ? `-${formatCurrency(Math.abs(remaining))}` 
                        : formatCurrency(remaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Circular Progress & Subtle Wallet Graphic */}
            <div className="flex items-center justify-center sm:justify-end gap-4 self-center sm:self-auto">
              <CircularProgress pct={hasBudgetConfigured ? overallPct : 0} />
              
              {/* Decorative 3D wallet / graphic */}
              <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
                <Wallet size={36} className="text-emerald-400 drop-shadow-[0_4px_10px_rgba(16,185,129,0.3)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mt-1">SmartSpend</span>
              </div>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallPct, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  !hasBudgetConfigured
                    ? 'bg-white/20'
                    : isOverBudget 
                      ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                      : overallPct >= 80 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                }`}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40 font-medium px-0.5">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Dynamic Alert Banner: triggers on reaching 80% and exceeding 100% */}
          {hasBudgetConfigured ? (
            <motion.div 
              layout
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                isOverBudget 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-200' 
                  : overallPct >= 80 
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-200' 
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              }`}
            >
              <div className="flex-shrink-0">
                {isOverBudget ? (
                  <Bell size={19} className="text-rose-400 animate-bounce" />
                ) : overallPct >= 80 ? (
                  <AlertTriangle size={19} className="text-amber-400" />
                ) : (
                  <CheckCircle2 size={19} className="text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold">
                  {isOverBudget 
                    ? `🚨 Budget Exceeded: You are ${formatCurrency(Math.abs(remaining))} over your monthly budget (${overallPct.toFixed(0)}% used)!`
                    : overallPct >= 80 
                      ? `⚠️ Approaching Limit: You have reached 80%+ of your monthly budget (${overallPct.toFixed(0)}% used, ${formatCurrency(remaining)} left). Slow down to stay on track!`
                      : `Great! You're doing good. Keep it up!`}
                </p>
                {isOverBudget && (
                  <p className="text-[11px] text-rose-300/80 mt-0.5">
                    Review your recent expenses or adjust your budget limit to avoid further overspending.
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-white/50 text-xs sm:text-sm">
              <span>Set your monthly budget to unlock spending health analytics and smart alerts.</span>
              <button 
                onClick={() => setShowSetMonthlyModal(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs ml-2 underline"
              >
                Set Now
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── 3 Summary Metric Status Cards ── */}
      {/* below 80% = On Track, 80–100% = Near Limit, above 100% = Over Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* On Track (< 80%) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-[#1C1C1E] border border-emerald-500/20 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Check size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight">{onTrackCount}</p>
            <p className="text-xs font-semibold text-white/90">On Track</p>
            <p className="text-[11px] text-white/40">&lt; 80% of limit</p>
          </div>
        </motion.div>

        {/* Near Limit (80% – 100%) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-[#1C1C1E] border border-amber-500/20 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <AlertTriangle size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight">{nearLimitCount}</p>
            <p className="text-xs font-semibold text-white/90">Near Limit</p>
            <p className="text-[11px] text-white/40">80% – 100% of limit</p>
          </div>
        </motion.div>

        {/* Over Budget (> 100%) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-[#1C1C1E] border border-rose-500/20 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
            <Bell size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight">{overBudgetCount}</p>
            <p className="text-xs font-semibold text-white/90">Over Budget</p>
            <p className="text-[11px] text-white/40">&gt; 100% of limit</p>
          </div>
        </motion.div>
      </div>

      {/* ── Category Budgets Card Container (Secondary Section) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-white font-bold text-lg tracking-wide">Category Budgets</h3>
            <p className="text-white/40 text-xs mt-0.5">Optionally set and customize spending limits per category</p>
          </div>
          <button 
            onClick={() => setShowSetMonthlyModal(true)}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Edit Monthly</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Category Budget Items List */}
        {allCategoryStatus.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            No expenses recorded for this month yet. Add transactions from the Expenses tab!
          </div>
        ) : (
          <div className="space-y-3">
            {allCategoryStatus.map((item, idx) => {
              const icon = CATEGORY_ICONS[item.category] ?? '📦';
              const catColor = CATEGORY_COLORS[item.category] ?? '#10B981';
              const isOver = item.hasLimit && item.health === 'critical';
              const isNear = item.hasLimit && item.health === 'warning';

              const pillBg = item.hasLimit
                ? isOver 
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                  : isNear 
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/5 text-white/50 border-white/10';

              return (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setEditingCategory(item.category)}
                  className="group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                >
                  {/* Left side: Icon + Category Name + Progress bar */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${catColor}20`, border: `1px solid ${catColor}35` }}
                    >
                      {icon}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <p className="text-white font-semibold text-sm truncate group-hover:text-emerald-300 transition-colors">
                        {item.category}
                      </p>
                      
                      {/* Horizontal progress bar */}
                      <div className="h-1.5 w-20 sm:w-48 md:w-60 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: item.hasLimit ? `${Math.min(item.pct, 100)}%` : '0%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ 
                            background: isOver 
                              ? '#EF4444' 
                              : isNear 
                                ? '#F59E0B' 
                                : catColor || '#10B981' 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount + Status + Pill + Chevron */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-semibold text-white font-mono">
                        {formatCurrency(item.spent)}{' '}
                        <span className="text-white/40 hidden sm:inline">
                          {item.hasLimit ? `/ ${formatCurrency(item.limit)}` : '(No limit)'}
                        </span>
                      </p>
                      <p className={`text-[11px] sm:text-xs font-medium ${
                        !item.hasLimit 
                          ? 'text-emerald-400/80' 
                          : isOver 
                            ? 'text-rose-400' 
                            : isNear 
                              ? 'text-amber-400' 
                              : 'text-emerald-400'
                      }`}>
                        {!item.hasLimit 
                          ? '+ Set limit' 
                          : isOver 
                            ? `${formatCurrency(Math.abs(item.remaining))} over` 
                            : `${formatCurrency(item.remaining)} left`}
                      </p>
                    </div>

                    {/* Percentage pill */}
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold border font-mono ${pillBg}`}>
                      {item.hasLimit ? `${item.pct.toFixed(0)}%` : '—'}
                    </span>

                    {/* Right chevron */}
                    <ChevronRight size={15} className="text-white/30 group-hover:text-white transition-colors hidden sm:block" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Set / Edit Overall Monthly Budget Modal ── */}
      <AnimatePresence>
        {showSetMonthlyModal && (
          <SetMonthlyBudgetModal
            current={effectiveMonthlyBudget}
            onSave={v => setMonthlyBudget(v)}
            onClose={() => setShowSetMonthlyModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Single Category Edit Modal ── */}
      <AnimatePresence>
        {editingCategory && (
          <EditCategoryBudgetModal
            category={editingCategory}
            current={currentEditingCategoryBudget?.limit ?? 0}
            onSave={v => {
              updateBudget({
                category: editingCategory,
                limit: v,
                color: CATEGORY_COLORS[editingCategory] ?? '#10B981',
              });
            }}
            onClose={() => setEditingCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
