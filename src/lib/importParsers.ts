import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import type { Transaction, Category } from '../types/finance';

// Set up worker for PDF.js safely
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker setup fallback:', e);
}

// Clean emoji and normalize category string
export function cleanCategoryString(raw: string): Category {
  if (!raw) return 'Other';
  // Remove emojis
  const clean = raw.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  const lower = clean.toLowerCase();

  if (lower.includes('food') || lower.includes('dining') || lower.includes('restaurant') || lower.includes('meal') || lower.includes('snack') || lower.includes('tea') || lower.includes('coffee')) return 'Food & Dining';
  if (lower.includes('social') || lower.includes('friend') || lower.includes('party')) return 'Social Life';
  if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) return 'Pets';
  if (lower.includes('transport') || lower.includes('travel') || lower.includes('cab') || lower.includes('ride') || lower.includes('fuel') || lower.includes('auto')) return 'Transport';
  if (lower.includes('culture') || lower.includes('art') || lower.includes('museum')) return 'Culture';
  if (lower.includes('household') || lower.includes('grocery') || lower.includes('home') || lower.includes('rent') || lower.includes('bill')) return 'Household';
  if (lower.includes('apparel') || lower.includes('cloth') || lower.includes('wear') || lower.includes('fashion')) return 'Apparel';
  if (lower.includes('beauty') || lower.includes('salon') || lower.includes('cosmetic')) return 'Beauty';
  if (lower.includes('health') || lower.includes('medical') || lower.includes('doctor') || lower.includes('medicine') || lower.includes('fitness')) return 'Health';
  if (lower.includes('education') || lower.includes('study') || lower.includes('school') || lower.includes('college') || lower.includes('book') || lower.includes('stationery')) return 'Education';
  if (lower.includes('gift') || lower.includes('present') || lower.includes('donation')) return 'Gift';
  if (lower.includes('allowance') || lower.includes('pocket')) return 'Allowance';
  if (lower.includes('salary') || lower.includes('payroll') || lower.includes('wage')) return 'Salary';
  if (lower.includes('petty') || lower.includes('cash in')) return 'Petty cash';
  if (lower.includes('bonus') || lower.includes('incentive') || lower.includes('reward')) return 'Bonus';
  if (lower.includes('shopping') || lower.includes('store') || lower.includes('mall') || lower.includes('online')) return 'Shopping';
  if (lower.includes('entertainment') || lower.includes('movie') || lower.includes('game') || lower.includes('music') || lower.includes('ott')) return 'Entertainment';

  return 'Other';
}

