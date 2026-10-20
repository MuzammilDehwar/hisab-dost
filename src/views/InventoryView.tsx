import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  X,
  PackagePlus,
  PackageMinus,
  CheckCircle2,
} from 'lucide-react';
import { Language, Product, ShopSettings } from '../types';
import { downloadCSV, formatPKR, getTodayDateString } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface Props {
  products: Product[];
  settings: ShopSettings;
  language: Language;
  onAddProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAdjustStock: (productId: string, delta: number) => void;
}

export const InventoryView: React.FC<Props> = ({
  products,
  settings,
  language,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAdjustStock,
}) => {
  const t = getTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minStockThreshold, setMinStockThreshold] = useState('5');
  const [unit, setUnit] = useState('دانہ / Pcs');
  const [category, setCategory] = useState('');

  // Quick Adjustment Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('1');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.urduName && p.urduName.includes(searchTerm));
    if (!matchesSearch) return false;

    if (filterStatus === 'low') {
      return p.stockQuantity <= p.minStockThreshold && p.stockQuantity > 0;
    }
    if (filterStatus === 'out') {
      return p.stockQuantity <= 0;
    }
    return true;
  });

  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.minStockThreshold && p.stockQuantity > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  const totalInventoryValue = products.reduce(
    (acc, p) => acc + p.stockQuantity * p.costPrice,
    0
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCostPrice('');
    setSalePrice('');
    setStockQuantity('');
    setMinStockThreshold('5');
    setUnit('دانہ / Pcs');
    setCategory('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCostPrice(p.costPrice.toString());
    setSalePrice(p.salePrice.toString());
    setStockQuantity(p.stockQuantity.toString());
    setMinStockThreshold(p.minStockThreshold.toString());
    setUnit(p.unit);
    setCategory(p.category || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cp = parseFloat(costPrice);
    const sp = parseFloat(salePrice);
    const qty = parseFloat(stockQuantity);
    const thresh = parseFloat(minStockThreshold) || 5;

    if (isNaN(cp) || isNaN(sp) || isNaN(qty) || !name.trim()) {
      alert(language === 'ur' ? 'برائے مہربانی تمام خانے درست پر کریں' : 'Please fill all required fields');
      return;
    }

    if (editingProduct) {
      onEditProduct({
        ...editingProduct,
        name: name.trim(),
        costPrice: cp,
        salePrice: sp,
        stockQuantity: qty,
        minStockThreshold: thresh,
        unit,
        category: category.trim() || undefined,
        updatedAt: getTodayDateString(),
      });
    } else {
      onAddProduct({
        name: name.trim(),
        costPrice: cp,
        salePrice: sp,
        stockQuantity: qty,
        minStockThreshold: thresh,
        unit,
        category: category.trim() || undefined,
      });
    }

    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleQuickAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const delta = parseFloat(adjustAmount);
    if (isNaN(delta) || delta <= 0) return;

    onAdjustStock(adjustingProduct.id, adjustType === 'add' ? delta : -delta);
    setAdjustingProduct(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Item Name (نام)',
      'Cost Price (خرید)',
      'Sale Price (فروخت)',
      'Margin (منافع فی یونٹ)',
      'Quantity (تعداد)',
      'Unit (یونٹ)',
      'Stock Value (کل مالیت)',
      'Status (حالت)',
    ];

    const rows = filteredProducts.map((p) => [
      p.name,
      p.costPrice.toString(),
      p.salePrice.toString(),
      (p.salePrice - p.costPrice).toString(),
      p.stockQuantity.toString(),
      p.unit,
      (p.stockQuantity * p.costPrice).toString(),
      p.stockQuantity <= 0 ? 'Out of Stock' : p.stockQuantity <= p.minStockThreshold ? 'Low Stock' : 'In Stock',
    ]);

    downloadCSV(`Inventory_Stock_${getTodayDateString()}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-700" />
            <span>{t.inventoryTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ur'
              ? 'دکان کا موجودہ اسٹاک، خرید و فروخت قیمت اور الرٹ'
              : 'Track product quantities, cost/sale rates, margins, and low stock warnings'}
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
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.quickAddProduct}</span>
          </button>
        </div>
      </div>

      {/* Stock Value & Alert KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">
            {t.stockValue}
          </span>
          <span className="text-base sm:text-lg font-black text-amber-950 font-numeric">
            ₨ {formatPKR(totalInventoryValue)}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-600 block">
            کل آئٹمز
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 font-numeric">
            {products.length}
          </span>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-rose-800 block">
            {t.lowStockAlerts}
          </span>
          <span className="text-base sm:text-lg font-black text-rose-900 font-numeric">
            {lowStockCount + outOfStockCount}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ur' ? 'آئٹم کا نام تلاش کریں...' : 'Search item name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-amber-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterStatus === 'all'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            تمام مال ({products.length})
          </button>
          <button
            onClick={() => setFilterStatus('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterStatus === 'low'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            کم اسٹاک ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterStatus('out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterStatus === 'out'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ختم شدہ ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Product Inventory Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700">{t.noDataFound}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stockQuantity <= 0;
            const isLowStock = !isOutOfStock && p.stockQuantity <= p.minStockThreshold;
            const margin = p.salePrice - p.costPrice;
            const marginPercent = Math.round((margin / (p.salePrice || 1)) * 100);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col justify-between ${
                  isOutOfStock
                    ? 'border-rose-300 bg-rose-50/20'
                    : isLowStock
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {p.name}
                      </h3>
                      {p.category && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {p.category}
                        </span>
                      )}
                    </div>

                    {/* Stock status pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-800'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOutOfStock ? t.outOfStock : isLowStock ? t.lowStock : t.inStock}
                    </span>
                  </div>

                  {/* Pricing details */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t.costPrice}</span>
                      <strong className="text-slate-700 font-numeric">₨ {formatPKR(p.costPrice)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t.salePrice}</span>
                      <strong className="text-emerald-800 font-numeric">₨ {formatPKR(p.salePrice)}</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">منافع فی {p.unit}:</span>
                      <span className="font-bold text-emerald-700 font-numeric">
                        ₨ {formatPKR(margin)} ({marginPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Current quantity display */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-600 font-semibold">{t.stockQty}:</span>
                    <span
                      className={`text-lg font-black font-numeric ${
                        isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-slate-900'
                      }`}
                    >
                      {p.stockQuantity} {p.unit}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Quick Adjust Button */}
                  <button
                    onClick={() => {
                      setAdjustingProduct(p);
                      setAdjustAmount('1');
                      setAdjustType('add');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition"
                  >
                    <PackagePlus className="w-3.5 h-3.5 text-amber-700" />
                    <span>اسٹاک ایڈجسٹ</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title={t.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            language === 'ur' ? 'کیا آپ یہ آئٹم حذف کرنا چاہتے ہیں؟' : 'Delete item?'
                          )
                        ) {
                          onDeleteProduct(p.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? t.editProductTitle : t.addProductTitle}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.productName} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً باسمتی چاول، چینی، کوکنگ آئل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.costPrice} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="خرید ریٹ"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.salePrice} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="فروخت ریٹ"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.stockQty} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="موجودہ تعداد"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.unit}</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    <option value="کلو / Kg">{t.unitKg}</option>
                    <option value="دانہ / Pcs">{t.unitPcs}</option>
                    <option value="پیکٹ / Pkt">{t.unitPacket}</option>
                    <option value="درجن / Dozen">{t.unitDozen}</option>
                    <option value="لیٹر / Ltr">{t.unitLitre}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.minThreshold} (اس سے کم پر الرٹ آئے گا)
                </label>
                <input
                  type="number"
                  step="any"
                  value={minStockThreshold}
                  onChange={(e) => setMinStockThreshold(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition active:scale-98"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Adjust Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {adjustingProduct.name} - {t.adjustStock}
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAdjustSubmit} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>+ نیا مال آیا</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    adjustType === 'subtract'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <PackageMinus className="w-4 h-4" />
                  <span>- خراب / واپسی</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تعداد ({adjustingProduct.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold font-numeric text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
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
