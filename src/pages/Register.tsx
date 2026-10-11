import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, Star, X, Check, Trash2, Edit2, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import type { Transaction, Category } from '../types/finance';
import { EmptyState } from '../components/shared/EmptyState';

const ALL_CATEGORIES: Category[] = [
  'Food & Dining', 'Groceries', 'Transport', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Health', 'Travel', 'Education', 'Rent', 'Investment', 'Insurance', 'Other',
];

const INCOME_CATEGORIES: Category[] = [
  'Allowance', 'Salary', 'Petty cash', 'Bonus', 'Other'
];

const EXPENSE_CATEGORIES: Category[] = [
  'Food', 'Social Life', 'Pets',
  'Transport', 'Culture', 'Household',
  'Apparel', 'Beauty', 'Health',
  'Education', 'Gift', 'Other'
];

type ViewTab = 'Daily' | 'Monthly' | 'All';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Format amount like the reference app
function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Group transactions by date (YYYY-MM-DD)
function groupByDay(txns: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  txns.forEach(t => {
    const key = t.date.split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

// Group transactions by month
function groupByMonth(txns: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  txns.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function CategoryPicker({ categories, onClose, onSelect }: { categories: Category[], onClose: () => void, onSelect: (c: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-lg bg-[#222225] rounded-t-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
        
        {/* Header matching the image */}
        <div className="flex items-center justify-between bg-white/10 px-4 py-3 border-b border-white/5">
          <h3 className="text-white/70 font-semibold text-lg">Category</h3>
          <div className="flex items-center gap-4 text-white/50">
            <button className="hover:text-white transition-colors"><Edit2 size={18} /></button>
            <button onClick={onClose} className="hover:text-white transition-colors"><X size={20} /></button>
          </div>
        </div>

        {/* Grid matching the image */}
        <div className="grid grid-cols-3">
          {categories.map((cat, i) => {
            const icon = CATEGORY_ICONS[cat] ?? (cat === 'Other' ? '' : '📦');
            return (
              <button key={cat} onClick={() => { onSelect(cat); onClose(); }}
                className={`py-6 flex flex-col items-center justify-center gap-2 border-white/5 hover:bg-white/5 transition-colors
                  ${i % 3 !== 2 ? 'border-r' : ''} 
                  ${Math.floor(i / 3) !== Math.floor((categories.length - 1) / 3) ? 'border-b' : ''}`}>
                <div className="flex items-center gap-2">
                  {icon && <span className="text-xl">{icon}</span>}
                  <span className="text-white font-medium text-[15px]">{cat}</span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Add Expense Bottom Sheet ─────────────────────── */
function AddSheet({ onClose, accounts, defaultType = 'debit' }: {
  onClose: () => void;
  accounts: ReturnType<typeof useFinance>['state']['accounts'];
  defaultType?: 'debit' | 'credit';
}) {
  const { addTransaction } = useFinance();
  const [form, setForm] = useState({
    amount: '', category: '',
    accountId: accounts[0]?.id ?? '', type: defaultType,
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    note: '',
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const save = () => {
    if (!form.amount || !form.category) return;
    addTransaction({
      id: `t-${Date.now()}`, title: form.note || form.category, merchant: form.note || form.category,
      category: form.category, amount: Math.abs(Number(form.amount)),
      type: form.type, accountId: form.accountId,
      date: new Date(form.date).toISOString(), status: 'pending',
      note: form.note,
    });
    onClose();
  };

  return (
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-lg bg-[#1C1C1E] rounded-t-3xl border-t border-white/10 p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold text-lg">New Transaction</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
            <X size={15} />
          </button>
        </div>

        {/* Type */}
        <div className="flex gap-2 p-1 bg-white/6 rounded-2xl">
          {(['credit', 'debit'] as const).map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                form.type === t
                  ? t === 'debit' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/30' : 'bg-[#4D9FFF]/20 text-[#4D9FFF] border border-[#4D9FFF]/30'
                  : 'text-white/40'}`}>
              {t === 'debit' ? '↑ Expense' : '↓ Income'}
            </button>
          ))}
        </div>

        {/* Form list layout */}
        <div className="space-y-0 text-lg">
          {/* Date */}
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <label className="text-white/60 font-semibold w-24 flex items-center gap-2">
              <Calendar size={18} /> Date
            </label>
            <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="flex-1 bg-transparent text-white focus:outline-none text-right [color-scheme:dark]" />
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <label className="text-white/60 font-semibold w-24">Amount</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0" autoFocus
              className="flex-1 bg-transparent text-white focus:outline-none text-right font-mono" />
          </div>

          {/* Category */}
          <div className="flex items-center justify-between py-4 border-b border-white/10 relative">
            <label className="text-white/60 font-semibold w-24">Category</label>
            <button onClick={() => setShowCategoryPicker(true)} 
              className={`flex-1 text-right focus:outline-none ${form.category ? 'text-white' : 'text-white/40'}`}>
              {form.category || 'Select Category'}
            </button>
          </div>

          {/* Account */}
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <label className="text-white/60 font-semibold w-24">Account</label>
            <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              className="flex-1 bg-transparent text-white focus:outline-none text-right rtl:text-right" dir="rtl">
              {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#1C1C1E] text-white">{a.name}</option>)}
            </select>
          </div>

          {/* Note */}
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <label className="text-white/60 font-semibold w-24">Note</label>
            <input placeholder="Optional" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="flex-1 bg-transparent text-white focus:outline-none text-right" />
          </div>
        </div>

        <button onClick={save} disabled={!form.amount || !form.category}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-opacity disabled:opacity-30 mt-4"
          style={{ background: form.type === 'debit' ? '#FF6B6B' : '#4D9FFF' }}>
          Save Transaction
        </button>
      </motion.div>
    </motion.div>
    
    <AnimatePresence>
      {showCategoryPicker && (
        <CategoryPicker 
          categories={form.type === 'credit' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
          onClose={() => setShowCategoryPicker(false)} 
          onSelect={c => setForm(f => ({ ...f, category: c }))} 
        />
      )}
    </AnimatePresence>
    </>
  );
}

/* ── Main Expenses Page ───────────────────────────── */
export function Register() {
  const { state, hasData, deleteTransaction, updateTransaction, addTransaction } = useFinance();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<ViewTab>('Daily');
  const [showSearch, setShowSearch] = useState(false);
  
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'debit'|'credit'>('debit');
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  
  const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);
  const [search, setSearch] = useState('');

  const openAdd = (type: 'debit' | 'credit') => { setAddType(type); setShowAdd(true); };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Auto-switch to the month containing transactions if the current selected month has 0 transactions
  useEffect(() => {
    if (state.transactions.length > 0) {
      const hasSelectedMonth = state.transactions.some(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      if (!hasSelectedMonth) {
        const sorted = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        if (latest) {
          const d = new Date(latest.date);
          if (!isNaN(d.getTime())) {
            setYear(d.getFullYear());
            setMonth(d.getMonth());
          }
        }
      }
    }
  }, [state.transactions.length]);

  // Identify latest transaction info for quick jump
  const latestTxnInfo = useMemo(() => {
    if (state.transactions.length === 0) return null;
    const sorted = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const d = new Date(sorted[0].date);
    if (isNaN(d.getTime())) return null;
    const count = state.transactions.filter(t => {
      const td = new Date(t.date);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    }).length;
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      count,
    };
  }, [state.transactions]);

  // Filter to selected month
  const monthTxns = useMemo(() =>
    state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month &&
        (!search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));
    }),
    [state.transactions, year, month, search]
  );

  // All transactions sorted
  const allTxns = useMemo(() =>
    [...state.transactions]
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.transactions, search]
  );

  if (!hasData) {
    return <EmptyState icon="🧾" title="No Expenses Yet" description="Tap + to add your first expense." showSyncAction />;
  }

  const activeTxns = tab === 'All' ? allTxns : monthTxns;
  const income  = activeTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const expense = activeTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const total   = income - expense;

  const TABS: ViewTab[] = ['Daily', 'Monthly', 'All'];

  return (
    <div className="flex flex-col min-h-screen -mx-3 sm:-mx-6 -mt-4 sm:-mt-7 bg-[#111113]">

      {/* ── Top bar ── */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-0 bg-[#111113] sticky top-14 lg:top-0 z-20">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          {tab === 'All' ? (
            <div className="flex items-center gap-2">
              <span className="text-xl">🗂️</span>
              <h2 className="text-white font-bold text-lg tracking-wide">
                All Transactions ({state.transactions.length})
              </h2>
            </div>
          ) : (
            <>
              <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <ChevronLeft size={22} />
              </button>
              <h2 className="text-white font-bold text-lg tracking-wide">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div className="flex items-center gap-3 ml-3">
            <button onClick={() => setShowSearch(v => !v)} className="text-white/50 hover:text-white transition-colors">
              <Search size={18} />
            </button>
            <button className="text-white/50 hover:text-white transition-colors">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button onClick={() => openAdd('credit')} className="flex-1 py-2.5 rounded-xl bg-[#4D9FFF]/15 text-[#4D9FFF] border border-[#4D9FFF]/20 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#4D9FFF]/25 transition-colors">
            ↑ Income
          </button>
          <button onClick={() => openAdd('debit')} className="flex-1 py-2.5 rounded-xl bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/20 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#FF6B6B]/25 transition-colors">
            ↓ Expense
          </button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
                  className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/25" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"><X size={13} /></button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div className="flex border-b border-white/8">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold relative transition-colors ${tab === t ? 'text-white' : 'text-white/35'}`}>
              {t} {t === 'All' && state.transactions.length > 0 ? `(${state.transactions.length})` : ''}
              {tab === t && (
                <motion.div layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#FF6B6B' }} />
              )}
            </button>
          ))}
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 text-center py-2.5 sm:py-3 border-b border-white/8">
          <div>
            <p className="text-white/40 text-xs mb-0.5">Income</p>
            <p className="text-[#4D9FFF] font-bold text-sm sm:text-base font-mono truncate px-1">{fmt(income)}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-0.5">Expenses</p>
            <p className="text-[#FF6B6B] font-bold text-sm sm:text-base font-mono truncate px-1">{fmt(expense)}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-0.5">Total</p>
            <p className={`font-bold text-sm sm:text-base font-mono truncate px-1 ${total >= 0 ? 'text-white' : 'text-[#FF6B6B]'}`}>{fmt(total)}</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-32">
        {tab === 'Daily' && monthTxns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6 space-y-4">
            <span className="text-5xl">📭</span>
            <div>
              <p className="text-white/70 font-semibold text-lg">No transactions in {MONTHS[month]} {year}</p>
              <p className="text-white/35 text-sm mt-1">Tap + to add one or view other periods</p>
            </div>
            {latestTxnInfo && (latestTxnInfo.year !== year || latestTxnInfo.month !== month) && (
              <button
                onClick={() => {
                  setYear(latestTxnInfo.year);
                  setMonth(latestTxnInfo.month);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <span>Jump to {latestTxnInfo.label} ({latestTxnInfo.count} transactions) →</span>
              </button>
            )}
            {state.transactions.length > 0 && (
              <button
                onClick={() => setTab('All')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors"
              >
                View All {state.transactions.length} Transactions Across All Time →
              </button>
            )}
          </div>
        ) : tab === 'Daily' ? (
          // ── DAILY VIEW ──
          <DailyView txns={monthTxns} accounts={state.accounts} onDelete={deleteTransaction} onEdit={setEditTxn} />
        ) : tab === 'Monthly' ? (
          // ── MONTHLY VIEW ──
          <MonthlyView 
            txns={state.transactions} 
            onSelectMonth={(y, m) => {
              setYear(y);
              setMonth(m);
              setTab('Daily');
            }} 
          />
        ) : (
          // ── ALL TRANSACTIONS VIEW ──
          allTxns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-white/60 font-semibold">No transactions recorded yet</p>
              <p className="text-white/30 text-sm mt-1">Import a file or tap + to add your first expense</p>
            </div>
          ) : (
            <DailyView txns={allTxns} accounts={state.accounts} onDelete={deleteTransaction} onEdit={setEditTxn} />
          )
        )}
      </div>

      {/* Add sheet */}
      <AnimatePresence>{showAdd && <AddSheet onClose={() => setShowAdd(false)} accounts={state.accounts} defaultType={addType} />}</AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editTxn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={e => e.target === e.currentTarget && setEditTxn(null)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              transition={{ type: 'spring', damping: 28 }}
              className="w-full max-w-lg bg-[#1C1C1E] rounded-t-3xl border-t border-white/10 p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Edit Transaction</h3>
                <button onClick={() => setEditTxn(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"><X size={15} /></button>
              </div>
              <div className="space-y-0 text-lg">
                <div className="flex items-center justify-between py-4 border-b border-white/10">
                  <label className="text-white/60 font-semibold w-24 flex items-center gap-2">
                    <Calendar size={18} /> Date
                  </label>
                  <input type="datetime-local" value={new Date(editTxn.date).toISOString().slice(0, 16)} onChange={e => setEditTxn(t => t ? { ...t, date: new Date(e.target.value).toISOString() } : t)}
                    className="flex-1 bg-transparent text-white focus:outline-none text-right [color-scheme:dark]" />
                </div>
                <div className="flex items-center justify-between py-4 border-b border-white/10">
                  <label className="text-white/60 font-semibold w-24">Amount</label>
                  <input type="number" value={editTxn.amount} onChange={e => setEditTxn(t => t ? { ...t, amount: Number(e.target.value) } : t)}
                    className="flex-1 bg-transparent text-white focus:outline-none text-right font-mono" />
                </div>
                <div className="flex items-center justify-between py-4 border-b border-white/10 relative">
                  <label className="text-white/60 font-semibold w-24">Category</label>
                  <button onClick={() => setShowEditCategoryPicker(true)} 
                    className={`flex-1 text-right focus:outline-none ${editTxn.category ? 'text-white' : 'text-white/40'}`}>
                    {editTxn.category || 'Select Category'}
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-white/10">
                  <label className="text-white/60 font-semibold w-24">Account</label>
                  <select value={editTxn.accountId} onChange={e => setEditTxn(t => t ? { ...t, accountId: e.target.value } : t)}
                    className="flex-1 bg-transparent text-white focus:outline-none text-right rtl:text-right" dir="rtl">
                    {state.accounts.map(a => <option key={a.id} value={a.id} className="bg-[#1C1C1E] text-white">{a.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-white/10">
                  <label className="text-white/60 font-semibold w-24">Note</label>
                  <input placeholder="Optional" value={editTxn.note ?? ''} onChange={e => setEditTxn(t => t ? { ...t, note: e.target.value, title: e.target.value || t.category } : t)}
                    className="flex-1 bg-transparent text-white focus:outline-none text-right" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditTxn(null)} className="flex-1 py-3 rounded-2xl bg-white/6 text-white/60 text-sm font-medium hover:text-white transition-colors">Cancel</button>
                <button onClick={() => { updateTransaction(editTxn!); setEditTxn(null); }}
                  className="flex-1 py-3 rounded-2xl text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditCategoryPicker && editTxn && (
          <CategoryPicker 
            categories={editTxn.type === 'credit' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
            onClose={() => setShowEditCategoryPicker(false)} 
            onSelect={c => setEditTxn(t => t ? { ...t, category: c } : t)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Daily View ─────────────────────────────────── */
function DailyView({ txns, accounts, onDelete, onEdit }: {
  txns: Transaction[];
  accounts: ReturnType<typeof useFinance>['state']['accounts'];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}) {
  const groups = groupByDay(txns);

  return (
    <div>
      {groups.map(([dateKey, dayTxns]) => {
        const d = new Date(dateKey + 'T12:00:00');
        const dayNum  = d.getDate();
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const monthYear = `${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
        const dayIncome  = dayTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
        const dayExpense = dayTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

        return (
          <div key={dateKey}>
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="text-white text-3xl font-black leading-none">{dayNum}</span>
                <div className="flex flex-col">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white/80 bg-white/15 w-fit leading-tight">{dayName}</span>
                  <span className="text-white/30 text-xs mt-0.5">{monthYear}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm font-semibold">
                {dayIncome > 0 && <span className="text-[#4D9FFF]">₹ {fmt(dayIncome)}</span>}
                {dayExpense > 0 && <span className="text-[#FF6B6B]">₹ {fmt(dayExpense)}</span>}
              </div>
            </div>

            {/* Transactions */}
            {dayTxns.map((txn, i) => {
              const icon  = CATEGORY_ICONS[txn.category] ?? '📦';
              const acct  = accounts.find(a => a.id === txn.accountId);

              return (
                <motion.div key={txn.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-white/4 hover:bg-white/3 transition-colors group">
                  {/* Category icon */}
                  <div className="flex flex-col items-center w-14 flex-shrink-0">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-white/35 text-[10px] mt-0.5 text-center leading-none">{txn.category.split(' ')[0]}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base truncate">{txn.title}</p>
                    <p className="text-white/35 text-xs mt-0.5 truncate">{acct?.name ?? 'Accounts'}</p>
                    {txn.note && (
                      <p className="text-white/40 text-[11px] mt-1 leading-tight italic truncate">{txn.note}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <p className={`font-bold text-base ${txn.type === 'credit' ? 'text-[#4D9FFF]' : 'text-[#FF6B6B]'}`}>
                      {txn.type === 'credit' ? '' : ''}₹ {fmt(txn.amount)}
                    </p>
                    <div className="flex gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(txn)} className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => onDelete(txn.id)} className="p-1.5 text-white/30 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/8 rounded-lg transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ── Monthly View ───────────────────────────────── */
function MonthlyView({ txns, onSelectMonth }: { txns: Transaction[]; onSelectMonth?: (year: number, month: number) => void }) {
  const groups = groupByMonth(txns);

  return (
    <div className="px-4 py-4 space-y-3">
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-white/60 font-semibold">No monthly history yet</p>
          <p className="text-white/30 text-sm mt-1">Add or import transactions to view monthly breakdowns</p>
        </div>
      ) : (
        groups.map(([key, mTxns]) => {
          const [y, m] = key.split('-');
          const monthIdx = parseInt(m, 10) - 1;
          const yearNum = parseInt(y, 10);
          const label = `${MONTHS[monthIdx]} ${yearNum}`;
          const income  = mTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
          const expense = mTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
          return (
            <div 
              key={key} 
              onClick={() => onSelectMonth?.(yearNum, monthIdx)}
              className="rounded-2xl bg-white/5 border border-white/8 hover:border-emerald-500/40 p-4 transition-all cursor-pointer group hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold group-hover:text-emerald-400 transition-colors">{label}</p>
                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-medium">Click to view days →</span>
                </div>
                <p className={`font-bold text-sm ${income - expense >= 0 ? 'text-[#4D9FFF]' : 'text-[#FF6B6B]'}`}>
                  ₹ {fmt(income - expense)}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                {income > 0 && (
                  <div>
                    <p className="text-white/30 text-xs">Income</p>
                    <p className="text-[#4D9FFF] font-semibold">₹ {fmt(income)}</p>
                  </div>
                )}
                <div>
                  <p className="text-white/30 text-xs">Expenses</p>
                  <p className="text-[#FF6B6B] font-semibold">₹ {fmt(expense)}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs">Transactions</p>
                  <p className="text-white/70 font-semibold">{mTxns.length}</p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
