import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number; // % change vs last month, positive = good
  trendLabel?: string;
  icon: string;
  color: string; // Tailwind gradient classes
  delay?: number;
  isCurrency?: boolean;
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  color,
  delay = 0,
  isCurrency = true,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(Math.abs(value), 1400);

  const trendPositive = trend !== undefined && trend > 0;
  const trendNeutral = trend === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card group hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg"
          style={{ background: color, boxShadow: `0 8px 24px ${color}40` }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              trendPositive ? 'bg-emerald-500/15 text-emerald-400' :
              trendNeutral   ? 'bg-white/10 text-white/50' :
                               'bg-red-500/15 text-red-400'
            )}
          >
            {trendNeutral ? (
              <Minus size={11} />
            ) : trendPositive ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>

      <p className="text-white/50 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-bold tracking-tight">
        {value < 0 ? '−' : ''}
        {isCurrency ? (
          <>
            <span className="text-base font-semibold text-white/70">₹</span>
            {animatedValue.toLocaleString('en-IN')}
          </>
        ) : (
          animatedValue
        )}
      </p>
      {trendLabel && (
        <p className="text-white/30 text-xs mt-1">{trendLabel}</p>
      )}
    </motion.div>
  );
}
