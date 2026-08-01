import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Upload, Trash2, ChevronUp, ChevronDown, X, Check, RefreshCw, Edit2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import type { Transaction, TransactionStatus, Category } from '../types/finance';
import { EmptyState } from '../components/shared/EmptyState';

type SortKey = 'date' | 'merchant' | 'category' | 'amount' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_CYCLE: TransactionStatus[] = ['pending', 'cleared', 'reconciled'];
const STATUS_CONFIG = {
  pending:    { label: 'Pending',    dot: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' },
  cleared:    { label: 'Cleared',    dot: 'bg-blue-400',   text: 'text-blue-400',   border: 'border-blue-400/30',   bg: 'bg-blue-400/10'   },
  reconciled: { label: 'Reconciled', dot: 'bg-emerald-400',text: 'text-emerald-400',border: 'border-emerald-400/30',bg: 'bg-emerald-400/10' },
};

const ALL_CATEGORIES: Category[] = [
  'Food & Dining','Transport','Shopping','Entertainment','Bills & Utilities',
  'Health','Travel','Education','Salary','Freelance','Investment','Rent','Groceries','Insurance','Other',
];

function StatusBadge({ status, onClick }: { status: TransactionStatus; onClick?: () => void }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <button
      onClick={onClick}
      title="Click to cycle status"
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium transition-all hover:opacity-80 ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </button>
  );
}

