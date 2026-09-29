import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface Linkable { id: string; name: string; icon: string; desc: string; }

const BANKS: Linkable[] = [
  { id: 'hdfc',  name: 'HDFC Bank',            icon: '🏦', desc: 'Savings, Salary & FD accounts' },
  { id: 'sbi',   name: 'State Bank of India',   icon: '🏛️', desc: 'India\'s largest public bank' },
  { id: 'icici', name: 'ICICI Bank',             icon: '🔵', desc: 'Personal & business accounts' },
  { id: 'axis',  name: 'Axis Bank',              icon: '🔴', desc: 'Savings & salary accounts' },
  { id: 'kotak', name: 'Kotak Mahindra',         icon: '🟠', desc: '811 & premium accounts' },
  { id: 'pnb',   name: 'Punjab National Bank',   icon: '🟡', desc: 'Government & savings accounts' },
];

const INVESTMENTS: Linkable[] = [
  { id: 'zerodha',  name: 'Zerodha',       icon: '📈', desc: 'Stocks, F&O & Mutual Funds' },
  { id: 'groww',    name: 'Groww',         icon: '🌱', desc: 'Stocks, MF & ETFs' },
  { id: 'upstox',   name: 'Upstox',        icon: '⚡', desc: 'Discount brokerage platform' },
  { id: 'angelone', name: 'Angel One',     icon: '😇', desc: 'Full-service broker & MF' },
  { id: 'icicidirect', name: 'ICICI Direct', icon: '🔵', desc: 'Stocks, MF, bonds & insurance' },
  { id: 'coin',     name: 'Zerodha Coin',  icon: '🪙', desc: 'Direct Mutual Funds at 0% commission' },
];

const CARDS: Linkable[] = [
  { id: 'icici-cc',  name: 'ICICI Credit Card',  icon: '💳', desc: 'Coral, Sapphire, Rubyx' },
  { id: 'hdfc-cc',   name: 'HDFC Credit Card',   icon: '💳', desc: 'Regalia, Millennia, Diners' },
  { id: 'axis-cc',   name: 'Axis Credit Card',   icon: '💳', desc: 'Magnus, Vistara, Neo' },
  { id: 'sbi-cc',    name: 'SBI Credit Card',    icon: '💳', desc: 'SimplySave, Elite, Prime' },
  { id: 'amex',      name: 'American Express',   icon: '💳', desc: 'Platinum, Gold, Green' },
];

const WALLETS: Linkable[] = [
  { id: 'paytm-w',  name: 'Paytm Wallet',   icon: '📱', desc: 'Digital wallet balance' },
  { id: 'amazon',   name: 'Amazon Pay',     icon: '🛒', desc: 'Amazon wallet & rewards' },
  { id: 'mobikwik', name: 'MobiKwik',       icon: '💰', desc: 'Super wallet' },
  { id: 'freecharge',name: 'FreeCharge',    icon: '⚡', desc: 'Snap payments wallet' },
];

const SYNC_STEPS = [
  '🔗 Establishing secure connection...',
  '🏦 Fetching account balances...',
  '📥 Importing transaction history...',
  '🤖 AI categorising expenses...',
  '📊 Building spending insights...',
  '✅ All done!',
];

