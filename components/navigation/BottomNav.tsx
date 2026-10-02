'use client';

import React from 'react';
import { ActiveTab } from './TopBar';
import { LayoutDashboard, Car, ClipboardCheck, Scale, Award, Sliders } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Início',
      icon: LayoutDashboard,
    },
    {
      id: 'vehicles' as ActiveTab,
      label: 'Veículos',
      icon: Car,
    },
    {
      id: 'dealership' as ActiveTab,
      label: 'Testes',
      icon: ClipboardCheck,
      highlight: true,
    },
    {
      id: 'compare' as ActiveTab,
      label: 'Comparar',
      icon: Scale,
    },
    {
      id: 'ranking' as ActiveTab,
      label: 'Ranking',
      icon: Award,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-40 px-3 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav
        className="pointer-events-auto max-w-md mx-auto rounded-3xl bg-white/80 dark:bg-[#070e20]/85 backdrop-blur-2xl backdrop-saturate-180 border border-white/60 dark:border-blue-400/20 shadow-[0_12px_40px_rgba(0,16,64,0.12),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] p-1.5 transition-colors"
        role="navigation"
        aria-label="Navegação inferior mobile"
      >
        <div className="grid grid-cols-5 items-center gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-white/95 dark:bg-blue-600/30 text-blue-700 dark:text-cyan-300 font-bold shadow-xs border border-white/70 dark:border-blue-400/30 backdrop-blur-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-transform ${
                    item.highlight && !isActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : ''
                  } ${isActive ? 'scale-110' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight leading-none mt-0.5 font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
