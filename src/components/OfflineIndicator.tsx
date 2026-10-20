import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  language: Language;
}

export const OfflineIndicator: React.FC<Props> = ({ language }) => {
  const isOnline = useOnlineStatus();
  const t = getTranslation(language);

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline Mode Status"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 z-40 flex items-center justify-between gap-3 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-medium text-white shadow-xl animate-fade-in"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
        <span>{t.offlineBanner}</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-amber-700/60 px-2 py-0.5 text-[10px] tracking-wide shrink-0">
        <Database className="w-3 h-3" />
        <span>Local Mode</span>
      </div>
    </aside>
  );
};
