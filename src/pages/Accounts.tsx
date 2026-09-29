import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionRow } from '../components/shared/TransactionRow';
import { formatCurrency } from '../lib/utils';
import { EmptyState } from '../components/shared/EmptyState';
import type { Account } from '../types/finance';

function AccountCard({ account, isSelected, onClick }: { account: Account; isSelected: boolean; onClick: () => void }) {
  const usedPct = account.limit ? Math.abs(account.balance / account.limit) * 100 : 0;
  const isCredit = (account.type as string) === 'credit';
  const isNegative = account.balance < 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-2xl p-5 transition-all duration-200 relative overflow-hidden ${
        isSelected ? 'ring-2 ring-violet-500/60' : 'hover:ring-1 hover:ring-white/10'
      }`}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${account.color}30, ${account.color}15)`
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isSelected ? account.color + '40' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Glow */}
      {isSelected && (
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30"
          style={{ background: account.color }}
        />
      )}

      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{account.icon}</span>
          <div>
            <p className="text-white font-semibold text-sm">{account.name}</p>
            <p className="text-white/40 text-xs">{account.bankName}</p>
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
          style={{ background: `${account.color}25`, color: account.color }}
        >
          {account.type}
        </span>
      </div>

      <p className="text-white/40 text-xs mb-1">{account.accountNumber}</p>
      <p className={`text-xl font-black ${isNegative ? 'text-red-400' : 'text-white'}`}>
        {isNegative ? '−' : ''}{formatCurrency(account.balance)}
      </p>

      {isCredit && account.limit && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/40">Credit used</span>
            <span className="text-white/60">{usedPct.toFixed(0)}% of {formatCurrency(account.limit)}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${usedPct}%`,
                background: usedPct > 80 ? '#EF4444' : usedPct > 50 ? '#F59E0B' : account.color,
              }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
}

export function Accounts() {
  const { state } = useFinance();
  const [selectedId, setSelectedId] = useState(state.accounts[0].id);

  const selectedAccount = state.accounts.find(a => a.id === selectedId)!;
  const accountTxns = state.transactions
    .filter(t => t.accountId === selectedId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAssets = state.accounts
    .filter(a => a.balance > 0)
    .reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = state.accounts
    .filter(a => a.balance < 0)
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-white text-2xl font-bold">Accounts</h1>
        <p className="text-white/40 text-sm mt-1">All your linked accounts in one place</p>
      </motion.div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card"
        >
          <p className="text-white/40 text-sm mb-1">Total Assets</p>
          <p className="text-emerald-400 text-2xl font-black">{formatCurrency(totalAssets)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <p className="text-white/40 text-sm mb-1">Total Liabilities</p>
          <p className="text-red-400 text-2xl font-black">{formatCurrency(totalLiabilities)}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Account cards list */}
        <div className="lg:col-span-2 space-y-3">
          {state.accounts.map((acc, i) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <AccountCard
                account={acc}
                isSelected={selectedId === acc.id}
                onClick={() => setSelectedId(acc.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Transactions for selected account */}
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 glass-card"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{selectedAccount.icon}</span>
            <div>
              <h2 className="text-white font-semibold">{selectedAccount.name} Transactions</h2>
              <p className="text-white/40 text-xs">{accountTxns.length} transactions</p>
            </div>
          </div>
          <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
            {accountTxns.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No transactions yet</p>
            ) : (
              accountTxns.map((t, i) => (
                <TransactionRow key={t.id} transaction={t} index={i} />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
