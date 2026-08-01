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

export function EmptyState({ icon, title, description, actionLabel, onAction, showSyncAction }: EmptyStateProps) {
  const { syncData } = useFinance();
  
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
      
      <div className="flex gap-4">
        {actionLabel && onAction && (
          <button 
            onClick={onAction}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> {actionLabel}
          </button>
        )}
        
        {showSyncAction && (
          <button 
            onClick={() => syncData()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25 flex items-center gap-2"
          >
            Connect Accounts <ArrowRight size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
