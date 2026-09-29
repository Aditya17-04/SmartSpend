import { motion } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  showSyncAction?: boolean;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card flex flex-col items-center justify-center p-12 text-center min-h-[400px]"
    >
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-black/20">
        {icon}
      </div>
      <h2 className="text-white text-2xl font-bold mb-3">{title}</h2>
      <p className="text-white/40 max-w-sm mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Plus size={18} /> {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
