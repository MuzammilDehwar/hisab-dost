import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  Edit2,
  X,
  PieChart,
} from 'lucide-react';
import { Expense, ExpenseCategory, Language, ShopSettings } from '../types';
import { downloadCSV, formatDate, formatPKR, getTodayDateString } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface Props {
  expenses: Expense[];
  settings: ShopSettings;
  language: Language;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  showAddModalDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
}

export const ExpensesView: React.FC<Props> = ({
  expenses,
  settings,
  language,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  showAddModalDirectly = false,
  onCloseAddModalDirectly,
}) => {
  const t = getTranslation(language);
  const today = getTodayDateString();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'month' | 'all'>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(showAddModalDirectly);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('chai_refreshment');
  const [expenseDate, setExpenseDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (showAddModalDirectly) {
      setShowAddModal(true);
    }
  }, [showAddModalDirectly]);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  const categoryLabels: Record<ExpenseCategory, string> = {
    rent: t.categoryRent,
    utilities: t.categoryUtilities,
    transport: t.categoryTransport,
    salary: t.categorySalary,
    packaging: t.categoryPackaging,
    chai_refreshment: t.categoryChai,
    maintenance: t.categoryMaintenance,
    other: t.categoryOther,
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (dateFilter === 'today' && e.date !== today) return false;
    if (dateFilter === 'yesterday' && e.date !== yStr) return false;
    if (dateFilter === 'month') {
      const currentMonth = today.substring(0, 7);
      if (!e.date.startsWith(currentMonth)) return false;
    }
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (searchTerm && !e.notes?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown calculation
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert(language === 'ur' ? 'برائے مہربانی درست رقم درج کریں' : 'Please enter a valid amount');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (editingExpense) {
      onEditExpense({
        ...editingExpense,
        amount: amt,
        category,
        date: expenseDate,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      setEditingExpense(null);
    } else {
      onAddExpense({
        amount: amt,
        category,
        date: expenseDate,
        time: timeStr,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    }

    setAmount('');
    setNotes('');
    setShowAddModal(false);
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
  };

  const handleExportCSV = () => {
    const headers = [
      'Date (تاریخ)',
      'Category (قسم)',
      'Amount (رقم)',
      'Method (ادائیگی)',
      'Notes (تفصیل)',
    ];
    const rows = filteredExpenses.map((e) => [
      e.date,
      categoryLabels[e.category] || e.category,
      e.amount.toString(),
      e.paymentMethod,
      e.notes || '',
    ]);

    downloadCSV(`Expenses_Report_${dateFilter}_${today}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-600" />
            <span>{t.expensesRegister}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ur'
              ? 'دکان کا کرایہ، بل، ملازمین کی تنخواہ اور روزمرہ چائے پانی'
              : 'Track daily bills, wages, rent, freight, and packaging costs'}
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
            onClick={() => {
              setEditingExpense(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.quickAddExpense}</span>
          </button>
        </div>
      </div>

      {/* Summary Total Card */}
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-rose-800 uppercase block">
            {t.totalExpenses} ({dateFilter === 'today' ? t.today : dateFilter === 'month' ? t.thisMonth : t.allTime})
          </span>
          <span className="text-2xl font-black text-rose-950 font-numeric mt-1">
            ₨ {formatPKR(totalFilteredExpenses)}
          </span>
        </div>
        <div className="text-xs font-bold text-rose-700">
          {filteredExpenses.length} {language === 'ur' ? 'اندراجات' : 'records'}
        </div>
      </div>

      {/* Expense Breakdown by Category */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-600" />
            <span>{t.expenseBreakdown}</span>
          </h3>
          <div className="space-y-2">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amt]) => {
                const percent = Math.round((amt / (totalFilteredExpenses || 1)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>{categoryLabels[cat as ExpenseCategory] || cat}</span>
                      <span className="font-numeric">
                        ₨ {formatPKR(amt)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ur' ? 'خرچے کی تفصیل تلاش کریں...' : 'Search expense notes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-rose-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['today', 'yesterday', 'month', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                dateFilter === filter
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {filter === 'today'
                ? t.today
                : filter === 'yesterday'
                ? t.yesterday
                : filter === 'month'
                ? t.thisMonth
                : t.allTime}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700">{t.noDataFound}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-rose-200 transition flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-bold text-sm text-slate-900">
                  {categoryLabels[exp.category] || exp.category}
                </div>
                {exp.notes && <p className="text-xs text-slate-600 mt-0.5">{exp.notes}</p>}
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span className="font-numeric">{formatDate(exp.date)}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                    {exp.paymentMethod === 'cash' ? t.paymentCash : t.paymentOnline}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-base font-black text-rose-700 font-numeric">
                  ₨ {formatPKR(exp.amount)}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingExpense(exp);
                      setAmount(exp.amount.toString());
                      setCategory(exp.category);
                      setExpenseDate(exp.date);
                      setPaymentMethod(exp.paymentMethod);
                      setNotes(exp.notes || '');
                      setShowAddModal(true);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title={t.edit}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          language === 'ur' ? 'کیا آپ یہ خرچہ حذف کرنا چاہتے ہیں؟' : 'Delete this expense record?'
                        )
                      ) {
                        onDeleteExpense(exp.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {(showAddModal || editingExpense) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingExpense ? t.editExpenseTitle : t.addExpenseTitle}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingExpense(null);
                  if (onCloseAddModalDirectly) onCloseAddModalDirectly();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3.5 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.amount} *</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₨
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full ps-8 pe-4 py-3 rounded-xl border border-slate-300 text-lg font-black font-numeric text-slate-900 focus:border-rose-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.expenseCategory} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                >
                  <option value="chai_refreshment">{t.categoryChai}</option>
                  <option value="packaging">{t.categoryPackaging}</option>
                  <option value="transport">{t.categoryTransport}</option>
                  <option value="utilities">{t.categoryUtilities}</option>
                  <option value="rent">{t.categoryRent}</option>
                  <option value="salary">{t.categorySalary}</option>
                  <option value="maintenance">{t.categoryMaintenance}</option>
                  <option value="other">{t.categoryOther}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.date}</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ادائیگی</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'online')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    <option value="cash">{t.paymentCash}</option>
                    <option value="online">{t.paymentOnline}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.notes}</label>
                <input
                  type="text"
                  placeholder="مثلاً چائے بسکٹ یا بجلی کا بل"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingExpense(null);
                    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
                  }}
                  className="py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition active:scale-98"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
