import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, User, Mic, MicOff, ArrowUp, RotateCcw,
  Sparkles, Copy, Check, ThumbsUp, ThumbsDown,
  TrendingUp, Wallet, Target, BarChart2, X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency, CATEGORY_ICONS, cn } from '../lib/utils';
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
  | { type: 'bar'; label: string; value: number; max: number; color: string }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; content: string };

// ─── Inline text renderer ──────────────────────────────────────────────────────

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(₹[\d,]+|\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
        if (!p) return null;
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
        if (p.startsWith('`') && p.endsWith('`'))
          return <code key={i} className="px-1 py-0.5 rounded text-emerald-300 font-mono text-[11px] bg-emerald-900/30">{p.slice(1, -1)}</code>;
        if (/^₹[\d,]+$/.test(p))
          return <span key={i} className="text-emerald-400 font-mono font-bold tabular-nums">{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-white/75">
      {text.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-0.5" />;
        if (/^#{1,3} /.test(t))
          return <p key={i} className="text-white font-bold text-sm"><Inline text={t.replace(/^#+\s/, '')} /></p>;
        if (/^[*\-•] /.test(t))
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
              <span><Inline text={t.slice(2)} /></span>
            </div>
          );
        const nm = t.match(/^(\d+)\.\s+(.*)/);
        if (nm)
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-500 font-mono text-[10px] flex-shrink-0 mt-0.5 w-4 text-right tabular-nums">{nm[1]}.</span>
              <span><Inline text={nm[2]} /></span>
            </div>
          );
        return <p key={i}><Inline text={line} /></p>;
      })}
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text': return <RichText text={block.content} />;
    case 'stat':
      return (
        <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/5 bg-white/[0.02]">
          <span className="text-white/45 text-[11px] font-medium">{block.label}</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono font-bold text-[13px] tabular-nums ${block.color ?? 'text-white/90'}`}>{block.value}</span>
            {block.sub && <span className="text-white/30 text-[10px]">{block.sub}</span>}
          </div>
        </div>
      );
    case 'bar': {
      const pct = Math.min((block.value / Math.max(block.max, 1)) * 100, 100);
      return (
        <div className="space-y-1.5 py-0.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/50">{block.label}</span>
            <span className="text-white/80 font-mono tabular-nums">{formatCurrency(block.value)} · {pct.toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: block.color }} />
          </div>
        </div>
      );
    }
    case 'list':
      return (
        <div className="space-y-1.5">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-white/65">
              <span className="w-1 h-1 rounded-full bg-emerald-400/60 flex-shrink-0 mt-1.5" />
              <span><Inline text={item} /></span>
            </div>
          ))}
        </div>
      );
    case 'tip':
      return (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
          <Sparkles size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-300/85 text-[12px] leading-relaxed"><Inline text={block.content} /></p>
        </div>
      );
    default: return null;
  }
}

// ─── Finance helpers ───────────────────────────────────────────────────────────

const isThisMonth = (d: string) => {
  const t = new Date(d), n = new Date();
  return t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear();
};

function catMap(txns: Transaction[]) {
  const m = new Map<string, number>();
  for (const t of txns) if (t.type === 'debit') m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

interface FinSnap {
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

function buildReply(query: string, snap: FinSnap): { blocks: ContentBlock[]; chips: string[] } {
  const q = query.toLowerCase();
  const { transactions, thisMonthSpent: spent, totalBalance, effectiveBudget: budget } = snap;
  const monthTx = transactions.filter(t => isThisMonth(t.date));
  const remaining = budget > 0 ? budget - spent : 0;
  const usedPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const cats = catMap(monthTx);

  if (q.includes('spend') || q.includes('spent') || q.includes('how much') || q.includes('expense'))
    return {
      blocks: [
        { type: 'text', content: `You've spent **${formatCurrency(spent)}** this month${cats[0] ? ` — mostly on **${cats[0][0]}**` : ''}.` },
        ...cats.slice(0, 3).map(([c, a]) => ({ type: 'stat' as const, label: `${CATEGORY_ICONS[c] ?? '📦'} ${c}`, value: formatCurrency(a), sub: spent > 0 ? `${((a / spent) * 100).toFixed(0)}%` : undefined })),
      ],
      chips: ['Budget status', 'Biggest expense', 'Save tips'],
    };

  if (q.includes('budget') || q.includes('limit') || q.includes('health'))
    return budget <= 0
      ? { blocks: [{ type: 'text', content: `No budget set yet. You've spent **${formatCurrency(spent)}** this month.` }], chips: ['How much spent?', 'Biggest expense'] }
      : { blocks: [
            { type: 'text', content: `Budget is **${formatCurrency(budget)}**. Used **${usedPct.toFixed(0)}%** with **${formatCurrency(remaining)}** remaining.` },
            { type: 'bar', label: 'Monthly Usage', value: spent, max: budget, color: usedPct > 90 ? '#ef4444' : usedPct > 70 ? '#f59e0b' : '#10b981' },
          ],
          chips: ['Where to cut back?', 'How much spent?'] };

  if (q.includes('big') || q.includes('largest') || q.includes('highest'))
    return cats.length === 0
      ? { blocks: [{ type: 'text', content: 'No expenses recorded this month yet.' }], chips: ['Budget status', 'Save tips'] }
      : { blocks: [
            { type: 'text', content: `Biggest: **${cats[0][0]}** at **${formatCurrency(cats[0][1])}**.` },
            ...cats.slice(1, 4).map(([c, a]) => ({ type: 'stat' as const, label: `${CATEGORY_ICONS[c] ?? '📦'} ${c}`, value: formatCurrency(a) })),
          ],
          chips: ['How much spent?', 'Budget status'] };

  if (q.includes('save') || q.includes('tip') || q.includes('cut'))
    return { blocks: [{ type: 'text', content: `3 quick wins:\n* ${cats[0] ? `Trim **${cats[0][0]}** 10% → save **${formatCurrency(Math.round(cats[0][1] * 0.1))}**` : 'Categorise expenses to find savings'}\n* Cap daily spend at **${remaining > 0 ? formatCurrency(Math.round(remaining / 15)) : '₹500'}** for the rest of the month\n* Wait 24 h before any non-essential purchase over ₹1,000` }], chips: ['How much spent?', 'Budget status'] };

  return {
    blocks: [{ type: 'text', content: `* **Spent this month**: ${formatCurrency(spent)}\n* **Balance**: ${formatCurrency(totalBalance)}\n* **Budget**: ${budget > 0 ? `${formatCurrency(budget)} (${usedPct.toFixed(0)}% used)` : 'Not set'}` }],
    chips: ['How much spent?', 'Budget status', 'Biggest expense'],
  };
}

