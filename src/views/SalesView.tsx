import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
} from 'lucide-react';
import { Customer, Language, PaymentType, Product, Sale, SaleItem, ShopSettings } from '../types';
import { downloadCSV, formatDate, formatPKR, getTodayDateString } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { ReceiptModal } from '../components/ReceiptModal';

interface Props {
  sales: Sale[];
  customers: Customer[];
  products: Product[];
  settings: ShopSettings;
  language: Language;
  onAddSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
  showAddModalDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
}

export const SalesView: React.FC<Props> = ({
  sales,
  customers,
  products,
  settings,
  language,
  onAddSale,
  onEditSale,
  onDeleteSale,
  showAddModalDirectly = false,
  onCloseAddModalDirectly,
}) => {
  const t = getTranslation(language);
  const today = getTodayDateString();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(showAddModalDirectly);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Form state
  const [saleDate, setSaleDate] = useState(today);
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCost, setManualCost] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);

  // Item builder state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');

  // Trigger from parent
  React.useEffect(() => {
    if (showAddModalDirectly) {
      setShowAddModal(true);
    }
  }, [showAddModalDirectly]);

  // Yesterday date string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  // Filtering
  const filteredSales = sales.filter((s) => {
    // Date filter
    if (dateFilter === 'today' && s.date !== today) return false;
    if (dateFilter === 'yesterday' && s.date !== yStr) return false;
    if (dateFilter === 'month') {
      const currentMonth = today.substring(0, 7);
      if (!s.date.startsWith(currentMonth)) return false;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCustomer = s.customerName?.toLowerCase().includes(term);
      const matchNotes = s.notes?.toLowerCase().includes(term);
      const matchItem = s.items?.some((i) => i.name.toLowerCase().includes(term));
      if (!matchCustomer && !matchNotes && !matchItem) return false;
    }

    return true;
  });

  const totalFilteredSales = filteredSales.reduce((sum, s) => sum + s.amount, 0);
  const totalFilteredCost = filteredSales.reduce((sum, s) => sum + (s.costAmount || 0), 0);
  const totalFilteredProfit = totalFilteredSales - totalFilteredCost;

  const handleAddItemToSale = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;
    const qty = parseFloat(itemQuantity);
    if (isNaN(qty) || qty <= 0) return;

    const newItem: SaleItem = {
      productId: prod.id,
      name: prod.name,
      quantity: qty,
      unitPrice: prod.salePrice,
      costPrice: prod.costPrice,
      unit: prod.unit,
    };

    setSelectedItems([...selectedItems, newItem]);
    setSelectedProductId('');
    setItemQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();

    let finalAmount = 0;
    let finalCost = 0;

    if (selectedItems.length > 0) {
      finalAmount = selectedItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
      finalCost = selectedItems.reduce((acc, i) => acc + i.quantity * i.costPrice, 0);
    } else {
      finalAmount = parseFloat(manualAmount);
      finalCost = manualCost ? parseFloat(manualCost) : Math.round(finalAmount * 0.85); // fallback estimate: ~15% margin
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert(language === 'ur' ? 'برائے مہربانی درست رقم درج کریں' : 'Please enter a valid amount');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (editingSale) {
      onEditSale({
        ...editingSale,
        date: saleDate,
        amount: finalAmount,
        costAmount: finalCost,
        paymentType,
        customerId: customer?.id,
        customerName: customer?.name,
        notes: notes.trim() || undefined,
        items: selectedItems.length > 0 ? selectedItems : undefined,
      });
      setEditingSale(null);
    } else {
      onAddSale({
        date: saleDate,
        time: timeStr,
        amount: finalAmount,
        costAmount: finalCost,
        paymentType,
        customerId: customer?.id,
        customerName: customer?.name,
        notes: notes.trim() || undefined,
        items: selectedItems.length > 0 ? selectedItems : undefined,
      });
    }

    // Reset form
    setManualAmount('');
    setManualCost('');
    setNotes('');
    setSelectedItems([]);
    setSelectedCustomerId('');
    setShowAddModal(false);
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
  };

  const handleExportCSV = () => {
    const headers = [
      'Date (تاریخ)',
      'Time (وقت)',
      'Customer (گاہک)',
      'Payment Type (طریقہ)',
      'Items / Notes (تفصیل)',
      'Total Amount (فروخت)',
      'Cost (خرید)',
      'Profit (منافع)',
    ];

    const rows = filteredSales.map((s) => [
      s.date,
      s.time || '',
      s.customerName || 'Walk-in / Naqad',
      s.paymentType,
      s.items ? s.items.map((i) => `${i.name} (${i.quantity})`).join('; ') : s.notes || '',
      s.amount.toString(),
      (s.costAmount || 0).toString(),
      (s.amount - (s.costAmount || 0)).toString(),
    ]);

    downloadCSV(`Sales_Report_${dateFilter}_${today}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-700" />
            <span>{t.salesRegister}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ur'
              ? 'روزانہ کی فروخت، کیش بل اور کھاتہ داروں کی انٹری'
              : 'Record cash sales, customer bills, and calculate profit margins'}
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
              setEditingSale(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.quickAddSale}</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar for Selected Range */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">
            {t.grossSales}
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-950 font-numeric">
            ₨ {formatPKR(totalFilteredSales)}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-600 block">
            {t.costOfGoods}
          </span>
          <span className="text-base sm:text-lg font-black text-slate-800 font-numeric">
            ₨ {formatPKR(totalFilteredCost)}
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">
            {t.grossProfit}
          </span>
          <span className="text-base sm:text-lg font-black text-amber-950 font-numeric">
            ₨ {formatPKR(totalFilteredProfit)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ur' ? 'گاہک، آئٹم یا نوٹ تلاش کریں...' : 'Search customer or items...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['today', 'yesterday', 'month', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                dateFilter === filter
                  ? 'bg-emerald-700 text-white shadow-xs'
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

      {/* Sales List Table / Mobile Cards */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700">{t.noDataFound}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSales.map((sale) => {
            const saleProfit = sale.amount - (sale.costAmount || 0);

            return (
              <div
                key={sale.id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-emerald-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {sale.customerName ? `${sale.customerName}` : language === 'ur' ? 'عام نقد گاہک (Walk-in)' : 'Cash Customer'}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        sale.paymentType === 'cash'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.paymentType === 'credit'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sale.paymentType === 'cash'
                        ? t.paymentCash
                        : sale.paymentType === 'credit'
                        ? t.paymentCredit
                        : t.paymentOnline}
                    </span>
                  </div>

                  {/* Items or Notes */}
                  {sale.items && sale.items.length > 0 ? (
                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-1">
                      {sale.items.map((i, idx) => (
                        <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {i.name} ({i.quantity} {i.unit || ''})
                        </span>
                      ))}
                    </div>
                  ) : (
                    sale.notes && <p className="text-xs text-slate-500 mt-1">{sale.notes}</p>
                  )}

                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span className="font-numeric">{formatDate(sale.date)}</span>
                    {sale.time && <span className="font-numeric">{sale.time}</span>}
                    <span className="text-emerald-700 font-semibold font-numeric">
                      {t.grossProfit}: ₨ {formatPKR(saleProfit)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="text-start sm:text-end">
                    <div className="text-base sm:text-lg font-black text-emerald-800 font-numeric">
                      ₨ {formatPKR(sale.amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title={t.print}
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingSale(sale);
                        setSaleDate(sale.date);
                        setPaymentType(sale.paymentType);
                        setSelectedCustomerId(sale.customerId || '');
                        setNotes(sale.notes || '');
                        if (sale.items && sale.items.length > 0) {
                          setSelectedItems(sale.items);
                          setManualAmount('');
                          setManualCost('');
                        } else {
                          setSelectedItems([]);
                          setManualAmount(sale.amount.toString());
                          setManualCost(sale.costAmount ? sale.costAmount.toString() : '');
                        }
                        setShowAddModal(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title={t.edit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            language === 'ur'
                              ? 'کیا آپ واقعی یہ فروخت ریکارڈ حذف کرنا چاہتے ہیں؟ اس سے اسٹاک اور کھاتہ خودبخود درست ہو جائے گا۔'
                              : 'Delete this sale record? Stock and customer ledger will be restored.'
                          )
                        ) {
                          onDeleteSale(sale.id);
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
            );
          })}
        </div>
      )}

      {/* Add / Edit Sale Modal */}
      {(showAddModal || editingSale) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-5 border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingSale ? t.editSaleTitle : t.addSaleTitle}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSale(null);
                  if (onCloseAddModalDirectly) onCloseAddModalDirectly();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="space-y-4 pt-3">
              {/* Payment Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      paymentType === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>{t.paymentCash}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('credit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      paymentType === 'credit'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t.paymentCredit}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('online')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      paymentType === 'online'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t.paymentOnline}</span>
                  </button>
                </div>
              </div>

              {/* Customer Selector (Mandatory if Credit, Optional if Cash) */}
              {(paymentType === 'credit' || customers.length > 0) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.customerName} {paymentType === 'credit' ? '*' : '(اختیاری)'}
                  </label>
                  <select
                    required={paymentType === 'credit'}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                  >
                    <option value="">{t.selectCustomer}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} - بقایا: ₨{formatPKR(c.balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Optional: Add Items from Inventory */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  {t.selectProducts}
                </span>

                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    <option value="">-- {language === 'ur' ? 'آئٹم منتخب کریں' : 'Choose Item'} --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₨{p.salePrice}/{p.unit} - موجود: {p.stockQuantity})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-16 p-2 rounded-lg border border-slate-300 text-xs text-center font-numeric"
                    placeholder="تعداد"
                  />

                  <button
                    type="button"
                    onClick={handleAddItemToSale}
                    disabled={!selectedProductId}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                  >
                    {language === 'ur' ? '+ شامل' : 'Add'}
                  </button>
                </div>

                {/* Selected Items List */}
                {selectedItems.length > 0 && (
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-200">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200"
                      >
                        <span className="font-semibold">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-numeric text-slate-600">
                            {item.quantity} x ₨{item.unitPrice} = ₨{item.quantity * item.unitPrice}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="text-end text-xs font-black text-emerald-800 pt-1 font-numeric">
                      {t.total}: ₨{' '}
                      {formatPKR(
                        selectedItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Amount (if not using line items) */}
              {selectedItems.length === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.saleAmount} *
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₨
                      </span>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        className="w-full ps-8 pe-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-numeric text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.costAmount} (لاگت)
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₨
                      </span>
                      <input
                        type="number"
                        step="any"
                        placeholder="اختیاری"
                        value={manualCost}
                        onChange={(e) => setManualCost(e.target.value)}
                        className="w-full ps-8 pe-3 py-2.5 rounded-xl border border-slate-300 text-sm font-numeric text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Date and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.date}</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.notes}</label>
                  <input
                    type="text"
                    placeholder="مثلاً چائے، بسکٹ وغیرہ"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSale(null);
                    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
                  }}
                  className="py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-98"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal Trigger */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          settings={settings}
          language={language}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
