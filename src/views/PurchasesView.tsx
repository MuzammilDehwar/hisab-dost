import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, PackagePlus, Plus, Search, Truck, X } from 'lucide-react';
import { Language, Product, Purchase, ShopSettings, Supplier } from '../types';
import { downloadCSV, formatPKR, getTodayDateString } from '../utils/formatters';

interface Props {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  settings: ShopSettings;
  language: Language;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => void;
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => void;
}

export const PurchasesView: React.FC<Props> = ({
  purchases,
  suppliers,
  products,
  settings,
  language,
  onAddSupplier,
  onAddPurchase,
}) => {
  const urdu = language === 'ur';
  const today = getTodayDateString();
  const [search, setSearch] = useState('');
  const [showPurchase, setShowPurchase] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Pcs');
  const [unitCost, setUnitCost] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return purchases;
    return purchases.filter((p) => `${p.supplierName} ${p.productName} ${p.notes || ''}`.toLowerCase().includes(term));
  }, [purchases, search]);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + Math.max(0, s.balance), 0);

  const resetPurchase = () => {
    setSupplierId(''); setSupplierName(''); setProductId(''); setProductName(''); setQuantity('1');
    setUnit('Pcs'); setUnitCost(''); setPaidAmount(''); setPurchaseDate(today); setNotes('');
  };

  const submitSupplier = (event: React.FormEvent) => {
    event.preventDefault();
    if (!supplierName.trim()) return;
    onAddSupplier({ name: supplierName.trim(), phone: supplierPhone.trim(), address: supplierAddress.trim() || undefined });
    setSupplierName(''); setSupplierPhone(''); setSupplierAddress(''); setShowSupplier(false);
  };

  const submitPurchase = (event: React.FormEvent) => {
    event.preventDefault();
    const qty = Number(quantity); const cost = Number(unitCost); const paid = Math.max(0, Number(paidAmount || 0));
    const selectedProduct = products.find((p) => p.id === productId);
    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    if ((!selectedProduct && !productName.trim()) || !supplierName.trim() || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost <= 0) return;
    const total = qty * cost;
    onAddPurchase({
      supplierId: selectedSupplier?.id,
      supplierName: selectedSupplier?.name || supplierName.trim(),
      productId: selectedProduct?.id,
      productName: selectedProduct?.name || productName.trim(),
      quantity: qty,
      unit: selectedProduct?.unit || unit,
      unitCost: cost,
      total,
      paidAmount: Math.min(paid, total),
      date: purchaseDate,
      notes: notes.trim() || undefined,
    });
    resetPurchase(); setShowPurchase(false);
  };

  const exportCSV = () => {
    downloadCSV(`Purchases_${today}.csv`, [
      ['Date', 'Supplier', 'Product', 'Quantity', 'Unit Cost', 'Total', 'Paid', 'Remaining'],
      ...filtered.map((p) => [p.date, p.supplierName, p.productName, String(p.quantity), String(p.unitCost), String(p.total), String(p.paidAmount), String(p.total - p.paidAmount)]),
    ]);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900"><Truck className="h-6 w-6 text-sky-700" />{urdu ? 'خریداری اور سپلائر' : 'Purchases & Suppliers'}</h2>
          <p className="mt-1 text-xs text-slate-500">{urdu ? 'نیا مال، سپلائر کا بقایا اور اسٹاک اپ ڈیٹ کریں' : 'Record stock purchases, supplier balances, and incoming inventory.'}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><FileSpreadsheet className="h-4 w-4 text-emerald-700" />CSV</button>
          <button type="button" onClick={() => setShowSupplier(true)} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">+ {urdu ? 'سپلائر' : 'Supplier'}</button>
          <button type="button" onClick={() => setShowPurchase(true)} className="flex items-center gap-1.5 rounded-xl bg-sky-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs"><Plus className="h-4 w-4" />{urdu ? 'خرید درج کریں' : 'Add purchase'}</button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3"><span className="block text-[10px] font-bold uppercase text-sky-700">{urdu ? 'کل خرید' : 'Total purchases'}</span><strong className="font-numeric text-lg text-sky-950">₨ {formatPKR(totalPurchases)}</strong></div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3"><span className="block text-[10px] font-bold uppercase text-amber-700">{urdu ? 'سپلائر بقایا' : 'Supplier payable'}</span><strong className="font-numeric text-lg text-amber-950">₨ {formatPKR(totalPayable)}</strong></div>
        <div className="hidden rounded-2xl border border-slate-200 bg-white p-3 sm:block"><span className="block text-[10px] font-bold uppercase text-slate-600">{urdu ? 'سپلائرز' : 'Suppliers'}</span><strong className="text-lg text-slate-900">{suppliers.length}</strong></div>
      </div>

      <div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={urdu ? 'سپلائر یا مال تلاش کریں...' : 'Search supplier or product...'} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pe-4 ps-9 text-sm shadow-xs outline-none focus:border-sky-600" /></div>

      {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><PackagePlus className="mx-auto mb-2 h-10 w-10 text-slate-300" /><p className="text-sm font-bold text-slate-700">{urdu ? 'ابھی کوئی خرید درج نہیں' : 'No purchases recorded yet'}</p><p className="mt-1 text-xs">{urdu ? 'پہلی خرید درج کر کے اسٹاک کا حساب شروع کریں۔' : 'Add your first purchase to start tracking incoming stock.'}</p></div> : <div className="space-y-2.5">{filtered.map((purchase) => <div key={purchase.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{purchase.productName}</p><p className="text-xs text-slate-500">{purchase.supplierName} · {purchase.date} · {purchase.quantity} {purchase.unit}</p></div><div className="text-start sm:text-end"><p className="font-numeric font-black text-sky-800">₨ {formatPKR(purchase.total)}</p><p className="text-[11px] font-semibold text-slate-500">{urdu ? 'باقی' : 'Due'}: ₨ {formatPKR(Math.max(0, purchase.total - purchase.paidAmount))}</p></div></div>)}</div>}

      {showSupplier && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><form onSubmit={submitSupplier} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-lg font-black">{urdu ? 'نیا سپلائر' : 'New supplier'}</h3><button type="button" onClick={() => setShowSupplier(false)}><X className="h-5 w-5" /></button></div><input required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder={urdu ? 'سپلائر کا نام' : 'Supplier name'} className="w-full rounded-xl border p-3 text-sm" /><input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder={urdu ? 'فون نمبر' : 'Phone number'} className="w-full rounded-xl border p-3 text-sm" /><input value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} placeholder={urdu ? 'پتہ' : 'Address'} className="w-full rounded-xl border p-3 text-sm" /><button className="w-full rounded-xl bg-sky-700 p-3 font-bold text-white">{urdu ? 'محفوظ کریں' : 'Save supplier'}</button></form></div>}

      {showPurchase && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><form onSubmit={submitPurchase} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black">{urdu ? 'خرید درج کریں' : 'Record purchase'}</h3><p className="text-xs text-slate-500">{urdu ? 'مال خریدنے پر اسٹاک خود بڑھ جائے گا' : 'Linked product stock increases automatically.'}</p></div><button type="button" onClick={() => setShowPurchase(false)}><X className="h-5 w-5" /></button></div><div className="grid gap-3 sm:grid-cols-2"><select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); const s = suppliers.find((item) => item.id === e.target.value); if (s) setSupplierName(s.name); }} className="rounded-xl border p-3 text-sm"><option value="">{urdu ? 'سپلائر منتخب کریں' : 'Select supplier'}</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><input required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder={urdu ? 'سپلائر کا نام' : 'Supplier name'} className="rounded-xl border p-3 text-sm" /></div><select value={productId} onChange={(e) => { setProductId(e.target.value); const p = products.find((item) => item.id === e.target.value); if (p) { setProductName(p.name); setUnit(p.unit); setUnitCost(String(p.costPrice)); } }} className="w-full rounded-xl border p-3 text-sm"><option value="">{urdu ? 'موجودہ پروڈکٹ منتخب کریں' : 'Select existing product'}</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder={urdu ? 'یا نیا مال کا نام' : 'Or enter new product name'} className="w-full rounded-xl border p-3 text-sm" /><div className="grid grid-cols-2 gap-3"><input required type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={urdu ? 'مقدار' : 'Quantity'} className="rounded-xl border p-3 text-sm" /><input required type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder={urdu ? 'فی یونٹ قیمت' : 'Unit cost'} className="rounded-xl border p-3 text-sm" /></div><div className="grid grid-cols-2 gap-3"><input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={urdu ? 'ادا شدہ رقم' : 'Paid amount'} className="rounded-xl border p-3 text-sm" /><input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="rounded-xl border p-3 text-sm" /></div><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={urdu ? 'نوٹ (اختیاری)' : 'Notes (optional)'} className="w-full rounded-xl border p-3 text-sm" /><button className="w-full rounded-xl bg-sky-700 p-3 font-bold text-white">{urdu ? 'خرید محفوظ کریں' : 'Save purchase'}</button></form></div>}
    </div>
  );
};
