import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowRight, Sparkles, Shield, BarChart3, Zap, ChevronDown,
  Star, CheckCircle2, Users, Brain, Lock, PieChart, MessageCircle,
  TrendingUp, TrendingDown, Bot, Bell, IndianRupee,
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

/* ─── Data ─────────────────────────────────────────────── */


const STATS = [
  { value: '₹2.4Cr+', label: 'Tracked monthly',  color: 'text-violet-400' },
  { value: '47k+',    label: 'Active users',       color: 'text-blue-400' },
  { value: '99.9%',   label: 'Uptime SLA',         color: 'text-emerald-400' },
  { value: '4.9★',    label: 'App store rating',   color: 'text-amber-400' },
];

const FEATURES = [
  { icon: Brain,         gradient: 'from-violet-500 to-purple-600', glow: '#7C3AED', title: 'AI Categorisation',     desc: 'Every transaction auto-tagged the moment it lands. Zero manual work.' },
  { icon: BarChart3,     gradient: 'from-blue-500 to-cyan-500',     glow: '#3B82F6', title: 'Budget Tracking',       desc: 'Real-time alerts before you overspend, not after the damage is done.' },
  { icon: MessageCircle, gradient: 'from-emerald-500 to-teal-500',  glow: '#10B981', title: 'Ask AI Anything',       desc: 'Your 24/7 financial coach answers questions in plain language.' },
  { icon: PieChart,      gradient: 'from-rose-500 to-pink-500',     glow: '#F43F5E', title: 'Spending Insights',     desc: 'Visual breakdowns and personalised recommendations every week.' },
  { icon: Users,         gradient: 'from-amber-500 to-orange-500',  glow: '#F59E0B', title: 'Parent View',           desc: 'Monitor family spending with consent controls and privacy built in.' },
  { icon: Shield,        gradient: 'from-indigo-500 to-violet-500', glow: '#6366F1', title: 'Bank-Grade Security',  desc: '256-bit AES encryption. Your data is never sold or shared.' },
];

const STEPS = [
  { n: '01', emoji: '✍️', title: 'Create Account',   desc: 'Sign up in under 60 seconds. No card needed.' },
  { n: '02', emoji: '🔗', title: 'Add Transactions', desc: 'Import CSV or log expenses manually in one tap.' },
  { n: '03', emoji: '🤖', title: 'AI Takes Over',    desc: 'Automatic tagging, analysis & spending pattern alerts.' },
  { n: '04', emoji: '📈', title: 'Get Smarter',      desc: 'Weekly insights delivered straight to your dashboard.' },
];

const TESTIMONIALS = [
  { avatar: 'R', gradient: 'from-violet-500 to-pink-500',   name: 'Riya Mehta',  role: 'Freelance Designer, Bengaluru', text: 'Finally a finance app that doesn\'t feel like a spreadsheet. The AI insights actually make sense for my irregular income.', stars: 5 },
  { avatar: 'A', gradient: 'from-blue-500 to-cyan-500',     name: 'Arjun Patel', role: 'Software Engineer, Pune',       text: 'Set up budgets in 5 minutes. Got notified about my shopping habit before the credit card bill could shock me.', stars: 5 },
  { avatar: 'P', gradient: 'from-emerald-500 to-teal-500',  name: 'Priya Nair',  role: 'Teacher, Chennai',              text: 'The parent dashboard is brilliant. I can see my son\'s spending without invading his privacy at all.', stars: 5 },
];

const TICKER = ['No credit card', 'Free forever', 'Data never sold', 'Bank-grade security', 'UPI & Cash', '24/7 AI support', 'Built for India', 'Cancel anytime'];

