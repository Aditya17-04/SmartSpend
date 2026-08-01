import { motion } from 'framer-motion';
import type { Transaction } from '../../types/finance';
import { formatCurrency, getDaysSince, getCategoryColor, getCategoryIcon } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface TransactionRowProps {
  transaction: Transaction;
  index?: number;
}

export function TransactionRow({ transaction, index = 0 }: TransactionRowProps) {
  const isCredit = transaction.type === 'credit';
  const color = getCategoryColor(transaction.category);
  const icon = getCategoryIcon(transaction.category);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/5 transition-colors duration-200 group"
    >
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
      >
        {icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{transaction.title}</p>
        <p className="text-white/40 text-xs truncate">{transaction.merchant} · {getDaysSince(transaction.date)}</p>
      </div>

      {/* Category badge */}
      <span
        className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
        style={{ background: `${color}20`, color }}
      >
        {transaction.category}
      </span>

      {/* Amount */}
      <div className={cn(
        'text-sm font-bold flex-shrink-0',
        isCredit ? 'text-emerald-400' : 'text-white'
      )}>
        {isCredit ? '+' : '−'}{formatCurrency(transaction.amount)}
      </div>
    </motion.div>
  );
}
