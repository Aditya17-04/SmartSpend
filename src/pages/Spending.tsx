import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { EmptyState } from '../components/shared/EmptyState';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function Spending() {
  const { categorySpends, thisMonthSpent, state, hasData } = useFinance();

  if (!hasData) {
    return (
      <EmptyState 
        icon="🛍️" 
        title="No Spending Data" 
        description="We need some transaction history to build your spending charts." 
        showSyncAction 
      />
    );
  }

  const barData = categorySpends.map(cs => ({
    name: cs.icon + ' ' + cs.category.split(' ')[0],
    'This Month': cs.amount,
    'Last Month': cs.prevAmount,
    fill: cs.color,
  }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-white text-2xl font-bold">Spending Breakdown</h1>
        <p className="text-white/40 text-sm mt-1">How your money is being spent this month</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <h2 className="text-white font-semibold mb-1">Category Share</h2>
          <p className="text-white/40 text-sm mb-4">Total: {formatCurrency(thisMonthSpent)}</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categorySpends}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="amount"
                nameKey="category"
                strokeWidth={0}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  if (percent < 0.06) return null;
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
                      {(percent * 100).toFixed(0)}%
                    </text>
                  );
                }}
              >
                {categorySpends.map((cs, i) => (
                  <Cell key={i} fill={cs.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), '']}
                contentStyle={{ background: '#141F38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar chart: this vs last month */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card"
        >
          <h2 className="text-white font-semibold mb-1">Month-over-Month</h2>
          <p className="text-white/40 text-sm mb-4">This month vs last month by category</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), '']}
                contentStyle={{ background: '#141F38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <Bar dataKey="This Month" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Last Month" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Category detail rows */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="glass-card"
      >
        <h2 className="text-white font-semibold mb-4">All Categories This Month</h2>
        <div className="space-y-4">
          {categorySpends.map((cs) => {
            const delta = cs.prevAmount > 0
              ? ((cs.amount - cs.prevAmount) / cs.prevAmount) * 100
              : 0;
            const isUp = delta > 5;
            const isDown = delta < -5;

            return (
              <motion.div key={cs.category} variants={item}>
                <div className="flex items-center gap-3 mb-1.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${cs.color}20`, border: `1px solid ${cs.color}30` }}
                  >
                    {cs.icon}
                  </div>
                  <span className="text-white/80 text-sm font-medium flex-1">{cs.category}</span>
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isUp ? 'bg-red-500/15 text-red-400' :
                    isDown ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
                    {Math.abs(delta).toFixed(0)}%
                  </div>
                  <span className="text-white font-bold text-sm">{formatCurrency(cs.amount)}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden ml-12">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((cs.amount / (thisMonthSpent || 1)) * 100 * 2, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${cs.color}cc, ${cs.color})` }}
                  />
                </div>
                <div className="flex justify-between mt-1 ml-12">
                  <span className="text-white/30 text-xs">
                    {cs.prevAmount > 0 ? `Last month: ${formatCurrency(cs.prevAmount)}` : 'No data last month'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