async function geminiReply(query: string, snap: FinSnap): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: ['You are SmartSpend AI — a warm, concise personal finance assistant.', 'Reply in 2–4 sentences or clean bullet points using only the supplied data.', `Question: ${query}`, `Data: ${JSON.stringify(snap)}`].join('\n\n') }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  const d = await res.json() as { answer?: string; error?: string };
  if (!res.ok) throw new Error(d.error ?? 'AI unavailable');
  return d.answer ?? 'No answer returned.';
}

// ─── Left Panel — Live Context ─────────────────────────────────────────────────

const QUERIES = [
  { label: 'Spending recap',   q: 'How much have I spent this month?',   icon: TrendingUp,  color: 'text-violet-400' },
  { label: 'Budget health',    q: 'Show my budget status',                icon: Wallet,      color: 'text-blue-400'   },
  { label: 'Top category',     q: 'What is my biggest expense?',          icon: BarChart2,   color: 'text-amber-400'  },
  { label: 'Save tips',        q: 'Tips to save money this month',        icon: Target,      color: 'text-emerald-400'},
];

function ContextPanel({ snap, onQuery, isMobile = false }: { snap: FinSnap; onQuery: (q: string) => void; isMobile?: boolean }) {
  const { effectiveBudget: budget, thisMonthSpent: spent, totalBalance, transactions } = snap;
  const usedPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget > 0 ? budget - spent : 0;
  const cats = catMap(transactions.filter(t => isThisMonth(t.date)));

  return (
    <div className={cn("flex flex-col gap-3 pr-1", isMobile ? "w-full pb-4" : "w-64 flex-shrink-0 overflow-y-auto custom-scrollbar")}>

      {/* Balance Card */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #1D4ED8 70%, #0EA5E9 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-blue-300/10 blur-xl" />

        <div className="relative z-10">
          <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">Total Balance</p>
          <p className={`font-black font-mono text-2xl tabular-nums tracking-tight ${totalBalance < 0 ? 'text-red-300' : 'text-white'}`}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      {/* Budget ring card */}
      <div className="rounded-2xl p-4 bg-[#14161A] border border-white/[0.06]">
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Monthly Budget</p>

        {budget > 0 ? (
          <div className="space-y-2">
            {/* Bar */}
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${usedPct}%`, background: usedPct > 90 ? '#ef4444' : usedPct > 70 ? '#f59e0b' : '#10b981' }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono tabular-nums">
              <span className="text-white/40">Spent</span>
              <span className="text-white/70">{formatCurrency(spent)} <span className="text-white/30">/ {formatCurrency(budget)}</span></span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-white/35 text-[10px]">Remaining</span>
              <span className={`font-mono font-bold text-sm tabular-nums ${remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-white/30 text-[12px]">No budget configured</p>
        )}
      </div>

      {/* Top categories */}
      {cats.length > 0 && (
        <div className="rounded-2xl p-4 bg-[#14161A] border border-white/[0.06]">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Top Spending</p>
          <div className="space-y-2.5">
            {cats.slice(0, 3).map(([cat, amt]) => {
              const share = spent > 0 ? (amt / spent) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/65">{CATEGORY_ICONS[cat] ?? '📦'} {cat}</span>
                    <span className="font-mono text-white/80 tabular-nums">{formatCurrency(amt)}</span>
                  </div>
                  <div className="h-0.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-2xl p-4 bg-[#14161A] border border-white/[0.06]">
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2.5">Quick Analysis</p>
        <div className="space-y-1">
          {QUERIES.map(({ label, q, icon: Icon, color }) => (
            <button key={q} onClick={() => onQuery(q)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] text-left transition-all group cursor-pointer active:scale-[0.98]">
              <Icon size={13} className={`${color} flex-shrink-0`} strokeWidth={1.75} />
              <span className="text-white/55 group-hover:text-white/85 text-[12px] font-medium transition-colors">{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Bubbles ───────────────────────────────────────────────────────────────────

const spring = { type: 'spring' as const, stiffness: 380, damping: 32 };

function AIBubble({ msg, onSend }: { msg: Message; onSend: (t: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [fb, setFb] = useState<'up' | 'down' | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}
      className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[#0E1F16] border border-emerald-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={13} className="text-emerald-400" strokeWidth={1.75} />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-[#13151A] border border-white/[0.07]">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.05]">
            <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">SmartSpend AI</span>
            <span className="text-[10px] text-white/25 font-mono tabular-nums">{msg.time}</span>
          </div>

          {/* Body */}
          <div className="px-3.5 py-3 space-y-2.5">
            {msg.blocks.map((b, i) => <Block key={i} block={b} />)}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3.5 py-2 border-t border-white/[0.04]">
            <button onClick={() => {
              navigator.clipboard.writeText(msg.blocks.map(b => b.type === 'text' ? b.content : '').filter(Boolean).join('\n'));
              setCopied(true); setTimeout(() => setCopied(false), 2000);
            }} className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition-colors">
              {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setFb(f => f === 'up' ? null : 'up')} className={`p-1 rounded transition-colors ${fb === 'up' ? 'text-emerald-400' : 'text-white/20 hover:text-white/50'}`}><ThumbsUp size={10} /></button>
              <button onClick={() => setFb(f => f === 'down' ? null : 'down')} className={`p-1 rounded transition-colors ${fb === 'down' ? 'text-red-400' : 'text-white/20 hover:text-white/50'}`}><ThumbsDown size={10} /></button>
            </div>
          </div>
        </div>

        {/* Chips */}
        {msg.chips && msg.chips.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-1.5">
            {msg.chips.map(c => (
              <button key={c} onClick={() => onSend(c)}
                className="px-2.5 py-1 rounded-lg text-[11px] text-white/45 hover:text-white/80 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-emerald-500/25 transition-all cursor-pointer active:scale-95">
                {c}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function UserBubble({ msg }: { msg: Message }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}
      className="flex items-end gap-2 justify-end">
      <div className="max-w-[76%] space-y-1">
        <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-white/90 text-[13px] leading-relaxed"
          style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #4338CA 100%)', boxShadow: '0 4px 20px rgba(91,33,182,0.25)' }}>
          {msg.blocks[0]?.type === 'text' ? msg.blocks[0].content : ''}
        </div>
        <div className="text-right text-[10px] text-white/20 font-mono tabular-nums pr-0.5">{msg.time}</div>
      </div>
      <div className="w-7 h-7 rounded-lg bg-[#1E1B33] border border-violet-700/30 flex items-center justify-center flex-shrink-0 text-violet-400">
        <User size={12} strokeWidth={1.75} />
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[#0E1F16] border border-emerald-800/50 flex items-center justify-center flex-shrink-0">
        <Bot size={12} className="text-emerald-400" strokeWidth={1.75} />
      </div>
      <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-[#13151A] border border-white/[0.07] flex items-center gap-1.5">
        {[0, 200, 400].map(d => (
          <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: d / 1000 }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function AskSmartSpend() {
  const { state, thisMonthSpent, thisMonthIncome, totalBalance } = useFinance();
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const effectiveBudget = useMemo((): number => {
    if (state.monthlyBudget != null && state.monthlyBudget > 0) return state.monthlyBudget;
    return state.budgets.reduce((s, b) => s + b.limit, 0);
  }, [state.monthlyBudget, state.budgets]);

  const snap: FinSnap = useMemo(() => ({
    transactions: state.transactions, budgets: state.budgets, goals: state.goals,
    recurring: state.recurring, accounts: state.accounts,
    thisMonthSpent, thisMonthIncome, totalBalance, effectiveBudget,
    userName: user?.name?.split(' ')[0] ?? 'there',
  }), [state, thisMonthSpent, thisMonthIncome, totalBalance, effectiveBudget, user]);

  const chatKey = `ss-v4-${user?.id ?? 'guest'}`;
  const [messages, setMessages] = useLocalStorage<Message[]>(chatKey, []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileContext, setShowMobileContext] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    try {
      const r = new SR(); r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
      r.onstart = () => setIsListening(true);
      r.onresult = (e: any) => { const t = e.results[0][0].transcript; if (t) { setInput(t); setTimeout(() => handleSend(t), 200); } setIsListening(false); };
      r.onerror = r.onend = () => setIsListening(false);
      recognitionRef.current = r; r.start();
    } catch { setIsListening(false); }
  };

  const handleSend = useCallback((override?: string) => {
    const query = (override ?? input).trim();
    if (!query || isTyping) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`, sender: 'user',
      blocks: [{ type: 'text', content: query }],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput(''); setIsTyping(true);

    setTimeout(async () => {
      let blocks: ContentBlock[]; let chips: string[] = [];
      try { blocks = [{ type: 'text', content: await geminiReply(query, snap) }]; chips = ['How much spent?', 'Budget status', 'Save tips']; }
      catch { ({ blocks, chips } = buildReply(query, snap)); }
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', blocks, chips, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setIsTyping(false);
    }, 400);
  }, [input, isTyping, isListening, snap, setMessages]);

  const handleClear = useCallback(() => setMessages([]), [setMessages]);

  return (
    /* Full height, responsive two-column layout */
    <div className="flex gap-5 h-[calc(100dvh-8.5rem)] lg:h-[calc(100vh-6.5rem)] -mx-1 sm:-mx-4">

      {/* ── LEFT: Live Financial Context Panel (Desktop) ── */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col">
        <ContextPanel snap={snap} onQuery={handleSend} />
      </aside>

      {/* ── RIGHT: Chat ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Chat header */}
        <div className="flex items-center justify-between pb-3 mb-1"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-[#0E1F16] border border-emerald-700/50 flex items-center justify-center">
                <Bot size={15} className="text-emerald-400" strokeWidth={1.75} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#111113]"
                style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-[14px] tracking-tight">Ask SmartSpend</h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 tracking-widest uppercase">Live</span>
              </div>
              <p className="text-white/30 text-[10px] mt-0.5">Gemini-powered financial co-pilot</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMobileContext(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-all"
            >
              <BarChart2 size={12} />
              <span>Stats</span>
            </button>
            {messages.length > 0 && (
              <button onClick={handleClear}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/35 hover:text-white/65 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all active:scale-95">
                <RotateCcw size={11} />
                <span className="hidden xs:inline">New chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile quick suggestions */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none flex-shrink-0 -mx-1 px-1 border-b border-white/[0.05]">
          {QUERIES.map(({ label, q, icon: Icon, color }) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[11px] font-medium text-white/70 whitespace-nowrap active:scale-95 transition-all flex-shrink-0"
            >
              <Icon size={11} className={color} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 custom-scrollbar">
          {messages.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}
              className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0E1F16] border border-emerald-700/50 flex items-center justify-center mb-3">
                <Sparkles size={22} className="text-emerald-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-white font-bold text-lg tracking-tight mb-1">Hi {userName} 👋</h2>
              <p className="text-white/35 text-[12px] max-w-[240px] leading-relaxed mb-4">
                Ask about your expenses, budgets, savings, or tap any suggestion above.
              </p>
            </motion.div>
          ) : (
            <>
              {messages.map(m => m.sender === 'ai' ? <AIBubble key={m.id} msg={m} onSend={handleSend} /> : <UserBubble key={m.id} msg={m} />)}
              <AnimatePresence>{isTyping && <TypingDots />}</AnimatePresence>
              <div ref={endRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="pt-2 sm:pt-3">
          <AnimatePresence>
            {isListening && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-2 px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /><span>Listening…</span></div>
                <button onClick={toggleVoice} className="underline font-medium">Stop</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#13151A] border border-white/[0.08] focus-within:border-emerald-600/40 transition-colors shadow-lg">
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Ask about spending, budgets, savings…"
              className="flex-1 bg-transparent text-white/90 text-[13px] sm:text-sm placeholder:text-white/20 focus:outline-none" />

            <button onClick={toggleVoice}
              className={`p-1.5 rounded-lg transition-all ${isListening ? 'text-white bg-rose-500' : 'text-white/25 hover:text-white/55'}`}>
              {isListening ? <MicOff size={14} strokeWidth={1.75} /> : <Mic size={14} strokeWidth={1.75} />}
            </button>

            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-black disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
              <ArrowUp size={13} strokeWidth={2.5} />
            </motion.button>
          </div>

          <p className="text-center text-white/15 text-[10px] mt-1.5 tracking-wide">
            Based on your verified ledger · Not financial advice
          </p>
        </div>
      </div>

      {/* ── Mobile Context Bottom Sheet ── */}
      <AnimatePresence>
        {showMobileContext && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileContext(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#14161A] border-t border-white/10 z-50 p-4 rounded-t-3xl overflow-y-auto lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <span className="text-white font-bold text-sm">Financial Context</span>
                </div>
                <button
                  onClick={() => setShowMobileContext(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <ContextPanel
                snap={snap}
                onQuery={(q) => {
                  setShowMobileContext(false);
                  handleSend(q);
                }}
                isMobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
