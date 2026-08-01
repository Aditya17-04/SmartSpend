import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { EmptyState } from '../components/shared/EmptyState';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141F38] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export function Trends() {
  const { state, hasData } = useFinance();

  if (!hasData) {
    return (
      <EmptyState 
        icon="📈" 
        title="No Trends Available" 
        description="Trends take a month of data to build. Link your accounts to start building your history." 
        showSyncAction 
      />
    );
  }

  const history = state.history;

  const netWorthData = history.map((m, i) => ({
    ...m,
    netWorth: history.slice(0, i + 1).reduce((s, h) => s + h.saved, 100000),
  }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-white text-2xl font-bold">Trends & History</h1>
        <p className="text-white/40 text-sm mt-1">Your financial journey over the last 6 months</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg Monthly Income',  value: history.reduce((s,h) => s+h.income,0)/history.length,  color: '#10B981' },
          { label: 'Avg Monthly Spend',   value: history.reduce((s,h) => s+h.spent,0)/history.length,   color: '#F97316' },
          { label: 'Avg Monthly Savings', value: history.reduce((s,h) => s+h.saved,0)/history.length,   color: '#6C63FF' },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card text-center"
          >
            <p className="text-white/40 text-xs mb-1">{label}</p>
            <p className="text-xl font-black" style={{ color }}>{formatCurrency(value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Income vs Spent area chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card"
      >
        <h2 className="text-white font-semibold mb-1">Income vs Spending</h2>
        <p className="text-white/40 text-sm mb-5">Monthly cash flow over 6 months</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, paddingTop: 8 }} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="spent"  name="Spent"  stroke="#F97316" strokeWidth={2.5} fill="url(#spentGrad)"  dot={{ fill: '#F97316', r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Savings trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <h2 className="text-white font-semibold mb-1">Monthly Savings</h2>
          <p className="text-white/40 text-sm mb-5">How much you saved each month</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6C63FF" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="saved"
                name="Saved"
                stroke="url(#savingsGrad)"
                strokeWidth={3}
                dot={{ fill: '#6C63FF', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#6C63FF', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly comparison bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card"
        >
          <h2 className="text-white font-semibold mb-1">Monthly Breakdown</h2>
          <p className="text-white/40 text-sm mb-5">Income · Spent · Saved</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={history} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4,4,0,0]} />
              <Bar dataKey="spent"  name="Spent"  fill="#F97316" radius={[4,4,0,0]} />
              <Bar dataKey="saved"  name="Saved"  fill="#6C63FF" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Net worth tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <h2 className="text-white font-semibold mb-1">Savings Growth</h2>
        <p className="text-white/40 text-sm mb-5">Cumulative savings built over 6 months</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={netWorthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="netWorth" name="Savings" stroke="#6C63FF" strokeWidth={3} fill="url(#nwGrad)" dot={{ fill: '#6C63FF', r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
