import { motion } from 'framer-motion';
import { useState } from 'react';
import { Shield, Zap, TrendingUp, Bell, MessageCircle, FileText, ArrowRight, Check } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const features = [
  { icon: '🔗', title: 'Unified Accounts', desc: 'Link all your banks, UPI apps, cards & wallets in one place.' },
  { icon: '🤖', title: 'AI Categorisation', desc: 'Transactions auto-categorised using ML — no manual tagging.' },
  { icon: '📊', title: 'Smart Dashboard', desc: 'Total balance, spending charts, and budget health at a glance.' },
  { icon: '🔔', title: 'Proactive Alerts', desc: 'Get notified before you overspend, not after.' },
  { icon: '💬', title: 'AI Chat Assistant', desc: 'Ask "where did I spend most?" in plain language.' },
  { icon: '📄', title: 'Monthly Reports', desc: 'Download PDF or CSV reports with your financial health score.' },
];

const steps = [
  { n: '01', label: 'Sign Up',           desc: 'Create account with email or Google' },
  { n: '02', label: 'Link Accounts',     desc: 'Connect your bank, UPI apps & cards' },
  { n: '03', label: 'Auto-Sync',         desc: 'AI fetches and categorises all transactions' },
  { n: '04', label: 'Get Insights',      desc: 'Personalised recommendations & smart alerts' },
];

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-navy-950 overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-emerald-600/6 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-lg">💜</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Wellsy</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin}
            className="px-4 py-2 text-white/60 hover:text-white text-sm font-medium transition-colors">
            Sign In
          </button>
          <motion.button
            onClick={onRegister}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:opacity-90 transition-opacity">
            Get Started Free
          </motion.button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm font-medium mb-8">
            <Zap size={13} />
            AI-Powered Personal Finance
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 max-w-4xl mx-auto" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Your money,{' '}
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              finally makes sense
            </span>
          </h1>

          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Wellsy unifies all your bank accounts, UPI apps, credit cards and wallets — then uses AI to give you clear, personalised financial guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={onRegister}
              whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(108,99,255,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-lg shadow-xl shadow-violet-500/25 transition-all">
              Start for Free <ArrowRight size={20} />
            </motion.button>
            <button onClick={onLogin} className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold text-lg hover:bg-white/10 hover:text-white transition-all">
              Sign In
            </button>
          </div>

          <p className="text-white/25 text-sm mt-5">No credit card required · Free to use · Secure &amp; private</p>
        </motion.div>

        {/* Mini dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-3xl border border-white/10 bg-white/3 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50 p-6">
            {/* Mini dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Balance', value: '₹1,41,470', color: '#6C63FF', icon: '💼' },
                { label: 'Monthly Income', value: '₹97,000',  color: '#10B981', icon: '💰' },
                { label: 'Spent This Month', value: '₹52,700', color: '#F97316', icon: '🛍️' },
                { label: 'Saved',           value: '₹44,300', color: '#8B5CF6', icon: '🎯' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="rounded-xl p-4 bg-white/4 border border-white/8"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2" style={{ background: `${stat.color}25` }}>
                    {stat.icon}
                  </div>
                  <p className="text-white/40 text-xs mb-0.5">{stat.label}</p>
                  <p className="text-white font-bold text-lg">{stat.value}</p>
                </motion.div>
              ))}
            </div>
            {/* Mini chart bars */}
            <div className="rounded-xl p-4 bg-white/4 border border-white/8">
              <p className="text-white/40 text-xs mb-3">Spending by Category</p>
              <div className="space-y-2">
                {[
                  { cat: '🍽️ Food & Dining',    pct: 84, color: '#F97316' },
                  { cat: '🛍️ Shopping',         pct: 60, color: '#EC4899' },
                  { cat: '🚗 Transport',         pct: 65, color: '#3B82F6' },
                  { cat: '🎬 Entertainment',     pct: 66, color: '#8B5CF6' },
                ].map((item, i) => (
                  <div key={item.cat} className="flex items-center gap-3">
                    <span className="text-white/50 text-xs w-36 flex-shrink-0">{item.cat}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ delay: 0.7 + i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                    <span className="text-white/40 text-xs w-8 text-right">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 px-6 md:px-16 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Everything you need to take control
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">From tracking to insights to predictions — Wellsy has it all.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              onHoverStart={() => setHoveredFeature(i)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="glass-card cursor-default transition-all duration-300"
              style={{ borderColor: hoveredFeature === i ? 'rgba(108,99,255,0.3)' : undefined }}
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 md:px-16 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Up and running in 4 steps
          </h2>
        </motion.div>
        <div className="flex flex-col md:flex-row items-start gap-6 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-blue-600/20 border border-violet-500/30 flex items-center justify-center mb-4">
                <span className="text-violet-400 font-black text-xl">{step.n}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute translate-x-[9rem] translate-y-[-2.5rem] w-12 h-px bg-gradient-to-r from-violet-500/40 to-transparent" />
              )}
              <h3 className="text-white font-bold mb-1">{step.label}</h3>
              <p className="text-white/40 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative z-10 px-6 md:px-16 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-3xl p-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(59,130,246,0.15))', border: '1px solid rgba(108,99,255,0.3)' }}
        >
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Start understanding your money today
            </h2>
            <p className="text-white/50 mb-8 text-lg">Join thousands of users taking control of their finances with Wellsy.</p>
            <motion.button
              onClick={onRegister}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-lg shadow-xl shadow-violet-500/30 hover:opacity-90 transition-opacity">
              Create Your Free Account
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center text-white/25 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-base">💜</span>
          <span className="font-bold text-white/40">Wellsy</span>
        </div>
        <p>© 2026 Wellsy. Your financial data is safe and private.</p>
      </footer>
    </div>
  );
}
