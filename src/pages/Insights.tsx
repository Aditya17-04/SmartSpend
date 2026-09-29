import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Calendar as CalendarIcon,
  ChevronDown,
  Lightbulb,
  Bot,
  ArrowUpRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/* ── Circular Progress Ring Component ──────────────── */
function CircularProgressRing({ pct, size = 130, strokeWidth = 11 }: { pct: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const color = pct > 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#22C55E';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
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

export function Insights({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { state } = useFinance();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

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

  // Filter transactions strictly for chosen month
  const monthTxns = useMemo(() => {
    return state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [state.transactions, selectedYear, selectedMonth]);

  // Aggregate debit spend strictly by category from actual transactions
  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTxns
      .filter(t => t.type === 'debit')
      .forEach(t => {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      });
    return map;
  }, [monthTxns]);

  // Dynamic calculated totals purely from transactions
  const totalDebitSpent = useMemo(() => {
    return monthTxns
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxns]);

  // Effective monthly budget
  const effectiveMonthlyBudget = state.monthlyBudget && state.monthlyBudget > 0
    ? state.monthlyBudget
    : state.budgets.reduce((s, b) => s + b.limit, 0);

  const spentAmount = totalDebitSpent;
  const remainingAmount = effectiveMonthlyBudget > 0 ? effectiveMonthlyBudget - spentAmount : 0;
  const usedPercentage = effectiveMonthlyBudget > 0
    ? Math.min((spentAmount / effectiveMonthlyBudget) * 100, 100)
    : 0;

  // Key metric calculations
  const categoryList = useMemo(() => {
    return Array.from(spendByCategory.entries())
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        pct: spentAmount > 0 ? Math.round((amt / spentAmount) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [spendByCategory, spentAmount]);

  const topCategory = categoryList[0] || null;

  const daysInMonth = 30;
  const avgDailySpend = spentAmount > 0 ? Math.round(spentAmount / daysInMonth) : 0;

  // Donut Chart Data built purely from actual spendByCategory entries
  const chartData = useMemo(() => {
    if (spendByCategory.size === 0) return [];

    return Array.from(spendByCategory.entries()).map(([cat, amt]) => ({
      name: cat,
      amount: amt,
      pct: spentAmount > 0 ? Math.round((amt / spentAmount) * 100) : 0,
      color: CATEGORY_COLORS[cat] ?? '#10B981',
      icon: CATEGORY_ICONS[cat] ?? '📦',
    })).sort((a, b) => b.amount - a.amount);
  }, [spendByCategory, spentAmount]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">Insights</h1>
            <span className="text-xl">✨</span>
          </div>
          <p className="text-white/50 text-sm mt-0.5 font-medium">Understand your spending. Make smarter decisions.</p>
        </div>

        {/* Date Selector on the right */}
        <div className="relative self-start sm:self-auto">
          <button 
            onClick={() => setShowMonthDropdown(v => !v)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#1C1C1E] border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <CalendarIcon size={15} className="text-emerald-400" />
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
      </div>

      {/* ── 2. AI Summary Card ── */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 bg-[#1C1C1E] border border-white/10 relative overflow-hidden shadow-xl"
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <Sparkles size={13} />
            <span>AI Spending Summary</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-4 max-w-lg">
              {/* Highlight summary statement */}
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
                {spentAmount > 0 ? (
                  <>
                    “You spent <span className="text-emerald-400 font-extrabold">{formatCurrency(spentAmount)}</span> this month{effectiveMonthlyBudget > 0 ? <>, which is <span className="text-emerald-400 font-extrabold">{usedPercentage.toFixed(0)}%</span> of your budget.</> : '.'}”
                  </>
                ) : (
                  <>
                    “No expenses recorded yet for <span className="text-emerald-400">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>.”
                  </>
                )}
              </h2>

              <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                {spentAmount > 0 
                  ? "Your spending pace is updated continuously from your manual transaction records."
                  : "Start recording your daily income and expenses from the Expenses tab to unlock real-time financial coach feedback."}
              </p>

              {/* Stats: Spent & Remaining */}
              <div className="flex items-center gap-8 pt-1">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 min-w-[120px]">
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Spent</p>
                  <p className="text-white font-bold text-lg font-mono mt-0.5">
                    {formatCurrency(spentAmount)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 min-w-[120px]">
                  <p className="text-emerald-400/70 text-xs font-medium uppercase tracking-wider">Remaining</p>
                  <p className="text-emerald-400 font-bold text-lg font-mono mt-0.5">
                    {effectiveMonthlyBudget > 0 ? formatCurrency(remainingAmount) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Circular progress indicator */}
            <div className="flex items-center justify-center self-center sm:self-auto flex-shrink-0 bg-white/[0.02] p-4 rounded-3xl border border-white/5">
              <CircularProgressRing pct={usedPercentage} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. Key Metrics (3 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Spent */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 text-xl">
            💳
          </div>
          <div>
            <p className="text-white/40 text-xs font-semibold">Total Spent</p>
            <p className="text-xl font-bold text-white font-mono mt-0.5">{formatCurrency(spentAmount)}</p>
            <p className="text-[11px] text-emerald-400/90 mt-0.5 font-medium">In {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
          </div>
        </motion.div>

        {/* Highest Spending Category */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0 text-xl">
            {topCategory ? (CATEGORY_ICONS[topCategory.category] || '🛍️') : '📊'}
          </div>
          <div className="min-w-0">
            <p className="text-white/40 text-xs font-semibold">Top Category</p>
            <p className="text-xl font-bold text-white truncate mt-0.5">
              {topCategory ? topCategory.category : 'None yet'}
            </p>
            <p className="text-[11px] text-pink-400/90 mt-0.5 font-medium font-mono">
              {topCategory ? `${formatCurrency(topCategory.amount)} (${topCategory.pct}%)` : 'No expenses'}
            </p>
          </div>
        </motion.div>

        {/* Average Daily Spend */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 text-xl">
            ⚡
          </div>
          <div>
            <p className="text-white/40 text-xs font-semibold">Average Daily Spend</p>
            <p className="text-xl font-bold text-white font-mono mt-0.5">{formatCurrency(avgDailySpend)}/day</p>
            <p className="text-[11px] text-blue-400/90 mt-0.5 font-medium">30-day average</p>
          </div>
        </motion.div>
      </div>

      {/* ── 4. Spending Overview (Donut Chart & Category Breakdown) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-white font-bold text-lg tracking-wide">Spending Overview</h3>
          <p className="text-white/40 text-xs mt-0.5">Category breakdown with amounts and percentages</p>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm space-y-2">
            <p className="text-3xl mb-2">📊</p>
            <p className="font-semibold text-white/70">No expenses recorded for this month</p>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Add your manual expense transactions in the Expenses tab to see your category breakdown here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
            {/* Donut Chart */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#1C1C1E] border border-white/10 px-3 py-2 rounded-xl text-xs shadow-2xl">
                            <p className="font-bold text-white">{data.name}</p>
                            <p className="text-emerald-400 font-mono font-semibold mt-0.5">
                              {formatCurrency(data.amount)} ({data.pct}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Label inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-white/40 font-medium">Total</span>
                <span className="text-lg font-bold text-white font-mono">{formatCurrency(spentAmount)}</span>
              </div>
            </div>

            {/* Breakdown Legend List */}
            <div className="md:col-span-7 space-y-2.5">
              {chartData.map((item) => (
                <div 
                  key={item.name}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] hover:bg-white/5 border border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: `${item.color}20`, border: `1px solid ${item.color}35` }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-white font-semibold text-sm">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-sm font-mono">{formatCurrency(item.amount)}</span>
                    <span 
                      className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono"
                      style={{ background: `${item.color}20`, color: item.color }}
                    >
                      {item.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── 5. AI Insights (3 Observations) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Sparkles size={18} className="text-emerald-400" />
          <div>
            <h3 className="text-white font-bold text-lg tracking-wide">AI Insights</h3>
            <p className="text-white/40 text-xs">Observations from your actual spending trends</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Observation 1 */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                📈
              </div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/15 px-2 py-0.5 rounded-md">
                Top Spending Area
              </span>
            </div>
            <h4 className="text-white font-bold text-sm">
              {topCategory ? `${topCategory.category} is your highest spend` : 'No category spend recorded'}
            </h4>
            <p className="text-white/60 text-xs leading-relaxed">
              {topCategory 
                ? `You've spent ${formatCurrency(topCategory.amount)} (${topCategory.pct}%) on ${topCategory.category}. Keeping a close eye on this category will optimize your budget.`
                : 'Add transactions under categories like Food, Shopping, Transport to see automated spending diagnosis.'}
            </p>
          </div>

          {/* Observation 2 */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                📉
              </div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/15 px-2 py-0.5 rounded-md">
                Discipline
              </span>
            </div>
            <h4 className="text-white font-bold text-sm">
              {spentAmount > 0 ? 'Spending Pace' : 'Clean Slate'}
            </h4>
            <p className="text-white/60 text-xs leading-relaxed">
              {spentAmount > 0 
                ? `Your current daily spend rate is ${formatCurrency(avgDailySpend)}/day. Staying disciplined each day builds your long-term savings.`
                : 'Starting fresh gives you total control to set a clean budget limit before tracking daily outflow.'}
            </p>
          </div>

          {/* Observation 3 */}
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center text-lg">
                🗓️
              </div>
              <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider bg-violet-500/15 px-2 py-0.5 rounded-md">
                Strategy
              </span>
            </div>
            <h4 className="text-white font-bold text-sm">Budget Management</h4>
            <p className="text-white/60 text-xs leading-relaxed">
              {effectiveMonthlyBudget > 0
                ? `Your monthly limit is ${formatCurrency(effectiveMonthlyBudget)}. Regular tracking prevents end-of-month financial surprises.`
                : 'Set a monthly budget in the Budget tab to enable dynamic 80% and 100% spending alert protections.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 6. Personalized Suggestions ── */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Lightbulb size={18} className="text-amber-400" />
          <div>
            <h3 className="text-white font-bold text-lg tracking-wide">Personalized Suggestions</h3>
            <p className="text-white/40 text-xs">Simple, high-impact moves to optimize your money</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Suggestion 1 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center flex-shrink-0 text-lg">
              🛍️
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold text-sm">24-Hour Purchase Rule</h4>
                <span className="text-emerald-400 font-bold text-xs font-mono">Impulse Shield</span>
              </div>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                Whenever you want to buy a non-essential item over ₹500, wait 24 hours. Most impulse urges fade naturally!
              </p>
            </div>
          </div>

          {/* Suggestion 2 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 text-lg">
              ⚡
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold text-sm">Categorize Every Expense</h4>
                <span className="text-emerald-400 font-bold text-xs font-mono">Clarity</span>
              </div>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                Always assign each expense to Cash or UPI and choose a category to maintain 100% accurate financial insights.
              </p>
            </div>
          </div>

          {/* Suggestion 3 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0 text-lg">
              ☕
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold text-sm">Micro-adjust Daily Small Spends</h4>
                <span className="text-emerald-400 font-bold text-xs font-mono">+₹1,500 Buffer</span>
              </div>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                Cutting just ₹50 on everyday snacks or bottled beverages builds an effortless ₹1,500 monthly safety net.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 7. Ask SmartSpend Banner / Direct Link ── */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-[#1C1C1E] to-[#1C1C1E] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center text-xl flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <Bot size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span>Ask SmartSpend AI Coach</span>
              <span className="text-sm">✨</span>
            </h3>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              Have questions about affordability, budgeting, or personalized advice? Chat with your dedicated 24/7 AI financial coach.
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigate?.('ask')}
          className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 self-start sm:self-auto flex-shrink-0"
        >
          <span>Open Ask AI</span>
          <ArrowUpRight size={17} className="stroke-[2.5]" />
        </button>
      </motion.div>
    </div>
  );
}
