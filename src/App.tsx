import { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, type PageId } from './components/layout/Sidebar';
import { LandingPage } from './pages/auth/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/Dashboard';
import { Register as RegisterPage } from './pages/Register';
import { Spending }  from './pages/Spending';
import { Accounts }  from './pages/Accounts';
import { Alerts }    from './pages/Alerts';
import { Insights }  from './pages/Insights';
import { Budgets }   from './pages/Budgets';
import { Trends }    from './pages/Trends';
import { Goals }     from './pages/Goals';
import { Reports }   from './pages/Reports';
import { RecurringPage } from './pages/RecurringPage';
import { Settings }  from './pages/Settings';
import { ChatWidget } from './components/chat/ChatWidget';

const PAGES: Record<PageId, React.ComponentType> = {
  dashboard: Dashboard,
  register:  RegisterPage,
  accounts:  Accounts,
  alerts:    Alerts,
  insights:  Insights,
  budgets:   Budgets,
  trends:    Trends,
  goals:     Goals,
  reports:   Reports,
  recurring: RecurringPage,
  settings:  Settings,
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  if (!isAuthenticated) {
    if (authView === 'login') return <Login onBack={() => setAuthView('landing')} onRegister={() => setAuthView('register')} />;
    if (authView === 'register') return <Register onBack={() => setAuthView('landing')} onLogin={() => setAuthView('login')} />;
    return <LandingPage onLogin={() => setAuthView('login')} onRegister={() => setAuthView('register')} />;
  }

  const ActivePage = PAGES[activePage];

  return (
    <div className="min-h-screen bg-navy-950 text-white font-sans flex">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 min-w-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <ActivePage />
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
