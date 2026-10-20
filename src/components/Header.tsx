import React from 'react';
import { BookOpen, Languages, ShieldCheck } from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { PWAInstallBanner } from './PWAInstallBanner';

interface Props {
  settings: ShopSettings;
  onLanguageChange: (lang: Language) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<Props> = ({ settings, onLanguageChange, onOpenSettings }) => {
  const t = getTranslation(settings.language);

  const cycleLanguage = () => {
    if (settings.language === 'ur') {
      onLanguageChange('ur-roman');
    } else if (settings.language === 'ur-roman') {
      onLanguageChange('en');
    } else {
      onLanguageChange('ur');
    }
  };

  const languageLabel = {
    ur: 'اردو',
    'ur-roman': 'Roman',
    en: 'Eng',
  }[settings.language];

  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md border-b border-emerald-900">
      <div className="max-w-5xl mx-auto px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand & Shop Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-600 flex items-center justify-center shadow-inner shrink-0 text-amber-300">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">
                {t.appName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>100% نجی</span>
              </span>
            </div>
            <p className="text-xs text-emerald-200 truncate font-medium">
              {settings.shopName || t.appTagline}
            </p>
          </div>
        </div>

        {/* Right Actions: Install Button & Language Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallBanner language={settings.language} variant="button" />

          {/* Quick Language Toggle */}
          <button
            onClick={cycleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-xs font-bold text-white transition border border-emerald-600/60 shadow-xs"
            title={t.languageSelection}
            aria-label="Toggle Language"
          >
            <Languages className="w-3.5 h-3.5 text-amber-300" />
            <span>{languageLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
