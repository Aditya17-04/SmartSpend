import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Receipt, Wallet, Sparkles, Bot, UserCircle, Menu, X, ChevronRight, LogOut, Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

export type PageId = 'dashboard' | 'expenses' | 'budget' | 'insights' | 'ask' | 'profile' | 'parentDashboard';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard',       label: 'Dashboard',      icon: LayoutDashboard, description: 'Overview & net worth' },
  { id: 'expenses',        label: 'Expenses',        icon: Receipt,         description: 'Add, edit & categorize' },
  { id: 'budget',          label: 'Budget',          icon: Wallet,          description: 'Set & monitor budgets' },
  { id: 'insights',        label: 'Insights',        icon: Sparkles,        description: 'AI recommendations' },
  { id: 'ask',             label: 'Ask AI',          icon: Bot,             description: 'Personal financial coach' },
  { id: 'parentDashboard', label: 'Parent View',     icon: Users,           description: "Monitor child's spending" },
  { id: 'profile',         label: 'Profile',         icon: UserCircle,      description: 'Account & preferences' },
];

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const visibleNavItems = navItems;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col min-h-screen bg-navy-900 border-r border-white/5 py-6 fixed left-0 top-0 z-40 transition-all duration-300',
        collapsed ? 'w-16 px-2' : 'w-60 px-4'
      )}>
        <SidebarContent
          activePage={activePage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
          items={visibleNavItems}
        />
      </aside>

      {/* Spacer */}
      <div className={cn('hidden lg:block transition-all duration-300 flex-shrink-0', collapsed ? 'w-16' : 'w-60')} />

      {/* Mobile nav */}
      <MobileNav activePage={activePage} onNavigate={onNavigate} items={visibleNavItems} />
    </>
  );
}

function SidebarContent({
  activePage, onNavigate, onClose, collapsed, onToggleCollapse, items,
}: {
  activePage: PageId;
  onNavigate: (p: PageId) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  items: NavItem[];
}) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 mb-10', collapsed ? 'justify-center' : '')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
          <span className="text-lg">💜</span>
        </div>
        {!collapsed && (
          <div className="flex-1">
            <p className="text-white font-bold text-lg tracking-tight leading-none">SmartSpend</p>
            <p className="text-white/35 text-xs mt-0.5">Money Manager</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
        {onToggleCollapse && !collapsed && (
          <button onClick={onToggleCollapse} className="text-white/20 hover:text-white/60 p-1 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronRight size={14} className="rotate-180" />
          </button>
        )}
        {onToggleCollapse && collapsed && (
          <button onClick={onToggleCollapse} className="text-white/20 hover:text-white/60 p-1 rounded-lg hover:bg-white/5 transition-colors mt-1">
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {items.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose?.(); }}
              whileHover={{ x: collapsed ? 0 : 3 }}
              whileTap={{ scale: 0.97 }}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left group',
                collapsed ? 'justify-center px-2' : 'px-4',
                isActive
                  ? 'bg-gradient-to-r from-violet-600/30 to-blue-600/15 text-white border border-violet-500/25 shadow-sm shadow-violet-500/10'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5'
              )}
            >
              {isActive && !collapsed && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-400 rounded-full"
                />
              )}

              <Icon
                size={18}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-violet-400' : 'text-white/35 group-hover:text-white/60'
                )}
              />

              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className={cn('font-semibold text-sm leading-none', isActive ? 'text-white' : '')}>{item.label}</p>
                  <p className="text-white/25 text-xs mt-0.5 truncate">{item.description}</p>
                </div>
              )}

              {!collapsed && isActive && <ChevronRight size={13} className="text-violet-400/60 flex-shrink-0" />}
            </motion.button>
          );
        })}
      </nav>

      {/* User card */}
      <div className={cn('mt-6 pt-5 border-t border-white/8', collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-3')}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.avatar ?? 'U'}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name ?? 'User'}</p>
              <p className="text-white/30 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-400/8 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </>
        )}
        {collapsed && (
          <button onClick={logout} className="p-1 text-white/20 hover:text-red-400 transition-colors" title="Sign Out">
            <LogOut size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function MobileNav({ activePage, onNavigate, items }: { activePage: PageId; onNavigate: (p: PageId) => void; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const activeItem = items.find(n => n.id === activePage) ?? items[0];
  const Icon = activeItem.icon;

  return (
    <>
      {/* Top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy-900 border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-sm">💜</span>
          </div>
          <span className="text-white font-bold">SmartSpend</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white/50 text-sm">
            <Icon size={14} className="text-violet-400" />
            <span>{activeItem.label}</span>
          </div>
          <button onClick={() => setOpen(true)} className="p-1.5 text-white/50 hover:text-white">
            <Menu size={20} />
          </button>
        </div>
      </div>
      <div className="h-14 lg:hidden" />

      {/* Bottom tab bar (mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900 border-t border-white/5 px-2 py-1 flex items-center justify-around">
        {items.map(item => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-medium',
                isActive ? 'text-violet-400' : 'text-white/35 hover:text-white/60'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Slide-in drawer (for the hamburger) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 bg-black/60 z-50 lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-navy-900 border-r border-white/5 z-50 p-5 lg:hidden">
              <SidebarContent activePage={activePage} onNavigate={onNavigate} onClose={() => setOpen(false)} items={items} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
