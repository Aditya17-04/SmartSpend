import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterProps {
  onBack: () => void;
  onLogin: () => void;
}

export function Register({ onBack, onLogin }: RegisterProps) {
  const { register } = useAuth();
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [agreed, setAgreed]                 = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

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

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!email.includes('@')) return setError('Please enter a valid email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!agreed) return setError('Please accept the terms to continue.');

    setLoading(true);
    try {
      const authenticated = await register(name, email, password);
      if (!authenticated) {
        setError('Account created. Check your email to confirm your account, then sign in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all';

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

        <div className="glass-card space-y-5">
          {/* Header */}
          <div className="mb-2">
            <p className="text-white font-bold text-xl">Create Account</p>
            <p className="text-white/40 text-sm">Join Smart Spend — it's free</p>
          </div>

          {/* Name */}
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div>
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full transition-all duration-300"
                      style={{ background: i < passwordStrength ? strengthColors[passwordStrength - 1] : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strengthColors[passwordStrength - 1] ?? '#94A3B8' }}>
                  {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ''} password
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setAgreed(v => !v)}
              className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center mt-0.5 transition-all ${
                agreed ? 'bg-violet-600 border-violet-600' : 'border-white/20 bg-white/5'
              }`}
            >
              {agreed && <Check size={12} className="text-white" />}
            </div>
            <p className="text-white/50 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
              I agree to Smart Spend's{' '}
              <span className="text-violet-400">Terms of Service</span> and{' '}
              <span className="text-violet-400">Privacy Policy</span>. My financial data is encrypted and never sold.
            </p>
          </label>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <motion.button
            onClick={handleSubmit}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Create Account 🎉'}
          </motion.button>

          <p className="text-center text-white/40 text-sm">
            Already have an account?{' '}
            <button onClick={onLogin} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
