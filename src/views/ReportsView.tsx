import React, { useState } from 'react';
import {
  FileBarChart2,
  Calendar,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Wallet,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Customer, CustomerTransaction, Expense, Language, Product, Sale, ShopSettings } from '../types';
import { downloadCSV, formatDate, formatPKR, getTodayDateString } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface Props {
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  transactions: CustomerTransaction[];
  settings: ShopSettings;
  language: Language;
}

export const ReportsView: React.FC<Props> = ({
  sales,
  expenses,
  customers,
  transactions,
  settings,
  language,
}) => {
  const t = getTranslation(language);
  const today = getTodayDateString();

  const [reportPeriod, setReportPeriod] = useState<'today' | 'this_month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(today);

  // Filter ranges
  const filteredSales = sales.filter((s) => {
    if (reportPeriod === 'today') return s.date === today;
    if (reportPeriod === 'this_month') return s.date.startsWith(today.substring(0, 7));
    if (reportPeriod === 'custom') return s.date >= customStartDate && s.date <= customEndDate;
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (reportPeriod === 'today') return e.date === today;
    if (reportPeriod === 'this_month') return e.date.startsWith(today.substring(0, 7));
    if (reportPeriod === 'custom') return e.date >= customStartDate && e.date <= customEndDate;
    return true;
  });

  const filteredCustomerPayments = transactions.filter((tx) => {
    if (tx.type !== 'got_payment') return false;
    if (reportPeriod === 'today') return tx.date === today;
    if (reportPeriod === 'this_month') return tx.date.startsWith(today.substring(0, 7));
    if (reportPeriod === 'custom') return tx.date >= customStartDate && tx.date <= customEndDate;
    return true;
  });

  // Financial Calculations
  const grossSales = filteredSales.reduce((acc, s) => acc + s.amount, 0);
  const costOfGoods = filteredSales.reduce((acc, s) => acc + (s.costAmount || 0), 0);
  const grossProfit = grossSales - costOfGoods;
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netEstimatedProfit = grossProfit - totalExpenses;
  const profitMargin = grossSales > 0 ? Math.round((netEstimatedProfit / grossSales) * 100) : 0;

  // Breakdown by payment mode
  const cashSales = filteredSales
    .filter((s) => s.paymentType === 'cash')
    .reduce((acc, s) => acc + s.amount, 0);
  const creditSales = filteredSales
    .filter((s) => s.paymentType === 'credit')
    .reduce((acc, s) => acc + s.amount, 0);
  const onlineSales = filteredSales
    .filter((s) => s.paymentType === 'online')
    .reduce((acc, s) => acc + s.amount, 0);

  // Cash in drawer
  const customerRecoveriesCash = filteredCustomerPayments.reduce((acc, tx) => acc + tx.amount, 0);
  const cashExpenses = filteredExpenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((acc, e) => acc + e.amount, 0);
  const netCashInflow = cashSales + customerRecoveriesCash - cashExpenses;

  // Total customer debt
  const totalCustomerDebt = customers.reduce((acc, c) => acc + Math.max(0, c.balance), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const periodLabel =
      reportPeriod === 'today'
        ? `Daily_${today}`
        : reportPeriod === 'this_month'
        ? `Monthly_${today.substring(0, 7)}`
        : `Custom_${customStartDate}_to_${customEndDate}`;

    const headers = ['Financial Metric (شعبہ)', 'Value in PKR (رقم روپے)'];
    const rows = [
      ['Gross Sales Revenue (کل فروخت)', grossSales.toString()],
      ['Cost of Goods Sold (لاگت مال)', costOfGoods.toString()],
      ['Gross Profit (خام منافع)', grossProfit.toString()],
      ['Operating Expenses (دکانی اخراجات)', totalExpenses.toString()],
      ['Net Estimated Profit (خالص منافع)', netEstimatedProfit.toString()],
      ['Profit Margin % (شرح منافع)', `${profitMargin}%`],
      ['Cash Sales (نقد فروخت)', cashSales.toString()],
      ['Credit Sales (ادھار فروخت)', creditSales.toString()],
      ['Customer Cash Recoveries (ادھار وصولیاں)', customerRecoveriesCash.toString()],
      ['Cash Expenses Paid (نقد اخراجات)', cashExpenses.toString()],
      ['Net Cash Inflow (خالص کیش دراز)', netCashInflow.toString()],
      ['Total Outstanding Customer Credit (کل گاہک بقایا)', totalCustomerDebt.toString()],
    ];

    downloadCSV(`HisabDost_Report_${periodLabel}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
      {/* Top Banner (Hidden in print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-emerald-700" />
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ur'
              ? 'روزانہ کی حساب بندش، منافع کا تخمینہ اور کیش کی گنتی'
              : 'Daily closing statement, net estimated profit, and cash drawer reconciliation'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>{t.print}</span>
          </button>
        </div>
      </div>

      {/* Period Selection Tabs (Hidden in print) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setReportPeriod('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              reportPeriod === 'today'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.today} (Daily)
          </button>

          <button
            onClick={() => setReportPeriod('this_month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              reportPeriod === 'this_month'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.thisMonth} (Monthly)
          </button>

          <button
            onClick={() => setReportPeriod('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              reportPeriod === 'custom'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            مخصوص تاریخ
          </button>
        </div>

        {reportPeriod === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 font-numeric text-xs"
            />
            <span>تا</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 font-numeric text-xs"
            />
          </div>
        )}
      </div>

      {/* Printable Statement Document */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm print:p-2 print:border-none print:shadow-none space-y-6">
        {/* Document Header */}
        <div className="text-center pb-4 border-b-2 border-dashed border-slate-200">
          <h1 className="text-2xl font-black text-slate-900">
            {settings.shopName || 'مدینہ کریانہ اسٹور'}
          </h1>
          <p className="text-sm font-bold text-emerald-800 mt-0.5">
            {t.dailyClosing}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-2">
            <span>
              <strong>تاریخ:</strong> {formatDate(today)}
            </span>
            {settings.phone && (
              <span>
                <strong>فون:</strong> {settings.phone}
              </span>
            )}
            {settings.city && <span>{settings.city}</span>}
          </div>
        </div>

        {/* Big Profit Statement Card */}
        <div
          className={`p-5 rounded-2xl border text-center ${
            netEstimatedProfit >= 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <span className="text-xs uppercase font-bold tracking-wider block">
            {t.netProfit} (خالص منافع)
          </span>
          <div className="text-3xl sm:text-4xl font-black font-numeric my-1">
            ₨ {formatPKR(netEstimatedProfit)}
          </div>
          <span className="text-xs font-semibold">
            {t.profitMargin}: <strong className="font-numeric">{profitMargin}%</strong>
          </span>
        </div>

        {/* Profit & Loss Calculation Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            {t.financialSummary} (نفع و نقصان کی تفصیل)
          </h3>
          <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              <span>{t.grossSales} (کل فروخت)</span>
              <span className="font-numeric text-sm text-emerald-800">
                + ₨ {formatPKR(grossSales)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border-b border-slate-200 text-slate-700">
              <span>منفی: {t.costOfGoods} (فروخت شدہ مال کی لاگت)</span>
              <span className="font-numeric text-slate-600">
                - ₨ {formatPKR(costOfGoods)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-100/60 border-b border-slate-200 font-bold text-slate-900">
              <span>{t.grossProfit} (خام منافع)</span>
              <span className="font-numeric text-sm">
                ₨ {formatPKR(grossProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border-b border-slate-200 text-rose-700">
              <span>منفی: {t.totalExpenses} (دکان کے تمام اخراجات)</span>
              <span className="font-numeric font-bold">
                - ₨ {formatPKR(totalExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-100/50 font-black text-emerald-950 text-sm">
              <span>{t.netProfit} (خالص متوقع منافع)</span>
              <span className="font-numeric text-base text-emerald-900">
                ₨ {formatPKR(netEstimatedProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Cash in Drawer Reconciliation */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            کیش دراز کا حساب (Cash In Drawer Reconciliation)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                کیش کی آمد (Cash In)
              </span>
              <div className="flex justify-between">
                <span>نقد فروخت (Cash Sales):</span>
                <span className="font-numeric font-bold">₨ {formatPKR(cashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>ادھار کیش وصولی (Customer Payments):</span>
                <span className="font-numeric font-bold">₨ {formatPKR(customerRecoveriesCash)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                کیش کی روانگی و باقی (Cash Out & Balance)
              </span>
              <div className="flex justify-between text-rose-700">
                <span>نقد اخراجات (Cash Expenses):</span>
                <span className="font-numeric font-bold">- ₨ {formatPKR(cashExpenses)}</span>
              </div>
              <div className="flex justify-between font-black text-emerald-900 pt-1 border-t border-slate-200">
                <span>دراز میں کیش (Net Inflow):</span>
                <span className="font-numeric text-sm">₨ {formatPKR(netCashInflow)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Credit Summary */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-purple-900 block">{t.totalUdhaar}</span>
            <span className="text-[11px] text-purple-700">
              کل گاہک جن کے ذمے رقم واجب الادا ہے
            </span>
          </div>
          <div className="text-lg font-black text-purple-950 font-numeric">
            ₨ {formatPKR(totalCustomerDebt)}
          </div>
        </div>

        {/* Verification Signatures (for paper print) */}
        <div className="pt-8 grid grid-cols-2 gap-6 text-center text-xs text-slate-600 print-only">
          <div className="border-t border-slate-400 pt-1">
            دستخط دکاندار / کیشیئر
          </div>
          <div className="border-t border-slate-400 pt-1">
            دستخط مالک / پڑتال کنندہ
          </div>
        </div>
      </div>
    </div>
  );
};
