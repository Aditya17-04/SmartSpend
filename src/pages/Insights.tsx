import { motion } from 'framer-motion';
import { Lightbulb, TrendingDown, PiggyBank, Zap, BookOpen, Target, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { EmptyState } from '../components/shared/EmptyState';

interface InsightCard {
  id: string;
  icon: React.ReactNode;
  gradient: string;
  tag: string;
  tagColor: string;
  title: string;
  body: string;
  action: string;
}

function useInsights() {
  const { categorySpends, thisMonthSpent, thisMonthIncome, thisMonthSaved, state, hasData } = useFinance();

  const foodSpend = categorySpends.find(c => c.category === 'Food & Dining');
  const shopSpend = categorySpends.find(c => c.category === 'Shopping');
  const savingsPct = thisMonthIncome > 0 ? (thisMonthSaved / thisMonthIncome) * 100 : 0;

  const cards: InsightCard[] = [
    {
      id: 'food',
      icon: <TrendingDown size={20} className="text-orange-400" />,
      gradient: 'from-orange-500/10 to-red-500/10',
      tag: 'Trending',
      tagColor: '#FB923C',
      title: 'Food spending is up 32%',
      body: `You've spent ${formatCurrency(foodSpend?.amount ?? 0)} on dining and delivery this month, which is higher than usual. Cutting back by just 10% could save you ₹500 next week.`,
      action: 'Set Food Budget →',
    },
    {
      id: 'sub',
      icon: <Zap size={20} className="text-yellow-400" />,
      gradient: 'from-yellow-500/10 to-amber-500/10',
      tag: 'Optimization',
      tagColor: '#FACC15',
      title: 'Unused Subscriptions',
      body: 'We noticed a recurring charge of ₹1,200 for a gym membership, but you haven\'t had any other fitness-related expenses in 2 months. Are you still using it?',
      action: 'Review Subscriptions',
    },
    {
      id: 'save',
      icon: <PiggyBank size={20} className="text-emerald-400" />,
      gradient: 'from-emerald-500/10 to-teal-500/10',
      tag: 'Milestone',
      tagColor: '#34D399',
      title: 'Great saving rate!',
      body: `You're currently saving ${savingsPct.toFixed(1)}% of your income. Financial experts recommend 20%. You have a surplus of ${formatCurrency(thisMonthSaved)} this month.`,
      action: 'Invest Surplus →',
    },
    {
      id: 'edu',
      icon: <BookOpen size={20} className="text-blue-400" />,
      gradient: 'from-blue-500/10 to-indigo-500/10',
      tag: 'Smart Money',
      tagColor: '#60A5FA',
      title: 'Tax Saving Opportunity',
      body: 'You haven\'t exhausted your Section 80C limit of ₹1.5L yet. Investing ₹30,000 more in ELSS could save you up to ₹9,000 in taxes.',
      action: 'Explore ELSS',
    }
  ];

  return { cards, hasData };
}

export function Insights() {
  const { cards, hasData } = useInsights();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!hasData) {
    return (
      <EmptyState 
        icon="💡" 
        title="No Insights Yet" 
        description="We need a bit of transaction history before we can generate AI insights." 
        showSyncAction 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="text-yellow-400" /> AI Insights
          </h1>
          <p className="text-white/40 text-sm mt-1">Personalised financial recommendations based on your habits</p>
        </motion.div>

        <motion.button
          onClick={() => setRefreshKey(k => k + 1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors text-sm"
        >
          <RefreshCw size={16} /> Refresh
        </motion.button>
      </div>

      {/* Featured Insight */}
      <motion.div
        key={`feat-${refreshKey}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className={`rounded-3xl p-6 bg-gradient-to-br ${cards[0].gradient} border relative overflow-hidden`}
        style={{ borderColor: `${cards[0].tagColor}40` }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
              {cards[0].icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cards[0].tagColor }}>
              {cards[0].tag}
            </span>
          </div>
          
          <h2 className="text-white font-bold text-xl mb-2">{cards[0].title}</h2>
          <p className="text-white/65 text-sm leading-relaxed">{cards[0].body}</p>
          <button className="mt-4 text-sm font-semibold hover:underline" style={{ color: cards[0].tagColor }}>
            {cards[0].action}
          </button>
        </div>
      </motion.div>

      {/* Grid of insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.slice(1).map((card, i) => (
          <motion.div
            key={`${card.id}-${refreshKey}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className={`rounded-2xl p-5 bg-gradient-to-br ${card.gradient} relative overflow-hidden cursor-default`}
            style={{ border: `1px solid ${card.tagColor}25` }}
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15"
              style={{ background: card.tagColor }} />
            
            <div className="flex items-center gap-2 mb-3">
              {card.icon}
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.tagColor }}>
                {card.tag}
              </span>
            </div>
            
            <h3 className="text-white font-semibold mb-2">{card.title}</h3>
            <p className="text-white/50 text-xs leading-relaxed mb-4">{card.body}</p>
            
            <button className="text-xs font-semibold hover:underline mt-auto" style={{ color: card.tagColor }}>
              {card.action}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
