'use client';

import React, { useState } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { calculateTCO, calculateCategoryScores, checkElimination, getIsofixRating, formatMoney, formatNumber, compareDimensions } from '@/lib/calculations';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CalculationModal } from '@/components/ui/CalculationModal';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ClipboardCheck,
  AlertTriangle,
  Scale,
  Car,
} from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onNewVehicle: () => void;
  onNavigateToDealership: (vehicle: Vehicle) => void;
  onNavigateToCompare: () => void;
}

export function VehiclesView({
  vehicles,
  preferences,
  onEditVehicle,
  onDeleteVehicle,
  onNewVehicle,
  onNavigateToDealership,
  onNavigateToCompare,
}: VehiclesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCalcVehicle, setSelectedCalcVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const usedCar = preferences.usedCar;

  // Filter & Search logic
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.dealership.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.version.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

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
            { id: 'all', label: `Todos (${vehicles.length})` },
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const elim = checkElimination(vehicle, preferences);
            const scores = calculateCategoryScores(vehicle, preferences);
            const tco = calculateTCO(vehicle, preferences);
            const isofixRating = getIsofixRating(vehicle.familySpace.isofixDistanceCm);

            return (
              <div
                key={vehicle.id}
                className={`rounded-3xl border backdrop-blur-2xl backdrop-saturate-180 p-5 transition-all flex flex-col justify-between group ${
                  elim.isEliminated
                    ? 'border-rose-300/60 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/25'
                    : 'border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 hover:border-white/90 dark:hover:border-white/20 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  {/* Top line: Brand/Model + Score */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {vehicle.brand}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {vehicle.model}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {vehicle.version} · {vehicle.powertrain} ({vehicle.yearModel})
                      </p>
                    </div>

                    <div className="text-right shrink-0 px-2 py-1 rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-2xs">
                      <span
                        className={`text-lg font-bold tabular-nums ${
                          elim.isEliminated
                            ? 'text-slate-500 dark:text-slate-400 line-through'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatNumber(scores.finalWeightedScore, 1)}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-none">/ 100</span>
                    </div>
                  </div>

                  {/* Status, Dealership, and Passenger Capacity */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <StatusBadge status={vehicle.status} size="sm" />
                    <span className="text-[11px] text-slate-500">
                      {vehicle.dealership || 'Sem concessionária'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {vehicle.familySpace.passengerCapacity || 5} passageiros
                    </span>
                  </div>

                  {/* Eliminatory alert banner if eliminated or pending */}
                  {elim.isEliminated ? (
                    <div className="p-2.5 rounded-2xl bg-rose-500/12 dark:bg-rose-950/40 border border-rose-300/40 dark:border-rose-900/60 text-[11px] text-rose-900 dark:text-rose-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{elim.reason}</span>
                    </div>
                  ) : elim.isPendingMeasurement ? (
                    <div className="p-2.5 rounded-2xl bg-amber-500/12 dark:bg-amber-950/40 border border-amber-300/40 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Medição ISOFIX em branco — realizar na concessionária</span>
                    </div>
                  ) : null}

                  {/* Metrics grid: ISOFIX, Preço da Loja, TCO 3 Anos, Custo Mensal */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Distância ISOFIX</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {vehicle.familySpace.isofixDistanceCm !== null && vehicle.familySpace.isofixDistanceCm !== undefined
                            ? `${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm`
                            : 'Em branco'}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isofixRating.badgeBg} ${isofixRating.badgeText}`}>
                          {isofixRating.rating}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Preço da Loja</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">
                        R$ {formatMoney(vehicle.financial.storePrice || vehicle.financial.tablePrice)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">TCO (3 Anos BA)</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums block mt-0.5">
                        R$ {formatMoney(tco.totalTCO)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Custo Mensal (3a)</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums block mt-0.5">
                        R$ {formatMoney(tco.monthlyTCO)} / mês
                      </span>
                    </div>
                  </div>

                  {/* Dimensões e Peso nos Cards Principais */}
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Dimensões & Peso
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">Comp: </span>
                        <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.lengthMm, 0)} mm</strong>
                        {usedCar && (
                          <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                            {compareDimensions(vehicle.familySpace.lengthMm, usedCar.lengthMm).text}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500">Larg: </span>
                        <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.widthMm, 0)} mm</strong>
                        {usedCar && (
                          <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                            {compareDimensions(vehicle.familySpace.widthMm, usedCar.widthMm).text}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500">Entre-eixos: </span>
                        <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.wheelbaseMm, 0)} mm</strong>
                        {usedCar && (
                          <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                            {compareDimensions(vehicle.familySpace.wheelbaseMm, usedCar.wheelbaseMm).text}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500">Peso: </span>
                        <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.weightKg, 0)} kg</strong>
                        {usedCar && (
                          <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                            {compareDimensions(vehicle.familySpace.weightKg, usedCar.weightKg, 'kg').text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desempenho, Consumo & Porta-malas vs Usado */}
                  {usedCar && (
                    <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Comparativo vs Usado ({usedCar.brand} {usedCar.model})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
                        <div>
                          <span className="text-slate-500">Porta-Malas: </span>
                          <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.trunk.volumeLiters} L</strong>
                          {usedCar.trunkVolumeLiters && (
                            <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                              {compareDimensions(vehicle.trunk.volumeLiters, usedCar.trunkVolumeLiters, 'L').text}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500">0-100 km/h: </span>
                          <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.powertrainSpec.zeroToHundredSeconds} s</strong>
                          {usedCar.zeroToHundredSeconds && (
                            <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                              {compareDimensions(vehicle.powertrainSpec.zeroToHundredSeconds, usedCar.zeroToHundredSeconds, 's').text}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500">Potência: </span>
                          <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.powertrainSpec.totalPowerHp} cv</strong>
                          {usedCar.powerHp && (
                            <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                              {compareDimensions(vehicle.powertrainSpec.totalPowerHp, usedCar.powerHp, 'cv').text}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500">Consumo Urbano: </span>
                          <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.consumption.urbanKmL} km/l</strong>
                          {usedCar.urbanGasolineKmL && (
                            <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                              {compareDimensions(vehicle.consumption.urbanKmL, usedCar.urbanGasolineKmL, 'km/l').text}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500">Consumo Estrada: </span>
                          <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.consumption.highwayKmL} km/l</strong>
                          {usedCar.highwayGasolineKmL && (
                            <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                              {compareDimensions(vehicle.consumption.highwayKmL, usedCar.highwayGasolineKmL, 'km/l').text}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500">TCO 3a vs Usado: </span>
                          {usedCar.tco3Years ? (
                            <span className={`block font-semibold tabular-nums ${tco.totalTCO <= usedCar.tco3Years ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {tco.totalTCO <= usedCar.tco3Years
                                ? `- R$ ${formatMoney(usedCar.tco3Years - tco.totalTCO)}`
                                : `+ R$ ${formatMoney(tco.totalTCO - usedCar.tco3Years)}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 block">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes snippet if exists */}
                  {vehicle.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 pt-1 border-t border-white/40 dark:border-white/5">
                      &ldquo;{vehicle.notes}&rdquo;
                    </p>
                  )}
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
    </div>
  );
}
