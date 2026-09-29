import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, User, Send, Sparkles, ShieldCheck, RotateCcw, Mic, TrendingUp, TrendingDown,
  Wallet, Target, RefreshCw, ChevronRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/utils';
import type { Transaction } from '../types/finance';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender: 'user' | 'ai';
  blocks: ContentBlock[];
  time: string;
  chips?: string[];
}

type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'stat'; label: string; value: string; sub?: string; color?: string }
  | { type: 'bar'; label: string; value: number; max: number; color: string; note?: string }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; content: string };

// ─── Markdown-to-React renderer ────────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="text-white font-bold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
          <RichText text={block.content} />
        </p>
      );
    case 'stat':
      return (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
          <span className="text-white/50 text-xs font-medium">{block.label}</span>
          <div className="text-right">
            <span className={`font-bold text-sm font-mono ${block.color ?? 'text-white'}`}>{block.value}</span>
            {block.sub && <p className="text-white/35 text-xs">{block.sub}</p>}
          </div>
        </div>
      );
    case 'bar': {
      const pct = Math.min((block.value / Math.max(block.max, 1)) * 100, 100);
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-white/60 font-medium">{block.label}</span>
            <span className="text-white/80 font-mono font-bold">{formatCurrency(block.value)}</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: block.color }}
            />
          </div>
          {block.note && <p className="text-white/30 text-xs">{block.note}</p>}
        </div>
      );
    }
    case 'list':
      return (
        <ul className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/75">
              <span className="text-emerald-400 mt-0.5 flex-shrink-0">›</span>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'tip':
      return (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Sparkles size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-violet-300 text-xs leading-relaxed"><RichText text={block.content} /></p>
        </div>
      );
    default:
      return null;
  }
}

// ─── Date helpers ───────────────────────────────────────────────────────────────

