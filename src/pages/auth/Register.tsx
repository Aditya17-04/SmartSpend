import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, EyeOff, User, Mail, Lock, Phone, Shield, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterProps {
  onBack: () => void;
  onLogin: () => void;
}

const STEPS = ['Account', 'Security', 'Confirm'];

export function Register({ onBack, onLogin }: RegisterProps) {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthColors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const nextStep = () => {
    setError('');
    if (step === 0) {
      if (!name.trim()) return setError('Please enter your name.');
      if (!email.includes('@')) return setError('Please enter a valid email.');
      if (password.length < 8) return setError('Password must be at least 8 characters.');
      if (password !== confirmPassword) return setError('Passwords do not match.');
    }
    if (step === 1) { /* phone is optional */ }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!agreed) return setError('Please accept the terms to continue.');
    setLoading(true);
    await register(name, email, password, phone, twoFactor);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-600/8 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="glass-card">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-xl">💜</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">Create Account</p>
              <p className="text-white/40 text-sm">Join Wellsy — it's free</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/30'
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white/70' : 'text-white/25'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? 'bg-emerald-500/50' : 'bg-white/10'}`} style={{ width: 24 }} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Account */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{ background: i < passwordStrength ? strengthColors[passwordStrength - 1] : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strengthColors[passwordStrength - 1] ?? '#94A3B8' }}>
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ''} password
                    </p>
                  </div>
                )}
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
                </div>
              </motion.div>
            )}

            {/* Step 1: Security */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <p className="text-white font-medium mb-1">Phone Number <span className="text-white/30 text-xs">(optional)</span></p>
                  <p className="text-white/40 text-sm mb-3">Used for two-factor authentication and account recovery.</p>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield size={18} className="text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm mb-1">Two-Factor Authentication (2FA)</p>
                      <p className="text-white/40 text-xs mb-3">Adds an extra layer of security by requiring a code every time you log in.</p>
                      <button
                        type="button"
                        onClick={() => setTwoFactor(v => !v)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${twoFactor ? 'bg-violet-600' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${twoFactor ? 'left-6' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  {[
                    { label: 'Name', value: name },
                    { label: 'Email', value: email },
                    { label: 'Phone', value: phone || 'Not provided' },
                    { label: '2FA', value: twoFactor ? 'Enabled' : 'Disabled' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-white/40">{label}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setAgreed(v => !v)}
                    className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center mt-0.5 transition-all ${agreed ? 'bg-violet-600 border-violet-600' : 'border-white/20 bg-white/5'}`}
                  >
                    {agreed && <Check size={12} className="text-white" />}
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                    I agree to Wellsy's <span className="text-violet-400">Terms of Service</span> and <span className="text-violet-400">Privacy Policy</span>. My financial data is encrypted and never sold.
                  </p>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm mt-4">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => { setError(''); setStep(s => s - 1); }}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {step < 2 ? (
              <button onClick={nextStep}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <motion.button onClick={handleSubmit} disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account 🎉'}
              </motion.button>
            )}
          </div>

          <p className="text-center text-white/40 text-sm mt-5">
            Already have an account?{' '}
            <button onClick={onLogin} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
