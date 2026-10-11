import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Eye,
  Lock,
  Bell,
  Info,
  BadgeCheck,
  LayoutGrid,
  Receipt,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  Flame,
  Leaf,
  Users,
  RefreshCw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS, getCategoryColor } from "../lib/utils";
import { useFinance } from "../context/FinanceContext";
import { useAuth } from "../context/AuthContext";
import type { Transaction, Budget } from "../types/finance";
import { supabase } from "../lib/supabase";

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutGrid },
  { id: "expenses",  label: "Expenses",  icon: Receipt     },
  { id: "budgets",   label: "Budgets",   icon: Wallet      },
  { id: "insights",  label: "Insights",  icon: BarChart3   },
] as const;

type TabId = typeof TABS[number]["id"];

const CONTAINER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const ITEM = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Small helpers ────────────────────────────────────────────────────────────

function BudgetBar({ spent, budget, color }: { spent: number; budget: number; color: string }) {
  const pct = Math.min((spent / Math.max(budget, 1)) * 100, 100);
  const over = spent > budget;
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mt-2 w-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: over ? "#EF4444" : color }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor: string }) {
  return (
    <div className="rounded-2xl p-3.5 border border-white/8 bg-white/3 flex flex-col gap-1">
      <p className="text-white/40 text-xs font-medium leading-tight">{label}</p>
      <p className="text-white font-black text-lg font-mono leading-none">{value}</p>
      <p className={`text-xs font-medium mt-0.5 ${subColor}`}>{sub}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">📭</div>
      <p className="text-white/40 text-sm">{message}</p>
    </div>
  );
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function OverviewTab({
  transactions, budgets, monthLabel, year,
  totalSpent, totalIncome, totalBudget, childName,
}: {
  transactions: Transaction[];
  budgets: Budget[];
  monthLabel: string;
  year: number;
  totalSpent: number;
  totalIncome: number;
  totalBudget: number;
  childName: string;
}) {
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const budgetPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = totalBudget > 0 && totalSpent > totalBudget;
  const saved = totalIncome - totalSpent;

  // Build category spend map
  const categoryMap = new Map<string, number>();
  transactions.filter(t => t.type === "debit").forEach(t => {
    categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
  });
  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="show" className="space-y-4">
      {/* Hero card */}
      <motion.div variants={ITEM} className="relative rounded-3xl overflow-hidden p-6"
        style={{ background: "linear-gradient(135deg,#064E3B 0%,#065F46 50%,#047857 100%)" }}
      >
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-8 w-20 h-20 rounded-full bg-emerald-400/10 blur-xl" />
        <div className="relative z-10">
          <p className="text-emerald-200/70 text-xs font-medium mb-1">Total Spent — {monthLabel} {year}</p>
          <h2 className="text-white text-4xl font-black tracking-tight mb-1 font-mono">
            {formatCurrency(totalSpent)}
          </h2>
          <p className={`text-sm font-semibold ${isOverBudget ? "text-red-300" : "text-emerald-300"}`}>
            {totalBudget > 0
              ? isOverBudget
                ? `Over budget by ${formatCurrency(totalSpent - totalBudget)}`
                : `${formatCurrency(remaining)} remaining of ${formatCurrency(totalBudget)} budget`
              : `No monthly budget set`}
          </p>
          {totalBudget > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-emerald-200/50">0</span>
                <span className="text-emerald-200/70 font-medium">{formatCurrency(totalBudget)} budget</span>
              </div>
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetPct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: isOverBudget ? "#EF4444" : "rgba(255,255,255,0.75)" }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 3 stat cards */}
      <motion.div variants={ITEM} className="grid grid-cols-3 gap-3">
        <StatCard label="Income" value={formatCurrency(totalIncome)} sub={totalIncome > 0 ? "Received" : "None logged"} subColor={totalIncome > 0 ? "text-emerald-400" : "text-white/30"} />
        <StatCard label="Saved" value={formatCurrency(Math.abs(saved))} sub={saved >= 0 ? "Saved" : "Deficit"} subColor={saved >= 0 ? "text-emerald-400" : "text-red-400"} />
        <StatCard label="Budget Used" value={totalBudget > 0 ? `${budgetPct.toFixed(0)}%` : "—"} sub={budgetPct >= 100 ? "Over!" : budgetPct >= 80 ? "Almost" : "On track"} subColor={budgetPct >= 100 ? "text-red-400" : budgetPct >= 80 ? "text-amber-400" : "text-emerald-400"} />
      </motion.div>

      {/* Top Spending Categories */}
      {topCategories.length > 0 ? (
        <motion.div variants={ITEM} className="glass-card space-y-3.5">
          <h2 className="text-white font-bold text-base">Top Categories</h2>
          {topCategories.map(([cat, amount], idx) => {
            const color = getCategoryColor(cat);
            const icon = CATEGORY_ICONS[cat] ?? "📦";
            const budget = budgets.find(b => b.category === cat);
            return (
              <motion.div key={cat} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: color + "18" }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-white/85 text-sm font-semibold">{cat}</p>
                      <span className="text-sm font-bold font-mono text-white">{formatCurrency(amount)}</span>
                    </div>
                    {budget && <BudgetBar spent={amount} budget={budget.limit} color={color} />}
                    {budget && (
                      <p className="text-white/30 text-xs mt-1">
                        of {formatCurrency(budget.limit)} budget
                        {amount > budget.limit && <span className="text-red-400 ml-1">· Exceeded!</span>}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div variants={ITEM} className="glass-card">
          <EmptyState message={`No spending recorded for ${childName} in ${monthLabel}.`} />
        </motion.div>
      )}

      {/* Recent 3 transactions preview */}
      {transactions.filter(t => t.type === "debit").length > 0 && (
        <motion.div variants={ITEM} className="glass-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-base">Recent Activity</h2>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/8">
              <Eye size={11} className="text-white/40" />
              <span className="text-white/40 text-xs font-medium">View only</span>
            </div>
          </div>
          <div className="space-y-1">
            {transactions
              .filter(t => t.type === "debit")
              .slice(0, 3)
              .map((exp, i) => {
                const color = getCategoryColor(exp.category);
                const icon = CATEGORY_ICONS[exp.category] ?? "📦";
                return (
                  <motion.div key={exp.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/4 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: color + "18" }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{exp.title}</p>
                      <p className="text-white/35 text-xs truncate">{exp.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold text-sm font-mono">-{formatCurrency(exp.amount)}</p>
                      <p className="text-white/30 text-xs">
                        {new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ExpensesTab({ transactions, childName, monthLabel }: { transactions: Transaction[]; childName: string; monthLabel: string }) {
  const [filter, setFilter] = useState<"all" | "debit" | "credit">("debit");
  const filtered = transactions.filter(t => filter === "all" || t.type === filter);

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="show" className="space-y-4">
      {/* Filter pills */}
      <motion.div variants={ITEM} className="flex gap-2">
        {(["debit", "credit", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                : "bg-white/5 text-white/40 border border-white/8 hover:text-white/70"
            }`}
          >
            {f === "debit" ? "Expenses" : f === "credit" ? "Income" : "All"}
          </button>
        ))}
      </motion.div>

      <motion.div variants={ITEM} className="glass-card space-y-1">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-white font-bold text-base">Transactions — {monthLabel}</h2>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/8">
            <Lock size={11} className="text-white/30" />
            <span className="text-white/30 text-xs font-medium">Read-only</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message={`No ${filter === "all" ? "" : filter} transactions for ${childName} in ${monthLabel}.`} />
        ) : (
          filtered.map((exp, i) => {
            const color = getCategoryColor(exp.category);
            const icon = CATEGORY_ICONS[exp.category] ?? "📦";
            const isCredit = exp.type === "credit";
            return (
              <motion.div key={exp.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/4 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: color + "18" }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{exp.title}</p>
                  <p className="text-white/35 text-xs truncate">{exp.category} · {exp.status}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm font-mono ${isCredit ? "text-emerald-400" : "text-white"}`}>
                    {isCredit ? "+" : "-"}{formatCurrency(exp.amount)}
                  </p>
                  <p className="text-white/30 text-xs">
                    {new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <motion.div variants={ITEM} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/4 border border-white/6">
        <Lock size={13} className="text-white/30 flex-shrink-0 mt-0.5" />
        <p className="text-white/35 text-xs leading-relaxed">
          You can <strong className="text-white/50">view</strong> shared transactions but cannot edit, delete, or modify any entries.
        </p>
      </motion.div>
    </motion.div>
  );
}

function BudgetsTab({ budgets, spendMap, monthLabel }: { budgets: Budget[]; spendMap: Map<string, number>; monthLabel: string }) {
  const budgetsWithSpend = budgets.map(b => ({
    ...b,
    spent: spendMap.get(b.category) ?? 0,
    pct: Math.min(((spendMap.get(b.category) ?? 0) / Math.max(b.limit, 1)) * 100, 100),
    over: (spendMap.get(b.category) ?? 0) > b.limit,
  })).sort((a, b) => b.pct - a.pct);

  const overCount = budgetsWithSpend.filter(b => b.over).length;
  const warnCount = budgetsWithSpend.filter(b => !b.over && b.pct >= 70).length;

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="show" className="space-y-4">
      {/* Summary pills */}
      <motion.div variants={ITEM} className="flex gap-3">
        <div className="flex-1 rounded-2xl p-3 bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 text-xs font-bold">{overCount} Over budget</p>
            <p className="text-white/30 text-xs">{monthLabel}</p>
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-3 bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <Flame size={14} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-400 text-xs font-bold">{warnCount} Near limit</p>
            <p className="text-white/30 text-xs">≥70% used</p>
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-3 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <Leaf size={14} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 text-xs font-bold">{Math.max(0, budgetsWithSpend.length - overCount - warnCount)} On track</p>
            <p className="text-white/30 text-xs">Healthy</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={ITEM} className="glass-card space-y-4">
        <h2 className="text-white font-bold text-base">Budget Breakdown — {monthLabel}</h2>
        {budgetsWithSpend.length === 0 ? (
          <EmptyState message="No budgets configured yet." />
        ) : (
          <div className="space-y-4">
            {budgetsWithSpend.map((b, idx) => {
              const icon = CATEGORY_ICONS[b.category] ?? "📦";
              return (
                <motion.div key={b.category} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: b.color + "18" }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-white/85 text-sm font-semibold">{b.category}</p>
                        <div className="flex items-center gap-2">
                          {b.over ? (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg text-red-400 bg-red-500/10 flex items-center gap-0.5">
                              <ArrowUpRight size={10} />Over!
                            </span>
                          ) : b.pct >= 70 ? (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg text-amber-400 bg-amber-500/10 flex items-center gap-0.5">
                              <Flame size={10} />{b.pct.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg text-emerald-400 bg-emerald-500/10 flex items-center gap-0.5">
                              <ArrowDownRight size={10} />{b.pct.toFixed(0)}%
                            </span>
                          )}
                          <span className={`text-sm font-bold font-mono ${b.over ? "text-red-400" : "text-white"}`}>
                            {formatCurrency(b.spent)}
                          </span>
                        </div>
                      </div>
                      <BudgetBar spent={b.spent} budget={b.limit} color={b.color} />
                      <p className="text-white/30 text-xs mt-1">
                        of {formatCurrency(b.limit)} budget
                        {b.over && <span className="text-red-400 ml-1">· {formatCurrency(b.spent - b.limit)} over</span>}
                        {!b.over && <span className="text-white/25 ml-1">· {formatCurrency(b.limit - b.spent)} left</span>}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function InsightsTab({
  transactions, budgets, spendMap, totalSpent, totalIncome, childName, monthLabel,
}: {
  transactions: Transaction[];
  budgets: Budget[];
  spendMap: Map<string, number>;
  totalSpent: number;
  totalIncome: number;
  childName: string;
  monthLabel: string;
}) {
  const topCat = Array.from(spendMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const overBudgetCats = budgets.filter(b => (spendMap.get(b.category) ?? 0) > b.limit);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
  const debitCount = transactions.filter(t => t.type === "debit").length;

  const alerts = useMemo(() => {
    const result: Array<{ severity: "high" | "medium" | "low"; message: string; detail: string; icon: string }> = [];
    overBudgetCats.forEach(b => {
      const spent = spendMap.get(b.category) ?? 0;
      result.push({
        severity: "high",
        message: `${b.category} budget exceeded`,
        detail: `${formatCurrency(spent)} spent vs ${formatCurrency(b.limit)} limit — over by ${formatCurrency(spent - b.limit)}.`,
        icon: CATEGORY_ICONS[b.category] ?? "📦",
      });
    });
    budgets.filter(b => {
      const pct = ((spendMap.get(b.category) ?? 0) / b.limit) * 100;
      return pct >= 70 && pct < 100;
    }).forEach(b => {
      const spent = spendMap.get(b.category) ?? 0;
      const pct = (spent / b.limit) * 100;
      result.push({
        severity: "medium",
        message: `${b.category} at ${pct.toFixed(0)}% of budget`,
        detail: `${formatCurrency(spent)} used of ${formatCurrency(b.limit)} limit. ${formatCurrency(b.limit - spent)} remaining.`,
        icon: CATEGORY_ICONS[b.category] ?? "📦",
      });
    });
    if (result.length === 0) {
      result.push({
        severity: "low",
        message: "All budgets on track this month 🎉",
        detail: "No categories are near or over their limits. Great financial discipline!",
        icon: "✅",
      });
    }
    return result;
  }, [budgets, spendMap, overBudgetCats]);

  const SEVERITY_STYLE = {
    high:   { border: "border-red-500/30",    bg: "bg-red-500/10",    dot: "bg-red-400",    text: "text-red-400" },
    medium: { border: "border-amber-500/30",  bg: "bg-amber-500/10",  dot: "bg-amber-400",  text: "text-amber-400" },
    low:    { border: "border-emerald-500/30",bg: "bg-emerald-500/10",dot: "bg-emerald-400",text: "text-emerald-400" },
  };

  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="show" className="space-y-4">

      {/* Key metrics */}
      <motion.div variants={ITEM} className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 border border-white/8 bg-white/3 space-y-1">
          <p className="text-white/40 text-xs font-medium">Savings Rate</p>
          <p className={`text-2xl font-black font-mono ${savingsRate >= 20 ? "text-emerald-400" : savingsRate >= 0 ? "text-amber-400" : "text-red-400"}`}>
            {savingsRate >= 0 ? savingsRate.toFixed(0) : "0"}%
          </p>
          <p className="text-white/30 text-xs">{savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : savingsRate >= 0 ? "Low" : "Deficit"}</p>
        </div>
        <div className="rounded-2xl p-4 border border-white/8 bg-white/3 space-y-1">
          <p className="text-white/40 text-xs font-medium">Transactions</p>
          <p className="text-2xl font-black font-mono text-white">{debitCount}</p>
          <p className="text-white/30 text-xs">expense entries</p>
        </div>
      </motion.div>

      {/* Spending Alerts */}
      <motion.div variants={ITEM} className="glass-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={16} className="text-amber-400" />
          <h2 className="text-white font-bold text-base">Spending Alerts</h2>
          {overBudgetCats.length > 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
              {overBudgetCats.length} flagged
            </span>
          )}
        </div>
        <div className="space-y-2">
          {alerts.map((alert, idx) => {
            const s = SEVERITY_STYLE[alert.severity];
            const isExpanded = expanded === idx;
            return (
              <button key={idx} onClick={() => setExpanded(isExpanded ? null : idx)}
                className={`w-full text-left rounded-2xl border p-3.5 transition-all ${s.bg} ${s.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${s.text}`}>{alert.message}</p>
                      <span className="text-lg flex-shrink-0">{alert.icon}</span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-white/50 text-xs mt-1.5 leading-relaxed overflow-hidden"
                        >
                          {alert.detail}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* AI Insight card */}
      <motion.div variants={ITEM}
        className="relative rounded-2xl p-5 overflow-hidden border border-violet-500/20"
        style={{ background: "linear-gradient(135deg,rgba(109,99,255,0.12) 0%,rgba(59,130,246,0.08) 100%)" }}
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles size={14} className="text-violet-400" />
            </div>
            <h2 className="text-white font-bold text-base">AI Insight for Parents</h2>
          </div>
          <div className="space-y-3 text-white/70 text-sm leading-relaxed">
            {totalSpent === 0 ? (
              <p>📭 No spending data found for {childName} in {monthLabel}. Check back once transactions are recorded.</p>
            ) : (
              <>
                {topCat && (
                  <p>
                    {CATEGORY_ICONS[topCat[0]] ?? "💸"} <strong className="text-white/90">Biggest spend: {topCat[0]}</strong> — {formatCurrency(topCat[1])} this month, making up {totalSpent > 0 ? ((topCat[1] / totalSpent) * 100).toFixed(0) : 0}% of total spending.
                  </p>
                )}
                {savingsRate >= 20 && (
                  <p>🌱 <strong className="text-white/90">Savings rate is excellent</strong> at {savingsRate.toFixed(0)}%. {childName} is demonstrating strong financial discipline.</p>
                )}
                {savingsRate >= 0 && savingsRate < 20 && (
                  <p>⚠️ <strong className="text-white/90">Savings rate is low</strong> at {savingsRate.toFixed(0)}%. Consider a friendly conversation about budgeting goals.</p>
                )}
                {overBudgetCats.length > 0 && (
                  <p>🚨 <strong className="text-white/90">{overBudgetCats.length} {overBudgetCats.length === 1 ? "category has" : "categories have"} exceeded budget</strong> this month — {overBudgetCats.map(b => b.category).join(", ")}. A check-in may be helpful.</p>
                )}
                {overBudgetCats.length === 0 && budgets.length > 0 && (
                  <p>✅ <strong className="text-white/90">All budgets are on track</strong> this month. Spending looks balanced and controlled.</p>
                )}
                {debitCount > 20 && (
                  <p>📊 <strong className="text-white/90">High transaction frequency</strong> — {debitCount} expense entries this month. This is worth reviewing for any impulse patterns.</p>
                )}
              </>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-violet-400/60 text-xs">
            <Info size={11} />
            <span>Generated by SmartSpend AI · Based on shared data</span>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ParentDashboard() {
  const { state, categoryBudgetStatus } = useFinance();
  const { user } = useAuth();
  const [sharedChild, setSharedChild] = useState<{ name: string; transactions: Transaction[]; budgets: Budget[] } | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ id: string } | null>(null);
  const [accessMessage, setAccessMessage] = useState('');
  const [isParentAccount, setIsParentAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [customChildName, setCustomChildName] = useState<string>('');
  const [isEditingChildName, setIsEditingChildName] = useState(false);
  const [tempChildName, setTempChildName] = useState('');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthOpen, setMonthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const loadSharedChild = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.email) return;
    setIsLoading(true);
    setAccessMessage('');
    try {
      // 1. Check for pending invite addressed to this email
      const { data: pending, error: pendingError } = await client
        .from('parent_access')
        .select('id')
        .eq('parent_email', user.email.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();
      if (pendingError) {
        setAccessMessage(`Unable to check consent: ${pendingError.message}`);
        return;
      }
      if (pending) {
        setPendingInvite(pending);
        setIsParentAccount(true);
      }

      // 2. Check for an already-approved access record (match by parent_id OR by email)
      const { data: approved, error: approvedError } = await client
        .from('parent_access')
        .select('id, child_id, parent_id, parent_email, status')
        .or(`parent_id.eq.${user.id},parent_email.eq."${user.email.toLowerCase()}"`)
        .eq('status', 'approved')
        .maybeSingle();
      if (approvedError) {
        setAccessMessage(`Unable to load parent access: ${approvedError.message}`);
        return;
      }
      if (!approved) return;

      setIsParentAccount(true);

      // Auto-link parent_id if currently null or mismatched
      if (approved.parent_id !== user.id) {
        console.log('Auto-linking parent_id to current user...', user.id);
        const { error: linkErr } = await client
          .from('parent_access')
          .update({ parent_id: user.id, approved_at: new Date().toISOString() })
          .eq('id', approved.id);
        if (linkErr) {
          console.warn('Could not auto-link parent_id:', linkErr.message);
        }
      }

      // 3. Fetch the child's finance snapshot
      setChildId(approved.child_id);
      const savedCustomName = localStorage.getItem(`smart-spend-child-name-${approved.child_id}`) || '';
      if (savedCustomName) {
        setCustomChildName(savedCustomName);
      }

      const { data: snapshot, error: snapshotError } = await client
        .from('finance_snapshots')
        .select('data')
        .eq('user_id', approved.child_id)
        .maybeSingle();

      let child = snapshot?.data as { transactions?: Transaction[]; budgets?: Budget[]; _name?: string; name?: string } | undefined;

      // 4. Fallback: Local storage cache (for same-browser testing or offline cache)
      if (!child || (!child.transactions?.length && !child.budgets?.length)) {
        try {
          const localChildRaw = localStorage.getItem(`smart-spend-finance-${approved.child_id}`);
          if (localChildRaw) {
            const parsed = JSON.parse(localChildRaw);
            if (parsed.transactions?.length || parsed.budgets?.length) {
              child = {
                ...parsed,
                _name: child?._name ?? parsed._name ?? parsed.name,
              };
              console.log('Loaded child data from local storage cache');
            }
          }
        } catch (e) {
          console.warn('Could not read local child storage fallback:', e);
        }
      }

      // Check for name from various sources
      const localChildProfileName = localStorage.getItem(`smart-spend-user-name-${approved.child_id}`) || '';
      const inferredName = savedCustomName || child?._name || child?.name || localChildProfileName || (approved as any).child_name || '';

      if (inferredName && inferredName !== 'Your Child') {
        setCustomChildName(inferredName);
      }

      if (snapshotError && !child) {
        console.error('Child snapshot query error:', snapshotError);
        setAccessMessage(`Access is approved, but child data could not be fetched (${snapshotError.message}). Check database permissions or tap Refresh.`);
        return;
      }

      if (child && ((child.transactions && child.transactions.length > 0) || (child.budgets && child.budgets.length > 0))) {
        setSharedChild({
          name: inferredName || child._name || child.name || 'Your Child',
          transactions: child.transactions ?? [],
          budgets: child.budgets ?? [],
        });
        setAccessMessage('');
      } else {
        setAccessMessage('Access is approved! However, your child has not synced any transactions yet. Ask them to open Settings and tap "Sync to Parent".');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSharedChild();
  }, [loadSharedChild]);

  const approveInvite = async () => {
    const client = supabase;
    if (!client || !pendingInvite || !user) return;
    setIsLoading(true);
    const { error } = await client
      .from('parent_access')
      .update({ parent_id: user.id, status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', pendingInvite.id);
    if (error) {
      setAccessMessage(error.message);
      setIsLoading(false);
      return;
    }
    setPendingInvite(null);
    // Re-run the full load to pick up child data now that parent_id is set
    await loadSharedChild();
  };

  const sourceTransactions = sharedChild?.transactions ?? (isParentAccount ? [] : state.transactions);
  const visibleTransactions = Array.from(new Map(sourceTransactions.map(transaction => [transaction.id, transaction])).values());
  const visibleBudgets = sharedChild?.budgets ?? (isParentAccount ? [] : state.budgets);

  // Auto-switch to active month if current calendar month has no data
  useEffect(() => {
    if (visibleTransactions.length > 0) {
      const hasCurrent = visibleTransactions.some(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      if (!hasCurrent) {
        const sorted = [...visibleTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  }, [visibleTransactions.length]);

  // Filter transactions by selected month/year
  const monthTransactions = useMemo(() => {
    return visibleTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visibleTransactions, selectedMonth, selectedYear]);

  // Spend map for the selected month
  const spendMap = useMemo(() => {
    const m = new Map<string, number>();
    monthTransactions.filter(t => t.type === "debit").forEach(t => {
      m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    });
    return m;
  }, [monthTransactions]);

  const totalSpent = useMemo(() => monthTransactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0), [monthTransactions]);
  const totalIncome = useMemo(() => monthTransactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0), [monthTransactions]);
  const totalBudget = visibleBudgets.reduce((s, b) => s + b.limit, 0);

  const childName = customChildName || (sharedChild?.name && sharedChild.name !== 'Your Child' ? sharedChild.name : 'Your Child');

  const handleSaveChildName = () => {
    const trimmed = tempChildName.trim();
    if (!trimmed) {
      setIsEditingChildName(false);
      return;
    }
    setCustomChildName(trimmed);
    if (childId) {
      localStorage.setItem(`smart-spend-child-name-${childId}`, trimmed);
    }
    setSharedChild(prev => prev ? { ...prev, name: trimmed } : prev);
    setIsEditingChildName(false);
  };

  // Show a "no access yet" screen if loading is done and there's no data/invite
  if (!isLoading && !sharedChild && !pendingInvite && isParentAccount === false) {
    return (
      <div className="min-h-screen text-white font-sans flex flex-col items-center justify-center gap-6 pb-8 px-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Users size={28} className="text-violet-400" />
        </div>
        <div className="text-center max-w-sm">
          <h1 className="text-white font-bold text-xl mb-2">No Parent Access Yet</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            This is a <strong className="text-white/70">view-only dashboard</strong> for parents.<br /><br />
            To get started, ask your child to open <strong className="text-white/70">Settings → Parent Access</strong> and enter your email address. Once they send consent, you'll see an approval prompt here.
          </p>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/2 max-w-sm w-full">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield size={14} className="text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-white/70 text-sm font-semibold">Child-controlled sharing</p>
            <p className="text-white/35 text-xs leading-relaxed">
              Only the child can initiate sharing. Parents get a read-only view and can never edit or delete transactions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans pb-8">

      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-30 bg-[#111113]/95 backdrop-blur-md border-b border-white/6 -mx-3 sm:-mx-6 px-3 sm:px-6 mb-5">
        <div className="py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-black text-sm sm:text-base shadow-md">
                {childName !== 'Your Child' ? childName.charAt(0).toUpperCase() : (user?.avatar ?? "U")}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border-2 border-[#111113]" />
            </div>
            <div className="min-w-0">
              <p className="text-white/40 text-[11px] sm:text-xs font-medium">Parent View</p>
              {isEditingChildName ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    value={tempChildName}
                    onChange={e => setTempChildName(e.target.value)}
                    placeholder="Enter child's name"
                    autoFocus
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-400 w-28 sm:w-40"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveChildName();
                      if (e.key === 'Escape') setIsEditingChildName(false);
                    }}
                  />
                  <button onClick={handleSaveChildName} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                    <Check size={13} />
                  </button>
                  <button onClick={() => setIsEditingChildName(false)} className="p-1.5 rounded-lg bg-white/10 text-white/50 hover:bg-white/20">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-bold text-base leading-tight">
                    {childName}&apos;s Spending
                  </h1>
                  <button
                    onClick={() => {
                      setTempChildName(childName === 'Your Child' ? '' : childName);
                      setIsEditingChildName(true);
                    }}
                    title="Change child's name"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[11px] font-medium transition-colors border border-white/10"
                  >
                    <Pencil size={10} />
                    <span>{childName === 'Your Child' ? 'Set name' : 'Edit'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controls: Refresh & Month picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadSharedChild()}
              disabled={isLoading}
              title="Refresh Data"
              className="p-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>

            {/* Month picker */}
            <div className="relative">
              <button
                onClick={() => setMonthOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/6 border border-white/10 text-white/80 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                {MONTHS[selectedMonth].slice(0, 3)} {selectedYear}
                <ChevronDown size={13} className={`transition-transform ${monthOpen ? "rotate-180" : ""}`} />
              </button>
            <AnimatePresence>
              {monthOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-[#1C1C1E] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 grid grid-cols-3 gap-1"
                >
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(i); setMonthOpen(false); }}
                      className={`py-1.5 px-1 rounded-xl text-xs font-semibold transition-all ${
                        i === selectedMonth ? "bg-violet-600 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pb-3 overflow-x-auto scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Consent banner */}
      {pendingInvite && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-4">
          <p className="text-amber-200 text-sm">A child has invited this account to view their spending.</p>
          <button
            onClick={approveInvite}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Approving…' : 'Approve'}
          </button>
        </div>
      )}
      {isLoading && !pendingInvite && (
        <div className="flex items-center gap-2 mb-4 text-white/50 text-sm">
          <svg className="animate-spin w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading child data…
        </div>
      )}
      {accessMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Info size={14} className="flex-shrink-0" />
            <span>{accessMessage}</span>
          </div>
          <button
            onClick={() => void loadSharedChild()}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            <RefreshCw className={isLoading ? "animate-spin" : ""} size={12} />
            <span>Refresh</span>
          </button>
        </div>
      )}
      {sharedChild && (
        <motion.div variants={ITEM} initial="hidden" animate="show"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 mb-4"
        >
          <BadgeCheck size={18} className="text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-emerald-300 text-sm font-semibold">Access Approved by {childName}</p>
            <p className="text-emerald-400/60 text-xs">View-only · {childName} can revoke access anytime from Settings</p>
          </div>
          <Shield size={14} className="text-emerald-400/50 flex-shrink-0" />
        </motion.div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              transactions={monthTransactions}
              budgets={visibleBudgets}
              monthLabel={MONTHS[selectedMonth]}
              year={selectedYear}
              totalSpent={totalSpent}
              totalIncome={totalIncome}
              totalBudget={totalBudget}
              childName={childName}
            />
          )}
          {activeTab === "expenses" && (
            <ExpensesTab
              transactions={monthTransactions}
              childName={childName}
              monthLabel={MONTHS[selectedMonth]}
            />
          )}
          {activeTab === "budgets" && (
            <BudgetsTab
              budgets={visibleBudgets}
              spendMap={spendMap}
              monthLabel={MONTHS[selectedMonth]}
            />
          )}
          {activeTab === "insights" && (
            <InsightsTab
              transactions={monthTransactions}
              budgets={visibleBudgets}
              spendMap={spendMap}
              totalSpent={totalSpent}
              totalIncome={totalIncome}
              childName={childName}
              monthLabel={MONTHS[selectedMonth]}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Privacy footer */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/2 mt-6">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield size={14} className="text-emerald-400" />
        </div>
        <div className="space-y-1">
          <p className="text-white/70 text-sm font-semibold">Privacy &amp; Consent</p>
          <p className="text-white/35 text-xs leading-relaxed">
            You are viewing spending information that <strong className="text-white/55">{childName} has chosen to share</strong> with you. This is a read-only view. SmartSpend never allows parents to edit, delete, or control the child account.
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Access consented on 1 Sep 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
