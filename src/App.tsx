import { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, type PageId } from './components/layout/Sidebar';
import { LandingPage } from './pages/auth/LandingPage';
import { Login }       from './pages/auth/Login';
import { Register }    from './pages/auth/Register';
import { Dashboard }   from './pages/Dashboard';
import { Register as ExpensesPage } from './pages/Register';
import { Budgets }     from './pages/Budgets';
import { Insights }    from './pages/Insights';
import { AskSmartSpend } from './pages/AskSmartSpend';
import { Settings as ProfilePage } from './pages/Settings';
import { ParentDashboard } from './pages/ParentDashboard';

const PAGES: Record<PageId, React.ComponentType<any>> = {
  dashboard:        Dashboard,
  expenses:         ExpensesPage,
  budget:           Budgets,
  insights:         Insights,
  ask:              AskSmartSpend,
  profile:          ProfilePage,
  parentDashboard:  ParentDashboard,
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('expenses');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  if (!isAuthenticated) {
    if (authView === 'login')    return <Login    onBack={() => setAuthView('landing')} onRegister={() => setAuthView('register')} />;
    if (authView === 'register') return <Register onBack={() => setAuthView('landing')} onLogin={() => setAuthView('login')} />;
    return <LandingPage onLogin={() => setAuthView('login')} onRegister={() => setAuthView('register')} />;
  }

  const ActivePage = PAGES[activePage];

  return (
    <div className="min-h-screen bg-[#111113] text-white font-sans flex">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 min-w-0 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
          <ActivePage onNavigate={setActivePage} />
        </div>
      </main>
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
