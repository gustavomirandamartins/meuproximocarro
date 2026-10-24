'use client';

import React, { useState } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { calculateTCO, calculateCategoryScores, checkElimination, getIsofixRating, formatMoney, formatNumber, compareDimensions, calculateAnnualConsumption } from '@/lib/calculations';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CalculationModal } from '@/components/ui/CalculationModal';
import { VehicleReportModal } from '@/components/ui/VehicleReportModal';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ClipboardCheck,
  AlertTriangle,
  Scale,
  Car,
  Sparkles,
  Archive,
  ArchiveRestore,
  FileText,
  Zap,
} from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onToggleArchiveVehicle?: (id: string) => void;
  onNewVehicle: () => void;
  onNavigateToDealership: (vehicle: Vehicle) => void;
  onNavigateToCompare: () => void;
}

export function VehiclesView({
  vehicles,
  preferences,
  onEditVehicle,
  onDeleteVehicle,
  onToggleArchiveVehicle,
  onNewVehicle,
  onNavigateToDealership,
  onNavigateToCompare,
}: VehiclesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusScope, setStatusScope] = useState<'active' | 'archived' | 'all'>('active');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCalcVehicle, setSelectedCalcVehicle] = useState<Vehicle | null>(null);
  const [selectedReportVehicle, setSelectedReportVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const usedCar = preferences.usedCar;

  const activeCount = vehicles.filter((v) => !v.isArchived).length;
  const archivedCount = vehicles.filter((v) => !!v.isArchived).length;
  const totalCount = vehicles.length;

  // Filter & Search logic
  const filteredVehicles = vehicles.filter((v) => {
    // 1. Status Scope (Ativos vs Arquivados vs Todos)
    if (statusScope === 'active' && v.isArchived) return false;
    if (statusScope === 'archived' && !v.isArchived) return false;

    // 2. Search query
    const matchesSearch =
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.dealership.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.version.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 3. Technical filter
    const elim = checkElimination(v, preferences);

    if (filterType === 'viable') return !elim.isEliminated;
    if (filterType === 'eliminated') return elim.isEliminated;
    if (filterType === 'phev') return v.powertrain === 'PHEV';
    if (filterType === 'hev') return v.powertrain === 'HEV';
    if (filterType === 'reev') return v.powertrain === 'REEV';
    if (filterType === 'finalist') return v.status === 'Finalista';

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Veículos Cadastrados
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie especificações, dimensões comparadas ao seu usado e TCO simplificado de 3 anos na Bahia.
          </p>
        </div>

        <button
          onClick={onNewVehicle}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900/90 dark:bg-white/90 dark:text-slate-950 rounded-xl hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-1.5 self-start sm:self-auto min-h-[40px] shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Veículo</span>
        </button>
      </div>

      {/* Status Scope Selector: Ativos / Arquivados / Todos */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl">
          <button
            onClick={() => setStatusScope('active')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 min-h-[34px] ${
              statusScope === 'active'
                ? 'bg-white dark:bg-white/15 text-slate-950 dark:text-white shadow-xs border border-white/80 dark:border-white/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Ativos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 font-bold">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusScope('archived')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 min-h-[34px] ${
              statusScope === 'archived'
                ? 'bg-amber-500 text-slate-950 shadow-xs border border-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arquivados</span>
            {archivedCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusScope === 'archived'
                  ? 'bg-amber-900/20 text-slate-950'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              }`}>
                {archivedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusScope('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 min-h-[34px] ${
              statusScope === 'all'
                ? 'bg-white dark:bg-white/15 text-slate-950 dark:text-white shadow-xs border border-white/80 dark:border-white/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Todos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {totalCount}
            </span>
          </button>
        </div>

        {archivedCount > 0 && statusScope === 'active' && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Archive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {archivedCount} veículo{archivedCount > 1 ? 's' : ''} escondido{archivedCount > 1 ? 's' : ''} em <strong>Arquivados</strong>
            </span>
            <button
              onClick={() => setStatusScope('archived')}
              className="text-blue-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
            >
              Ver arquivados
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por marca, modelo, versão, concessionária..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/60 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/40 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: `Todos (${filteredVehicles.length})` },
            { id: 'viable', label: 'Viáveis' },
            { id: 'eliminated', label: 'Eliminados' },
            { id: 'phev', label: 'PHEV' },
            { id: 'hev', label: 'HEV' },
            { id: 'reev', label: 'REEV' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap min-h-[34px] cursor-pointer ${
                filterType === tab.id
                  ? 'bg-white/95 dark:bg-white/15 text-slate-950 dark:text-white shadow-xs border border-white/80 dark:border-white/15'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-white/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl space-y-3">
          {statusScope === 'archived' ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Archive className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nenhum veículo arquivado no momento.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                A função &ldquo;Arquivar&rdquo; permite guardar veículos com todas as suas informações preenchidas, mantendo-os escondidos dos rankings e comparativos sem precisar excluí-los.
              </p>
              <button
                onClick={() => setStatusScope('active')}
                className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer shadow-sm hover:opacity-90"
              >
                Ver Veículos Ativos ({activeCount})
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Nenhum veículo encontrado com os filtros selecionados.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/20 cursor-pointer"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={onNewVehicle}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-xl bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 cursor-pointer shadow-sm"
                >
                  Cadastrar Veículo
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const elim = checkElimination(vehicle, preferences);
            const scores = calculateCategoryScores(vehicle, preferences);
            const tco = calculateTCO(vehicle, preferences);
            const isofixRating = getIsofixRating(vehicle.familySpace.isofixDistanceCm);
            const annualCons = calculateAnnualConsumption(vehicle, preferences);

            return (
              <div
                key={vehicle.id}
                className={`rounded-3xl border backdrop-blur-2xl backdrop-saturate-180 p-5 transition-all flex flex-col justify-between group ${
                  vehicle.isArchived
                    ? 'border-amber-300/60 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20 opacity-85 hover:opacity-100 shadow-xs'
                    : elim.isEliminated
                    ? 'border-rose-300/60 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/25'
                    : 'border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 hover:border-white/90 dark:hover:border-white/20 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  {/* Archived Top Notice if archived */}
                  {vehicle.isArchived && (
                    <div className="p-2 rounded-xl bg-amber-500/15 dark:bg-amber-950/50 border border-amber-300/40 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Arquivado (Escondido dos rankings)</span>
                      </span>
                      {onToggleArchiveVehicle && (
                        <button
                          onClick={() => onToggleArchiveVehicle(vehicle.id)}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-100 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                          title="Reativar e desarquivar veículo"
                        >
                          <ArchiveRestore className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Desarquivar</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Top line: Brand Logo + Brand/Model + Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <BrandLogo
                        brand={vehicle.brand}
                        model={vehicle.model}
                        size="md"
                        showFallbackText
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block truncate">
                          {vehicle.brand}
                        </span>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {vehicle.model}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {vehicle.version} · {vehicle.powertrain} ({vehicle.yearModel})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 px-2 py-1 rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-2xs">
                      <span
                        className={`text-lg font-bold tabular-nums ${
                          elim.isPendingMeasurement
                            ? 'text-amber-600 dark:text-amber-400'
                            : elim.isEliminated
                            ? 'text-slate-500 dark:text-slate-400 line-through'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatNumber(scores.finalWeightedScore, 1)}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-none">/ 100</span>
                    </div>
                  </div>

                  {/* Status, Dealership, Passenger Capacity and User Impression (50%) */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <StatusBadge status={vehicle.status} size="sm" />
                    <span className="text-[11px] text-slate-500">
                      {vehicle.dealership || 'Sem concessionária'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {vehicle.familySpace.passengerCapacity || 5} passageiros
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      scores.userImpressionRaw !== null
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                    }`}>
                      <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                      <span>Impressão: {scores.userImpressionRaw !== null ? `${formatNumber(scores.userImpressionRaw, 1)}/10` : 'Pendente'} (50%)</span>
                    </span>
                  </div>

                  {/* Eliminatory alert banner if eliminated or pending */}
                  {elim.isPendingMeasurement ? (
                    <div className="p-2.5 rounded-2xl bg-amber-500/12 dark:bg-amber-950/40 border border-amber-300/40 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Falta de medição ISOFIX (aspecto eliminatório: nota zero até medir)</span>
                    </div>
                  ) : elim.isEliminated ? (
                    <div className="p-2.5 rounded-2xl bg-rose-500/12 dark:bg-rose-950/40 border border-rose-300/40 dark:border-rose-900/60 text-[11px] text-rose-900 dark:text-rose-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{elim.reason}</span>
                    </div>
                  ) : null}

                  {/* Metrics grid: Dados essenciais e principais métricas */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                    {/* Preço da Loja */}
                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Preço da Loja</span>
                      <span className={`font-bold tabular-nums block mt-0.5 ${vehicle.financial.storePrice > (preferences.maxStorePrice ?? 200000) ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                        R$ {formatMoney(vehicle.financial.storePrice || vehicle.financial.tablePrice)}
                      </span>
                    </div>

                    {/* Distância ISOFIX */}
                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Distância ISOFIX</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`font-bold tabular-nums ${vehicle.familySpace.isofixDistanceCm !== null && vehicle.familySpace.isofixDistanceCm < (preferences.isofixMinDistanceCm ?? 45) ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                          {vehicle.familySpace.isofixDistanceCm !== null && vehicle.familySpace.isofixDistanceCm !== undefined
                            ? `${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm`
                            : 'Em branco'}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isofixRating.badgeBg} ${isofixRating.badgeText}`}>
                          {isofixRating.rating}
                        </span>
                      </div>
                    </div>

                    {/* Consumo Anual (e estimativa só na energia elétrica ao lado se for PHEV ou Elétrico) */}
                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Consumo Anual</span>
                          {annualCons.isElectricOrPhev && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" />
                              {annualCons.isBev ? '100% Elétrico' : 'PHEV'}
                            </span>
                          )}
                        </div>
                        <span className="font-bold tabular-nums block mt-0.5 text-slate-900 dark:text-white">
                          R$ {formatMoney(annualCons.annualTotal)}
                          <span className="text-[10px] font-normal text-slate-400"> /ano</span>
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          R$ {formatMoney(annualCons.monthlyTotal)} / mês
                        </span>
                      </div>

                      {/* Estimativa só na energia elétrica ao lado / abaixo se for PHEV ou BEV */}
                      {annualCons.isElectricOrPhev && annualCons.electricOnlyAnnual !== null && (
                        <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-white/10 text-[10px]">
                          {annualCons.isPhev || annualCons.isReev ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <span className="flex items-center gap-0.5">
                                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>Só na tomada:</span>
                                </span>
                                <span className="tabular-nums font-bold">
                                  R$ {formatMoney(annualCons.electricOnlyAnnual)}/ano
                                </span>
                              </div>
                              {annualCons.electricEconomyAnnual && annualCons.electricEconomyAnnual > 0 && (
                                <span className="text-[9px] text-emerald-700 dark:text-emerald-300 block font-medium">
                                  Econ. de R$ {formatMoney(annualCons.electricEconomyAnnual)}/ano
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1 text-cyan-600 dark:text-cyan-400 font-semibold">
                              <span className="flex items-center gap-0.5">
                                <Zap className="w-3 h-3 text-cyan-500 shrink-0" />
                                <span>Tomada (BA 0,95)</span>
                              </span>
                              <span className="tabular-nums font-medium text-[9px] text-slate-500">
                                {annualCons.annualKwhTotal} kWh/ano
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comprimento */}
                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Comprimento</span>
                      <span className={`font-bold tabular-nums block mt-0.5 ${usedCar?.lengthMm && vehicle.familySpace.lengthMm > usedCar.lengthMm ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                        {formatNumber(vehicle.familySpace.lengthMm, 0)} mm
                      </span>
                    </div>

                    {/* Porta-Malas */}
                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Porta-Malas</span>
                      <span className={`font-bold tabular-nums block mt-0.5 ${usedCar?.trunkVolumeLiters && vehicle.trunk.volumeLiters < usedCar.trunkVolumeLiters ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                        {vehicle.trunk.volumeLiters} L
                      </span>
                    </div>

                    {/* Consumo Urbano */}
                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Consumo Urbano</span>
                      <span className={`font-bold tabular-nums block mt-0.5 ${usedCar?.urbanGasolineKmL && vehicle.consumption.urbanKmL < usedCar.urbanGasolineKmL ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                        {vehicle.consumption.urbanKmL ? `${vehicle.consumption.urbanKmL} km/l` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/5 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigateToDealership(vehicle)}
                      className="px-2.5 py-1.5 text-slate-600 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 bg-white/50 dark:bg-white/5 hover:bg-amber-500/15 border border-white/40 dark:border-white/5 rounded-xl transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Teste presencial na concessionária"
                    >
                      <ClipboardCheck className="w-4 h-4 text-amber-500" />
                      <span className="hidden sm:inline text-xs font-medium">Testar</span>
                    </button>

                    <button
                      onClick={() => setSelectedCalcVehicle(vehicle)}
                      className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/15 border border-white/40 dark:border-white/5 rounded-xl transition-all min-h-[38px] flex items-center justify-center text-xs font-medium cursor-pointer shadow-2xs"
                      title="Ver memória de cálculo detalhada"
                    >
                      Cálculo
                    </button>

                    <button
                      onClick={() => setSelectedReportVehicle(vehicle)}
                      className="px-2.5 py-1.5 text-blue-700 dark:text-cyan-300 hover:text-blue-800 dark:hover:text-cyan-200 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 rounded-xl transition-all min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
                      title="Gerar relatório do veículo com todas as informações contidas no cadastro"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                      <span className="hidden sm:inline">Relatório</span>
                    </button>

                    {deleteConfirmId === vehicle.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteVehicle(vehicle.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(vehicle.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Excluir veículo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {onToggleArchiveVehicle && (
                      <button
                        onClick={() => onToggleArchiveVehicle(vehicle.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                          vehicle.isArchived
                            ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-300/40 dark:border-emerald-800/40'
                            : 'text-slate-400 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-500/10'
                        }`}
                        title={vehicle.isArchived ? "Desarquivar veículo (reativar nos rankings)" : "Arquivar veículo (manter escondido sem excluir)"}
                      >
                        {vehicle.isArchived ? (
                          <ArchiveRestore className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onEditVehicle(vehicle)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-semibold text-xs transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Memória de Cálculo */}
      <CalculationModal
        vehicle={selectedCalcVehicle}
        preferences={preferences}
        isOpen={!!selectedCalcVehicle}
        onClose={() => setSelectedCalcVehicle(null)}
      />

      {/* Modal de Relatório Completo do Veículo */}
      <VehicleReportModal
        vehicle={selectedReportVehicle}
        preferences={preferences}
        isOpen={!!selectedReportVehicle}
        onClose={() => setSelectedReportVehicle(null)}
      />
    </div>
  );
}
