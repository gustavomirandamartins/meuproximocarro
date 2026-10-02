'use client';

import React, { useState, useEffect } from 'react';
import { useCarMatchStore } from '@/lib/storage';
import { Vehicle } from '@/types/vehicle';
import { TopBar, ActiveTab } from '@/components/navigation/TopBar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { DashboardView } from '@/components/views/DashboardView';
import { VehiclesView } from '@/components/views/VehiclesView';
import { ComparisonView } from '@/components/views/ComparisonView';
import { TcoCostsView } from '@/components/views/TcoCostsView';
import { DealershipQuickTestView } from '@/components/views/DealershipQuickTestView';
import { RankingView } from '@/components/views/RankingView';
import { SettingsView } from '@/components/views/SettingsView';
import { VehicleFormModal } from '@/components/views/VehicleFormModal';
import { ExcelManagerModal } from '@/components/ui/ExcelManagerModal';
import { CheckCircle2, X } from 'lucide-react';

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storedTheme = localStorage.getItem('carmatch_theme');
    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
}

export default function Home() {
  const {
    vehicles,
    preferences,
    activeScenarioId,
    isHydrated,
    scenarios,
    upsertVehicle,
    deleteVehicle,
    savePreferences,
    applyScenario,
    resetToSeedData,
    importData,
  } = useCarMatchStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDataSyncOpen, setIsDataSyncOpen] = useState<boolean>(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [activeDealershipVehicleId, setActiveDealershipVehicleId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark mode class on document immediately and on state change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('carmatch_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored ? stored === 'dark' : prefersDark;
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setTimeout(() => {
        setIsDarkMode(shouldBeDark);
      }, 0);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const color = isDarkMode ? '#070e20' : '#f1f5f9';
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Dynamic theme-color meta to ensure status bar strictly matches the header
    let metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color);
  }, [isDarkMode]);

  // Ensure browser document title is strictly "Meu Próximo Carro"
  useEffect(() => {
    document.title = 'Meu Próximo Carro';
  }, []);

  // Check URL hash for direct data transfer from Dev environment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.startsWith('#import=')) {
      try {
        const encoded = hash.replace('#import=', '');
        const jsonStr = decodeURIComponent(escape(atob(encoded)));
        const parsed = JSON.parse(jsonStr);
        if (parsed && Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0) {
          const res = importData(parsed, 'replace');
          if (res.success) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setTimeout(() => {
              setToastMessage(`🎉 ${res.count} veículo(s) transferidos com sucesso para a versão publicada!`);
            }, 50);
            setTimeout(() => setToastMessage(null), 6000);
          }
        }
      } catch (e) {
        console.error('Falha ao importar dados da URL', e);
      }
    }
  }, [importData]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('carmatch_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('carmatch_theme', 'light');
      }
      return next;
    });
  };

  const handleOpenNewVehicle = () => {
    setVehicleToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setIsFormOpen(true);
  };

  const handleOpenDealershipTest = (vehicle: Vehicle) => {
    setActiveDealershipVehicleId(vehicle.id);
    setActiveTab('dealership');
  };

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  // Hydration fallback skeleton
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Carregando Meu Próximo Carro...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/90 dark:bg-[#070e20] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 antialiased relative overflow-x-hidden selection:bg-blue-500/20">
      {/* iOS Ambient Chromatic Refractor Mesh for Glassmorphism - Icon Sapphire/Electric Cobalt Palette */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 dark:bg-blue-600/25 blur-3xl animate-pulse duration-1000" />
        <div className="absolute top-1/4 -right-28 w-[28rem] h-[28rem] rounded-full bg-cyan-500/12 dark:bg-cyan-500/15 blur-3xl" />
        <div className="absolute top-2/3 -left-20 w-80 h-80 rounded-full bg-sky-500/12 dark:bg-sky-600/15 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-[32rem] h-[32rem] rounded-full bg-blue-800/18 dark:bg-blue-900/25 blur-3xl" />
      </div>

      {/* Top Bar Navigation */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewVehicle={handleOpenNewVehicle}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        activeScenarioName={activeScenario?.name}
        onOpenDataSync={() => setIsDataSyncOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 p-4 rounded-2xl bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-[0_12px_36px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.9)] border border-white/20 dark:border-white/40 backdrop-blur-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-xl text-slate-400 hover:text-white dark:hover:text-slate-900 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-20 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            vehicles={vehicles}
            preferences={preferences}
            onNavigate={setActiveTab}
            onSelectVehicle={handleOpenEditVehicle}
            onNewVehicle={handleOpenNewVehicle}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiclesView
            vehicles={vehicles}
            preferences={preferences}
            onEditVehicle={handleOpenEditVehicle}
            onDeleteVehicle={deleteVehicle}
            onNewVehicle={handleOpenNewVehicle}
            onNavigateToDealership={handleOpenDealershipTest}
            onNavigateToCompare={() => setActiveTab('compare')}
          />
        )}

        {activeTab === 'compare' && (
          <ComparisonView
            vehicles={vehicles}
            preferences={preferences}
            onEditVehicle={handleOpenEditVehicle}
            onNewVehicle={handleOpenNewVehicle}
          />
        )}

        {activeTab === 'costs' && (
          <TcoCostsView
            vehicles={vehicles}
            preferences={preferences}
            onUpdatePreferences={savePreferences}
            onSelectVehicle={handleOpenEditVehicle}
            onNewVehicle={handleOpenNewVehicle}
          />
        )}

        {activeTab === 'dealership' && (
          <DealershipQuickTestView
            vehicles={vehicles}
            preferences={preferences}
            selectedVehicleId={activeDealershipVehicleId}
            onUpdateVehicle={upsertVehicle}
            onNewVehicle={handleOpenNewVehicle}
          />
        )}

        {activeTab === 'ranking' && (
          <RankingView
            vehicles={vehicles}
            preferences={preferences}
            onSelectVehicle={handleOpenEditVehicle}
            onNavigateToSettings={() => setActiveTab('settings')}
            onUpdatePreferences={savePreferences}
            onNewVehicle={handleOpenNewVehicle}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            preferences={preferences}
            activeScenarioId={activeScenarioId}
            onUpdatePreferences={savePreferences}
            onApplyScenario={applyScenario}
            onResetSeedData={resetToSeedData}
            onOpenDataSync={() => setIsDataSyncOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Progressive Form Modal for adding/editing vehicles */}
      <VehicleFormModal
        key={vehicleToEdit ? vehicleToEdit.id : (isFormOpen ? 'new-form' : 'closed')}
        vehicleToEdit={vehicleToEdit}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setVehicleToEdit(null);
        }}
        onSave={(vehicle) => {
          upsertVehicle(vehicle);
          setToastMessage(`Veículo "${vehicle.brand} ${vehicle.model}" salvo com sucesso!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Excel Spreadsheet Manager Modal */}
      <ExcelManagerModal
        isOpen={isDataSyncOpen}
        onClose={() => setIsDataSyncOpen(false)}
        vehicles={vehicles}
        preferences={preferences}
        activeScenarioId={activeScenarioId}
        onImportData={importData}
      />
    </div>
  );
}
