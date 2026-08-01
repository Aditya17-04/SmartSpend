import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw } from 'lucide-react';

interface TwoFactorProps {
  email: string;
  onVerify: () => void;
}

export function TwoFactor({ email, onVerify }: TwoFactorProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setTimer(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    if (otp.some(d => !d)) return setError('Please enter all 6 digits.');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    // In demo: any 6 digits work
    onVerify();
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="glass-card text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <Shield size={28} className="text-violet-400" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2">Two-Factor Verification</h2>
          <p className="text-white/40 text-sm mb-8">
            Enter the 6-digit code sent to <span className="text-white/70">{email}</span>
          </p>

          <div className="flex justify-center gap-3 mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-white text-xl font-bold bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all"
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <motion.button
            onClick={handleVerify}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25 disabled:opacity-50 mb-4"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
          </motion.button>

          <div className="flex items-center justify-center gap-2 text-sm">
            {timer > 0 ? (
              <p className="text-white/40">Resend in <span className="text-violet-400 font-bold">{timer}s</span></p>
            ) : (
              <button onClick={() => setTimer(30)} className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors">
                <RefreshCw size={14} /> Resend Code
              </button>
            )}
          </div>

          <p className="text-white/25 text-xs mt-4">
            Demo mode: any 6 digits will work
          </p>
        </div>
      </motion.div>
    </div>
  );
}
