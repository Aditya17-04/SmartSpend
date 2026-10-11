import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  LogOut,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  Check,
  X,
  Lock,
  Smartphone,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileDown,
  Receipt,
  ChevronRight,
  RefreshCw,
  Cloud
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { parseExcelOrCsv, parsePdfStatement, downloadSampleTemplate } from '../lib/importParsers';
import { formatCurrency, CATEGORY_ICONS } from '../lib/utils';
import type { Transaction } from '../types/finance';
import { supabase } from '../lib/supabase';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
      style={{ background: on ? 'linear-gradient(90deg,#10B981,#059669)' : 'rgba(255,255,255,0.1)' }}>
      <motion.span
        animate={{ left: on ? 'calc(100% - 22px)' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
        style={{ position: 'absolute' }}
      />
    </button>
  );
}

export function Settings({ onNavigate }: { onNavigate?: (page: string) => void } = {}) {
  const { user, logout } = useAuth();
  const { state, resetData, importTransactions, totalBalance, syncData } = useFinance();

  const [notifs, setNotifs] = useState({
    budgetAlerts:   true,
    weeklyReport:   true,
    largeExpenses:  false,
    billReminders:  true,
  });
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(user?.name ?? '');
  const [saved, setSaved] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [parentAccess, setParentAccess] = useState<{ id: string; parent_email: string; status: string } | null>(null);
  const [sharingMessage, setSharingMessage] = useState('');
  const [isSyncingWithParent, setIsSyncingWithParent] = useState(false);

  // File import state
  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewTxns, setPreviewTxns] = useState<Transaction[] | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase.from('parent_access').select('id, parent_email, status').eq('child_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setParentAccess(data);
          setParentEmail(data.parent_email);
        }
      });
  }, [user]);

  const handleParentAccess = async () => {
    if (!supabase || !user || !parentEmail.trim()) return;
    setSharingMessage('');
    setIsSyncingWithParent(true);
    try {
      // 1. First ensure current child financial data is synced to cloud
      const syncRes = await syncData();
      if (!syncRes.success) {
        console.warn('Initial cloud snapshot sync warning:', syncRes.error);
      }

      // 2. Insert or update parent access invitation
      const { data, error } = await supabase.from('parent_access').upsert({
        child_id: user.id,
        parent_email: parentEmail.trim().toLowerCase(),
        status: 'pending',
        parent_id: null,
      }, { onConflict: 'child_id,parent_email' }).select('id, parent_email, status').single();
      if (error) {
        setSharingMessage(error.message);
        return;
      }
      setParentAccess(data);
      setSharingMessage('Consent request sent and your financial records were synced! Your parent can now view them.');
    } finally {
      setIsSyncingWithParent(false);
    }
  };

  const handleManualSyncToParent = async () => {
    setIsSyncingWithParent(true);
    setSharingMessage('');
    try {
      const res = await syncData();
      if (res.success) {
        setSharingMessage(`✓ Successfully synced ${state.transactions.length} transactions and ${state.budgets.length} budgets to cloud!`);
      } else {
        setSharingMessage(`Sync failed: ${res.error}`);
      }
    } finally {
      setIsSyncingWithParent(false);
    }
  };

  const handleRevokeParentAccess = async () => {
    if (!supabase || !parentAccess) return;
    const { error } = await supabase.from('parent_access').update({ status: 'revoked' }).eq('id', parentAccess.id);
    if (error) {
      setSharingMessage(error.message);
      return;
    }
    setParentAccess(prev => prev ? { ...prev, status: 'revoked' } : prev);
    setSharingMessage('Parent access revoked.');
  };

  const handleSaveName = async () => {
    setEditName(false);
    const trimmed = nameVal.trim();
    if (!trimmed) return;
    if (user) {
      localStorage.setItem(`smart-spend-user-name-${user.id}`, trimmed);
      if (supabase) {
        try {
          await supabase.auth.updateUser({ data: { name: trimmed } });
          await supabase.from('finance_snapshots').upsert({
            user_id: user.id,
            data: { ...state, _name: trimmed },
            updated_at: new Date().toISOString(),
          });
          if (parentAccess?.id) {
            await supabase.from('parent_access').update({
              child_name: trimmed,
            }).eq('id', parentAccess.id);
          }
        } catch (e) {
          console.warn('Could not update profile name in Supabase:', e);
        }
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const parsed = await parseExcelOrCsv(file);
      setPreviewTxns(parsed);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to read Excel / CSV file. Please check file format.');
    } finally {
      setIsParsing(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const parsed = await parsePdfStatement(file);
      setPreviewTxns(parsed);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to extract transactions from PDF.');
    } finally {
      setIsParsing(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!previewTxns || previewTxns.length === 0) return;
    importTransactions(previewTxns);
    const count = previewTxns.length;
    setPreviewTxns(null);
    setImportSuccessCount(count);
    setTimeout(() => setImportSuccessCount(null), 5000);
  };

  const handleRemoveFromPreview = (index: number) => {
    if (!previewTxns) return;
    setPreviewTxns(prev => (prev ? prev.filter((_, i) => i !== index) : null));
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Status', 'Account'];
    const rows = state.transactions.map(t => {
      const account = state.accounts.find(a => a.id === t.accountId);
      return [
        t.date.split('T')[0],
        `"${t.merchant}"`,
        t.category,
        t.amount,
        t.type,
        t.status,
        `"${account?.name ?? ''}"`,
      ].join(',');
    });
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'SmartSpend_Transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── Header bar ──────────────────────────────────────────────
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartSpend', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Transaction Report', 14, 19);

    // Date range
    const now = new Date();
    doc.text(
      `Generated: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      196,
      12,
      { align: 'right' }
    );
    doc.text(`${user?.name ?? 'User'} · ${user?.email ?? ''}`, 196, 19, { align: 'right' });

    // ── Summary boxes ────────────────────────────────────────────
    const totalIncome  = state.transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalExpense = state.transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const net = totalIncome - totalExpense;

    const fmt = (n: number) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const summaryY = 35;
    const boxes = [
      { label: 'Total Income',   value: fmt(totalIncome),  color: [16, 185, 129]  as [number,number,number] },
      { label: 'Total Expenses', value: fmt(totalExpense), color: [239, 68, 68]   as [number,number,number] },
      { label: 'Net Savings',    value: fmt(net),          color: net >= 0 ? [16, 185, 129] as [number,number,number] : [239, 68, 68] as [number,number,number] },
      { label: 'Transactions',   value: String(state.transactions.length), color: [16, 185, 129] as [number,number,number] },
    ];
    boxes.forEach((box, i) => {
      const x = 14 + i * 46;
      doc.setFillColor(245, 245, 255);
      doc.roundedRect(x, summaryY, 43, 20, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 140);
      doc.setFont('helvetica', 'normal');
      doc.text(box.label, x + 3, summaryY + 6);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...box.color);
      doc.text(box.value, x + 3, summaryY + 15);
    });

    // ── Table ────────────────────────────────────────────────────
    const sorted = [...state.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    autoTable(doc, {
      startY: summaryY + 27,
      head: [['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Status']],
      body: sorted.map(t => {
        const account = state.accounts.find(a => a.id === t.accountId);
        return [
          new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
          t.title,
          t.category,
          account?.name ?? '—',
          t.type === 'credit' ? 'Income' : 'Expense',
          (t.type === 'credit' ? '+' : '-') + fmt(t.amount),
          t.status.charAt(0).toUpperCase() + t.status.slice(1),
        ];
      }),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        textColor: [30, 30, 50],
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 32 },
        3: { cellWidth: 32 },
        4: { cellWidth: 18 },
        5: { cellWidth: 26, halign: 'right' },
        6: { cellWidth: 20 },
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const isIncome = (data.cell.text[0] ?? '').startsWith('+');
          doc.setTextColor(isIncome ? 16 : 239, isIncome ? 185 : 68, isIncome ? 129 : 68);
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ── Footer ───────────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 200);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `SmartSpend · Confidential · Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 6,
        { align: 'center' }
      );
    }

    doc.save(`SmartSpend_Report_${now.toISOString().split('T')[0]}.pdf`);
  };

  const handleDeleteData = () => {
    if (window.confirm('Delete all your manual financial data? This will clear all transactions and reset balances to ₹0.')) resetData();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">

      {/* Hidden file inputs */}
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleExcelUpload}
        className="hidden"
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />

      {/* Success Banner */}
      <AnimatePresence>
        {importSuccessCount !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 sm:p-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-sm sm:text-base text-white">Import Complete!</p>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  Successfully loaded {importSuccessCount} transactions into your financial ledger.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('expenses')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs transition-colors shadow-sm"
                >
                  View in Expenses →
                </button>
              )}
              {onNavigate && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  Dashboard
                </button>
              )}
              <button onClick={() => setImportSuccessCount(null)} className="text-emerald-400/60 hover:text-emerald-300 p-1">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {parseError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-xs sm:text-sm">{parseError}</p>
            </div>
            <button onClick={() => setParseError(null)} className="text-red-400/60 hover:text-red-300">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile hero */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 relative overflow-hidden bg-[#1C1C1E] border border-white/10 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-black text-3xl font-black shadow-lg shadow-emerald-500/20 flex-shrink-0">
            {user?.avatar ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            {editName ? (
              <div className="flex items-center gap-2">
                <input value={nameVal} onChange={e => setNameVal(e.target.value)} autoFocus
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-400 flex-1" />
                <button onClick={handleSaveName} className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400"><Check size={13} /></button>
                <button onClick={() => setEditName(false)} className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/50"><X size={13} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-xl truncate">{user?.name ?? 'User'}</h2>
                <button onClick={() => setEditName(true)} className="text-white/30 hover:text-white transition-colors">
                  <span className="text-xs">✏️</span>
                </button>
              </div>
            )}
            <p className="text-white/50 text-sm truncate mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold">
                  Total Balance: {formatCurrency(totalBalance)}
                </span>
              </div>
              <span className="text-white/30 text-xs">·</span>
              <span className="text-white/50 text-xs">
                {state.transactions.length} manual records
              </span>
            </div>
          </div>
        </div>
        {saved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center gap-1.5 text-emerald-400 text-xs">
            <Check size={12} /> Profile updated!
          </motion.div>
        )}
      </motion.div>

      {/* ── PARENT ACCESS ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="rounded-3xl bg-[#1C1C1E] border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield size={17} />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Parent Access</h3>
            <p className="text-white/40 text-xs">Share a view-only copy of your transactions with a parent.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={parentEmail}
            onChange={e => setParentEmail(e.target.value)}
            placeholder="Parent email address"
            disabled={parentAccess?.status === 'approved'}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 disabled:opacity-60"
          />
          {parentAccess?.status === 'approved' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSyncToParent}
                disabled={isSyncingWithParent}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isSyncingWithParent ? <RefreshCw className="animate-spin" size={14} /> : <Cloud size={14} />}
                <span>{isSyncingWithParent ? 'Syncing…' : 'Sync to Parent'}</span>
              </button>
              <button onClick={handleRevokeParentAccess} className="px-3.5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/25">Revoke</button>
            </div>
          ) : (
            <button
              onClick={handleParentAccess}
              disabled={!parentEmail.trim() || isSyncingWithParent}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold disabled:opacity-40 flex items-center gap-2 hover:bg-emerald-400 transition-colors"
            >
              {isSyncingWithParent && <RefreshCw className="animate-spin" size={14} />}
              <span>{isSyncingWithParent ? 'Syncing…' : 'Send consent'}</span>
            </button>
          )}
        </div>
        {parentAccess && (
          <div className="flex items-center justify-between text-xs text-white/50 pt-1">
            <p>Status: <span className="text-emerald-300 capitalize font-medium">{parentAccess.status}</span></p>
            {parentAccess.status === 'approved' && (
              <span className="text-white/40">Shared: {state.transactions.length} records, {state.budgets.length} budgets</span>
            )}
          </div>
        )}
        {sharingMessage && (
          <p className={`text-xs ${sharingMessage.toLowerCase().includes('error') || sharingMessage.toLowerCase().includes('failed') ? 'text-red-400' : 'text-emerald-300'}`}>
            {sharingMessage}
          </p>
        )}
      </motion.div>

      {/* ── 📥 1. IMPORT DATA SECTION ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl bg-[#1C1C1E] border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload size={16} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Import Previous Data</h3>
              <p className="text-white/40 text-xs">Load historical transactions from spreadsheets or PDF bank statements</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSampleTemplate('xlsx')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
            >
              <FileDown size={13} className="text-emerald-400" />
              <span>Sample Template</span>
            </button>
          </div>
        </div>

        {/* Import Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Option 1: Import Excel Data */}
          <button
            onClick={() => excelInputRef.current?.click()}
            disabled={isParsing}
            className="p-5 rounded-2xl bg-white/[0.03] hover:bg-emerald-500/[0.06] border border-white/10 hover:border-emerald-500/40 text-left transition-all group relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet size={24} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider font-mono">
                .XLSX / .CSV
              </span>
            </div>

            <div className="mt-3">
              <p className="text-white font-bold text-base group-hover:text-emerald-300 transition-colors">
                Import Excel Data
              </p>
              <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
                Upload Excel spreadsheet or CSV export to instantly import rows.
              </p>
            </div>
          </button>

          {/* Option 2: Import PDF Statement */}
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={isParsing}
            className="p-5 rounded-2xl bg-white/[0.03] hover:bg-red-500/[0.06] border border-white/10 hover:border-red-500/40 text-left transition-all group relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/25 uppercase tracking-wider font-mono">
                .PDF
              </span>
            </div>

            <div className="mt-3">
              <p className="text-white font-bold text-base group-hover:text-red-300 transition-colors">
                Import PDF Statement
              </p>
              <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
                Upload bank statement or transaction report PDF to extract records.
              </p>
            </div>
          </button>
        </div>

        {isParsing && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-white text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span>Parsing file and analyzing transactions...</span>
          </div>
        )}
      </motion.div>


      {/* ── 2. PREVIEW IMPORT MODAL ── */}
      <AnimatePresence>
        {previewTxns && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#1C1C1E] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Review Transactions to Import</h3>
                    <p className="text-white/40 text-xs">{previewTxns.length} records ready to import</p>
                  </div>
                </div>

                <button
                  onClick={() => setPreviewTxns(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Summary of parsed list */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <div>
                  <p className="text-white/40 text-[11px]">Total Found</p>
                  <p className="text-white font-bold text-base">{previewTxns.length}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[11px]">Income Total</p>
                  <p className="text-emerald-400 font-bold text-base font-mono">
                    +{formatCurrency(previewTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-[11px]">Expense Total</p>
                  <p className="text-pink-400 font-bold text-base font-mono">
                    -{formatCurrency(previewTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px] custom-scrollbar">
                {previewTxns.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 text-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-base flex-shrink-0">
                        {CATEGORY_ICONS[t.category] || '📦'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm truncate">{t.title}</p>
                        <p className="text-white/40 text-[11px] mt-0.5">
                          {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                      {/* Category Tag */}
                      <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/70 text-[11px] font-medium">
                        {t.category}
                      </span>

                      {/* Account Toggle Button */}
                      <button
                        onClick={() => {
                          setPreviewTxns(prev => prev ? prev.map((item, i) => i === idx ? { ...item, accountId: item.accountId === 'acc-1' ? 'acc-2' : 'acc-1' } : item) : null);
                        }}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-colors ${
                          t.accountId === 'acc-1' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                        }`}
                        title="Click to toggle Cash / UPI"
                      >
                        {t.accountId === 'acc-1' ? '💵 Cash' : '📱 UPI'}
                      </button>

                      {/* Type Toggle Button */}
                      <button
                        onClick={() => {
                          setPreviewTxns(prev => prev ? prev.map((item, i) => i === idx ? { ...item, type: item.type === 'credit' ? 'debit' : 'credit' } : item) : null);
                        }}
                        className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg border transition-colors ${
                          t.type === 'credit' 
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'text-pink-400 bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20'
                        }`}
                        title="Click to toggle Income (+) / Expense (-)"
                      >
                        {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromPreview(idx)}
                        className="text-white/30 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors ml-1"
                        title="Remove from import"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => setPreviewTxns(null)}
                  className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Check size={17} className="stroke-[2.5]" />
                  <span>Import {previewTxns.length} Transactions</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl bg-[#1C1C1E] border border-white/10 p-5 space-y-1 shadow-md">
        <p className="text-white/35 text-xs font-bold uppercase tracking-widest mb-3">Account</p>
        {[
          { icon: <User size={16} />, label: 'Full Name', value: user?.name ?? '—' },
          { icon: <Smartphone size={16} />, label: 'Email', value: user?.email ?? '—' },
          { icon: <Lock size={16} />, label: 'Wallets Configured', value: 'Cash & UPI' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50 flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-xs">{label}</p>
              <p className="text-white text-sm font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-3xl bg-[#1C1C1E] border border-white/10 p-5 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-emerald-400" />
          <p className="text-white font-bold">Notifications & Alerts</p>
        </div>
        <div className="space-y-4">
          {([
            { key: 'budgetAlerts',  label: 'Budget Alerts',       desc: 'When spending reaches 80% or exceeds 100%' },
            { key: 'weeklyReport',  label: 'Weekly Summary',      desc: 'Spending recap every Sunday' },
            { key: 'largeExpenses', label: 'Large Expenses',      desc: 'Any transaction above ₹5,000' },
            { key: 'billReminders', label: 'Bill Reminders',      desc: '3 days before recurring bills' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-white/35 text-xs mt-0.5">{desc}</p>
              </div>
              <Toggle on={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl bg-[#1C1C1E] border border-white/10 p-5 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-emerald-400" />
          <p className="text-white font-bold">Security & Storage</p>
        </div>
        <div className="space-y-1">
          {[
            { label: 'Two-Factor Authentication', value: user?.twoFactorEnabled ? 'Enabled ✅' : 'Disabled', sub: user?.twoFactorEnabled ? 'Your account is protected' : 'Enable for extra security' },
            { label: 'Storage Mode', value: 'Offline & Local', sub: 'Stored safely on your device' },
            { label: 'Active Session', value: '1 active', sub: 'Current browser' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-white/35 text-xs mt-0.5">{sub}</p>
              </div>
              <span className="text-white/50 text-xs text-right flex-shrink-0 ml-3">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 3. EXPORT TRANSACTIONS & RESET ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-3xl bg-[#1C1C1E] border border-white/10 p-5 sm:p-6 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-white/35 text-xs font-bold uppercase tracking-widest">Export Ledger</p>
          <span className="text-white/40 text-xs">{state.transactions.length} records</span>
        </div>

        {/* CSV */}
        <button onClick={handleExportCSV}
          className="w-full flex items-center gap-3 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 px-4 hover:bg-white/8 transition-colors text-left group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/25 transition-colors">
            <Download size={17} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Export as CSV</p>
            <p className="text-white/40 text-xs">Spreadsheet format — open in Excel or Google Sheets</p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex-shrink-0">.csv</span>
        </button>

        {/* PDF */}
        <button onClick={handleExportPDF}
          className="w-full flex items-center gap-3 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 px-4 hover:bg-white/8 transition-colors text-left group">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/25 transition-colors">
            <Download size={17} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Export as PDF</p>
            <p className="text-white/40 text-xs">Formatted financial statement with summary & records</p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 flex-shrink-0">.pdf</span>
        </button>

        {/* Delete */}
        <button onClick={handleDeleteData}
          className="w-full flex items-center gap-3 py-3 rounded-2xl bg-red-500/8 border border-red-500/20 px-4 hover:bg-red-500/15 transition-colors text-left mt-1">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium">Reset All Transactions</p>
            <p className="text-red-400/50 text-xs">Clears all recorded income and expenses back to ₹0</p>
          </div>
        </button>
      </motion.div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        onClick={logout}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-2xl border border-white/10 bg-white/4 text-white/70 font-semibold flex items-center justify-center gap-2 hover:text-white hover:bg-white/8 transition-all">
        <LogOut size={17} /> Sign Out
      </motion.button>

      {/* Footer note */}
      <p className="text-center text-white/20 text-xs pb-2">
        🔒 All data stored locally on your device · SmartSpend v1.0
      </p>
    </motion.div>
  );
}