/* ─── Hero App Preview ─────────────────────────────────── */
function AppPreview() {
  return (
    <div className="w-full max-w-[420px] mx-auto lg:mx-0">
      {/* Phone-like container */}
      <div className="relative">
        {/* Glow */}
        <div className="absolute inset-0 rounded-[2.5rem] blur-3xl bg-gradient-to-b from-violet-500/20 via-blue-500/15 to-emerald-500/10 scale-105" />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[2rem] border border-white/12 bg-[#0D1117] shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Top bar */}
          <div className="px-5 py-3.5 border-b border-white/6 bg-[#080D1A] flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex-1 mx-3 h-5 rounded-lg bg-white/4 border border-white/8 flex items-center px-3">
              <span className="text-white/20 text-[10px] font-mono">app.smartspend.in</span>
            </div>
          </div>

          {/* App content */}
          <div className="p-4 space-y-3">
            {/* Balance card */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#3730A3 0%,#1E3A8A 60%,#064E3B 100%)' }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
              <p className="text-white/50 text-[11px] font-medium mb-0.5 relative z-10">Total Balance</p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="text-white text-[2rem] font-black font-mono leading-none relative z-10">₹1,41,470
              </motion.p>
              <div className="flex gap-2 mt-4 relative z-10">
                {[
                  { label: 'Income', val: '₹97,000', color: 'text-emerald-300', Icon: TrendingUp },
                  { label: 'Spent',  val: '₹52,700', color: 'text-red-300',     Icon: TrendingDown },
                ].map(s => (
                  <div key={s.label} className="flex-1 bg-white/12 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <s.Icon size={11} className={s.color} />
                    <div>
                      <p className="text-white/45 text-[10px]">{s.label}</p>
                      <p className={`font-bold text-xs ${s.color}`}>{s.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category bars */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4 space-y-2.5">
              <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wide">Spending by Category</p>
              {[
                { cat: '🍽️ Food & Dining', pct: 72, color: '#F97316' },
                { cat: '🛍️ Shopping',       pct: 89, color: '#EC4899' },
                { cat: '🚕 Transport',      pct: 45, color: '#3B82F6' },
                { cat: '🎬 Entertainment',  pct: 38, color: '#8B5CF6' },
              ].map((item, i) => (
                <div key={item.cat} className="flex items-center gap-2.5">
                  <span className="text-white/40 text-[11px] w-28 flex-shrink-0 truncate">{item.cat}</span>
                  <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ background: item.color }}
                    />
                  </div>
                  <span className="text-white/25 text-[10px] w-6 text-right font-mono">{item.pct}%</span>
                </div>
              ))}
            </div>

            {/* Transactions */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
              <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wide mb-3">Recent</p>
              <div className="space-y-2">
                {[
                  { icon: '🍕', name: 'Swiggy Order', cat: 'Food',     amt: '-₹540',    col: '#F97316' },
                  { icon: '🛍️', name: 'Myntra Haul',  cat: 'Shopping', amt: '-₹2,200',  col: '#EC4899' },
                  { icon: '💰', name: 'July Salary',  cat: 'Income',   amt: '+₹85,000', col: '#10B981' },
                ].map(t => (
                  <div key={t.name} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${t.col}18` }}>{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs font-semibold">{t.name}</p>
                      <p className="text-white/30 text-[10px]">{t.cat}</p>
                    </div>
                    <p className={`text-xs font-bold font-mono ${t.col === '#10B981' ? 'text-emerald-400' : 'text-white/65'}`}>{t.amt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI chip — positioned inside relative container */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.5 }}
          className="absolute top-20 -right-4 flex items-center gap-2.5 bg-[#13131F]/95 backdrop-blur-xl border border-violet-500/25 rounded-2xl px-3 py-2.5 shadow-xl shadow-violet-500/10"
        >
          <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Bot size={13} className="text-violet-400" />
          </div>
          <div>
            <p className="text-white text-[11px] font-bold leading-none mb-0.5">AI Insight</p>
            <p className="text-violet-300/70 text-[10px]">Shopping up 25% ↑</p>
          </div>
        </motion.div>

        {/* Alert chip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-24 -right-4 flex items-center gap-2.5 bg-[#13131F]/95 backdrop-blur-xl border border-amber-500/25 rounded-2xl px-3 py-2.5 shadow-xl shadow-amber-500/10"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={13} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-[11px] font-bold leading-none mb-0.5">Budget Alert</p>
            <p className="text-amber-300/70 text-[10px]">₹800 remaining</p>
          </div>
        </motion.div>

        {/* Saved chip */}
        <motion.div
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.7, duration: 0.5 }}
          className="absolute bottom-40 -left-4 flex items-center gap-2 bg-[#13131F]/95 backdrop-blur-xl border border-emerald-500/25 rounded-2xl px-3 py-2.5 shadow-xl shadow-emerald-500/10"
        >
          <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-[11px] font-bold">Saved ₹3,200 🎉</p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Feature card ─────────────────────────────────────── */
function FeatureCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const Icon = f.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: i * 0.06, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group rounded-2xl p-6 border border-white/8 bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300 cursor-default"
    >
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg`}
        style={{ boxShadow: `0 8px 24px ${f.glow}30` }}>
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
    </motion.div>
  );
}

/* ─── Main ─────────────────────────────────────────────── */
export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#06070F] overflow-x-hidden text-white" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>

      {/* Scroll bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 z-[60] origin-left" style={{ scaleX: scrollYProgress }} />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[900px] h-[900px] rounded-full bg-violet-600/8 blur-[200px]" />
        <div className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full bg-blue-600/7 blur-[180px]" />
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/6 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#06070F]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/50' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-white font-black text-lg tracking-tight">SmartSpend</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="hidden sm:block px-4 py-2 text-white/50 hover:text-white text-sm font-medium transition-colors">Sign In</button>
            <motion.button onClick={onRegister} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold shadow-lg shadow-violet-500/20">
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex items-center px-6 md:px-10 pt-20 pb-20">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-20 items-center">

          {/* Left */}
          <div className="space-y-8 max-w-xl">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-semibold">
                <Sparkles size={12} className="animate-pulse" />
                AI-Powered Finance for India
                <span className="px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-200 text-xs font-bold">NEW</span>
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
              Your money,
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,#A78BFA 0%,#60A5FA 50%,#34D399 100%)' }}>
                finally smart.
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="text-white/50 text-lg leading-relaxed">
              Track expenses, set budgets, and get AI-powered insights tailored to your Indian spending habits — all in one beautiful app.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.48 }}
              className="flex flex-wrap gap-3">
              <motion.button onClick={onRegister}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(108,99,255,0.45)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-base text-white shadow-xl shadow-violet-500/25 transition-all"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
                Start Free — No Card Needed <ArrowRight size={18} />
              </motion.button>
              <button onClick={onLogin}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-semibold text-base hover:bg-white/8 hover:text-white transition-all">
                Sign In
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-5">
              {[['🔒', '256-bit encrypted'], ['🚫', 'Zero data selling'], ['⚡', 'Free forever']].map(([e, t]) => (
                <span key={t} className="flex items-center gap-1.5 text-white/30 text-sm">{e} {t}</span>
              ))}
            </motion.div>
          </div>

          {/* Right */}
          <div className="relative flex justify-center lg:justify-end">
            <AppPreview />
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/15">
          <span className="text-[10px] font-medium tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={14} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Ticker ───────────────────────────────────────── */}
      <div className="relative z-10 border-y border-white/[0.05] bg-white/[0.01] py-3.5 overflow-hidden">
        <motion.div animate={{ x: [0, '-50%'] }} transition={{ repeat: Infinity, duration: 25, ease: 'linear' }} className="flex gap-10 w-max">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-3 text-white/20 text-sm font-medium whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-violet-400/50" />{t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 md:px-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-white/6 md:divide-y-0 overflow-hidden">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-10 text-center">
              <p className={`text-4xl font-black tracking-tight ${s.color}`}>{s.value}</p>
              <p className="text-white/35 text-sm mt-1.5 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/18 text-violet-300 text-xs font-bold tracking-wider uppercase mb-5">Features</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">Everything to master<br />your finances</h2>
          <p className="text-white/40 text-lg max-w-lg mx-auto">From tracking to AI coaching — SmartSpend is your complete financial OS.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/18 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-5">How it works</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Up and running in minutes</h2>
            <p className="text-white/40 text-lg">Four steps to financial clarity.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 && <div className="hidden md:block absolute top-8 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-gradient-to-r from-violet-500/30 to-transparent" />}
                <div className="relative z-10 w-14 h-14 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/20 to-blue-600/12 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/10">
                  <span className="text-xl">{step.emoji}</span>
                </div>
                <span className="text-violet-400/40 text-xs font-black tracking-widest mb-2">{step.n}</span>
                <h3 className="text-white font-bold text-sm mb-2">{step.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/18 text-amber-300 text-xs font-bold tracking-wider uppercase mb-5">Loved by users</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Real people, real results</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border border-white/8 bg-white/[0.025] hover:bg-white/[0.04] hover:border-white/14 transition-all duration-300 space-y-4">
                <div className="flex gap-0.5">{Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}</div>
                <p className="text-white/60 text-sm leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-1">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl p-8 md:p-12 border border-emerald-500/15 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(5,150,105,0.07) 0%,rgba(16,185,129,0.03) 100%)' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
            <div className="relative z-10 text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3">
                <Shield size={18} className="text-emerald-400" />
                <span className="text-emerald-300 font-bold text-lg">Bank-Grade Security</span>
              </div>
              <p className="text-white/40 text-base max-w-xl mx-auto">Your financial data is encrypted at rest and in transit. We never sell or share it — you are always in full control.</p>
            </div>
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Shield, label: '256-bit AES' },
                { icon: Lock, label: 'Zero data sharing' },
                { icon: CheckCircle2, label: 'Read-only access' },
                { icon: Zap, label: 'Spend alerts' },
              ].map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div key={b.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/7 text-center hover:border-emerald-500/20 transition-colors duration-300">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/12 flex items-center justify-center">
                      <Icon size={16} className="text-emerald-400" />
                    </div>
                    <p className="text-white/55 text-xs font-semibold">{b.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 md:px-10">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-3xl p-12 md:p-20 text-center relative overflow-hidden border border-white/8"
          style={{ background: 'linear-gradient(135deg,rgba(109,99,255,0.14) 0%,rgba(37,99,235,0.10) 50%,rgba(16,185,129,0.08) 100%)' }}>
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-violet-500/12 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-blue-500/12 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-white/40 text-xs font-medium">
              <IndianRupee size={11} className="text-emerald-400" /> Free — No credit card required
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Take control of your<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,#A78BFA,#60A5FA)' }}>money today.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-sm mx-auto">Join 47,000+ Indians who've stopped guessing and started knowing.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <motion.button onClick={onRegister} whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(108,99,255,0.5)' }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-violet-500/25 transition-all"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
                Create Free Account <ArrowRight size={20} />
              </motion.button>
              <button onClick={onLogin} className="px-7 py-4 rounded-2xl bg-white/6 border border-white/10 text-white/60 font-semibold text-base hover:bg-white/10 hover:text-white transition-all">
                Sign In
              </button>
            </div>
            <p className="text-white/20 text-sm">No credit card · Free forever · Cancel anytime</p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.05] py-10 px-6 md:px-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <span className="text-white font-black tracking-tight">SmartSpend</span>
            <span className="text-white/20 text-sm">© 2026</span>
          </div>
          <div className="flex gap-6 text-white/25 text-sm">
            {['Privacy', 'Terms', 'Security', 'Contact'].map(l => <button key={l} className="hover:text-white/55 transition-colors">{l}</button>)}
          </div>
          <p className="text-white/18 text-xs">Data safe, private, never sold.</p>
        </div>
      </footer>
    </div>
  );
}
