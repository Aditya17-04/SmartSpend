import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Download, Trash2, Shield, Palette, ChevronRight, Check, LogOut, Plus, Edit2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import type { Category } from '../types/finance';

const SECTIONS = ['Profile', 'Notifications', 'Categories', 'Data & Privacy'] as const;
type Section = typeof SECTIONS[number];

const DEFAULT_CATEGORIES: Category[] = [
  'Food & Dining','Groceries','Transport','Shopping','Entertainment',
  'Bills & Utilities','Health','Travel','Education','Rent',
  'Investment','Insurance','Freelance','Salary','Other',
];

export function Settings() {
  const { user, logout } = useAuth();
  const { state, resetData } = useFinance();
  const [activeSection, setActiveSection] = useState<Section>('Profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Status', 'Account'];
    const rows = state.transactions.map(t => {
      const account = state.accounts.find(a => a.id === t.accountId);
      return [t.date.split('T')[0], t.merchant, t.category, t.amount, t.type, t.status, account?.name ?? ''].join(',');
    });
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'Wellsy_AllTransactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteData = () => {
    if (window.confirm('Are you sure you want to delete all your financial data? This cannot be undone.')) {
      resetData();
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-white text-2xl font-bold">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your profile, categories, and data</p>
      </motion.div>

      <div className="flex gap-5">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === s ? 'bg-violet-600/20 text-white border border-violet-500/25' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                {s === 'Profile' && <User size={15} />}
                {s === 'Notifications' && <Bell size={15} />}
                {s === 'Categories' && <Palette size={15} />}
                {s === 'Data & Privacy' && <Shield size={15} />}
                {s}
                {activeSection === s && <ChevronRight size={14} className="ml-auto text-violet-400" />}
              </button>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/10">
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/8 transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* Profile */}
            {activeSection === 'Profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                className="glass-card space-y-5">
                <h2 className="text-white font-bold text-lg border-b border-white/8 pb-4">Your Profile</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-violet-500/25">
                    {user?.avatar ?? 'W'}
                  </div>
                  <div>
                    <p className="text-white font-bold">{user?.name}</p>
                    <p className="text-white/40 text-sm">{user?.email}</p>
                    <p className="text-violet-400 text-xs mt-0.5">Pro Member</p>
                  </div>
                </div>

                {/* Form */}
                {[
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                  { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={profileForm[key as keyof typeof profileForm]}
                      onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    {user?.twoFactorEnabled && (
                      <><Shield size={14} className="text-emerald-400" /><span>2FA Enabled</span></>
                    )}
                  </div>
                  <button onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20">
                    {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {activeSection === 'Notifications' && (
              <motion.div key="notif" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                className="glass-card space-y-4">
                <h2 className="text-white font-bold text-lg border-b border-white/8 pb-4">Notification Preferences</h2>
                {[
                  { label: 'Budget Alerts', desc: 'Get notified when you reach 80% of a budget', defaultOn: true },
                  { label: 'Recurring Due Soon', desc: 'Remind me 3 days before a bill is due', defaultOn: true },
                  { label: 'Large Transactions', desc: 'Alert for any transaction over ₹5,000', defaultOn: false },
                  { label: 'Monthly Report', desc: 'Send a summary at the end of each month', defaultOn: true },
                  { label: 'Unusual Spending', desc: 'Alert when spending is significantly higher than usual', defaultOn: true },
                ].map(({ label, desc, defaultOn }) => {
                  const [on, setOn] = useState(defaultOn);
                  return (
                    <div key={label} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-white text-sm font-medium">{label}</p>
                        <p className="text-white/35 text-xs mt-0.5">{desc}</p>
                      </div>
                      <button onClick={() => setOn(v => !v)}
                        className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${on ? 'bg-violet-600' : 'bg-white/10'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${on ? 'left-5.5' : 'left-0.5'}`} style={{ left: on ? 'calc(100% - 22px)' : '2px' }} />
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Categories */}
            {activeSection === 'Categories' && (
              <motion.div key="cats" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                className="glass-card">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
                  <h2 className="text-white font-bold text-lg">Spending Categories</h2>
                  <p className="text-white/30 text-xs">{DEFAULT_CATEGORIES.length} categories</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_CATEGORIES.map(cat => {
                    const icon = CATEGORY_ICONS[cat] ?? '📦';
                    const color = CATEGORY_COLORS[cat] ?? '#94A3B8';
                    return (
                      <div key={cat} className="flex items-center gap-3 p-3 rounded-xl border border-white/8 hover:border-white/15 transition-colors group">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${color}20` }}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{cat}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Data & Privacy */}
            {activeSection === 'Data & Privacy' && (
              <motion.div key="data" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                className="glass-card space-y-5">
                <h2 className="text-white font-bold text-lg border-b border-white/8 pb-4">Data & Privacy</h2>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/4 border border-white/8 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium text-sm">Export All Data</p>
                      <p className="text-white/40 text-xs mt-0.5">Download all your transactions as a CSV file</p>
                    </div>
                    <button onClick={handleExportCSV}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-colors flex-shrink-0">
                      <Download size={14} /> Export CSV
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-white/4 border border-white/8 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium text-sm">Linked Accounts</p>
                      <p className="text-white/40 text-xs mt-0.5">{state.accounts.length} accounts connected</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {state.accounts.map(a => (
                        <div key={a.id} className="flex items-center gap-2 text-xs text-white/50">
                          <span>{a.icon}</span>
                          <span>{a.name}</span>
                          <span className="text-white/25">{a.accountNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/20 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-red-400 font-medium text-sm">Delete All Data</p>
                      <p className="text-white/40 text-xs mt-0.5">Permanently removes all transactions, accounts, and settings. This cannot be undone.</p>
                    </div>
                    <button onClick={handleDeleteData}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors flex-shrink-0">
                      <Trash2 size={14} /> Delete Data
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/3 border border-white/8 text-xs text-white/30 space-y-1">
                  <p>🔒 All data is stored locally on your device using encrypted localStorage.</p>
                  <p>🚫 We never sell or share your financial data with third parties.</p>
                  <p>📖 You can request deletion of your account at any time.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
