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

  // Primary 4 tabs for bottom navigation bar + More
  const primaryTabs: PageId[] = ['dashboard', 'expenses', 'budget', 'ask'];
  const isMoreActive = !primaryTabs.includes(activePage);

  return (
    <>
      {/* Top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-xl border-b border-white/8 px-4 h-14 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-white font-bold text-base tracking-tight">SmartSpend</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium">
            <Icon size={13} className="text-violet-400" />
            <span className="max-w-[90px] truncate">{activeItem.label}</span>
          </div>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Bottom tab bar (mobile 5-tab bar with Safe Area) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-2xl border-t border-white/8 px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.35rem)] flex items-center justify-around shadow-2xl"
      >
        {items
          .filter(i => primaryTabs.includes(i.id))
          .map(item => {
            const isActive = activePage === item.id;
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all text-[11px] font-semibold active:scale-95',
                  isActive
                    ? 'text-violet-400 bg-violet-600/15'
                    : 'text-white/40 hover:text-white/70'
                )}
              >
                <ItemIcon size={19} className={isActive ? 'text-violet-400' : 'text-white/40'} />
                <span className="truncate max-w-[64px]">{item.label}</span>
              </button>
            );
          })}

        {/* 5th Tab: More (opens drawer for Insights, Parent View, Profile) */}
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all text-[11px] font-semibold active:scale-95 relative',
            isMoreActive
              ? 'text-violet-400 bg-violet-600/15'
              : 'text-white/40 hover:text-white/70'
          )}
        >
          <div className="relative">
            <Menu size={19} className={isMoreActive ? 'text-violet-400' : 'text-white/40'} />
            {isMoreActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400 ring-2 ring-navy-900" />
            )}
          </div>
          <span className="truncate max-w-[64px]">{isMoreActive ? activeItem.label : 'More'}</span>
        </button>
      </nav>

      {/* Slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-navy-900/98 backdrop-blur-2xl border-r border-white/10 z-50 p-5 flex flex-col shadow-2xl lg:hidden overflow-y-auto"
            >
              <SidebarContent
                activePage={activePage}
                onNavigate={onNavigate}
                onClose={() => setOpen(false)}
                items={items}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
