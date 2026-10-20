import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare } from 'lucide-react';
import { Customer, Language, ShopSettings } from '../types';
import { buildWhatsAppLink, formatPKR } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface Props {
  customer: Customer;
  settings: ShopSettings;
  language: Language;
  onClose: () => void;
}

export const WhatsAppReminderModal: React.FC<Props> = ({
  customer,
  settings,
  language,
  onClose,
}) => {
  const t = getTranslation(language);
  const due = Math.max(0, customer.balance);

  // Template message
  const defaultUrduMsg = `السلام علیکم ${customer.name} صاحب!\nآپ کے "${settings.shopName || 'دکان'}" کھاتے کا کل بقایا ₨${formatPKR(due)} ہے۔\nبرائے مہربانی تشریف لا کر حساب کلیئر فرما دیں۔\nشکریہ!\n-${settings.shopName || 'دکان'}`;

  const defaultRomanMsg = `Assalam-o-Alaikum ${customer.name} sahib!\nAap ke "${settings.shopName || 'Dukan'}" khate ka kul baqaya ₨${formatPKR(due)} hai.\nBaraye meherbani tashreef la kar hisab clear farma dein.\nShukriya!\n-${settings.shopName || 'Dukan'}`;

  const defaultEnMsg = `Assalam-o-Alaikum ${customer.name}!\nThis is a gentle reminder that your pending balance at "${settings.shopName || 'Shop'}" is PKR ${formatPKR(due)}.\nKindly visit to clear your account.\nThank you!\n-${settings.shopName || 'Shop'}`;

  const initialMsg =
    language === 'ur'
      ? defaultUrduMsg
      : language === 'ur-roman'
      ? defaultRomanMsg
      : defaultEnMsg;

  const [message, setMessage] = useState(initialMsg);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsAppUrl = customer.phone ? buildWhatsAppLink(customer.phone, message) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {t.sendWhatsAppReminder}
              </h3>
              <p className="text-xs text-emerald-200">
                {customer.name} ({customer.phone || (language === 'ur' ? 'نمبر درج نہیں' : 'No phone')})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Outstanding Due Card */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">
              {t.currentBalance}:
            </span>
            <span className="text-base font-black text-amber-950 font-numeric">
              ₨ {formatPKR(due)}
            </span>
          </div>

          {!customer.phone && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              ⚠️ {language === 'ur'
                ? 'اس گاہک کا فون نمبر درج نہیں ہے۔ آپ نیچے سے متن کاپی کر کے کسی بھی نمبر پر بھیج سکتے ہیں۔'
                : 'Customer phone number is not registered. You can copy the reminder text below and send via SMS.'}
            </div>
          )}

          {/* Editable message preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {language === 'ur' ? 'پیغام کا متن (ضرورت پڑنے پر تبدیل کر سکتے ہیں):' : 'Message text (editable):'}
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-100 text-slate-800 resize-none leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 py-3 text-xs font-bold text-slate-700 transition active:scale-98"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ur' ? 'کاپی ہو گیا!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{language === 'ur' ? 'متن کاپی کریں' : 'Copy Text'}</span>
                </>
              )}
            </button>

            {whatsAppUrl ? (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-sm transition active:scale-98 text-center"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'ur' ? 'واٹس ایپ کھولیں' : 'Open WhatsApp'}</span>
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-400 cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'ur' ? 'فون نمبر نہیں' : 'No Phone'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
