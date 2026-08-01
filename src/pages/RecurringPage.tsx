import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Power, PowerOff, Calendar, RefreshCw, X, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import type { RecurringTransaction, Category, RecurringFrequency } from '../types/finance';
import { EmptyState } from '../components/shared/EmptyState';

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Every Day',
  weekly: 'Every Week',
  biweekly: 'Every 2 Weeks',
  monthly: 'Every Month',
  quarterly: 'Every Quarter',
  yearly: 'Every Year',
};

const ALL_CATEGORIES: Category[] = [
  'Food & Dining','Transport','Shopping','Entertainment','Bills & Utilities',
  'Health','Travel','Education','Salary','Freelance','Investment','Rent','Groceries','Insurance','Other',
];

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return 'Overdue';
  return `In ${days} days`;
}

function RecurringForm({ initial, accounts, onSave, onClose }: {
  initial?: Partial<RecurringTransaction>;
  accounts: ReturnType<typeof useFinance>['state']['accounts'];
  onSave: (r: RecurringTransaction) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    amount: String(initial?.amount ?? ''),
    category: initial?.category ?? ('Bills & Utilities' as Category),
    accountId: initial?.accountId ?? accounts[0]?.id ?? '',
    type: initial?.type ?? ('debit' as const),
    frequency: initial?.frequency ?? ('monthly' as RecurringFrequency),
    nextDate: initial?.nextDate ? initial.nextDate.split('T')[0] : new Date().toISOString().split('T')[0],
    note: initial?.note ?? '',
    isActive: initial?.isActive ?? true,
  });

  const save = () => {
    if (!form.title || !form.amount) return;
    onSave({
      id: initial?.id ?? `r-${Date.now()}`,
      title: form.title, merchant: form.title,
      category: form.category, amount: Math.abs(Number(form.amount)),
      type: form.type, accountId: form.accountId,
      frequency: form.frequency, nextDate: new Date(form.nextDate).toISOString(),
      isActive: form.isActive, note: form.note,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-md bg-navy-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-bold">{initial?.id ? 'Edit' : 'New'} Recurring Transaction</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Name / Payee</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Netflix, Rent"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Amount (₹)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Next Date</label>
              <input type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Frequency</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as RecurringFrequency }))}
                className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50">
                {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50">
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c] ?? '📦'} {c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Account</label>
              <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">Type</label>
            <div className="flex gap-3">
              {(['debit', 'credit'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${form.type === t ? (t === 'debit' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400') : 'bg-white/5 border-white/10 text-white/50'}`}>
                  {t === 'debit' ? '↑ Expense' : '↓ Income'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition-colors">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
            {initial?.id ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function RecurringPage() {
  const { state, hasData, addRecurring, updateRecurring, deleteRecurring } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringTransaction | null>(null);

  if (!hasData) {
    return <EmptyState icon="🔁" title="No Recurring Rules" description="Connect accounts first to set up your recurring bills and income." showSyncAction />;
  }

  const active = state.recurring.filter(r => r.isActive);
  const inactive = state.recurring.filter(r => !r.isActive);
  const monthlyTotal = active.filter(r => r.type === 'debit').reduce((s, r) => {
    const factor = r.frequency === 'daily' ? 30 : r.frequency === 'weekly' ? 4.33 : r.frequency === 'biweekly' ? 2.17 : r.frequency === 'quarterly' ? 1/3 : r.frequency === 'yearly' ? 1/12 : 1;
    return s + r.amount * factor;
  }, 0);
  const monthlyIncome = active.filter(r => r.type === 'credit').reduce((s, r) => s + r.amount, 0);

  const sorted = [...state.recurring].sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Recurring Transactions</h1>
          <p className="text-white/40 text-sm mt-0.5">Automated bills, subscriptions, and income</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Rule
        </button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Monthly Bills', value: monthlyTotal, color: 'text-red-400' },
          { label: 'Monthly Income', value: monthlyIncome, color: 'text-emerald-400' },
          { label: 'Active Rules', value: active.length, color: 'text-violet-400', isCount: true },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass-card py-4">
            <p className="text-white/40 text-xs mb-1">{item.label}</p>
            <p className={`text-xl font-black font-mono ${item.color}`}>
              {item.isCount ? item.value : formatCurrency(item.value as number)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_100px_100px_80px_72px] gap-0 px-4 py-2.5 bg-white/4 border-b border-white/8 text-xs font-semibold text-white/35 uppercase tracking-wider">
          <div>Rule Name</div>
          <div>Frequency</div>
          <div className="text-right">Amount</div>
          <div>Next Due</div>
          <div>Status</div>
          <div />
        </div>

        <div className="divide-y divide-white/5">
          {sorted.map((r, i) => {
            const catIcon = CATEGORY_ICONS[r.category] ?? '📦';
            const catColor = CATEGORY_COLORS[r.category] ?? '#94A3B8';
            const dueSoon = new Date(r.nextDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
            const account = state.accounts.find(a => a.id === r.accountId);

            return (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[1fr_120px_100px_100px_80px_72px] gap-0 px-4 py-3 items-center hover:bg-white/3 transition-colors group ${!r.isActive ? 'opacity-50' : ''}`}>

                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: `${catColor}20` }}>
                    {catIcon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.title}</p>
                    <p className="text-white/30 text-xs truncate">{account?.name ?? 'Unknown Account'} {r.note && `· ${r.note}`}</p>
                  </div>
                  {r.isRecurring && <RefreshCw size={12} className="text-violet-400/50 flex-shrink-0" />}
                </div>

                <div className="text-white/50 text-xs">{FREQ_LABELS[r.frequency]}</div>

                <div className="text-right">
                  <span className={`font-mono font-bold text-sm ${r.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                    {r.type === 'credit' ? '+' : '-'}{formatCurrency(r.amount)}
                  </span>
                </div>

                <div>
                  <p className={`text-sm font-medium ${dueSoon && r.isActive ? 'text-yellow-400' : 'text-white/60'}`}>
                    {daysUntil(r.nextDate)}
                  </p>
                  <p className="text-white/25 text-xs">{new Date(r.nextDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>

                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${r.isActive ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    {r.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditTarget(r)}
                    className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => updateRecurring({ ...r, isActive: !r.isActive })}
                    className={`p-1.5 rounded-lg transition-colors ${r.isActive ? 'text-white/30 hover:text-yellow-400 hover:bg-yellow-400/8' : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-400/8'}`}>
                    {r.isActive ? <PowerOff size={13} /> : <Power size={13} />}
                  </button>
                  <button onClick={() => deleteRecurring(r.id)}
                    className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/8 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {(showForm || editTarget) && (
          <RecurringForm
            initial={editTarget ?? undefined}
            accounts={state.accounts}
            onSave={r => { editTarget ? updateRecurring(r) : addRecurring(r); setEditTarget(null); }}
            onClose={() => { setShowForm(false); setEditTarget(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
