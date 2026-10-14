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
  Copy,
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

interface ChildSpendSummary {
  childId: string;
  name: string;
  spent: number;
  txCount: number;
}

function OverviewTab({
  transactions, budgets, monthLabel, year,
  totalSpent, totalIncome, totalBudget, childName,
  childrenSummaries, onSelectChild,
}: {
  transactions: Transaction[];
  budgets: Budget[];
  monthLabel: string;
  year: number;
  totalSpent: number;
  totalIncome: number;
  totalBudget: number;
  childName: string;
  childrenSummaries?: ChildSpendSummary[];
  onSelectChild?: (childId: string) => void;
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

      {/* Children Breakdown Card (when viewing multiple children) */}
      {childrenSummaries && childrenSummaries.length > 1 && (
        <motion.div variants={ITEM} className="glass-card space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <Users size={16} className="text-violet-400" />
              <span>Children Spending Breakdown</span>
            </h2>
            <span className="text-white/40 text-xs">{childrenSummaries.length} children active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {childrenSummaries.map(c => {
              const pct = totalSpent > 0 ? (c.spent / totalSpent) * 100 : 0;
              return (
                <div
                  key={c.childId}
                  onClick={() => onSelectChild?.(c.childId)}
                  className="p-3.5 rounded-2xl bg-white/4 hover:bg-white/8 border border-white/8 hover:border-violet-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold group-hover:text-violet-300 transition-colors">
                          {c.name}
                        </p>
                        <p className="text-white/40 text-xs">{c.txCount} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono font-bold text-sm">{formatCurrency(c.spent)}</p>
                      <p className="text-white/40 text-[11px]">{pct.toFixed(0)}% of total</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden w-full">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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

function ExpensesTab({
  transactions, childName, monthLabel, isViewingAll = false,
}: {
  transactions: Transaction[];
  childName: string;
  monthLabel: string;
  isViewingAll?: boolean;
}) {
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
            const itemChildName = (exp as any)._childName;
            return (
              <motion.div key={exp.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/4 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: color + "18" }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-semibold truncate">{exp.title}</p>
                    {(itemChildName || isViewingAll) && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25 flex-shrink-0">
                        {itemChildName || childName}
                      </span>
                    )}
                  </div>
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

interface ChildRecord {
  id: string; // parent_access id
  child_id: string; // user id of child
  name: string;
  transactions: Transaction[];
  budgets: Budget[];
  approved_at?: string;
}

interface PendingConsent {
  id: string;
  child_id: string;
  child_name: string;
  created_at?: string;
}

export function ParentDashboard() {
  const { state } = useFinance();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingConsent[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('all'); // 'all' or specific child_id
  const [accessMessage, setAccessMessage] = useState('');
  const [isParentAccount, setIsParentAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingChildName, setIsEditingChildName] = useState(false);
  const [tempChildName, setTempChildName] = useState('');

  const [showAddChildModal, setShowAddChildModal] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthOpen, setMonthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const loadSharedChildren = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.email) return;
    setIsLoading(true);
    setAccessMessage('');
    try {
      const parentEmail = user.email.toLowerCase().trim();

      // 1. Fetch ALL records for this parent from parent_access (both approved and pending)
      let { data: accessRows, error: accessError } = await client
        .from('parent_access')
        .select('id, child_id, parent_id, parent_email, status, approved_at, created_at')
        .or(`parent_id.eq.${user.id},parent_email.ilike.${parentEmail}`);

      if (accessError || !accessRows || accessRows.length === 0) {
        // Fallback by email
        const { data: emailRows } = await client
          .from('parent_access')
          .select('id, child_id, parent_id, parent_email, status, approved_at, created_at')
          .ilike('parent_email', parentEmail);
        if (emailRows && emailRows.length > 0) {
          accessRows = emailRows;
        }
      }

      const pendingData = (accessRows || []).filter(r => r.status === 'pending');
      const approvedList = (accessRows || []).filter(r => r.status === 'approved');

      // Process pending invites without querying finance_snapshots (which RLS protects)
      const pendingList: PendingConsent[] = pendingData.map((p, idx) => {
        const savedCustomName = localStorage.getItem(`smart-spend-child-name-${p.child_id}`) || '';
        const localName = localStorage.getItem(`smart-spend-user-name-${p.child_id}`) || '';
        const name = savedCustomName || localName || `Child ${approvedList.length + idx + 1}`;
        return {
          id: p.id,
          child_id: p.child_id,
          child_name: name,
          created_at: p.created_at,
        };
      });
      setPendingInvites(pendingList);

      if (pendingList.length > 0) {
        setIsParentAccount(true);
      }

      // Auto-link parent_id for any approved records
      for (const record of approvedList) {
        if (record.parent_id !== user.id) {
          client.from('parent_access')
            .update({ parent_id: user.id, approved_at: record.approved_at || new Date().toISOString() })
            .eq('id', record.id)
            .then();
        }
      }

      // 3. Batch fetch snapshots for all approved children
      const approvedChildIds = Array.from(new Set(approvedList.map(a => a.child_id)));
      let snapshots: any[] = [];
      if (approvedChildIds.length > 0) {
        setIsParentAccount(true);
        const { data: snapData, error: snapErr } = await client
          .from('finance_snapshots')
          .select('user_id, data')
          .in('user_id', approvedChildIds);
        if (snapErr) {
          console.warn('finance_snapshots fetch note:', snapErr.message);
        }
        snapshots = snapData || [];
      }

      const snapshotMap = new Map((snapshots || []).map(s => [s.user_id, s.data]));
      const loadedChildren: ChildRecord[] = [];

      for (let i = 0; i < approvedList.length; i++) {
        const record = approvedList[i];
        let childData = snapshotMap.get(record.child_id) as any;

        // Fallback to local storage cache if cloud snapshot is empty
        if (!childData || (!childData.transactions?.length && !childData.budgets?.length)) {
          try {
            const localRaw = localStorage.getItem(`smart-spend-finance-${record.child_id}`);
            if (localRaw) {
              const parsed = JSON.parse(localRaw);
              if (parsed.transactions?.length || parsed.budgets?.length) {
                childData = { ...parsed, _name: childData?._name ?? parsed._name ?? parsed.name };
              }
            }
          } catch (e) {
            console.warn('Local storage fallback error:', e);
          }
        }

        const savedCustomName = localStorage.getItem(`smart-spend-child-name-${record.child_id}`) || '';
        const localName = localStorage.getItem(`smart-spend-user-name-${record.child_id}`) || '';
        const finalName = savedCustomName || childData?._name || childData?.name || localName || `Child ${i + 1}`;

        const txs: Transaction[] = (childData?.transactions ?? []).map((t: any) => ({
          ...t,
          _childName: finalName,
          _childId: record.child_id,
        }));

        loadedChildren.push({
          id: record.id,
          child_id: record.child_id,
          name: finalName,
          transactions: txs,
          budgets: childData?.budgets ?? [],
          approved_at: record.approved_at,
        });
      }

      // Ensure any legacy demo children in localStorage are removed
      try {
        localStorage.removeItem('smart-spend-demo-children');
      } catch (e) {
        // ignore
      }

      setChildren(loadedChildren);
    } catch (err: any) {
      setAccessMessage(err?.message || 'Error loading children');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSharedChildren();
  }, [loadSharedChildren]);



  const approveInvite = async (inviteId: string) => {
    const client = supabase;
    if (!client || !user) return;
    setIsLoading(true);
    setAccessMessage('');
    try {
      const { error } = await client
        .from('parent_access')
        .update({ parent_id: user.id, status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', inviteId);
      if (error) {
        setAccessMessage(error.message);
        return;
      }
      setPendingInvites(prev => prev.filter(p => p.id !== inviteId));
      await loadSharedChildren();
    } catch (e: any) {
      setAccessMessage(e?.message || 'Approval failed');
    } finally {
      setIsLoading(false);
    }
  };

  const approveAllInvites = async () => {
    const client = supabase;
    if (!client || !user || pendingInvites.length === 0) return;
    setIsLoading(true);
    setAccessMessage('');
    try {
      const inviteIds = pendingInvites.map(p => p.id);
      const { error } = await client
        .from('parent_access')
        .update({ parent_id: user.id, status: 'approved', approved_at: new Date().toISOString() })
        .in('id', inviteIds);
      if (error) {
        setAccessMessage(error.message);
        return;
      }
      setPendingInvites([]);
      await loadSharedChildren();
    } catch (e: any) {
      setAccessMessage(e?.message || 'Approval failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isViewingAll = children.length > 1 && (selectedChildId === 'all' || !children.some(c => c.child_id === selectedChildId));

  const activeChild = useMemo(() => {
    if (isViewingAll) return null;
    if (children.length === 1) return children[0];
    return children.find(c => c.child_id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId, isViewingAll]);



  const sourceTransactions = useMemo(() => {
    if (children.length === 0) {
      return isParentAccount ? [] : state.transactions;
    }
    if (activeChild) {
      return activeChild.transactions;
    }
    const allTxs: Transaction[] = [];
    children.forEach(c => {
      c.transactions.forEach(t => {
        allTxs.push({
          ...t,
          _childName: c.name,
          _childId: c.child_id,
        } as any);
      });
    });
    return allTxs;
  }, [children, activeChild, isParentAccount, state.transactions]);

  const visibleTransactions = useMemo(() => {
    return Array.from(new Map(sourceTransactions.map(t => [t.id, t])).values());
  }, [sourceTransactions]);

  const visibleBudgets = useMemo(() => {
    if (children.length === 0) {
      return isParentAccount ? [] : state.budgets;
    }
    if (activeChild) {
      return activeChild.budgets;
    }
    // Combined budgets
    const combinedMap = new Map<string, Budget>();
    children.forEach(c => {
      c.budgets.forEach(b => {
        const existing = combinedMap.get(b.category);
        if (existing) {
          combinedMap.set(b.category, { ...existing, limit: existing.limit + b.limit });
        } else {
          combinedMap.set(b.category, { ...b });
        }
      });
    });
    return Array.from(combinedMap.values());
  }, [children, activeChild, isParentAccount, state.budgets]);

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

  const childName = isViewingAll
    ? (children.length > 0 ? `All Children (${children.length})` : 'All Children')
    : (activeChild?.name ?? 'Your Child');

  // Breakdown by child for OverviewTab
  const childrenSummaries = useMemo(() => {
    return children.map(c => {
      const childMonthDebits = c.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && t.type === 'debit';
      });
      const spent = childMonthDebits.reduce((s, t) => s + t.amount, 0);
      return {
        childId: c.child_id,
        name: c.name,
        spent,
        txCount: childMonthDebits.length,
      };
    });
  }, [children, selectedMonth, selectedYear]);

  const handleSaveChildName = () => {
    const trimmed = tempChildName.trim();
    if (!trimmed || !activeChild) {
      setIsEditingChildName(false);
      return;
    }
    localStorage.setItem(`smart-spend-child-name-${activeChild.child_id}`, trimmed);
    setChildren(prev =>
      prev.map(c => (c.child_id === activeChild.child_id ? { ...c, name: trimmed } : c))
    );
    setIsEditingChildName(false);
  };

  // Show a "no access yet" screen if loading is done and there's no data or pending invite
  if (!isLoading && children.length === 0 && pendingInvites.length === 0 && isParentAccount === false) {
    return (
      <div className="min-h-screen text-white font-sans flex flex-col items-center justify-center gap-6 pb-8 px-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Users size={28} className="text-violet-400" />
        </div>
        <div className="text-center max-w-sm">
          <h1 className="text-white font-bold text-xl mb-2">No Parent Access Yet</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-4">
            This is a <strong className="text-white/70">multi-child parent dashboard</strong>.<br /><br />
            To get started, ask each child to open <strong className="text-white/70">Settings → Parent Access</strong> and enter your email address. You can accept consent from multiple children and review all their expenses in one place.
          </p>
          <button
            onClick={() => {
              if (user?.email) {
                navigator.clipboard.writeText(user.email);
                alert('Parent email copied to clipboard!');
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Copy size={14} />
            <span>Copy Parent Email to Share with Child</span>
          </button>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/2 max-w-sm w-full">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield size={14} className="text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-white/70 text-sm font-semibold">Child-controlled consent</p>
            <p className="text-white/35 text-xs leading-relaxed">
              Each child individually consents to share their view-only finances. You can toggle between children or view aggregated family expenses.
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
                {isViewingAll ? <Users size={18} /> : childName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border-2 border-[#111113]" />
            </div>
            <div className="min-w-0">
              <p className="text-white/40 text-[11px] sm:text-xs font-medium">
                Parent View {children.length > 0 && `· ${children.length} Connected`}
              </p>
              {isEditingChildName && activeChild ? (
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
                  <h1 className="text-white font-bold text-base leading-tight truncate">
                    {childName}&apos;s Spending
                  </h1>
                  {!isViewingAll && activeChild && (
                    <button
                      onClick={() => {
                        setTempChildName(activeChild.name);
                        setIsEditingChildName(true);
                      }}
                      title="Rename this child"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[11px] font-medium transition-colors border border-white/10"
                    >
                      <Pencil size={10} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls: Refresh & Month picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadSharedChildren()}
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

        {/* Children Switcher Bar (Always shown when children or pending invites exist) */}
        {(children.length > 0 || pendingInvites.length > 0) && (
          <div className="flex items-center gap-2 pb-2.5 overflow-x-auto scrollbar-none">
            <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
              <Users size={12} /> Children:
            </span>

            {children.length > 1 && (
              <button
                onClick={() => setSelectedChildId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  isViewingAll
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 border border-violet-400/30'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/8'
                }`}
              >
                <span>All Children</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {children.length}
                </span>
              </button>
            )}

            {children.map(c => {
              const isSelected = !isViewingAll && (activeChild?.child_id === c.child_id || (children.length === 1 && selectedChildId !== 'all'));
              return (
                <button
                  key={c.child_id}
                  onClick={() => setSelectedChildId(c.child_id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 border border-violet-400/30'
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/8'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{c.name}</span>
                </button>
              );
            })}

            {/* Any pending children in the bar */}
            {pendingInvites.map(p => (
              <button
                key={p.id}
                onClick={() => approveInvite(p.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 flex-shrink-0"
                title="Pending consent - click to approve"
              >
                <Bell size={11} className="animate-bounce" />
                <span>{p.child_name}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-black font-extrabold">
                  Approve
                </span>
              </button>
            ))}

            {/* Connect another child */}
            <button
              onClick={() => setShowAddChildModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-white/5 hover:bg-white/10 text-violet-300 hover:text-white border border-dashed border-violet-500/30 hover:border-violet-400 transition-all flex-shrink-0"
            >
              <span>+ Add Child</span>
            </button>
          </div>
        )}

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

      {/* Multiple Children Consent Center */}
      {pendingInvites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 p-4 mb-5 shadow-lg shadow-amber-500/5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                <Bell size={16} />
              </div>
              <div>
                <p className="text-amber-200 text-sm font-bold">
                  {pendingInvites.length === 1
                    ? '1 Child Consent Request Pending'
                    : `${pendingInvites.length} Children Consent Requests Pending`}
                </p>
                <p className="text-white/45 text-xs">
                  Review and accept consent to view their spending and budgets
                </p>
              </div>
            </div>
            {pendingInvites.length > 1 && (
              <button
                onClick={approveAllInvites}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all disabled:opacity-50"
              >
                Approve All ({pendingInvites.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {pendingInvites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/25 border border-white/5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {invite.child_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{invite.child_name}</p>
                    <p className="text-white/35 text-[11px] truncate">Requested financial sharing</p>
                  </div>
                </div>
                <button
                  onClick={() => approveInvite(invite.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading && pendingInvites.length === 0 && (
        <div className="flex items-center gap-2 mb-4 text-white/50 text-sm">
          <svg className="animate-spin w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading children data…
        </div>
      )}

      {accessMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Info size={14} className="flex-shrink-0" />
            <span>{accessMessage}</span>
          </div>
          <button
            onClick={() => void loadSharedChildren()}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            <RefreshCw className={isLoading ? "animate-spin" : ""} size={12} />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {children.length > 0 && (
        <motion.div variants={ITEM} initial="hidden" animate="show"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 mb-4"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BadgeCheck size={18} className="text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-emerald-300 text-sm font-semibold truncate">
                {isViewingAll ? `Viewing All ${children.length} Consented Children` : `Access Approved by ${childName}`}
              </p>
              <p className="text-emerald-400/60 text-xs">
                View-only · Children can revoke access anytime from Settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Shield size={14} className="text-emerald-400/50" />
          </div>
        </motion.div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${selectedChildId}`}
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
              childrenSummaries={childrenSummaries}
              onSelectChild={id => setSelectedChildId(id)}
            />
          )}
          {activeTab === "expenses" && (
            <ExpensesTab
              transactions={monthTransactions}
              childName={childName}
              monthLabel={MONTHS[selectedMonth]}
              isViewingAll={isViewingAll}
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
          <p className="text-white/70 text-sm font-semibold">Privacy &amp; Child Consent</p>
          <p className="text-white/35 text-xs leading-relaxed">
            You are viewing spending information that <strong className="text-white/55">{childName} has chosen to share</strong> with you. This is a read-only view. SmartSpend never allows parents to edit, delete, or control the child account.
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Child-consented access active</span>
          </div>
        </div>
      </div>

      {/* Add / Connect Child Modal */}
      <AnimatePresence>
        {showAddChildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#161618] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
                    <Users size={18} />
                  </div>
                  <h2 className="text-white font-bold text-lg">Connect Another Child</h2>
                </div>
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3.5 rounded-2xl bg-white/4 border border-white/8 space-y-1.5">
                  <p className="text-white/60 text-xs font-semibold">Step 1: On your child&apos;s device/account</p>
                  <p className="text-white text-xs leading-relaxed">
                    Ask your child to log into SmartSpend, go to <strong className="text-emerald-400">Settings → Parent Access</strong>, and enter your email:
                  </p>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-violet-300">
                    <span className="truncate mr-2">{user?.email}</span>
                    <button
                      onClick={() => {
                        if (user?.email) navigator.clipboard.writeText(user.email);
                        alert('Parent email copied to clipboard!');
                      }}
                      className="text-white/60 hover:text-white text-[11px] font-sans px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/4 border border-white/8 space-y-1">
                  <p className="text-white/60 text-xs font-semibold">Step 2: Consent Request &amp; Approval</p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Once they tap <strong className="text-white/70">&quot;Send consent&quot;</strong>, an approval prompt appears right in your Children bar for you to approve with one click.
                  </p>
                </div>
              </div>


            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

