import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import React from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  twoFactorEnabled: boolean;
  avatar: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string, twoFactor?: boolean) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = 'smart-spend-auth-v1';

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY) || localStorage.getItem('wellsy-auth-v1');
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {}
  return { user: null, isAuthenticated: false, hasOnboarded: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(loadAuth);

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
  }, [authState]);

  const login = async (email: string, _password: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    const stored = loadAuth();
    if (stored.user?.email === email) {
      setAuthState({ ...stored, isAuthenticated: true, hasOnboarded: true });
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, _password: string, phone?: string, twoFactor = false) => {
    await new Promise(r => setTimeout(r, 1200));
    const user: AuthUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      twoFactorEnabled: twoFactor,
      avatar: name.charAt(0).toUpperCase(),
    };
    setAuthState({ user, isAuthenticated: true, hasOnboarded: true });
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false, hasOnboarded: false });
    localStorage.removeItem('smart-spend-finance');
    localStorage.removeItem('smart-spend-finance-version');
    localStorage.removeItem('wellsy-finance');
    localStorage.removeItem('wellsy-finance-version');
  };

  const completeOnboarding = () => {
    setAuthState(prev => ({ ...prev, hasOnboarded: true }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
