import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction, Category } from '../../types/finance';
import { CATEGORY_ICONS } from '../../lib/utils';

const EXPENSE_CATEGORIES: Category[] = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Health', 'Travel', 'Education', 'Other',
];
const INCOME_CATEGORIES: Category[] = ['Salary', 'Freelance', 'Investment', 'Other'];

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ open, onClose }: AddTransactionModalProps) {
  const { state, addTransaction } = useFinance();
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [title, setTitle] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food & Dining');
  const [accountId, setAccountId] = useState(state.accounts[0].id);

  const categories = type === 'debit' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const t: Transaction = {
      id: `t-${Date.now()}`,
      accountId,
      title,
      merchant: merchant || title,
      category,
      amount: parseFloat(amount),
      type,
      date: new Date().toISOString(),
      status: 'cleared',
    };
    addTransaction(t);
    // Reset
    setTitle(''); setMerchant(''); setAmount('');
    setType('debit'); setCategory('Food & Dining');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="glass-card w-full max-w-md relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white text-lg font-bold">Add Transaction</h2>
                  <p className="text-white/40 text-sm">Record a new transaction</p>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type toggle */}
                <div className="flex rounded-xl bg-white/5 p-1 gap-1">
                  {(['debit', 'credit'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setType(t); setCategory(t === 'debit' ? 'Food & Dining' : 'Salary'); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        type === t
                          ? t === 'debit'
                            ? 'bg-red-500/30 text-red-300 shadow'
                            : 'bg-emerald-500/30 text-emerald-300 shadow'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {t === 'debit' ? '− Expense' : '+ Income'}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-xl font-bold placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    required
                    min="1"
                    step="0.01"
                  />
                </div>

                {/* Title */}
                <input
                  type="text"
                  placeholder="Transaction title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  required
                />

                {/* Merchant */}
                <input
                  type="text"
                  placeholder="Merchant / source (optional)"
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />

                {/* Category */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium uppercase tracking-wider">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          category === cat
                            ? 'bg-violet-600/40 text-violet-300 border border-violet-500/40'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-transparent'
                        }`}
                      >
                        <span>{CATEGORY_ICONS[cat]}</span>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium uppercase tracking-wider">Account</p>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 transition-all"
                  >
                    {state.accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-[#0A0F1E]">
                        {acc.icon} {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25 mt-2"
                >
                  <Plus size={18} />
                  Add Transaction
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
