import { motion } from 'framer-motion';
import { Download, FileText, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { EmptyState } from '../components/shared/EmptyState';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Reports() {
  const { state, thisMonthIncome, thisMonthSpent, thisMonthSaved, categorySpends, budgetScore, alerts, hasData } = useFinance();
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  if (!hasData) {
    return (
      <EmptyState 
        icon="📄" 
        title="No Reports Yet" 
        description="We need some transaction data to generate your monthly financial report." 
        showSyncAction 
      />
    );
  }

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Account ID'];
    const rows = state.transactions.map(t => 
      [t.date.split('T')[0], t.merchant, t.category, t.amount, t.type, t.accountId].join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Smart_Spend_Report_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-white text-2xl font-bold print:text-black">Monthly Report</h1>
          <p className="text-white/40 text-sm mt-1 print:text-gray-600">Summary for {currentMonth}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 print:hidden"
        >
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <FileText size={16} /> Export CSV
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:opacity-90 transition-opacity"
          >
            <Download size={16} /> Download PDF
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Income', value: thisMonthIncome, color: '#10B981' },
          { label: 'Total Expenses', value: thisMonthSpent, color: '#F97316' },
          { label: 'Net Savings', value: thisMonthSaved, color: '#6C63FF' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card print:border-gray-200 print:shadow-none"
          >
            <p className="text-white/40 text-sm mb-1 print:text-gray-500">{item.label}</p>
            <p className="text-3xl font-black" style={{ color: item.color }}>
              {formatCurrency(item.value)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Score */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="glass-card flex flex-col items-center justify-center p-8 print:border-gray-200"
        >
          <h2 className="text-white font-semibold mb-6 self-start print:text-black">Financial Health Score</h2>
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
             <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
               <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" className="print:stroke-gray-100" />
               <motion.circle 
                 cx="50" cy="50" r="45" fill="none" 
                 stroke={budgetScore > 80 ? '#10B981' : budgetScore > 50 ? '#F59E0B' : '#EF4444'} 
                 strokeWidth="10" 
                 strokeLinecap="round"
                 strokeDasharray="283"
                 initial={{ strokeDashoffset: 283 }}
                 animate={{ strokeDashoffset: 283 - (283 * budgetScore) / 100 }}
                 transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-4xl font-black print:text-black">{budgetScore}</span>
               <span className="text-white/40 text-xs print:text-gray-500">out of 100</span>
             </div>
          </div>
          <p className="text-center text-white/60 text-sm print:text-gray-600">
            {budgetScore > 80 ? "Excellent! You are managing your money very well." :
             budgetScore > 50 ? "Good, but there's room for improvement in your budgeting." :
             "Attention needed. You are frequently exceeding your budgets."}
          </p>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="glass-card flex flex-col print:border-gray-200"
        >
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2 print:text-black">
            <Lightbulb size={18} className="text-yellow-400" /> AI Recommendations
          </h2>
          <div className="space-y-4 flex-1">
            {alerts.slice(0, 4).map((alert, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10 print:border-gray-200 print:bg-gray-50">
                <span className="text-xl">{alert.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold print:text-black">{alert.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 print:text-gray-600">{alert.message}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="flex items-center gap-2 text-white/50 print:text-gray-500">
                <CheckCircle size={16} className="text-emerald-500" /> No urgent recommendations at this time.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
        className="glass-card print:border-gray-200 print:shadow-none"
      >
        <h2 className="text-white font-semibold mb-4 print:text-black">Spending by Category</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categorySpends} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tickFormatter={(val) => `₹${val/1000}k`} stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <YAxis type="category" dataKey="category" width={100} stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                contentStyle={{ backgroundColor: '#141F38', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Spent']}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {categorySpends.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      {/* Print-only footer */}
      <div className="hidden print:block text-center text-gray-400 text-sm pt-8 border-t border-gray-200 mt-8">
        Generated by Smart Spend AI on {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
