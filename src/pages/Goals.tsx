import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import type { SavingsGoal } from '../types/finance';
import { EmptyState } from '../components/shared/EmptyState';

function GoalCard({ goal, index }: { goal: SavingsGoal; index: number }) {
  const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const targetDate = new Date(goal.targetDate);
  const monthsLeft = Math.max(0,
    (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
    (targetDate.getMonth() - new Date().getMonth())
  );
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;

  const radialData = [{ value: pct, fill: goal.color }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="glass-card relative overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-15"
        style={{ background: goal.color }}
      />

      <div className="relative flex items-start gap-4">
        {/* Radial progress */}
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="65%"
              outerRadius="100%"
              data={radialData}
              startAngle={220}
              endAngle={-40}
            >
              <RadialBar
                background={{ fill: 'rgba(255,255,255,0.05)' }}
                dataKey="value"
                cornerRadius={6}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl leading-none">{goal.emoji}</span>
            <span className="text-white text-xs font-bold mt-0.5">{pct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg mb-0.5">{goal.title}</h3>
          <p className="text-white/40 text-sm mb-3">
            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
          </p>

          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: index * 0.1 + 0.3, duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${goal.color}99, ${goal.color})` }}
            />
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1 text-white/40">
              <Calendar size={11} />
              <span>Target: {targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            </div>
            {monthsLeft > 0 && (
              <div className="text-white/40">
                <span className="font-medium" style={{ color: goal.color }}>₹{Math.round(monthlyNeeded).toLocaleString('en-IN')}/mo</span>
                <span> needed</span>
              </div>
            )}
          </div>

          {remaining <= 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${goal.color}25`, color: goal.color }}>
              🎉 Goal achieved!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AddGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addGoal } = useFinance();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState('🎯');

  const EMOJIS = ['🎯','🏖️','💻','🚗','🏠','📱','🎓','💍','✈️','🛡️'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colors = ['#6C63FF','#10B981','#F59E0B','#EC4899','#3B82F6','#F97316'];
    addGoal({
      id: `goal-${Date.now()}`,
      title,
      targetAmount: parseFloat(target),
      currentAmount: parseFloat(current || '0'),
      emoji,
      targetDate: date,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    setTitle(''); setTarget(''); setCurrent(''); setDate(''); setEmoji('🎯');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">New Savings Goal</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Emoji picker */}
            <div>
              <p className="text-white/50 text-xs mb-2 font-medium uppercase tracking-wider">Pick an emoji</p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                      emoji === e ? 'bg-violet-600/40 ring-2 ring-violet-500/60' : 'bg-white/5 hover:bg-white/10'
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Goal name (e.g. Emergency Fund)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
              required
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹</span>
              <input
                type="number"
                placeholder="Target amount"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
                required min="1"
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹</span>
              <input
                type="number"
                placeholder="Amount already saved (optional)"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 focus:outline-none focus:border-violet-500/50 transition-all"
              required
            />
            <button type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25">
              <Plus size={18} /> Create Goal
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
}

export function Goals() {
  const { state, hasData } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);

  if (!hasData) {
    return (
      <EmptyState 
        icon="🎯" 
        title="No Savings Goals" 
        description="Link your accounts first so we can track your progress towards your goals." 
        showSyncAction 
      />
    );
  }

  const totalSaved = state.goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-white text-2xl font-bold">Savings Goals</h1>
          <p className="text-white/40 text-sm mt-1">Work towards what matters most to you</p>
        </div>
        <motion.button
          onClick={() => setModalOpen(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> New Goal
        </motion.button>
      </motion.div>

      {/* Overall progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-white/40 text-sm">Total Progress Across All Goals</p>
            <p className="text-white text-2xl font-black mt-1">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-sm">Combined Target</p>
            <p className="text-white text-xl font-bold mt-1">{formatCurrency(totalTarget)}</p>
          </div>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #6C63FF, #3B82F6, #10B981)' }}
          />
        </div>
        <p className="text-white/30 text-xs mt-2 text-right">
          {((totalSaved / totalTarget) * 100).toFixed(0)}% of total target saved
        </p>
      </motion.div>

      {/* Goal cards */}
      <div className="space-y-4">
        {state.goals.map((goal, i) => (
          <GoalCard key={goal.id} goal={goal} index={i} />
        ))}
      </div>

      {state.goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card text-center py-12"
        >
          <span className="text-5xl mb-4 block">🎯</span>
          <p className="text-white/50 text-sm">No goals yet. Create one to get started!</p>
          <button onClick={() => setModalOpen(true)}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Create My First Goal
          </button>
        </motion.div>
      )}

      <AddGoalModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