function SelectGrid({ items, selected, onToggle }: { items: Linkable[]; selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, i) => {
        const isSelected = selected.has(item.id);
        return (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onToggle(item.id)}
            className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
            style={{
              background: isSelected ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)',
              borderColor: isSelected ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <span className="text-2xl w-9 text-center flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.name}</p>
              <p className="text-white/35 text-xs truncate">{item.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-white/20'}`}>
              {isSelected && <Check size={11} className="text-white" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const { syncData } = useFinance();
  const [step, setStep] = useState(0);
  const [banks, setBanks] = useState<Set<string>>(new Set(['hdfc', 'sbi']));
  const [investments, setInvestments] = useState<Set<string>>(new Set(['zerodha']));
  const [cards, setCards] = useState<Set<string>>(new Set(['icici-cc']));
  const [wallets, setWallets] = useState<Set<string>>(new Set());
  const [syncStep, setSyncStep] = useState(0);

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void) => (id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setFn(next);
  };

  const totalLinked = banks.size + investments.size + cards.size + wallets.size;

  // Simulate sync — step 5 is the syncing screen
  useEffect(() => {
    if (step === 5) {
      const interval = setInterval(() => {
        setSyncStep(s => {
          if (s >= SYNC_STEPS.length - 1) {
            clearInterval(interval);
            syncData();
            setTimeout(() => setStep(6), 800);
            return SYNC_STEPS.length - 1;
          }
          return s + 1;
        });
      }, 900);
      return () => clearInterval(interval);
    }
  }, [step, syncData]);

  // Step titles: 0=Welcome, 1=Banks, 2=Investments, 3=Cards, 4=Wallets, 5=Syncing, 6=Ready
  const STEP_TITLES = ['Welcome', 'Banks', 'Investments', 'Cards', 'Wallets', 'Syncing', 'Ready!'];
  const TOTAL_STEPS = 7;

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg">
        {/* Progress bar */}
        {step < 6 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>Step {step + 1} of {TOTAL_STEPS}</span>
              <span>{STEP_TITLES[step]}</span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500"
              />
            </div>
          </div>
        )}

        <div className="glass-card">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-4">
                <div className="text-6xl mb-5">💜</div>
                <h1 className="text-white text-2xl font-black mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Welcome, {user?.name?.split(' ')[0] ?? 'there'}!
                </h1>
                <p className="text-white/50 mb-8 leading-relaxed">
                  Let's set up your Smart Spend dashboard. Track your income, manage expenses, and get clear AI financial guidance automatically.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                  {[
                    { icon: '🔒', text: '256-bit encryption' },
                    { icon: '🚫', text: 'We never store passwords' },
                    { icon: '📖', text: 'Read-only access' },
                    { icon: '🗑️', text: 'Delete data anytime' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2 p-3 rounded-xl bg-white/4 border border-white/8">
                      <span>{icon}</span>
                      <span className="text-white/60 text-sm">{text}</span>
                    </div>
                  ))}
                </div>
                <motion.button onClick={() => setStep(1)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:opacity-90">
                  Let's get started <ChevronRight size={18} />
                </motion.button>
              </motion.div>
            )}

            {/* Step 1: Banks */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏦</span>
                  <h2 className="text-white font-bold text-lg">Link Bank Accounts</h2>
                </div>
                <p className="text-white/40 text-sm mb-5">Select the banks you have accounts with. We'll securely connect using net banking APIs.</p>
                <div className="max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  <SelectGrid items={BANKS} selected={banks} onToggle={toggle(banks, setBanks)} />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-sm transition-all">Back</button>
                  <button onClick={() => setStep(2)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/20">
                    {banks.size > 0 ? `Continue with ${banks.size} bank${banks.size > 1 ? 's' : ''}` : 'Skip for now'} <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Investments (replaces UPI) */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📈</span>
                  <h2 className="text-white font-bold text-lg">Link Investment Accounts</h2>
                </div>
                <p className="text-white/40 text-sm mb-5">Connect your brokerage and mutual fund platforms to track your portfolio alongside daily spending.</p>
                <div className="max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  <SelectGrid items={INVESTMENTS} selected={investments} onToggle={toggle(investments, setInvestments)} />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-sm transition-all">Back</button>
                  <button onClick={() => setStep(3)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/20">
                    {investments.size > 0 ? `Continue with ${investments.size} platform${investments.size > 1 ? 's' : ''}` : 'Skip'} <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Cards */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💳</span>
                  <h2 className="text-white font-bold text-lg">Link Credit & Debit Cards</h2>
                </div>
                <p className="text-white/40 text-sm mb-5">Track card spending and utilisation automatically.</p>
                <div className="max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  <SelectGrid items={CARDS} selected={cards} onToggle={toggle(cards, setCards)} />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-sm transition-all">Back</button>
                  <button onClick={() => setStep(4)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/20">
                    {cards.size > 0 ? `Continue with ${cards.size} card${cards.size > 1 ? 's' : ''}` : 'Skip'} <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Wallets */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👜</span>
                  <h2 className="text-white font-bold text-lg">Link Digital Wallets</h2>
                </div>
                <p className="text-white/40 text-sm mb-5">Include wallet balances in your total financial picture.</p>
                <SelectGrid items={WALLETS} selected={wallets} onToggle={toggle(wallets, setWallets)} />
                <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-white/60">
                  <strong className="text-violet-300">Ready to sync:</strong> {totalLinked} source{totalLinked !== 1 ? 's' : ''} selected across banks, investments, cards & wallets
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(3)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-sm transition-all">Back</button>
                  <button onClick={() => setStep(5)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/20">
                    <Wifi size={15} /> Start Syncing
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Syncing */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500"
                  />
                  <div className="absolute inset-3 rounded-full bg-violet-500/15 flex items-center justify-center text-3xl">
                    💜
                  </div>
                </div>
                <h2 className="text-white font-bold text-xl mb-2">Syncing your accounts</h2>
                <p className="text-white/40 text-sm mb-8">This usually takes a few seconds...</p>
                <div className="space-y-3 text-left max-w-xs mx-auto">
                  {SYNC_STEPS.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i <= syncStep ? 1 : 0.2, x: 0 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        i < syncStep ? 'bg-emerald-500' : i === syncStep ? 'bg-violet-600' : 'bg-white/10'
                      }`}>
                        {i < syncStep ? '✓' : i === syncStep ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> : ''}
                      </div>
                      <span className={i <= syncStep ? 'text-white/70' : 'text-white/25'}>{s}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 6: Done */}
            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-4xl mx-auto mb-5"
                >
                  🎉
                </motion.div>
                <h1 className="text-white text-2xl font-black mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  You're all set!
                </h1>
                <p className="text-white/50 mb-6">
                  Synced <strong className="text-white">{totalLinked} account{totalLinked !== 1 ? 's' : ''}</strong> and imported <strong className="text-white">40 transactions</strong>. Your personalised dashboard is ready.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: 'Accounts', value: String(totalLinked), icon: '🏦' },
                    { label: 'Transactions', value: '40', icon: '📋' },
                    { label: 'Categories', value: '11', icon: '🏷️' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/8 text-center">
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-white font-bold text-lg">{value}</div>
                      <div className="text-white/40 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
                <motion.button
                  onClick={completeOnboarding}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:opacity-90">
                  Go to Dashboard →
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
