'use client';

import React from 'react';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'vehicles'
  | 'dealership'
  | 'compare'
  | 'costs'
  | 'ranking'
  | 'settings';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewVehicle?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeScenarioName?: string;
  onOpenDataSync?: () => void;
}

export function TopBar({
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  activeScenarioName,
  onOpenDataSync,
}: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-200/60 dark:border-white/10 bg-slate-100/80 dark:bg-[#070e20]/80 supports-[backdrop-filter]:bg-slate-100/70 dark:supports-[backdrop-filter]:bg-[#070e20]/75 backdrop-blur-xl backdrop-saturate-180 pt-[env(safe-area-inset-top,0px)] shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_-1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_-1px_0_0_rgba(255,255,255,0.05)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark with official icon */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange('dashboard')}
            className="group flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-blue-900/30 border border-white/60 dark:border-blue-400/30 group-hover:scale-105 transition-transform shrink-0 relative bg-[#070e20] flex items-center justify-center">
              <Image
                src="/icon-carmatch.png"
                alt="Meu Próximo Carro"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-none">
                Meu Próximo Carro
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Floating Glass Segmented Navigation Dock */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-200/40 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
          {(
            [
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'vehicles', label: 'Veículos' },
              { id: 'compare', label: 'Comparação' },
              { id: 'costs', label: 'Custos & TCO' },
              { id: 'ranking', label: 'Ranking' },
              { id: 'settings', label: 'Configurações' },
            ] as const
          ).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-1.5 text-xs rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white/95 dark:bg-blue-600/30 text-blue-700 dark:text-cyan-300 font-semibold shadow-xs border border-white/80 dark:border-blue-400/30 backdrop-blur-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Glass Actions */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle Glass Button */}
          <button
            onClick={onToggleDarkMode}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-slate-850/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all cursor-pointer active:scale-95"
            aria-label="Alternar tema claro/escuro"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
}
