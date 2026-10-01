import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import React from 'react';
import { supabase } from '../lib/supabase';

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
  register: (name: string, email: string, password: string, phone?: string, twoFactor?: boolean) => Promise<boolean>;
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

function mapSupabaseUser(user: { id: string; email?: string; user_metadata?: { name?: string; avatar?: string } }): AuthUser {
  const name = user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User';
  return {
    id: user.id,
    name,
    email: user.email ?? '',
    twoFactorEnabled: false,
    avatar: user.user_metadata?.avatar ?? name.charAt(0).toUpperCase(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(loadAuth);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        const user = data.session?.user;
        if (user) setAuthState({ user: mapSupabaseUser(user), isAuthenticated: true, hasOnboarded: true });
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        setAuthState(user
          ? { user: mapSupabaseUser(user), isAuthenticated: true, hasOnboarded: true }
          : { user: null, isAuthenticated: false, hasOnboarded: false });
      });

      return () => listener.subscription.unsubscribe();
    }

    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
  }, []);

  useEffect(() => {
    if (!supabase) localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
  }, [authState]);

  const login = async (email: string, _password: string): Promise<boolean> => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: _password });
      return !error;
    }

    await new Promise(r => setTimeout(r, 1000));
    const stored = loadAuth();
    if (stored.user?.email === email) {
      setAuthState({ ...stored, isAuthenticated: true, hasOnboarded: true });
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, _password: string, phone?: string, twoFactor = false) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: _password,
        options: { data: { name, phone, twoFactorEnabled: twoFactor, avatar: name.charAt(0).toUpperCase() } },
      });
      if (error) throw error;
      if (data.user && data.session) setAuthState({ user: mapSupabaseUser(data.user), isAuthenticated: true, hasOnboarded: true });
      return Boolean(data.session);
    }

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
    return true;
  };

  const logout = () => {
    if (supabase) {
      void supabase.auth.signOut();
      return;
    }

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