// Category keyword matching helper based on description
export function inferCategory(desc: string, isCredit: boolean): Category {
  const text = (desc || '').toLowerCase();

  if (isCredit) {
    if (text.includes('salary') || text.includes('payroll') || text.includes('wages')) return 'Salary';
    if (text.includes('allowance') || text.includes('pocket money')) return 'Allowance';
    if (text.includes('bonus') || text.includes('incentive') || text.includes('reward')) return 'Bonus';
    if (text.includes('cash') || text.includes('petty')) return 'Petty cash';
    return 'Other';
  }

  if (text.includes('swiggy') || text.includes('zomato') || text.includes('restaurant') || text.includes('cafe') || text.includes('food') || text.includes('pizza') || text.includes('burger') || text.includes('dining') || text.includes('starbucks') || text.includes('mcdonald') || text.includes('kfc') || text.includes('subway') || text.includes('chai') || text.includes('tea') || text.includes('coffee') || text.includes('paratha') || text.includes('dosa') || text.includes('biryani') || text.includes('shawarma') || text.includes('biscuit') || text.includes('drink') || text.includes('pulav') || text.includes('vada') || text.includes('lassi') || text.includes('kurkure') || text.includes('dhud') || text.includes('bourbon')) return 'Food & Dining';
  if (text.includes('uber') || text.includes('ola') || text.includes('rapido') || text.includes('metro') || text.includes('fuel') || text.includes('petrol') || text.includes('diesel') || text.includes('bus') || text.includes('train') || text.includes('transport') || text.includes('cab') || text.includes('irctc') || text.includes('flight') || text.includes('indigo') || text.includes('air') || text.includes('auto')) return 'Transport';
  if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('shopping') || text.includes('store') || text.includes('mart') || text.includes('zara') || text.includes('h&m') || text.includes('purchase') || text.includes('retail') || text.includes('mall') || text.includes('apparel') || text.includes('cloth')) return 'Shopping';
  if (text.includes('netflix') || text.includes('spotify') || text.includes('prime') || text.includes('hotstar') || text.includes('cinema') || text.includes('movie') || text.includes('pvr') || text.includes('inox') || text.includes('entertainment') || text.includes('game') || text.includes('apple.com/bill') || text.includes('google play') || text.includes('youtube')) return 'Entertainment';
  if (text.includes('grocery') || text.includes('blinkit') || text.includes('zepto') || text.includes('instamart') || text.includes('supermarket') || text.includes('bigbasket') || text.includes('vegetables') || text.includes('milk') || text.includes('household') || text.includes('dmart') || text.includes('rent') || text.includes('electricity') || text.includes('maintenance')) return 'Household';
  if (text.includes('hospital') || text.includes('pharmacy') || text.includes('medical') || text.includes('doctor') || text.includes('medicine') || text.includes('apollo') || text.includes('health') || text.includes('gym') || text.includes('fitness') || text.includes('cult') || text.includes('moisturizer') || text.includes('cream')) return 'Health';
  if (text.includes('school') || text.includes('college') || text.includes('course') || text.includes('tuition') || text.includes('books') || text.includes('udemy') || text.includes('education') || text.includes('exam') || text.includes('notebook') || text.includes('pen') || text.includes('stationery')) return 'Education';
  if (text.includes('salon') || text.includes('spa') || text.includes('beauty') || text.includes('parlour') || text.includes('cosmetics') || text.includes('nykaa')) return 'Beauty';
  if (text.includes('pet') || text.includes('vet') || text.includes('dog') || text.includes('cat')) return 'Pets';
  if (text.includes('friend') || text.includes('party') || text.includes('club') || text.includes('social') || text.includes('bar') || text.includes('pub')) return 'Social Life';
  if (text.includes('gift') || text.includes('present') || text.includes('donation') || text.includes('charity')) return 'Gift';

  return 'Other';
}

