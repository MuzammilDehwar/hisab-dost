import React, { useState } from 'react';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  language: Language;
  variant?: 'banner' | 'button';
}

export const PWAInstallBanner: React.FC<Props> = ({ language, variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const t = getTranslation(language);

  // Do not show if already in standalone app mode or dismissed by user
  if (isInstalled || isDismissed) {
    return null;
  }

  // If not installable and not iOS, no install prompt available from browser
  if (!isInstallable && !isIOS) {
    return null;
  }

  if (variant === 'button') {
    return (
      <>
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
            title={t.installApp}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.installApp}</span>
          </button>
        )}

        {isIOS && (
          <button
            onClick={() => setShowIOSModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition"
            title="iOS Install Guide"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.installApp}</span>
          </button>
        )}

        {/* iOS Step-by-step modal */}
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">
                    {language === 'ur' ? 'آئی فون پر انسٹال کرنے کا طریقہ' : 'Install on iPhone / iPad'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 space-y-3 text-sm text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    {language === 'ur' ? (
                      <>
                        صفاری براؤزر کے نیچے موجود <strong className="text-emerald-700">شیئر بٹن</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />) پر کلک کریں۔
                      </>
                    ) : (
                      <>
                        Tap the <strong>Share button</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />) in Safari.
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    {language === 'ur' ? (
                      <>
                        نیچے سکرول کر کے <strong className="text-emerald-700">Add to Home Screen (ہوم اسکرین پر شامل کریں)</strong> کو دبائیں۔
                      </>
                    ) : (
                      <>
                        Scroll down and tap <strong>Add to Home Screen</strong>.
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    {language === 'ur' ? (
                      <>
                        اوپر کونے میں <strong className="text-emerald-700">Add</strong> دبائیں۔ ایپ آپ کے فون کی اسکرین پر آ جائے گی!
                      </>
                    ) : (
                      <>
                        Tap <strong>Add</strong> in the top-right corner. Hisab Dost will open like a native app!
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'ur' ? 'سمجھ آ گیا' : 'Got it'}</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Top banner variant
  return (
    <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-950">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="font-medium">{t.installDesc}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={isIOS ? () => setShowIOSModal(true) : install}
          className="px-2.5 py-1 bg-emerald-700 text-white rounded-md font-semibold hover:bg-emerald-800 active:scale-95 transition"
        >
          {t.installApp}
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-emerald-700 hover:text-emerald-950"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
