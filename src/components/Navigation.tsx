import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Receipt,
  Boxes,
  FileBarChart2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

export type TabType =
  | 'dashboard'
  | 'khata'
  | 'sales'
  | 'expenses'
  | 'inventory'
  | 'reports'
  | 'settings';

interface Props {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  language: Language;
  lowStockCount?: number;
  customersWithDueCount?: number;
}

export const Navigation: React.FC<Props> = ({
  currentTab,
  onTabChange,
  language,
  lowStockCount = 0,
  customersWithDueCount = 0,
}) => {
  const t = getTranslation(language);

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: t.navDashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'khata' as TabType,
      label: t.navKhata,
      icon: Users,
      badge: customersWithDueCount > 0 ? customersWithDueCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'sales' as TabType,
      label: t.navSales,
      icon: ShoppingCart,
    },
    {
      id: 'expenses' as TabType,
      label: t.navExpenses,
      icon: Receipt,
    },
    {
      id: 'inventory' as TabType,
      label: t.navInventory,
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'reports' as TabType,
      label: t.navReports,
      icon: FileBarChart2,
    },
    {
      id: 'settings' as TabType,
      label: t.navSettings,
      icon: SettingsIcon,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet top tab bar */}
      <nav aria-label="Desktop Navigation" className="hidden md:block bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile-first bottom bar (Fixed at bottom for thumb-reach ergonomics) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl safe-area-bottom"
      >
        <div className="grid grid-cols-5 items-center px-1 py-1">
          {/* Main primary tabs on mobile */}
          {[
            navItems[0], // Dashboard
            navItems[1], // Khata
            navItems[2], // Sales
            navItems[4], // Inventory
            navItems[5], // Reports
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition relative ${
                  isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 leading-tight truncate max-w-[64px] ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary quick bar strip for Expenses & Settings on mobile if needed */}
        <div className="bg-slate-100 border-t border-slate-200/80 px-4 py-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
          <button
            onClick={() => onTabChange('expenses')}
            className={`flex items-center gap-1.5 py-0.5 px-2 rounded transition ${
              currentTab === 'expenses'
                ? 'bg-rose-100 text-rose-800 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.navExpenses}</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-1.5 py-0.5 px-2 rounded transition ${
              currentTab === 'settings'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.navSettings}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