export function parseFlexibleDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date && !isNaN(val.getTime())) return val.toISOString();

  if (typeof val === 'number') {
    // Excel serial date code
    if (val > 25000 && val < 75000) {
      const utc_days = Math.floor(val - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      if (!isNaN(date_info.getTime())) return date_info.toISOString();
    }
  }

  const str = String(val).trim();
  if (!str) return new Date().toISOString();

  // Format: 25-08-2026 00:32:08 or 25-08-2026 or 25/08/2026
  const dmyMatch = str.match(/^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

    let day = p1;
    let month = p2 - 1;
    if (p2 > 12 && p1 <= 12) {
      month = p1 - 1;
      day = p2;
    }
    const d = new Date(year, month, day, hour, min, sec);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // Format: 25-Aug-2026 or 25 May 2025
  const monthNameMatch = str.match(/(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})/);
  if (monthNameMatch) {
    const day = parseInt(monthNameMatch[1], 10);
    const mStr = monthNameMatch[2].toLowerCase();
    let year = parseInt(monthNameMatch[3], 10);
    if (year < 100) year += 2000;
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mIdx = months.findIndex(m => mStr.startsWith(m));
    if (mIdx !== -1) {
      const d = new Date(year, mIdx, day);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  // Format: YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/\-. ](\d{1,2})[/\-. ](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  const standard = new Date(str);
  if (!isNaN(standard.getTime())) return standard.toISOString();

  return new Date().toISOString();
}

export function parseFlexibleAmount(val: any): { amount: number; isNegative: boolean; isDr: boolean; isCr: boolean } {
  if (val === null || val === undefined || val === '') {
    return { amount: 0, isNegative: false, isDr: false, isCr: false };
  }

  if (typeof val === 'number') {
    return {
      amount: Math.abs(val),
      isNegative: val < 0,
      isDr: val < 0,
      isCr: val > 0
    };
  }

  const str = String(val).trim();
  const lower = str.toLowerCase();

  const isDr = lower.includes('(dr)') || lower.includes(' dr') || lower.endsWith('dr') || lower === 'expense' || lower === 'debit';
  const isCr = lower.includes('(cr)') || lower.includes(' cr') || lower.endsWith('cr') || lower === 'income' || lower === 'credit';
  const isParenthesesNegative = str.startsWith('(') && str.endsWith(')');

  const cleaned = str.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  const isValid = !isNaN(num);
  const rawNum = isValid ? num : 0;
  const isNegative = rawNum < 0 || isParenthesesNegative || isDr;

  return {
    amount: Math.abs(rawNum),
    isNegative,
    isDr,
    isCr
  };
}

export async function parseExcelOrCsv(file: File): Promise<Transaction[]> {
  const baseTs = Date.now();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded spreadsheet contains no sheets.');
  }

  let bestTransactions: Transaction[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rawMatrix || rawMatrix.length === 0) continue;

    let headerRowIdx = -1;
    let colIndices = {
      date: -1,
      desc: -1,
      note: -1,
      debit: -1,
      credit: -1,
      amount: -1,
      type: -1,
      category: -1,
      account: -1,
      balance: -1
    };

    // Scan top 35 rows for the table header row
    for (let r = 0; r < Math.min(rawMatrix.length, 35); r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const tempCols = {
        date: -1,
        desc: -1,
        note: -1,
        debit: -1,
        credit: -1,
        amount: -1,
        type: -1,
        category: -1,
        account: -1,
        balance: -1
      };

      row.forEach((rawCell, colIdx) => {
        if (!rawCell) return;
        const cell = String(rawCell).toLowerCase().trim();

        // 1. Date
        if (
          ['date', 'txn date', 'transaction date', 'value date', 'entry date', 'posting date', 'time', 'dt', 'booking date'].includes(cell) ||
          cell.includes('date') || 
          cell.includes('txn dt') || 
          cell === 'dt'
        ) {
          if (tempCols.date === -1) tempCols.date = colIdx;
        }
        // 2. Type Column (Income/Expense, Type, Transaction Type)
        else if (
          cell === 'income/expense' || 
          cell === 'expense/income' || 
          cell === 'income / expense' || 
          cell === 'type' || 
          cell === 'txn type' || 
          cell === 'transaction type' || 
          cell === 'tran type' || 
          cell === 'dr/cr' || 
          cell === 'cr/dr' || 
          cell === 'd/c' ||
          cell.includes('income/expense') ||
          cell.includes('dr/cr')
        ) {
          if (tempCols.type === -1) tempCols.type = colIdx;
        }
        // 3. Note Column (Specific user column)
        else if (cell === 'note' || cell === 'notes' || cell === 'remark' || cell === 'remarks' || cell === 'memo' || cell.includes('user note')) {
          if (tempCols.note === -1) tempCols.note = colIdx;
        }
        // 4. Description / Narration / Particulars
        else if (
          cell === 'description' || 
          cell === 'narration' || 
          cell === 'particulars' || 
          cell === 'particular' || 
          cell === 'details' || 
          cell === 'merchant' || 
          cell === 'title' || 
          cell === 'payee' || 
          cell === 'party' || 
          cell === 'beneficiary' ||
          cell.includes('desc') ||
          cell.includes('narrat') ||
          cell.includes('particular') ||
          cell.includes('detail') ||
          cell.includes('merchant') ||
          cell.includes('payee') ||
          cell.includes('party') ||
          cell.includes('beneficiary')
        ) {
          if (tempCols.desc === -1) tempCols.desc = colIdx;
        }
        // 5. Debit Column (Explicit Withdrawal)
        else if (
          cell === 'debit' || 
          cell === 'withdrawal' || 
          cell === 'withdrawal amt' || 
          cell === 'withdrawal amount' || 
          cell === 'debit amt' || 
          cell === 'debit amount' || 
          cell === 'paid out' || 
          cell === 'spent' || 
          cell === 'dr' ||
          cell.includes('debit') ||
          cell.includes('withdrawal') ||
          cell.includes('paid out') ||
          cell.includes('(dr)') ||
          cell.endsWith(' dr')
        ) {
          if (tempCols.debit === -1) tempCols.debit = colIdx;
        }
        // 6. Credit Column (Explicit Deposit)
        else if (
          cell === 'credit' || 
          cell === 'deposit' || 
          cell === 'deposit amt' || 
          cell === 'deposit amount' || 
          cell === 'credit amt' || 
          cell === 'credit amount' || 
          cell === 'paid in' || 
          cell === 'received' || 
          cell === 'cr' ||
          cell.includes('credit') ||
          cell.includes('deposit') ||
          cell.includes('paid in') ||
          cell.includes('(cr)') ||
          cell.endsWith(' cr')
        ) {
          if (tempCols.credit === -1) tempCols.credit = colIdx;
        }
        // 7. Amount / INR Column
        else if (
          cell === 'amount' || 
          cell === 'amount (inr)' || 
          cell === 'amount (rs)' || 
          cell === 'amount (₹)' || 
          cell === 'txn amount' || 
          cell === 'transaction amount' || 
          cell === 'net amount' || 
          cell === 'total' || 
          cell === 'amt' || 
          cell === 'inr' || 
          cell === 'rs' || 
          cell === 'value' ||
          cell.includes('amount') ||
          cell.includes('amt')
        ) {
          if (tempCols.amount === -1 || cell === 'amount' || cell.includes('amount')) {
            tempCols.amount = colIdx;
          }
        }
        // 8. Category
        else if (cell === 'category' || cell === 'cat' || cell === 'expense category' || cell === 'category name' || cell === 'tag' || cell === 'group' || cell.includes('category')) {
          if (tempCols.category === -1) tempCols.category = colIdx;
        }
        // 9. Account / Wallet / Mode
        else if (cell === 'account' || cell === 'wallet' || cell === 'payment mode' || cell === 'mode' || cell === 'bank' || cell === 'payment method' || cell === 'account name' || cell.includes('account') || cell.includes('wallet')) {
          if (tempCols.account === -1) tempCols.account = colIdx;
        }
        // 10. Balance
        else if (cell === 'balance' || cell === 'closing balance' || cell === 'available balance' || cell === 'running balance' || cell.includes('balance')) {
          if (tempCols.balance === -1) tempCols.balance = colIdx;
        }
      });

      const hasDateOrDesc = tempCols.date !== -1 || tempCols.desc !== -1 || tempCols.note !== -1;
      const hasMoneyCol = tempCols.amount !== -1 || tempCols.debit !== -1 || tempCols.credit !== -1;

      if (hasDateOrDesc && hasMoneyCol) {
        headerRowIdx = r;
        colIndices = tempCols;
        break;
      }
    }

    if (headerRowIdx === -1) {
      // Fallback: check if row 0 has data that looks like date and amount
      const sampleRow = rawMatrix[0];
      if (sampleRow && Array.isArray(sampleRow)) {
        sampleRow.forEach((c, idx) => {
          const s = String(c || '').trim();
          if (colIndices.date === -1 && (c instanceof Date || /\d{1,4}[/\-. ]\d{1,2}[/\-. ]\d{1,4}/.test(s))) {
            colIndices.date = idx;
          } else if (colIndices.amount === -1 && (typeof c === 'number' || /^[₹$€£\s]*[0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?$/.test(s))) {
            colIndices.amount = idx;
          } else if (colIndices.desc === -1 && typeof c === 'string' && s.length > 2 && isNaN(Number(s))) {
            colIndices.desc = idx;
          }
        });
      }
      headerRowIdx = 0;
    }

    // Parse Data Rows
    const sheetTxns: Transaction[] = [];

    for (let r = headerRowIdx + 1; r < rawMatrix.length; r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawDate = colIndices.date !== -1 ? row[colIndices.date] : undefined;
      const rawNote = colIndices.note !== -1 ? String(row[colIndices.note] || '').trim() : '';
      const rawDescCol = colIndices.desc !== -1 ? String(row[colIndices.desc] || '').trim() : '';
      const rawDebit = colIndices.debit !== -1 ? row[colIndices.debit] : undefined;
      const rawCredit = colIndices.credit !== -1 ? row[colIndices.credit] : undefined;
      const rawAmount = colIndices.amount !== -1 ? row[colIndices.amount] : undefined;
      const rawType = colIndices.type !== -1 ? String(row[colIndices.type] || '').trim().toLowerCase() : '';
      const rawCat = colIndices.category !== -1 ? String(row[colIndices.category] || '').trim() : '';
      const rawAcc = colIndices.account !== -1 ? String(row[colIndices.account] || '').trim().toLowerCase() : '';

      // Prefer Note if Description column is empty
      const desc = rawNote || rawDescCol || `Transaction #${r}`;
      if (!desc || desc === `Transaction #${r}` && !rawDate && !rawAmount) continue;

      const lowerDesc = desc.toLowerCase();
      if (lowerDesc.includes('total') || lowerDesc.includes('closing balance') || lowerDesc.includes('opening balance') || lowerDesc.startsWith('***')) {
        continue;
      }

      let amount = 0;
      let type: 'debit' | 'credit' = 'debit';

      const debitParsed = parseFlexibleAmount(rawDebit);
      const creditParsed = parseFlexibleAmount(rawCredit);
      const amountParsed = parseFlexibleAmount(rawAmount);

      // Check explicit Income/Expense or Type column first!
      if (rawType) {
        if (rawType.includes('expense') || rawType.includes('debit') || rawType.includes('dr') || rawType.includes('out') || rawType.includes('withdrawal')) {
          type = 'debit';
        } else if (rawType.includes('income') || rawType.includes('credit') || rawType.includes('cr') || rawType.includes('in') || rawType.includes('deposit')) {
          type = 'credit';
        }
      } else if (debitParsed.amount > 0 && creditParsed.amount === 0) {
        type = 'debit';
      } else if (creditParsed.amount > 0 && debitParsed.amount === 0) {
        type = 'credit';
      } else if (amountParsed.isDr || amountParsed.isNegative) {
        type = 'debit';
      } else if (amountParsed.isCr) {
        type = 'credit';
      } else if (lowerDesc.includes('salary') || lowerDesc.includes('received') || lowerDesc.includes('refund')) {
        type = 'credit';
      } else {
        type = 'debit';
      }

      // Determine amount number
      if (debitParsed.amount > 0 && type === 'debit') {
        amount = debitParsed.amount;
      } else if (creditParsed.amount > 0 && type === 'credit') {
        amount = creditParsed.amount;
      } else if (amountParsed.amount > 0) {
        amount = amountParsed.amount;
      } else if (debitParsed.amount > 0) {
        amount = debitParsed.amount;
      } else if (creditParsed.amount > 0) {
        amount = creditParsed.amount;
      }

      if (amount <= 0) continue;

      const date = parseFlexibleDate(rawDate);
      
      // Clean category
      let category: Category = 'Other';
      if (rawCat) {
        category = cleanCategoryString(rawCat);
      }
      if (category === 'Other') {
        category = inferCategory(desc, type === 'credit');
      }

      // Account: if specifies cash -> acc-1, else default to acc-2 (UPI)
      const accountId = rawAcc.includes('cash') ? 'acc-1' : 'acc-2';

      sheetTxns.push({
        id: `import-xlsx-${baseTs}-${r}-${Math.random().toString(36).slice(2, 7)}`,
        accountId,
        title: desc,
        merchant: desc,
        category,
        amount,
        type,
        date,
        status: 'cleared'
      });
    }

    if (sheetTxns.length > bestTransactions.length) {
      bestTransactions = sheetTxns;
    }
  }

  if (bestTransactions.length === 0) {
    throw new Error('Could not identify valid transactions in this file. Please verify Date, Note/Description, and Amount or Income/Expense columns.');
  }

  return bestTransactions;
}

export async function parsePdfStatement(file: File): Promise<Transaction[]> {
  const baseTs = Date.now();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let allLines: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const items = textContent.items as Array<{ str: string; transform: number[] }>;
    const lineMap = new Map<number, string[]>();

    items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push(item.str.trim());
    });

    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    sortedY.forEach(y => {
      const lineStr = lineMap.get(y)!.join(' ');
      if (lineStr.trim()) allLines.push(lineStr);
    });
  }

  if (allLines.length === 0) {
    throw new Error('No text could be extracted from this PDF. It may be a scanned image or protected.');
  }

  const transactions: Transaction[] = [];

  const dateRegex = /(\b\d{1,2}[/\-.][A-Za-z0-9]{2,3}[/\-.]\d{2,4}\b|\b\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}\b)/;
  const amountRegex = /(?:₹\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/g;

  allLines.forEach((line, idx) => {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) return;

    const rawDateStr = dateMatch[0];
    const parsedDate = parseFlexibleDate(rawDateStr);

    const numberMatches = Array.from(line.matchAll(amountRegex))
      .map(m => m[1])
      .filter(m => m && !m.includes('/') && !m.includes('-'))
      .map(m => parseFlexibleAmount(m).amount)
      .filter(m => m > 0 && m !== parseInt(rawDateStr, 10));

    if (numberMatches.length === 0) return;

    const amount = numberMatches[0];
    if (amount < 1 || amount > 50000000) return;

    let desc = line
      .replace(rawDateStr, '')
      .replace(/[₹0-9,.]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!desc || desc.length < 2) {
      desc = `Statement Transaction #${idx + 1}`;
    }

    const lower = line.toLowerCase();
    const isCredit = lower.includes('cr') || lower.includes('credit') || lower.includes('salary') || lower.includes('deposit') || lower.includes('received') || lower.includes('refund') || lower.includes('income');
    const type: 'debit' | 'credit' = isCredit ? 'credit' : 'debit';

    const category = inferCategory(desc, type === 'credit');
    const accountId = lower.includes('cash') ? 'acc-1' : 'acc-2';

    transactions.push({
      id: `import-pdf-${baseTs}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      accountId,
      title: desc,
      merchant: desc,
      category,
      amount,
      type,
      date: parsedDate,
      status: 'cleared',
    });
  });

  if (transactions.length === 0) {
    throw new Error('Found PDF text, but could not detect structured transaction rows (Date & Amount columns).');
  }

  return transactions;
}

export function downloadSampleTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const makeDateStr = (daysAgo: number, timeStr: string) => {
    const d = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - daysAgo));
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${timeStr}`;
  };

  const sampleData = [
    {
      Date: makeDateStr(0, '10:32:08'),
      Account: 'Accounts',
      Category: 'Food',
      Note: 'Cold drink',
      'Income/Expense': 'Expense',
      Amount: 20
    },
    {
      Date: makeDateStr(1, '16:30:49'),
      Account: 'Accounts',
      Category: 'Food',
      Note: 'Coffee',
      'Income/Expense': 'Expense',
      Amount: 35
    },
    {
      Date: makeDateStr(2, '13:28:18'),
      Account: 'Accounts',
      Category: 'Education',
      Note: 'Notebook',
      'Income/Expense': 'Expense',
      Amount: 35
    },
    {
      Date: makeDateStr(3, '14:50:24'),
      Account: 'Cash',
      Category: 'Food',
      Note: 'Pulav',
      'Income/Expense': 'Expense',
      Amount: 65
    },
    {
      Date: makeDateStr(4, '17:55:57'),
      Account: 'Cash',
      Category: 'Other',
      Note: 'Allowance Received',
      'Income/Expense': 'Income',
      Amount: 1600
    },
    {
      Date: makeDateStr(5, '17:51:05'),
      Account: 'Accounts',
      Category: 'Other',
      Note: 'Salary Transfer',
      'Income/Expense': 'Income',
      Amount: 8300
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SmartSpend_Sample_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, 'SmartSpend_Sample_Template.xlsx');
  }
}
