import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Users,
  Wallet,
  AlertTriangle,
  PlusCircle,
  Receipt,
  ShoppingCart,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { Customer, CustomerTransaction, Expense, Language, Product, Sale } from '../types';
import { formatPKR, getTodayDateString } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface Props {
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  products: Product[];
  transactions: CustomerTransaction[];
  language: Language;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onOpenAddKhata: () => void;
  onOpenNewCustomer: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const DashboardView: React.FC<Props> = ({
  sales,
  expenses,
  customers,
  products,
  transactions,
  language,
  onOpenAddSale,
  onOpenAddExpense,
  onOpenAddKhata,
  onOpenNewCustomer,
  onNavigateTab,
  onSelectCustomer,
}) => {
  const t = getTranslation(language);
  const today = getTodayDateString();

  // Calculations for Today
  const todaySalesList = sales.filter((s) => s.date === today);
  const todayExpensesList = expenses.filter((e) => e.date === today);

  const todaySalesTotal = todaySalesList.reduce((acc, s) => acc + (s.amount || 0), 0);
  const todayExpensesTotal = todayExpensesList.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Profit calculation: (Today Sales - COGS for today sales) - Today Expenses
  const todayCostOfGoods = todaySalesList.reduce((acc, s) => acc + (s.costAmount || 0), 0);
  const todayGrossProfit = todaySalesTotal - todayCostOfGoods;
  const todayEstimatedProfit = todayGrossProfit - todayExpensesTotal;

  // Total customer credit due
  const totalUdhaarDue = customers.reduce((acc, c) => acc + Math.max(0, c.balance || 0), 0);
  const customersOwingCount = customers.filter((c) => (c.balance || 0) > 0).length;

  // Cash in drawer estimation for today:
  // Today cash sales + today customer cash payments received - today cash expenses
  const cashSalesToday = todaySalesList
    .filter((s) => s.paymentType === 'cash')
    .reduce((acc, s) => acc + s.amount, 0);
  const customerPaymentsToday = (transactions || [])
    .filter((tx) => tx.type === 'got_payment' && tx.date === today)
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const cashExpensesToday = todayExpensesList
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((acc, e) => acc + e.amount, 0);
  const estimatedCashInHand = cashSalesToday + customerPaymentsToday - cashExpensesToday;

  // Low stock items
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity <= (p.minStockThreshold || 5)
  );

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
      {/* Welcome / Counter Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
            {t.today}: {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {language === 'ur' ? 'آج کی دکانداری کا جائزہ' : "Today's Business Summary"}
          </h2>
        </div>

        {/* Cash in Hand Quick Badge */}
        <div className="flex items-center gap-3 bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-xs self-start sm:self-auto">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wide">
              {t.cashInHand}
            </div>
            <div className="text-base font-black font-numeric text-white">
              ₨ {formatPKR(Math.max(0, estimatedCashInHand))}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Sales */}
        <div
          onClick={() => onNavigateTab('sales')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{t.todaySales}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-800 font-numeric">
            ₨ {formatPKR(todaySalesTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{todaySalesList.length} {language === 'ur' ? 'گاہک' : 'bills'}</span>
          </div>
        </div>

        {/* Today's Expenses */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-xs hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{t.todayExpenses}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-700 font-numeric">
            ₨ {formatPKR(todayExpensesTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{todayExpensesList.length} {language === 'ur' ? 'اخراجات' : 'items'}</span>
          </div>
        </div>

        {/* Today's Estimated Profit */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-100 shadow-xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{t.todayProfit}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-lg sm:text-2xl font-black font-numeric ${
              todayEstimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            ₨ {formatPKR(todayEstimatedProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>
              {todaySalesTotal > 0
                ? `${Math.round((todayEstimatedProfit / todaySalesTotal) * 100)}% ${t.profitMargin}`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Customer Udhaar Due */}
        <div
          onClick={() => onNavigateTab('khata')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-100 shadow-xs hover:border-purple-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{t.totalUdhaar}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-purple-900 font-numeric">
            ₨ {formatPKR(totalUdhaarDue)}
          </div>
          <div className="text-[11px] text-purple-700 mt-1 font-semibold">
            <span>{customersOwingCount} {t.customersOwing}</span>
          </div>
        </div>
      </div>

      {/* Big Touch-Friendly Quick Action Buttons (Counter Ergonomics) */}
      <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {language === 'ur' ? 'تیز رفتار اندراج (Quick Actions)' : 'Quick Counter Actions'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Add Sale Button */}
          <button
            onClick={onOpenAddSale}
            className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm shadow-md transition"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.quickAddSale}</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={onOpenAddExpense}
            className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm shadow-md transition"
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.quickAddExpense}</span>
          </button>

          {/* Khata Entry Button */}
          <button
            onClick={onOpenAddKhata}
            className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-sm shadow-md transition"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.quickAddKhata}</span>
          </button>

          {/* New Customer Button */}
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 text-slate-100 font-bold text-sm transition"
          >
            <UserPlus className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">{t.quickNewCustomer}</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h4 className="font-bold text-sm">
                {t.lowStockAlerts} ({lowStockProducts.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-0.5"
            >
              <span>{t.viewAll}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {lowStockProducts.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white/90 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
              >
                <div className="truncate">
                  <div className="font-bold text-slate-800 truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-500 font-numeric">
                    {language === 'ur' ? 'باقی: ' : 'Left: '}
                    <strong className="text-amber-700">{item.stockQuantity} {item.unit}</strong>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold shrink-0"
                >
                  {language === 'ur' ? '+ منگوائیں' : 'Reorder'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Column: Top Debtors & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Debtors (گاہک بقایا) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">{t.topDebtors}</h3>
            </div>
            <button
              onClick={() => onNavigateTab('khata')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              {t.viewAll}
            </button>
          </div>

          {customers.filter((c) => c.balance > 0).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {language === 'ur' ? 'ماشاءاللہ، کسی گاہک کے ذمہ ادھار نہیں ہے' : 'No customers have outstanding credit'}
            </div>
          ) : (
            <div className="space-y-2">
              {customers
                .filter((c) => c.balance > 0)
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 4)
                .map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800">{cust.name}</div>
                      <div className="text-[11px] text-slate-500 font-numeric">{cust.phone || '—'}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-black text-sm text-purple-900 font-numeric">
                        ₨ {formatPKR(cust.balance)}
                      </div>
                      <span className="text-[10px] text-purple-700 font-semibold">
                        {t.youWillReceive}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Sales List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">{t.recentSales}</h3>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              {t.viewAll}
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {t.noDataFound}
            </div>
          ) : (
            <div className="space-y-2">
              {sales.slice(0, 4).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-800 truncate">
                      {sale.customerName || (sale.items && sale.items.length > 0 ? sale.items.map(i => i.name).join(', ') : t.paymentCash)}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-numeric">{sale.time || sale.date}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        sale.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-800' :
                        sale.paymentType === 'credit' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {sale.paymentType === 'cash' ? t.paymentCash : sale.paymentType === 'credit' ? t.paymentCredit : t.paymentOnline}
                      </span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="font-black text-sm text-emerald-800 font-numeric">
                      ₨ {formatPKR(sale.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
