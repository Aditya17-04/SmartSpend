import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, CreditCard, Bell, Lightbulb,
  Target, TrendingUp, Wallet, Menu, X, ChevronRight, FileText,
  LogOut, RefreshCw, Settings, ChevronLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

export type PageId =
  | 'dashboard'
  | 'register'
  | 'accounts'
  | 'budgets'
  | 'recurring'
  | 'alerts'
  | 'insights'
  | 'trends'
  | 'goals'
  | 'reports'
  | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard, group: 'Overview' },
  { id: 'register',   label: 'Register',     icon: ClipboardList,   group: 'Overview' },
  { id: 'accounts',   label: 'Accounts',     icon: CreditCard,      group: 'Overview' },
  { id: 'budgets',    label: 'Budgets',      icon: Wallet,          group: 'Planning' },
  { id: 'recurring',  label: 'Recurring',    icon: RefreshCw,       group: 'Planning' },
  { id: 'goals',      label: 'Goals',        icon: Target,          group: 'Planning' },
  { id: 'alerts',     label: 'Alerts',       icon: Bell,            group: 'Analysis' },
  { id: 'insights',   label: 'AI Insights',  icon: Lightbulb,       group: 'Analysis' },
  { id: 'trends',     label: 'Trends',       icon: TrendingUp,      group: 'Analysis' },
  { id: 'reports',    label: 'Reports',      icon: FileText,        group: 'Analysis' },
  { id: 'settings',   label: 'Settings',     icon: Settings,        group: 'Account' },
];

const GROUPS = ['Overview', 'Planning', 'Analysis', 'Account'] as const;

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { alerts } = useFinance();
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const badgeCount = criticalCount + warningCount;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col min-h-screen bg-navy-900 border-r border-white/5 py-5 fixed left-0 top-0 z-40 transition-all duration-300',
        collapsed ? 'w-16 px-2' : 'w-56 px-3'
      )}>
        <SidebarContent
          activePage={activePage}
          onNavigate={onNavigate}
          badgeCount={badgeCount}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
        />
      </aside>

      {/* Main content offset */}
      <div className={cn('hidden lg:block transition-all duration-300', collapsed ? 'w-16' : 'w-56')} />

      {/* Mobile top bar */}
      <MobileNav activePage={activePage} onNavigate={onNavigate} badgeCount={badgeCount} />
    </>
  );
}

function SidebarContent({
  activePage, onNavigate, badgeCount, onClose, collapsed, onToggleCollapse,
}: {
  activePage: PageId;
  onNavigate: (p: PageId) => void;
  badgeCount: number;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 mb-5 px-1', collapsed ? 'justify-center' : '')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
          <span className="text-base">💜</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-lg tracking-tight leading-none">Wellsy</p>
            <p className="text-white/35 text-xs">Money Manager</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white/80 lg:hidden">
            <X size={20} />
          </button>
        )}
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className={cn('text-white/25 hover:text-white/60 p-1 rounded-lg hover:bg-white/5 transition-colors', collapsed ? 'mx-auto' : 'ml-auto')}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {GROUPS.map(group => {
          const items = navItems.filter(n => n.group === group);
          return (
            <div key={group} className="mb-2">
              {!collapsed && (
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest px-2 mb-1">{group}</p>
              )}
              {items.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;
                const isAlerts = item.id === 'alerts';

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onClose?.(); }}
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.98 }}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left group',
                      collapsed ? 'justify-center px-2' : 'px-3',
                      isActive
                        ? 'bg-gradient-to-r from-violet-600/30 to-blue-600/15 text-white border border-violet-500/25'
                        : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                    )}
                  >
                    {isActive && !collapsed && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-full"
                      />
                    )}
                    <div className="relative flex-shrink-0">
                      <Icon size={16} className={cn(isActive ? 'text-violet-400' : 'text-white/35 group-hover:text-white/60')} />
                      {isAlerts && badgeCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                          {badgeCount}
                        </span>
                      )}
                    </div>
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && isActive && <ChevronRight size={12} className="text-violet-400/50" />}
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className={cn('mt-3 pt-3 border-t border-white/8 flex items-center gap-2.5', collapsed ? 'justify-center flex-col' : '')}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.avatar ?? 'W'}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name ?? 'User'}</p>
              <p className="text-white/30 text-[10px] truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-400/8 rounded-lg transition-colors" title="Sign Out">
              <LogOut size={14} />
            </button>
          </>
        )}
        {collapsed && (
          <button onClick={logout} className="p-1 text-white/20 hover:text-red-400 transition-colors" title="Sign Out">
            <LogOut size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function MobileNav({ activePage, onNavigate, badgeCount }: { activePage: PageId; onNavigate: (p: PageId) => void; badgeCount: number }) {
  const [open, setOpen] = useState(false);
  const active = navItems.find(n => n.id === activePage);
  const Icon = active?.icon ?? LayoutDashboard;

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy-900 border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-sm">💜</span>
          </div>
          <span className="text-white font-bold text-base">Wellsy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-white/50 text-sm">
            <Icon size={15} className="text-violet-400" />
            <span>{active?.label}</span>
          </div>
          <button onClick={() => setOpen(true)} className="p-1.5 text-white/50 hover:text-white ml-2">
            <Menu size={20} />
          </button>
        </div>
      </div>
      <div className="h-14 lg:hidden" />

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 bg-black/60 z-50 lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-navy-900 border-r border-white/5 z-50 p-4 lg:hidden">
              <SidebarContent activePage={activePage} onNavigate={onNavigate} badgeCount={badgeCount} onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