function EditDrawer({ txn, onClose, onSave }: { txn: Transaction; onClose: () => void; onSave: (t: Transaction) => void }) {
  const { state } = useFinance();
  const [form, setForm] = useState({ ...txn });

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full max-w-sm bg-navy-900 border-l border-white/10 z-50 flex flex-col shadow-2xl"
    >
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <h2 className="text-white font-bold text-lg">Edit Transaction</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <label className="block">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Payee / Title</span>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
        </label>

        <label className="block">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Amount (₹)</span>
          <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors font-mono" />
        </label>

        <label className="block">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Date</span>
          <input type="date" value={form.date.split('T')[0]} onChange={e => setForm(f => ({ ...f, date: new Date(e.target.value).toISOString() }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
        </label>

        <label className="block">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Category</span>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
            className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors">
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c] ?? '📦'} {c}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Account</span>
          <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
            className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors">
            {state.accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
          </select>
        </label>

        <div>
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Type</span>
          <div className="flex gap-3">
            {(['debit', 'credit'] as const).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${form.type === t ? (t === 'debit' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400') : 'bg-white/5 border-white/10 text-white/50'}`}>
                {t === 'debit' ? '↑ Expense' : '↓ Income'}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Note</span>
          <textarea value={form.note ?? ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors resize-none" />
        </label>
      </div>

      <div className="p-5 border-t border-white/10 flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors">
          Cancel
        </button>
        <button onClick={() => { onSave(form); onClose(); }}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}

function AddTransactionRow({ onAdd, accounts }: { onAdd: (t: Transaction) => void; accounts: ReturnType<typeof useFinance>['state']['accounts'] }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food & Dining' as Category, accountId: accounts[0]?.id ?? '', type: 'debit' as const, date: new Date().toISOString().split('T')[0], note: '' });

  const handleAdd = () => {
    if (!form.title || !form.amount) return;
    onAdd({
      id: `t-${Date.now()}`,
      title: form.title, merchant: form.title, category: form.category,
      amount: Math.abs(Number(form.amount)), type: form.type, accountId: form.accountId,
      date: new Date(form.date).toISOString(), status: 'pending', note: form.note,
    });
    setForm({ title: '', amount: '', category: 'Food & Dining', accountId: accounts[0]?.id ?? '', type: 'debit', date: new Date().toISOString().split('T')[0], note: '' });
    setShow(false);
  };

  if (!show) return (
    <button onClick={() => setShow(true)}
      className="w-full flex items-center gap-3 px-4 py-3 border border-dashed border-white/15 rounded-xl text-white/30 hover:text-white/60 hover:border-white/30 hover:bg-white/3 transition-all text-sm group">
      <Plus size={16} className="group-hover:scale-110 transition-transform" /> Add a transaction...
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-violet-500/30 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input placeholder="Payee / Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
        <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 font-mono" />
        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
          className="bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50">
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
          className="bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div className="flex gap-2">
          {(['debit', 'credit'] as const).map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${form.type === t ? (t === 'debit' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400') : 'bg-white/5 border-white/10 text-white/40'}`}>
              {t === 'debit' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white transition-colors">Cancel</button>
        <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
          Add Transaction
        </button>
      </div>
    </motion.div>
  );
}

export function Register() {
  const { state, hasData, updateTransactionStatus, deleteTransaction, updateTransaction, addTransaction } = useFinance();
  const [search, setSearch] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  if (!hasData) {
    return <EmptyState icon="📋" title="No Transactions Yet" description="Link your accounts to populate the transaction register automatically." showSyncAction />;
  }

  const filtered = useMemo(() => {
    return state.transactions
      .filter(t => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.merchant.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (filterType !== 'all' && t.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (sortKey === 'amount') cmp = a.amount - b.amount;
        else if (sortKey === 'merchant') cmp = a.merchant.localeCompare(b.merchant);
        else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
        else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [state.transactions, search, filterAccount, filterCategory, filterStatus, filterType, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const cycleStatus = (id: string, current: TransactionStatus) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    updateTransactionStatus(id, next);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const selectAll = () => {
    selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(t => t.id)));
  };

  const deleteSelected = () => {
    selected.forEach(id => deleteTransaction(id));
    setSelected(new Set());
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={12} className="text-white/15" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-violet-400" /> : <ChevronDown size={12} className="text-violet-400" />;
  };

  const pendingCount = filtered.filter(t => t.status === 'pending').length;
  const totalIncome = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Transaction Register</h1>
          <p className="text-white/40 text-sm mt-0.5">{filtered.length} transactions · {pendingCount > 0 && <span className="text-yellow-400">{pendingCount} pending</span>}</p>
        </div>
      </motion.div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Income', value: totalIncome, color: 'text-emerald-400' },
          { label: 'Total Expenses', value: totalExpense, color: 'text-red-400' },
          { label: 'Net', value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? 'text-emerald-400' : 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="glass-card py-3 px-4">
            <p className="text-white/40 text-xs mb-0.5">{item.label}</p>
            <p className={`text-lg font-black font-mono ${item.color}`}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              placeholder="Search payee or merchant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X size={14} /></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${showFilters ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
            <Filter size={15} /> Filters
          </button>
          {selected.size > 0 && (
            <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={deleteSelected}
              className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-2 hover:bg-red-500/25 transition-colors">
              <Trash2 size={15} /> Delete ({selected.size})
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white/3 rounded-xl border border-white/8">
              {[
                { label: 'Account', value: filterAccount, onChange: setFilterAccount, options: [['all', 'All Accounts'], ...state.accounts.map(a => [a.id, a.name])] },
                { label: 'Category', value: filterCategory, onChange: setFilterCategory, options: [['all', 'All Categories'], ...ALL_CATEGORIES.map(c => [c, c])] },
                { label: 'Status', value: filterStatus, onChange: setFilterStatus, options: [['all', 'All Statuses'], ['pending', 'Pending'], ['cleared', 'Cleared'], ['reconciled', 'Reconciled']] },
                { label: 'Type', value: filterType, onChange: setFilterType, options: [['all', 'All Types'], ['debit', 'Expense'], ['credit', 'Income']] },
              ].map(({ label, value, onChange, options }) => (
                <div key={label}>
                  <p className="text-white/30 text-xs mb-1">{label}</p>
                  <select value={value} onChange={e => onChange(e.target.value)}
                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-violet-500/40">
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add */}
      <AddTransactionRow onAdd={addTransaction} accounts={state.accounts} />

      {/* Register Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[24px_1fr_120px_120px_100px_90px_40px] gap-0 bg-white/4 border-b border-white/8 px-4 py-2.5 text-xs font-semibold text-white/35 uppercase tracking-wider">
          <div>
            <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={selectAll}
              className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
          </div>
          {([['date', 'Date'], ['merchant', 'Payee'], ['category', 'Category'], ['amount', 'Amount'], ['status', 'Status']] as [SortKey, string][]).map(([k, label]) => (
            <button key={k} onClick={() => toggleSort(k)} className={`flex items-center gap-1 hover:text-white/70 transition-colors text-left ${k === 'amount' ? 'justify-end' : ''}`}>
              {label} <SortIcon k={k} />
            </button>
          ))}
          <div />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">No transactions match your filters.</div>
          ) : (
            filtered.map((txn, i) => {
              const account = state.accounts.find(a => a.id === txn.accountId);
              const catIcon = CATEGORY_ICONS[txn.category] ?? '📦';
              const catColor = CATEGORY_COLORS[txn.category] ?? '#94A3B8';
              const isSelected = selected.has(txn.id);

              return (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={`grid grid-cols-[24px_1fr_120px_120px_100px_90px_40px] gap-0 px-4 py-3 text-sm items-center hover:bg-white/3 transition-colors group ${isSelected ? 'bg-violet-500/8' : ''}`}
                >
                  <div>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(txn.id)}
                      className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
                  </div>

                  {/* Date + Payee */}
                  <div className="min-w-0 pr-3">
                    <p className="text-white font-medium truncate">{txn.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/30 text-xs">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      {account && <span className="text-white/25 text-xs truncate">{account.icon} {account.name}</span>}
                      {txn.isRecurring && <span className="text-violet-400/60 text-xs">↻</span>}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: catColor }}>
                      <span>{catIcon}</span>
                      <span className="truncate">{txn.category}</span>
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <span className={`font-mono font-bold text-sm ${txn.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                      {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={txn.status} onClick={() => cycleStatus(txn.id, txn.status)} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingTxn(txn)}
                      className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteTransaction(txn.id)}
                      className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/8 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Drawer */}
      <AnimatePresence>
        {editingTxn && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingTxn(null)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            <EditDrawer txn={editingTxn} onClose={() => setEditingTxn(null)} onSave={updateTransaction} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
