'use client';

import React, { useState, useMemo } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import {
  calculateTCO,
  calculateCategoryScores,
  checkElimination,
  getIsofixRating,
  formatMoney,
  formatNumber,
  compareDimensions,
  computeUnifiedRanking,
} from '@/lib/calculations';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CalculationModal } from '@/components/ui/CalculationModal';
import { ReportModal } from '@/components/ui/ReportModal';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  Scale,
  Car,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { ActiveTab } from '../navigation/TopBar';

interface DashboardViewProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  onNavigate: (tab: ActiveTab) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onNewVehicle: () => void;
}

export function DashboardView({
  vehicles,
  preferences,
  onNavigate,
  onSelectVehicle,
  onNewVehicle,
}: DashboardViewProps) {
  const [selectedCalcVehicle, setSelectedCalcVehicle] = useState<Vehicle | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const usedCar = preferences.usedCar;

  // Unified official ranking matching RankingView exactly
  const {
    eligibleVehicles,
    unmeasuredVehicles,
    viableRanked,
    disqualifiedRanked,
    fullRanking,
  } = useMemo(() => computeUnifiedRanking(vehicles, preferences), [vehicles, preferences]);

  // Principais candidatos finalistas: exatamente os primeiros colocados do ranking oficial unificado
  const topFinalists = fullRanking.slice(0, 3);

  // Key summary values (baseados no ranking oficial unificado)
  const lowestTcoVehicle = viableRanked.length > 0
    ? [...viableRanked].sort((a, b) => a.tco.totalTCO - b.tco.totalTCO)[0]
    : (fullRanking.length > 0 ? [...fullRanking].sort((a, b) => a.tco.totalTCO - b.tco.totalTCO)[0] : null);

  const widestIsofixVehicle = viableRanked.length > 0
    ? [...viableRanked].sort(
        (a, b) => (b.vehicle.familySpace.isofixDistanceCm || 0) - (a.vehicle.familySpace.isofixDistanceCm || 0)
      )[0]
    : (fullRanking.length > 0
        ? [...fullRanking].sort(
            (a, b) => (b.vehicle.familySpace.isofixDistanceCm || 0) - (a.vehicle.familySpace.isofixDistanceCm || 0)
          )[0]
        : null);

  // Decision Pending Items
  const pendingItems: { vehicle: Vehicle; issue: string; impact: string }[] = [];
  const minIsofix = preferences?.isofixMinDistanceCm ?? 45;
  vehicles.forEach((vehicle) => {
    const isofix = vehicle.familySpace?.isofixDistanceCm;
    const isUnmeasured = isofix === null || isofix === undefined || isNaN(isofix) || isofix === 0;
    const is5SeatsOrLess = (vehicle.familySpace?.passengerCapacity ?? 5) <= 5;
    if (is5SeatsOrLess) {
      if (isUnmeasured) {
        pendingItems.push({
          vehicle,
          issue: 'Medição presencial da fita métrica do ISOFIX pendente',
          impact: `Exigido para entrar no ranking (espaço ≥ ${minIsofix} cm para 5 passageiros).`,
        });
      } else if (isofix < minIsofix) {
        pendingItems.push({
          vehicle,
          issue: `ISOFIX de ${formatNumber(isofix, 2)} cm abaixo do mínimo exigido (${minIsofix} cm)`,
          impact: 'Fora do ranking por não acomodar cadeirinhas familiares.',
        });
      }
    }
    if (!vehicle.financial?.storePrice) {
      pendingItems.push({
        vehicle,
        issue: 'Preço final da loja não informado',
        impact: 'Impacta o cálculo do IPVA (2,5% na Bahia) e TCO acumulado.',
      });
    }
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs">
      {/* 1. Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Como está minha decisão?
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 backdrop-blur-xl transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>Relatório Finalistas</span>
          </button>

          <button
            onClick={() => onNavigate('compare')}
            className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white/60 dark:bg-slate-850/60 text-slate-800 dark:text-slate-200 border border-white/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-800 backdrop-blur-xl transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <Scale className="w-4 h-4 text-slate-500" />
            <span>Comparar ({viableRanked.length})</span>
          </button>
        </div>
      </div>

      {/* Welcome banner when zero vehicles are registered */}
      {vehicles.length === 0 && (
        <div className="p-8 sm:p-10 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Car className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bem-vindo ao Meu Próximo Carro
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Sua ferramenta analítica para compra automotiva familiar na Bahia. Cadastre os veículos candidatos para comparar dimensões com o seu carro usado, espaço traseiro ISOFIX e TCO simplificado de 3 anos.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onNewVehicle}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Veículo</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Core Numbers Strip */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Viáveis */}
          <div className="p-4 sm:p-5 rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
              Veículos no Ranking
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {fullRanking.length}
              </span>
              <span className="text-xs text-slate-500">classificados</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {disqualifiedRanked.length > 0
                ? `${disqualifiedRanked.length} ${disqualifiedRanked.length === 1 ? 'desclassificado' : 'desclassificados'} (fora do ranking).`
                : `${unmeasuredVehicles.length} pendentes de medição ISOFIX.`}
            </p>
          </div>

          {/* Líder Geral */}
          <div className="p-4 sm:p-5 rounded-3xl border border-blue-200/60 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/25 backdrop-blur-2xl shadow-sm">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-cyan-300 block uppercase">
              Líder do Ranking
            </span>
            <div className="mt-1">
              {fullRanking.length > 0 ? (
                <>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white block truncate">
                    {fullRanking[0].vehicle.brand} {fullRanking[0].vehicle.model}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
                    Nota: {formatNumber(fullRanking[0].scores.finalWeightedScore, 1)} / 100
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">Nenhum veículo apto</span>
              )}
            </div>
          </div>

          {/* Menor TCO (3 Anos) */}
          <div className="p-4 sm:p-5 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/25 backdrop-blur-2xl shadow-sm">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block uppercase">
              Menor TCO (3 Anos BA)
            </span>
            <div className="mt-1">
              {lowestTcoVehicle ? (
                <>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white block truncate">
                    {lowestTcoVehicle.vehicle.brand} {lowestTcoVehicle.vehicle.model}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    R$ {formatMoney(lowestTcoVehicle.tco.totalTCO)} (R$ {formatMoney(lowestTcoVehicle.tco.monthlyTCO)}/mês)
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">Nenhum</span>
              )}
            </div>
          </div>

          {/* Maior Distância ISOFIX */}
          <div className="p-4 sm:p-5 rounded-3xl border border-cyan-200/60 dark:border-cyan-900/60 bg-cyan-50/50 dark:bg-cyan-950/25 backdrop-blur-2xl shadow-sm">
            <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 block uppercase">
              Maior Espaço Traseiro ISOFIX
            </span>
            <div className="mt-1">
              {widestIsofixVehicle && widestIsofixVehicle.vehicle.familySpace.isofixDistanceCm ? (
                <>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white block truncate">
                    {widestIsofixVehicle.vehicle.brand} {widestIsofixVehicle.vehicle.model}
                  </span>
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {formatNumber(widestIsofixVehicle.vehicle.familySpace.isofixDistanceCm, 2)} cm medidos
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">Medições pendentes</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Carros Finalistas com Dimensões e Peso */}
      {topFinalists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Principais Candidatos Finalistas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top colocados no ranking oficial ponderado com TCO de 3 anos e dimensões vs seu usado ({usedCar?.brand} {usedCar?.model}).
              </p>
            </div>
            <button
              onClick={() => onNavigate('ranking')}
              className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver ranking completo ({fullRanking.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topFinalists.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Nenhum veículo classificado no momento.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {unmeasuredVehicles.length > 0 && `${unmeasuredVehicles.length} aguardam medição do ISOFIX. `}
                {disqualifiedRanked.length > 0 && `${disqualifiedRanked.length} desclassificados pelos critérios atuais.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topFinalists.map((item, idx) => {
                const { vehicle, scores, tco } = item;
                const isofixRating = getIsofixRating(vehicle.familySpace.isofixDistanceCm);
                const rankPosition = idx + 1;

                return (
                  <div
                    key={vehicle.id}
                    className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl p-5 shadow-sm flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                            #{rankPosition} no Ranking
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {vehicle.version} · {vehicle.powertrain}
                          </p>
                        </div>

                        <div className="text-right px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/10 border border-white/50 dark:border-white/10">
                          <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatNumber(scores.finalWeightedScore, 1)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ 100</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/40 dark:border-white/5">
                        <StatusBadge status={vehicle.status} size="sm" />
                        <span className="text-[11px] text-slate-500">
                          {vehicle.dealership || 'Sem concessionária'}
                        </span>
                      </div>

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

                      {/* TCO 3 Anos (BA) */}
                      <div className="p-2.5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">TCO 3 Anos (BA)</span>
                        <span className={`font-bold tabular-nums block mt-0.5 ${usedCar?.tco3Years && tco.totalTCO > usedCar.tco3Years ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                          R$ {formatMoney(tco.totalTCO)}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                          R$ {formatMoney(tco.monthlyTCO)}/mês
                        </span>
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

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCalcVehicle(vehicle)}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Ver cálculo
                    </button>

                    <button
                      onClick={() => onSelectVehicle(vehicle)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm cursor-pointer"
                    >
                      Detalhes & Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* 4. Pendências que Podem Mudar a Decisão */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Pendências que podem mudar a decisão
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dados importantes ainda pendentes de confirmação ou medição com fita métrica no showroom.
        </p>

        {pendingItems.length === 0 ? (
          <div className="p-4 rounded-3xl bg-emerald-500/12 dark:bg-emerald-500/15 border border-emerald-500/25 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Todos os dados críticos e medições dos finalistas estão preenchidos!</span>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingItems.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.vehicle.brand} {item.vehicle.model}:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{item.issue}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Impacto: {item.impact}
                  </p>
                </div>

                <button
                  onClick={() => onSelectVehicle(item.vehicle)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-medium shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  Resolver
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <CalculationModal
        vehicle={selectedCalcVehicle}
        preferences={preferences}
        isOpen={Boolean(selectedCalcVehicle)}
        onClose={() => setSelectedCalcVehicle(null)}
      />

      <ReportModal
        vehicles={vehicles}
        preferences={preferences}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
