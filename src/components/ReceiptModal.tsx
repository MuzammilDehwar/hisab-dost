import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { Language, Sale, ShopSettings } from '../types';
import { formatDate, formatPKR } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface Props {
  sale: Sale;
  settings: ShopSettings;
  language: Language;
  onClose: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ sale, settings, language, onClose }) => {
  const t = getTranslation(language);

  const handlePrint = () => {
    window.print();
  };

  const paymentLabel = {
    cash: t.paymentCash,
    credit: t.paymentCredit,
    online: t.paymentOnline,
  }[sale.paymentType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in no-print">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm">
              {language === 'ur' ? 'رسید / بل میمو' : 'Cash Memo / Receipt'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Memo Paper */}
        <div className="p-6 bg-white text-slate-900 print-area text-center" id="printable-memo">
          <div className="border-b-2 border-dashed border-slate-300 pb-3 mb-3">
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              {settings.shopName || 'مدینہ کریانہ اسٹور'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {settings.ownerName ? `${settings.ownerName} • ` : ''}
              {settings.phone || ''}
            </p>
            {settings.city && <p className="text-xs text-slate-500">{settings.city}</p>}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
            <span>
              <strong>{t.date}:</strong> {formatDate(sale.date)} {sale.time || ''}
            </span>
            <span>
              <strong>بل نمبر:</strong> #{sale.id.slice(-5)}
            </span>
          </div>

          {sale.customerName && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs text-start mb-3">
              <span className="text-slate-500">{t.customerName}: </span>
              <strong className="text-slate-900">{sale.customerName}</strong>
            </div>
          )}

          {/* Items if any */}
          {sale.items && sale.items.length > 0 ? (
            <div className="border-t border-b border-slate-200 py-2 mb-3 text-xs">
              <div className="grid grid-cols-12 font-bold text-slate-700 pb-1 border-b border-slate-100">
                <span className="col-span-6 text-start">تفصیل</span>
                <span className="col-span-2 text-center">تعداد</span>
                <span className="col-span-4 text-end">رقم</span>
              </div>
              <div className="space-y-1.5 pt-1.5 text-start">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-slate-800">
                    <span className="col-span-6 truncate font-medium">{item.name}</span>
                    <span className="col-span-2 text-center font-numeric text-slate-600">
                      {item.quantity} {item.unit || ''}
                    </span>
                    <span className="col-span-4 text-end font-numeric font-bold">
                      ₨ {formatPKR(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            sale.notes && (
              <p className="text-xs text-slate-600 text-start bg-slate-50 p-2 rounded-lg mb-3">
                {sale.notes}
              </p>
            )
          )}

          {/* Total & Payment Method */}
          <div className="flex items-center justify-between py-2 border-t border-slate-900 mb-2">
            <span className="text-sm font-bold text-slate-800">{t.total}:</span>
            <span className="text-xl font-black text-emerald-800 font-numeric">
              ₨ {formatPKR(sale.amount)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mb-4">
            <span>ادائیگی:</span>
            <span className="font-bold text-slate-800">{paymentLabel}</span>
          </div>

          <div className="pt-2 border-t border-dashed border-slate-300 text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>تشریف آوری کا شکریہ! (Hisab Dost)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            {t.cancel}
          </button>
          <button
            onClick={handlePrint}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t.print}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
