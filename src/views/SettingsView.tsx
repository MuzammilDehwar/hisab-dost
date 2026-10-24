import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Trash2,
  ShieldCheck,
  Store,
  Languages,
  Check,
} from 'lucide-react';
import { AppState, Language, ShopSettings } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  state: AppState;
  onUpdateSettings: (settings: ShopSettings) => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<Props> = ({
  state,
  onUpdateSettings,
  onClearAllData,
}) => {
  const { settings } = state;
  const t = getTranslation(settings.language);

  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [city, setCity] = useState(settings.city);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      city: city.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLanguageSelect = (lang: Language) => {
    onUpdateSettings({
      ...settings,
      language: lang,
    });
  };

  const language = settings.language;

  return (
    <div className="space-y-5 pb-20 sm:pb-8 animate-fade-in max-w-3xl mx-auto">
      {/* Title */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-700" />
            <span>{t.settingsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ur'
              ? 'دکان کی پروفائل اور زبان کی ترتیبات'
              : 'Customize your shop profile and language'}
          </p>
        </div>
      </div>

      {/* Language Switcher Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Languages className="w-4 h-4 text-emerald-700" />
          <span>{t.languageSelection}</span>
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleLanguageSelect('ur')}
            className={`py-3 px-3 rounded-xl text-xs font-bold border transition text-center ${
              language === 'ur'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span className="block text-sm font-black mb-0.5">اردو</span>
            <span className="text-[10px] opacity-80">(Urdu RTL)</span>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageSelect('ur-roman')}
            className={`py-3 px-3 rounded-xl text-xs font-bold border transition text-center ${
              language === 'ur-roman'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span className="block text-sm font-black mb-0.5">Roman Urdu</span>
            <span className="text-[10px] opacity-80">(Aasan Urdu)</span>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageSelect('en')}
            className={`py-3 px-3 rounded-xl text-xs font-bold border transition text-center ${
              language === 'en'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span className="block text-sm font-black mb-0.5">English</span>
            <span className="text-[10px] opacity-80">(UK/US)</span>
          </button>
        </div>
      </div>

      {/* Shop Profile Settings Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-700" />
          <span>{t.shopInfo}</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.shopName}
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="مثلاً مدینہ کریانہ اسٹور"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.ownerName}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="مثلاً محمد عثمان"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.phone}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.city}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثلاً لاہور، فیصل آباد، راولپنڈی"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>{language === 'ur' ? 'ترتیبات محفوظ ہو گئیں!' : 'Profile saved!'}</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-xs transition"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>

      {/* User-owned data control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          {language === 'ur' ? 'آپ کا ڈیٹا' : 'Your data'}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {language === 'ur'
            ? 'یہ کارروائی صرف آپ کے اپنے کاروباری ریکارڈ صاف کرے گی۔'
            : 'This action only clears your own business records.'}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t.confirmClearData)) onClearAllData();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t.clearAllData}</span>
        </button>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="bg-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-900">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-emerald-200">
              {t.privacyNoticeTitle}
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
              {language === 'ur'
                ? 'آپ کے کاروباری ریکارڈ آپ کے اپنے اکاؤنٹ کے ساتھ محفوظ رہتے ہیں اور دوسرے صارف انہیں نہیں دیکھ سکتے۔'
                : 'Your business records stay linked to your own account and are not shown to other users.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
