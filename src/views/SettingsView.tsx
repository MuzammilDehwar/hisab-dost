import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Store,
  Languages,
  Check,
  AlertCircle,
  HelpCircle,
  Smartphone,
} from 'lucide-react';
import { AppState, Language, ShopSettings } from '../types';
import { exportBackupJSON, importBackupJSON } from '../services/storage';
import { formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { PWAInstallBanner } from '../components/PWAInstallBanner';

interface Props {
  state: AppState;
  onUpdateSettings: (settings: ShopSettings) => void;
  onRestoreState: (newState: AppState) => void;
  onLoadDemoData: () => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<Props> = ({
  state,
  onUpdateSettings,
  onRestoreState,
  onLoadDemoData,
  onClearAllData,
}) => {
  const { settings } = state;
  const t = getTranslation(settings.language);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [city, setCity] = useState(settings.city);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

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

  const handleDownloadBackup = () => {
    const updated = exportBackupJSON(state);
    onRestoreState(updated);
    setRestoreMessage(t.backupSuccess);
    setTimeout(() => setRestoreMessage(null), 3000);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await importBackupJSON(file);
      onRestoreState(restored);
      setRestoreMessage(t.restoreSuccess);
      setTimeout(() => setRestoreMessage(null), 3000);
    } catch (err: any) {
      alert(language === 'ur' ? 'فائل درست نہیں ہے!' : 'Invalid backup file format');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              ? 'دکان کا نام، زبان اور آف لائن بیک اپ کی ترتیبات'
              : 'Customize shop details, language, and manage local data backup'}
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

      {/* Backup and Restore Hub */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-700" />
            <span>{t.backupAndRestore}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ur'
              ? 'اپنے تمام کھاتے کی بیک اپ فائل محفوظ کریں تاکہ موبائل تبدیل کرنے یا ڈیٹا ضائع ہونے پر فوری بحال کیا جا سکے۔'
              : 'Save an offline JSON backup of all customer ledgers, sales, and products to restore anytime.'}
          </p>
        </div>

        {/* Last Backup Status indicator */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            {language === 'ur' ? 'آخری بیک اپ کی تاریخ:' : 'Last Backup Saved:'}
          </span>
          <span className="font-numeric font-bold text-emerald-800">
            {settings.lastBackupDate
              ? formatDate(settings.lastBackupDate)
              : language === 'ur'
              ? 'ابھی تک نہیں لیا گیا'
              : 'Never taken'}
          </span>
        </div>

        {restoreMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{restoreMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Download Backup */}
          <button
            onClick={handleDownloadBackup}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadBackup}</span>
          </button>

          {/* Restore Backup */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition active:scale-98"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>{t.restoreBackup}</span>
            </button>
          </div>
        </div>

        {/* Demo Data & Fresh Start */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => {
              if (
                window.confirm(
                  language === 'ur'
                    ? 'کیا آپ پاکستانی کریانہ اسٹور کا ڈیمو ڈیٹا لوڈ کرنا چاہتے ہیں؟'
                    : 'Load Pakistani Kiryana demo data?'
                )
              ) {
                onLoadDemoData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.loadDemoData}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(t.confirmClearData)) {
                onClearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearAllData}</span>
          </button>
        </div>
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
              {t.privacyNoticeDesc}
            </p>
            <div className="mt-2 text-[11px] text-amber-200 bg-emerald-900/60 p-2 rounded-lg font-medium">
              ⚠️ {language === 'ur'
                ? 'اہم حفاظتی نوٹ: آپ کا ڈیٹا براؤزر کے لوکل اسٹوریج میں محفوظ ہوتا ہے جو کہ انکرپٹڈ (Encrypted) نہیں ہے۔ کسی دوسرے شخص کو اپنے مالی حسابات دیکھنے سے روکنے کے لیے اپنے موبائل یا لیپ ٹاپ پر پن، پاس ورڈ یا فنگر پرنٹ لاک کا استعمال کریں۔'
                : 'Security Note: Data is saved directly in browser LocalStorage without hardware encryption. Protect your device with a PIN, biometric lock, or password.'}
            </div>
            <div className="mt-2 text-[11px] text-emerald-300 font-medium">
              ✓ 100% Client-side local storage &nbsp;•&nbsp; ✓ کوئی بادل یا سرور نہیں &nbsp;•&nbsp; ✓ زیرو ٹریکنگ
            </div>
          </div>
        </div>
      </div>

      {/* Compliant Future Advertising Integration Point Documentation */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>مستقبل میں اشتہارات کی جگہ (Future Advertising Slot)</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          یہ ایپ فی الوقت مکمل طور پر فری اور اشتہارات سے پاک ہے۔ مستقبل میں دکانداروں کی سہولت برقرار رکھتے ہوئے صرف غیر دخل انداز (Non-intrusive) بینر سپورٹ کیا جائے گا جس میں گاہکوں کے ذاتی کھاتے، فون نمبر یا مالی ڈیٹا کی کوئی ٹریکنگ نہیں کی جائے گی۔
        </p>
        <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-[11px]">
          {/* FUTURE_AD_SLOT_RESERVED: Placeholder for compliant ad network (Google AdSense / Local Commerce Partner) */}
          <span>[مستقبل کا محفوظ اشتہاری سلاٹ — غیر فعال / No Ads Active in Prototype]</span>
        </div>
      </div>
    </div>
  );
};