function isThisMonth(date: string) {
  const d = new Date(date), now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
function isLastMonth(date: string) {
  const d = new Date(date), now = new Date();
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
}
function isThisWeek(date: string) {
  const d = new Date(date), now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}
function isToday(date: string) {
  const d = new Date(date), now = new Date();
  return d.toDateString() === now.toDateString();
}

// ─── AI Engine ─────────────────────────────────────────────────────────────────

interface FinanceSnapshot {
  transactions: Transaction[];
  budgets: ReturnType<typeof useFinance>['state']['budgets'];
  goals: ReturnType<typeof useFinance>['state']['goals'];
  recurring: ReturnType<typeof useFinance>['state']['recurring'];
  accounts: ReturnType<typeof useFinance>['state']['accounts'];
  thisMonthSpent: number;
  thisMonthIncome: number;
  totalBalance: number;
  effectiveBudget: number;
  userName: string;
}

function buildReply(query: string, snap: FinanceSnapshot): { blocks: ContentBlock[]; chips: string[] } {
  const q = query.toLowerCase();
  const {
    transactions, budgets, goals, recurring, accounts,
    thisMonthSpent: spent, thisMonthIncome: income,
    totalBalance, effectiveBudget: budget, userName,
  } = snap;

  const remaining = budget > 0 ? budget - spent : 0;
  const usedPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  // Derive filtered transaction sets
  const thisMonthTxns = transactions.filter(t => isThisMonth(t.date));
  const lastMonthTxns = transactions.filter(t => isLastMonth(t.date));
  const thisWeekTxns  = transactions.filter(t => isThisWeek(t.date));
  const todayTxns     = transactions.filter(t => isToday(t.date));

  const debits = (txns: Transaction[]) => txns.filter(t => t.type === 'debit');
  const credits = (txns: Transaction[]) => txns.filter(t => t.type === 'credit');
  const total = (txns: Transaction[]) => txns.reduce((s, t) => s + t.amount, 0);

  // Build category spend map for a set of transactions
  const catMap = (txns: Transaction[]) => {
    const m = new Map<string, number>();
    debits(txns).forEach(t => m.set(t.category, (m.get(t.category) ?? 0) + t.amount));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };

  // ── Intent: Greet ──
  if (/^(hi|hello|hey|good morning|good evening|howdy)\b/.test(q)) {
    return {
      blocks: [
        { type: 'text', content: `👋 Hey ${userName}! I'm SmartSpend AI — your personal finance coach with full access to your live data.` },
        { type: 'stat', label: 'This Month Spent', value: formatCurrency(spent), sub: budget > 0 ? `${usedPct.toFixed(0)}% of budget` : 'No budget set', color: usedPct > 90 ? 'text-red-400' : 'text-white' },
        { type: 'stat', label: 'Total Balance', value: formatCurrency(totalBalance), color: totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400' },
        { type: 'text', content: 'What can I help you with today?' },
      ],
      chips: ['Analyze my spending', 'Show budget status', 'How can I save more?', 'Show my goals'],
    };
  }

  // ── Intent: Today's spending ──
  if (/today|right now|so far today/.test(q)) {
    const todaySpent = total(debits(todayTxns));
    const todayIncome = total(credits(todayTxns));
    const todayCats = catMap(todayTxns);
    return {
      blocks: [
        { type: 'text', content: `📅 **Today's Financial Activity**` },
        { type: 'stat', label: 'Spent Today', value: formatCurrency(todaySpent), color: 'text-red-300' },
        { type: 'stat', label: 'Income Today', value: formatCurrency(todayIncome), color: 'text-emerald-400' },
        ...(todayCats.length > 0
          ? [{ type: 'text' as const, content: 'Category breakdown:' },
             ...todayCats.slice(0, 4).map(([cat, amt]) => ({
               type: 'bar' as const, label: `${CATEGORY_ICONS[cat] ?? '📦'} ${cat}`, value: amt, max: todaySpent, color: CATEGORY_COLORS[cat] ?? '#94A3B8',
             }))]
          : [{ type: 'text' as const, content: 'No expenses logged today yet.' }]
        ),
      ],
      chips: ['Show this week', 'Analyze my spending', 'Add a tip to save today'],
    };
  }

  // ── Intent: This week ──
  if (/this week|week so far|past 7 days|last 7 days/.test(q)) {
    const weekSpent = total(debits(thisWeekTxns));
    const weekIncome = total(credits(thisWeekTxns));
    const weekCats = catMap(thisWeekTxns);
    const dailyAvg = weekSpent / 7;
    return {
      blocks: [
        { type: 'text', content: `📊 **This Week's Summary**` },
        { type: 'stat', label: 'Total Spent', value: formatCurrency(weekSpent) },
        { type: 'stat', label: 'Total Income', value: formatCurrency(weekIncome), color: 'text-emerald-400' },
        { type: 'stat', label: 'Daily Average', value: `${formatCurrency(dailyAvg)}/day` },
        ...(weekCats.length > 0
          ? [{ type: 'text' as const, content: 'Top categories this week:' },
             ...weekCats.slice(0, 4).map(([cat, amt]) => ({
               type: 'bar' as const, label: `${CATEGORY_ICONS[cat] ?? '📦'} ${cat}`, value: amt, max: weekSpent, color: CATEGORY_COLORS[cat] ?? '#94A3B8',
             }))]
          : []
        ),
      ],
      chips: ['Show this month', 'Compare to last month', 'Where am I overspending?'],
    };
  }

  // ── Intent: Analyze / Overview / Summary ──
  if (/analyz|overview|summary|how am i doing|spending habit|breakdown/.test(q)) {
    const cats = catMap(thisMonthTxns);
    const topCat = cats[0];
    const lastSpent = total(debits(lastMonthTxns));
    const changeSign = lastSpent > 0 ? ((spent - lastSpent) / lastSpent * 100) : 0;
    return {
      blocks: [
        { type: 'text', content: `📊 **Monthly Spending Analysis — ${new Date().toLocaleString('en-IN', { month: 'long' })}**` },
        { type: 'stat', label: 'Total Spent', value: formatCurrency(spent), sub: budget > 0 ? `${usedPct.toFixed(0)}% of ${formatCurrency(budget)} budget` : 'No budget set' },
        { type: 'stat', label: 'Total Income', value: formatCurrency(income), color: 'text-emerald-400' },
        { type: 'stat', label: 'Net This Month', value: formatCurrency(income - spent), color: income >= spent ? 'text-emerald-400' : 'text-red-400', sub: income >= spent ? 'Surplus' : 'Deficit' },
        ...(lastSpent > 0
          ? [{ type: 'stat' as const, label: 'vs Last Month', value: `${changeSign >= 0 ? '+' : ''}${changeSign.toFixed(0)}%`, color: changeSign > 0 ? 'text-red-400' : 'text-emerald-400', sub: `Last month: ${formatCurrency(lastSpent)}` }]
          : []
        ),
        ...(cats.length > 0
          ? [
            { type: 'text' as const, content: 'Spending by category:' },
            ...cats.slice(0, 5).map(([cat, amt]) => ({
              type: 'bar' as const,
              label: `${CATEGORY_ICONS[cat] ?? '📦'} ${cat}`,
              value: amt, max: spent,
              color: CATEGORY_COLORS[cat] ?? '#94A3B8',
              note: `${((amt / spent) * 100).toFixed(0)}% of total spending`,
            })),
          ]
          : [{ type: 'text' as const, content: 'No transactions recorded this month yet.' }]
        ),
        ...(topCat ? [{ type: 'tip' as const, content: `Your biggest spend is **${topCat[0]}** at ${formatCurrency(topCat[1])}. ${topCat[1] / spent > 0.4 ? 'This is over 40% of your total — consider reviewing it.' : 'Spending looks reasonably distributed.'}` }] : []),
      ],
      chips: ['Where am I overspending?', 'Show budget status', 'Compare to last month', 'How can I save more?'],
    };
  }

  // ── Intent: Last month comparison ──
  if (/last month|previous month|compare|month.*(vs|versus)|versus.*month/.test(q)) {
    const lmSpent = total(debits(lastMonthTxns));
    const lmIncome = total(credits(lastMonthTxns));
    const diff = spent - lmSpent;
    const lmCats = catMap(lastMonthTxns);
    const thisCats = new Map(catMap(thisMonthTxns));
    return {
      blocks: [
        { type: 'text', content: `📅 **Month-over-Month Comparison**` },
        { type: 'stat', label: 'This Month Spent', value: formatCurrency(spent), color: 'text-white' },
        { type: 'stat', label: 'Last Month Spent', value: formatCurrency(lmSpent), color: 'text-white/60' },
        { type: 'stat', label: 'Change', value: `${diff >= 0 ? '+' : ''}${formatCurrency(Math.abs(diff))}`, color: diff > 0 ? 'text-red-400' : 'text-emerald-400', sub: diff > 0 ? 'Spending up ↑' : 'Spending down ↓' },
        { type: 'stat', label: 'This Month Income', value: formatCurrency(income), color: 'text-emerald-400' },
        { type: 'stat', label: 'Last Month Income', value: formatCurrency(lmIncome), color: 'text-emerald-400/60' },
        ...(lmCats.length > 0
          ? [{ type: 'text' as const, content: 'Category changes:' },
             ...lmCats.slice(0, 4).map(([cat, lmAmt]) => {
               const thisAmt = thisCats.get(cat) ?? 0;
               const d = thisAmt - lmAmt;
               return { type: 'stat' as const, label: `${CATEGORY_ICONS[cat] ?? '📦'} ${cat}`, value: `${d >= 0 ? '+' : ''}${formatCurrency(Math.abs(d))}`, color: d > 0 ? 'text-red-400' : 'text-emerald-400', sub: `Last: ${formatCurrency(lmAmt)} → Now: ${formatCurrency(thisAmt)}` };
             })]
          : []
        ),
      ],
      chips: ['Analyze my spending', 'Where am I overspending?', 'Show budget status'],
    };
  }

  // ── Intent: Category-specific question ──
  const CATEGORY_ALIASES: Record<string, string[]> = {
    'Food & Dining': ['food', 'dining', 'swiggy', 'zomato', 'restaurant', 'eat', 'meal', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe'],
    'Transport': ['transport', 'travel', 'cab', 'ola', 'uber', 'rapido', 'metro', 'bus', 'petrol', 'fuel', 'commute', 'ride'],
    'Shopping': ['shopping', 'amazon', 'myntra', 'flipkart', 'clothes', 'fashion', 'apparel', 'buy', 'purchase', 'order'],
    'Entertainment': ['entertainment', 'netflix', 'spotify', 'movie', 'pvr', 'inox', 'music', 'stream', 'gaming'],
    'Bills & Utilities': ['bill', 'electricity', 'jio', 'broadband', 'wifi', 'internet', 'utility', 'recharge', 'emi', 'loan'],
    'Groceries': ['groceries', 'grocery', 'bigbasket', 'blinkit', 'vegetables', 'fruits', 'supermarket'],
    'Health': ['health', 'gym', 'doctor', 'medicine', 'pharmacy', 'medical', 'wellness', 'fitness'],
    'Education': ['education', 'course', 'udemy', 'book', 'tuition', 'class', 'learn', 'study'],
    'Rent': ['rent', 'house', 'housing', 'flat', 'apartment', 'pg'],
    'Investment': ['investment', 'invest', 'sip', 'mutual fund', 'stock', 'zerodha', 'coin'],
    'Insurance': ['insurance', 'lic', 'policy', 'premium', 'coverage'],
  };

  for (const [cat, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some(a => q.includes(a))) {
      const catThis = catMap(thisMonthTxns).find(([c]) => c === cat)?.[1] ?? 0;
      const catLast = catMap(lastMonthTxns).find(([c]) => c === cat)?.[1] ?? 0;
      const catBudget = budgets.find(b => b.category === cat);
      const catTxns = debits(thisMonthTxns).filter(t => t.category === cat);
      const change = catLast > 0 ? ((catThis - catLast) / catLast * 100) : 0;

      return {
        blocks: [
          { type: 'text', content: `${CATEGORY_ICONS[cat] ?? '📦'} **${cat} Breakdown — This Month**` },
          { type: 'stat', label: 'Total Spent', value: formatCurrency(catThis), color: catThis > 0 ? 'text-white' : 'text-white/40' },
          ...(catLast > 0 ? [{ type: 'stat' as const, label: 'vs Last Month', value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`, color: change > 0 ? 'text-red-400' : 'text-emerald-400', sub: `Last month: ${formatCurrency(catLast)}` }] : []),
          ...(catBudget ? [{ type: 'bar' as const, label: 'Budget usage', value: catThis, max: catBudget.limit, color: catThis > catBudget.limit ? '#EF4444' : CATEGORY_COLORS[cat] ?? '#94A3B8', note: `${formatCurrency(catThis)} of ${formatCurrency(catBudget.limit)} budget` }] : []),
          ...(catTxns.length > 0
            ? [{ type: 'text' as const, content: `Recent ${cat} transactions:` },
               { type: 'list' as const, items: catTxns.slice(0, 5).map(t => `**${t.title}** — ${formatCurrency(t.amount)} on ${new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`) }]
            : [{ type: 'text' as const, content: `No ${cat} transactions recorded this month.` }]
          ),
          ...(catThis > 0 && catBudget && catThis > catBudget.limit
            ? [{ type: 'tip' as const, content: `You've exceeded your ${cat} budget by **${formatCurrency(catThis - catBudget.limit)}**. Consider cutting back for the rest of the month.` }]
            : catThis > 0
            ? [{ type: 'tip' as const, content: `${cat} spending is ${catBudget ? `${((catThis / catBudget.limit) * 100).toFixed(0)}% of your ${formatCurrency(catBudget.limit)} budget.` : 'tracked but no budget set for this category.'}` }]
            : []
          ),
        ],
        chips: ['Analyze my spending', 'Show budget status', 'Compare to last month', `Tips to reduce ${cat.split(' ')[0].toLowerCase()} spending`],
      };
    }
  }

  // ── Intent: Budget status ──
  if (/budget|limit|allowance|how much (left|remaining|do i have)|remaining/.test(q)) {
    const budgetStatuses = budgets.map(b => {
      const s = catMap(thisMonthTxns).find(([c]) => c === b.category)?.[1] ?? 0;
      return { ...b, spent: s, pct: Math.min((s / b.limit) * 100, 100), over: s > b.limit };
    }).sort((a, b) => b.pct - a.pct);

    return {
      blocks: [
        { type: 'text', content: `💰 **Budget Status — ${new Date().toLocaleString('en-IN', { month: 'long' })}**` },
        { type: 'stat', label: 'Overall Spent', value: formatCurrency(spent), sub: budget > 0 ? `${usedPct.toFixed(0)}% of ${formatCurrency(budget)}` : 'No total budget set' },
        { type: 'stat', label: 'Overall Remaining', value: budget > 0 ? formatCurrency(remaining) : '—', color: remaining > 0 ? 'text-emerald-400' : 'text-red-400' },
        ...(budgetStatuses.length > 0
          ? [
            { type: 'text' as const, content: 'By category:' },
            ...budgetStatuses.map(b => ({
              type: 'bar' as const,
              label: `${CATEGORY_ICONS[b.category] ?? '📦'} ${b.category}`,
              value: b.spent,
              max: b.limit,
              color: b.over ? '#EF4444' : b.pct >= 80 ? '#F59E0B' : CATEGORY_COLORS[b.category] ?? '#94A3B8',
              note: `${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}${b.over ? ' — EXCEEDED' : ` — ${formatCurrency(b.limit - b.spent)} left`}`,
            })),
          ]
          : [{ type: 'text' as const, content: 'No category budgets configured yet. Go to the Budget tab to set limits.' }]
        ),
        ...(budgetStatuses.filter(b => b.over).length > 0
          ? [{ type: 'tip' as const, content: `**${budgetStatuses.filter(b => b.over).length} categories** are over budget. Focus on reducing ${budgetStatuses.filter(b => b.over).map(b => b.category).join(', ')} spending.` }]
          : budgetStatuses.length > 0
          ? [{ type: 'tip' as const, content: `All budgets are on track! ${remaining > 0 ? `You have **${formatCurrency(remaining)}** remaining for the month.` : ''}` }]
          : []
        ),
      ],
      chips: ['How can I save more?', 'Analyze my spending', 'Compare to last month'],
    };
  }

  // ── Intent: Goals ──
  if (/goal|saving|target|dream|fund|vacation|gadget/.test(q)) {
    if (goals.length === 0) {
      return {
        blocks: [
          { type: 'text', content: `🎯 **Savings Goals**\n\nYou haven't set any savings goals yet. Head to the Goals section to create your first goal!` },
          { type: 'tip', content: 'Common goals: Emergency Fund, Vacation, New Device, or Car Down Payment.' },
        ],
        chips: ['How can I save more?', 'Show budget status', 'Analyze my spending'],
      };
    }
    return {
      blocks: [
        { type: 'text', content: `🎯 **Your Savings Goals**` },
        ...goals.map(g => {
          const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
          const left = g.targetAmount - g.currentAmount;
          const daysLeft = Math.max(0, Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / 86400000));
          return {
            type: 'bar' as const,
            label: `${g.emoji} ${g.title}`,
            value: g.currentAmount,
            max: g.targetAmount,
            color: g.color,
            note: `${formatCurrency(g.currentAmount)} of ${formatCurrency(g.targetAmount)} (${pct.toFixed(0)}%) — ${formatCurrency(left)} left${daysLeft > 0 ? ` · ${daysLeft} days remaining` : ' · Deadline passed'}`,
          };
        }),
        ...(goals.some(g => (g.targetAmount - g.currentAmount) > 0)
          ? [{ type: 'tip' as const, content: `Saving **${formatCurrency(Math.ceil(goals.reduce((s, g) => s + Math.max(0, g.targetAmount - g.currentAmount), 0) / 12))} / month** would help you hit all your goals within a year.` }]
          : [{ type: 'tip' as const, content: '🎉 All goals reached! Time to set new ones.' }]
        ),
      ],
      chips: ['How can I save more?', 'Analyze my spending', 'Show budget status'],
    };
  }

  // ── Intent: Recurring / Subscriptions ──
  if (/recurring|subscription|subscri|auto.?pay|standing|emi|monthly charge|netflix|spotify|amazon prime/.test(q)) {
    const activeRecurring = recurring.filter(r => r.isActive);
    const monthlyDebits = activeRecurring.filter(r => r.type === 'debit');
    const monthlyTotal = monthlyDebits.reduce((s, r) => s + r.amount, 0);
    return {
      blocks: [
        { type: 'text', content: `🔁 **Recurring Payments Overview**` },
        { type: 'stat', label: 'Total Monthly Commitments', value: formatCurrency(monthlyTotal), sub: `${monthlyDebits.length} active recurring charges` },
        ...(monthlyDebits.length > 0
          ? [{ type: 'list' as const, items: monthlyDebits.map(r => `**${r.title}** (${r.merchant}) — ${formatCurrency(r.amount)} / ${r.frequency}, next: ${new Date(r.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`) }]
          : [{ type: 'text' as const, content: 'No active recurring payments recorded.' }]
        ),
        ...(monthlyTotal > 0
          ? [{ type: 'tip' as const, content: `Your recurring commitments total **${formatCurrency(monthlyTotal)} / month** (${budget > 0 ? `${((monthlyTotal / budget) * 100).toFixed(0)}% of your budget` : 'no budget set to compare'}). Review if all are necessary.` }]
          : []
        ),
      ],
      chips: ['Show budget status', 'Analyze my spending', 'How can I save more?'],
    };
  }

  // ── Intent: Accounts / Net Worth ──
  if (/account|balance|net worth|cash|wallet|upi|card|bank/.test(q)) {
    return {
      blocks: [
        { type: 'text', content: `💳 **Account Balances**` },
        ...accounts.map(a => ({
          type: 'stat' as const,
          label: `${a.icon} ${a.name} (${a.bankName})`,
          value: formatCurrency(a.balance),
          color: a.balance >= 0 ? 'text-emerald-400' : 'text-red-400',
          sub: a.balance >= 0 ? 'Available' : 'Deficit',
        })),
        { type: 'stat', label: '💼 Total Net Worth', value: formatCurrency(totalBalance), color: totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400' },
        { type: 'tip', content: `Balances are calculated from your recorded income and expense entries.` },
      ],
      chips: ['Analyze my spending', 'Show budget status', 'Show my goals'],
    };
  }

  // ── Intent: Save more / Tips ──
  if (/save|saving|tips?|cut.?back|reduce|spend less|economiz/.test(q)) {
    const cats = catMap(thisMonthTxns);
    const topThree = cats.slice(0, 3);
    return {
      blocks: [
        { type: 'text', content: `💡 **Personalized Money-Saving Tips**` },
        ...(topThree.length > 0
          ? [
            { type: 'text' as const, content: `Based on your spending, here's where you can save the most:` },
            { type: 'list' as const, items: topThree.map(([cat, amt]) => {
              const saving = Math.round(amt * 0.2);
              return `**${cat}** (${formatCurrency(amt)}): Cutting 20% could save you **${formatCurrency(saving)} / month**.`;
            }) },
          ]
          : []
        ),
        { type: 'list', items: [
          '**Meal prep on weekends** — saves ₹400–800/month on food delivery.',
          '**24-hour rule** — wait a day before non-essential purchases over ₹500.',
          '**Cancel unused subscriptions** — check recurring payments for dormant ones.',
          '**Auto-save rule** — transfer 10% of income to savings on payday.',
          '**Use UPI cash-back offers** — CRED, GPay rewards can add ₹100–300/month.',
        ]},
        ...(income > 0 ? [{ type: 'stat' as const, label: 'Ideal Savings Target (20%)', value: formatCurrency(income * 0.2), sub: `${income > 0 ? ((income - spent) / income * 100).toFixed(0) : 0}% currently saved` }] : []),
        { type: 'tip', content: remaining > 0 ? `You have **${formatCurrency(remaining)}** remaining in your budget. Great opportunity to put some into savings!` : `No budget set — add one in the Budget tab to track your spending limits.` },
      ],
      chips: ['Show my goals', 'Show budget status', 'Analyze my spending'],
    };
  }

  // ── Intent: Income / Salary ──
  if (/income|salary|earn|credit|received|freelance|how much (did i make|i earn)/.test(q)) {
    const incomeThisMonth = credits(thisMonthTxns);
    const incomeLastMonth = credits(lastMonthTxns);
    return {
      blocks: [
        { type: 'text', content: `💰 **Income Overview**` },
        { type: 'stat', label: 'This Month Income', value: formatCurrency(income), color: 'text-emerald-400' },
        { type: 'stat', label: 'Last Month Income', value: formatCurrency(total(incomeLastMonth)), color: 'text-emerald-400/60' },
        { type: 'stat', label: 'Savings Rate', value: income > 0 ? `${((income - spent) / income * 100).toFixed(0)}%` : '—', color: income > spent ? 'text-emerald-400' : 'text-red-400', sub: income > spent ? 'Positive cashflow' : 'Spending more than earning' },
        ...(incomeThisMonth.length > 0
          ? [{ type: 'list' as const, items: incomeThisMonth.map(t => `**${t.title}** (${t.merchant}) — ${formatCurrency(t.amount)} on ${new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`) }]
          : [{ type: 'text' as const, content: 'No income recorded this month yet.' }]
        ),
      ],
      chips: ['Analyze my spending', 'Show my goals', 'How can I save more?'],
    };
  }

  // ── Intent: Affordable check ──
  if (/afford|can i buy|should i buy|worth it|₹\d+|rs\.?\s?\d+/.test(q)) {
    const numMatch = q.match(/[₹rs.]*\s*(\d[\d,]*)/);
    const amount = numMatch ? parseInt(numMatch[1].replace(/,/g, '')) : 0;
    const canAffordFromBudget = remaining >= amount;
    const canAffordFromBalance = totalBalance >= amount;
    return {
      blocks: [
        { type: 'text', content: `🛒 **Affordability Check${amount > 0 ? ` — ${formatCurrency(amount)}` : ''}**` },
        { type: 'stat', label: 'Monthly Budget Remaining', value: budget > 0 ? formatCurrency(remaining) : '—', color: budget > 0 && remaining > 0 ? 'text-emerald-400' : 'text-white/40' },
        { type: 'stat', label: 'Total Account Balance', value: formatCurrency(totalBalance), color: totalBalance > 0 ? 'text-emerald-400' : 'text-red-400' },
        ...(amount > 0
          ? [{
            type: 'text' as const,
            content: canAffordFromBudget && canAffordFromBalance
              ? `✅ **Yes, you can afford ${formatCurrency(amount)}!** It fits within both your budget and account balance.`
              : canAffordFromBalance
              ? `⚠️ You have enough in your account, but this would **exceed your monthly budget**. Consider waiting till next month.`
              : `❌ **Not advisable right now.** Your current balance (${formatCurrency(totalBalance)}) is less than ${formatCurrency(amount)}.`,
          }]
          : [{ type: 'tip' as const, content: 'Include the amount in your question (e.g., "Can I afford ₹5,000?") for a precise answer.' }]
        ),
      ],
      chips: ['Show budget status', 'How can I save more?', 'Check my account balances'],
    };
  }

  // ── Intent: Daily budget target ──
  if (/daily|per day|each day|day limit/.test(q)) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const dailySafe = daysLeft > 0 && remaining > 0 ? Math.round(remaining / daysLeft) : 0;
    const dailyActual = now.getDate() > 0 ? Math.round(spent / now.getDate()) : 0;
    return {
      blocks: [
        { type: 'text', content: `📅 **Daily Spending Target**` },
        { type: 'stat', label: 'Days Left in Month', value: `${daysLeft} days` },
        { type: 'stat', label: 'Budget Remaining', value: budget > 0 ? formatCurrency(remaining) : '—' },
        { type: 'stat', label: 'Safe Daily Limit', value: dailySafe > 0 ? `${formatCurrency(dailySafe)} / day` : '—', color: 'text-emerald-400', sub: 'To stay within budget' },
        { type: 'stat', label: 'Actual Daily Average', value: `${formatCurrency(dailyActual)} / day`, sub: 'Based on current month', color: dailyActual > dailySafe && dailySafe > 0 ? 'text-red-400' : 'text-white' },
        { type: 'tip', content: dailySafe > 0 ? `Staying under **${formatCurrency(dailySafe)}/day** for the remaining ${daysLeft} days will keep you within budget.` : 'Set a budget in the Budget tab to get a daily spending target.' },
      ],
      chips: ['Show budget status', 'How can I save more?', 'Analyze my spending'],
    };
  }

  // ── Intent: Overspending ──
  if (/overspend|over.?budget|exceed|too much|limit/.test(q)) {
    const budgetStatuses = budgets.map(b => {
      const s = catMap(thisMonthTxns).find(([c]) => c === b.category)?.[1] ?? 0;
      return { ...b, spent: s, over: s > b.limit, pct: (s / b.limit) * 100 };
    }).filter(b => b.over || b.pct >= 70).sort((a, b) => b.pct - a.pct);

    if (budgetStatuses.length === 0) {
      return {
        blocks: [
          { type: 'text', content: `✅ **No Overspending Detected!**\n\nAll your spending categories are within budget this month. Keep it up!` },
          { type: 'tip', content: `You have **${formatCurrency(remaining)}** left in your monthly budget.` },
        ],
        chips: ['How can I save more?', 'Analyze my spending', 'Show my goals'],
      };
    }

    const cats = catMap(thisMonthTxns);
    return {
      blocks: [
        { type: 'text', content: `⚠️ **Overspending Detected**` },
        ...budgetStatuses.map(b => ({
          type: 'bar' as const,
          label: `${CATEGORY_ICONS[b.category] ?? '📦'} ${b.category}`,
          value: b.spent,
          max: b.limit,
          color: b.over ? '#EF4444' : '#F59E0B',
          note: b.over ? `${formatCurrency(b.spent - b.limit)} over limit` : `${b.pct.toFixed(0)}% used — approaching limit`,
        })),
        { type: 'list', items: budgetStatuses.filter(b => b.over).map(b => `**${b.category}**: ${formatCurrency(b.spent - b.limit)} over. Try to freeze ${b.category} spending for the rest of the month.`) },
        ...(cats.length > 0 ? [{ type: 'tip' as const, content: `Your top uncapped spend is **${cats[0][0]}** (${formatCurrency(cats[0][1])}). Set a budget limit to control it.` }] : []),
      ],
      chips: ['How can I save more?', 'Show budget status', 'Analyze my spending'],
    };
  }

  // ── Intent: Top / Biggest / Highest ──
  if (/top|biggest|highest|most|major|where did (i|my money)/.test(q)) {
    const cats = catMap(thisMonthTxns);
    if (cats.length === 0) {
      return {
        blocks: [{ type: 'text', content: 'No expenses recorded this month yet. Start logging transactions to see your top spending categories!' }],
        chips: ['Analyze my spending', 'Show budget status'],
      };
    }
    return {
      blocks: [
        { type: 'text', content: `🏆 **Top Spending Categories This Month**` },
        ...cats.slice(0, 6).map(([cat, amt], i) => ({
          type: 'bar' as const,
          label: `#${i + 1} ${CATEGORY_ICONS[cat] ?? '📦'} ${cat}`,
          value: amt,
          max: cats[0][1],
          color: CATEGORY_COLORS[cat] ?? '#94A3B8',
          note: `${formatCurrency(amt)} · ${((amt / spent) * 100).toFixed(0)}% of total spending`,
        })),
        { type: 'tip', content: `**${cats[0][0]}** is your #1 expense at ${formatCurrency(cats[0][1])}. ${budgets.find(b => b.category === cats[0][0]) ? 'You have a budget set for it.' : 'Consider setting a budget limit for this category.'}` },
      ],
      chips: ['Show budget status', 'How can I save more?', `How much on ${cats[0][0].split(' ')[0].toLowerCase()}?`],
    };
  }

  // ── Fallback ──
  const cats = catMap(thisMonthTxns);
  return {
    blocks: [
      { type: 'text', content: `🤖 I'm not sure I fully understood that, but here's your current financial snapshot:` },
      { type: 'stat', label: 'This Month Spent', value: formatCurrency(spent), sub: budget > 0 ? `${usedPct.toFixed(0)}% of ${formatCurrency(budget)} budget` : 'No budget set' },
      { type: 'stat', label: 'Total Balance', value: formatCurrency(totalBalance), color: totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400' },
      ...(cats.length > 0 ? [{ type: 'stat' as const, label: 'Top Spend', value: `${CATEGORY_ICONS[cats[0][0]] ?? '📦'} ${cats[0][0]}`, sub: formatCurrency(cats[0][1]) }] : []),
      { type: 'text', content: 'Try asking me:' },
      { type: 'list', items: ['Analyze my spending', 'How much did I spend on food?', 'Show my budget status', 'Can I afford ₹3,000?', 'Compare to last month', 'Give me saving tips'] },
    ],
    chips: ['Analyze my spending', 'Show budget status', 'How can I save more?', 'Top spending categories'],
  };
}

// ─── Suggested Prompts ──────────────────────────────────────────────────────────

const PROMPT_GROUPS = [
  {
    label: 'Spending',
    icon: TrendingUp,
    prompts: ['Analyze my spending', 'Top spending categories', 'Compare to last month', "Today's expenses"],
  },
  {
    label: 'Budget',
    icon: Wallet,
    prompts: ['Show budget status', 'Where am I overspending?', "What's my daily limit?", 'Check food spending'],
  },
  {
    label: 'Planning',
    icon: Target,
    prompts: ['How can I save more?', 'Show my goals', 'Check my subscriptions', 'Can I afford ₹5,000?'],
  },
];

// ─── Typewriter hook ────────────────────────────────────────────────────────────

function useTypewriterText(target: string, active: boolean) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active) { setDisplayed(target); return; }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [target, active]);
  return displayed;
}

// ─── Message bubble ─────────────────────────────────────────────────────────────

function AIBubble({ msg, isLatest }: { msg: Message; isLatest: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-emerald-500/20">
        <Bot size={16} className="stroke-[2.5]" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="rounded-3xl rounded-tl-sm px-4 py-3.5 bg-white/5 border border-white/10 shadow-sm space-y-2.5">
          {msg.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
          <p className="text-[10px] text-white/25 font-mono text-right pt-1">{msg.time}</p>
        </div>
        {msg.chips && msg.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {msg.chips.map(chip => (
              <span key={chip} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center gap-1">
                <ChevronRight size={10} />
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UserBubble({ msg }: { msg: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 justify-end"
    >
      <div className="max-w-[80%] space-y-1">
        <div className="rounded-3xl rounded-tr-sm px-4 py-3 bg-emerald-500 text-black font-semibold text-sm shadow-lg shadow-emerald-500/10">
          {msg.blocks[0]?.type === 'text' ? msg.blocks[0].content : ''}
          <p className="text-[10px] text-black/40 font-mono text-right mt-1.5">{msg.time}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
        <User size={15} />
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

const INIT_CHIPS = ['Analyze my spending', 'Show budget status', 'How can I save more?', 'Show my goals'];

export function AskSmartSpend() {
  const finance = useFinance();
  const { user } = useAuth();
  const { state, thisMonthSpent, thisMonthIncome, totalBalance, categoryBudgetStatus } = finance;

  const effectiveBudget = useMemo(() => {
    if (state.monthlyBudget && state.monthlyBudget > 0) return state.monthlyBudget;
    return state.budgets.reduce((s, b) => s + b.limit, 0);
  }, [state.monthlyBudget, state.budgets]);

  const remaining = effectiveBudget > 0 ? effectiveBudget - thisMonthSpent : 0;
  const usedPct = effectiveBudget > 0 ? Math.min((thisMonthSpent / effectiveBudget) * 100, 100) : 0;

  const snap: FinanceSnapshot = useMemo(() => ({
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals,
    recurring: state.recurring,
    accounts: state.accounts,
    thisMonthSpent,
    thisMonthIncome,
    totalBalance,
    effectiveBudget,
    userName: user?.name?.split(' ')[0] ?? 'there',
  }), [state, thisMonthSpent, thisMonthIncome, totalBalance, effectiveBudget, user]);

  const initMessage = useMemo<Message>(() => ({
    id: 'init',
    sender: 'ai',
    blocks: [
      { type: 'text', content: `👋 **Hello! I'm SmartSpend AI — your personal finance coach.**\n\nI have real-time access to all your financial data:` },
      { type: 'stat', label: 'Monthly Budget', value: effectiveBudget > 0 ? formatCurrency(effectiveBudget) : 'Not set', sub: effectiveBudget > 0 ? `${usedPct.toFixed(0)}% used` : 'Set one in Budget tab' },
      { type: 'stat', label: 'Spent This Month', value: formatCurrency(thisMonthSpent), color: usedPct > 90 ? 'text-red-400' : 'text-white' },
      { type: 'stat', label: 'Total Balance', value: formatCurrency(totalBalance), color: totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400' },
      { type: 'text', content: 'Ask me anything — spending analysis, budget tips, category breakdowns, or savings goals!' },
    ],
    time: 'Just now',
    chips: INIT_CHIPS,
  }), []); // intentionally not reactive — only on mount

  const [messages, setMessages] = useState<Message[]>([initMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [latestAiId, setLatestAiId] = useState<string | null>('init');
  const [activePromptGroup, setActivePromptGroup] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback((customText?: string) => {
    const query = (customText ?? input).trim();
    if (!query || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      blocks: [{ type: 'text', content: query }],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const delay = 600 + Math.random() * 400;
    setTimeout(() => {
      const { blocks, chips } = buildReply(query, snap);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        blocks,
        chips,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setLatestAiId(aiMsg.id);
      setIsTyping(false);
    }, delay);
  }, [input, isTyping, snap]);

  const handleClear = useCallback(() => {
    setMessages([{
      ...initMessage,
      id: `init-${Date.now()}`,
      time: 'Just now',
      blocks: [
        { type: 'text', content: '🧹 Chat cleared! What would you like to explore?' },
        { type: 'stat', label: 'Spent This Month', value: formatCurrency(thisMonthSpent), color: usedPct > 90 ? 'text-red-400' : 'text-white' },
        { type: 'stat', label: 'Budget Remaining', value: effectiveBudget > 0 ? formatCurrency(remaining) : '—', color: 'text-emerald-400' },
      ],
      chips: INIT_CHIPS,
    }]);
    setLatestAiId(null);
  }, [thisMonthSpent, effectiveBudget, remaining, usedPct]);

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">Ask SmartSpend</h1>
            <span className="text-xl">✨</span>
          </div>
          <p className="text-white/50 text-sm mt-0.5 font-medium">Your 24/7 personal financial coach &amp; money advisor.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Online</span>
          </div>
          <button onClick={handleClear} className="p-2 rounded-2xl bg-[#1C1C1E] border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-colors" title="Clear chat">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Live context bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-3.5 sm:p-4 rounded-3xl bg-[#1C1C1E] border border-white/10 flex flex-wrap items-center gap-3 text-xs shadow-md"
      >
        <div className="flex items-center gap-2 text-white/60">
          <ShieldCheck size={15} className="text-emerald-400 flex-shrink-0" />
          <span className="font-semibold text-white">Live Data Connected</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-white/70 font-mono ml-auto">
          <div><span className="text-white/40">Budget: </span><span className="font-bold text-white">{effectiveBudget > 0 ? formatCurrency(effectiveBudget) : '—'}</span></div>
          <div><span className="text-white/40">Spent: </span><span className="font-bold text-white">{formatCurrency(thisMonthSpent)}</span>{effectiveBudget > 0 && <span className="text-emerald-400 ml-1">({usedPct.toFixed(0)}%)</span>}</div>
          <div><span className="text-white/40">Left: </span><span className="font-bold text-emerald-400">{effectiveBudget > 0 ? formatCurrency(remaining) : '—'}</span></div>
          <div><span className="text-white/40">Balance: </span><span className="font-bold text-white">{formatCurrency(totalBalance)}</span></div>
        </div>
      </motion.div>

      {/* Chat container */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-[#1C1C1E] border border-white/10 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Messages */}
        <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[540px] custom-scrollbar">
          {messages.map(msg =>
            msg.sender === 'ai'
              ? <AIBubble key={msg.id} msg={msg} isLatest={msg.id === latestAiId} />
              : <UserBubble key={msg.id} msg={msg} />
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center flex-shrink-0">
                  <Bot size={16} />
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>

        {/* Suggested prompts */}
        <div className="p-4 sm:p-5 bg-white/[0.02] border-t border-white/10 space-y-3">
          {/* Group tabs */}
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-emerald-400" />
            <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">Suggested</span>
            <div className="flex gap-1.5 ml-auto">
              {PROMPT_GROUPS.map((g, i) => {
                const Icon = g.icon;
                return (
                  <button key={g.label} onClick={() => setActivePromptGroup(i)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      activePromptGroup === i
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    <Icon size={11} />
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PROMPT_GROUPS[activePromptGroup].prompts.map(p => (
              <button key={p} onClick={() => handleSend(p)}
                className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/25 text-white/60 hover:text-emerald-300 text-xs font-medium transition-all leading-snug"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="p-4 sm:p-5 bg-[#1C1C1E] border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Ask anything… e.g. How much did I spend on food this month?"
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:bg-white/7 transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-black font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0"
            >
              <span className="hidden sm:inline">Ask</span>
              <Send size={16} className="stroke-[2.5]" />
            </button>
          </div>
          <p className="text-white/20 text-[10px] text-center mt-2">AI responses are based on your logged data only. Not financial advice.</p>
        </div>
      </motion.div>
    </div>
  );
}
