import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Bell } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { AlertSeverity } from '../types/finance';
import { EmptyState } from '../components/shared/EmptyState';

const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: React.ComponentType<{ size?: number }>;
  bg: string;
  border: string;
  iconColor: string;
  label: string;
}> = {
  critical: {
    icon: AlertTriangle,
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    iconColor: '#EF4444',
    label: 'Critical',
  },
  warning: {
    icon: AlertCircle,
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    iconColor: '#F59E0B',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    iconColor: '#3B82F6',
    label: 'Info',
  },
};

export function Alerts() {
  const { alerts, hasData, categoryBudgetStatus, thisMonthSpent, thisMonthIncome } = useFinance();

  if (!hasData) {
    return (
      <EmptyState 
        icon="🔔" 
        title="All Quiet Here" 
        description="We'll notify you here if you go over budget, have unusual spending, or large bills due." 
        showSyncAction 
      />
    );
  }

  const criticals = alerts.filter(a => a.severity === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning');
  const infos = alerts.filter(a => a.severity === 'info');

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const projectedSpend = Math.round((thisMonthSpent / dayOfMonth) * daysInMonth);
  const projectedSaving = thisMonthIncome - projectedSpend;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-white text-2xl font-bold">Proactive Alerts</h1>
        <p className="text-white/40 text-sm mt-1">We're watching your finances so you don't have to</p>
      </motion.div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {[
          { count: criticals.length, label: 'Critical', color: '#EF4444', Icon: AlertTriangle },
          { count: warnings.length,  label: 'Warnings', color: '#F59E0B', Icon: AlertCircle },
          { count: infos.length,     label: 'Info',     color: '#3B82F6', Icon: Info },
        ].map(({ count, label, color, Icon }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card"
          >
            <Icon size={15} style={{ color }} />
            <span className="text-white font-bold">{count}</span>
            <span className="text-white/40 text-sm">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* End of month projection banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(59,130,246,0.1))',
          border: '1px solid rgba(108,99,255,0.3)',
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: '#6C63FF' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Bell size={18} className="text-violet-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Month-End Projection</p>
              <p className="text-white/50 text-sm">Based on your spending pace (Day {dayOfMonth} of {daysInMonth})</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-white/40 text-xs">Projected Spend</p>
              <p className="text-white font-bold text-lg">₹{projectedSpend.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Projected Savings</p>
              <p className={`font-bold text-lg ${projectedSaving >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {projectedSaving < 0 ? '−' : ''}₹{Math.abs(projectedSaving).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alert cards */}
      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const config = SEVERITY_CONFIG[alert.severity];
          const Icon = config.icon;
          const isAllGood = alert.id === 'alert-all-good';

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-5 flex gap-4 items-start"
              style={{ background: config.bg, border: `1px solid ${config.border}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: `${config.iconColor}20` }}
              >
                {alert.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm">{alert.title}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${config.iconColor}20`, color: config.iconColor }}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="text-white/60 text-sm">{alert.message}</p>
              </div>
              {!isAllGood && (
                <span style={{ color: config.iconColor }} className="flex-shrink-0 mt-0.5">
                  <Icon size={18} />
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Budget status table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <h2 className="text-white font-semibold mb-4">Budget Status at a Glance</h2>
        <div className="space-y-3">
          {categoryBudgetStatus.map(({ budget, spent, pct, health }) => (
            <div key={budget.category} className="flex items-center gap-3">
              <span className="text-sm w-32 text-white/60 truncate">{budget.category}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: health === 'critical' ? '#EF4444' :
                                health === 'warning'  ? '#F59E0B' : '#10B981',
                  }}
                />
              </div>
              <span className="text-white/50 text-xs w-10 text-right">{pct.toFixed(0)}%</span>
              <span className="text-white text-xs font-medium w-20 text-right">
                ₹{spent.toLocaleString('en-IN')} / ₹{budget.limit.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
