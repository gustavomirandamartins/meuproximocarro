'use client';

import React, { useState } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { calculateTCO, checkElimination, formatMoney, formatNumber } from '@/lib/calculations';
import { CalculationModal } from '@/components/ui/CalculationModal';
import { Calculator, Shield, Fuel, Wrench, FileText, ArrowUpRight } from 'lucide-react';

interface TcoCostsViewProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onNewVehicle?: () => void;
}

export function TcoCostsView({
  vehicles,
  preferences,
  onUpdatePreferences,
  onSelectVehicle,
  onNewVehicle,
}: TcoCostsViewProps) {
  const [selectedCalcVehicle, setSelectedCalcVehicle] = useState<Vehicle | null>(null);

  // Ranked by simplified 3-year TCO ascending
  const calculatedList = vehicles
    .map((v) => {
      const tco = calculateTCO(v, preferences);
      const elim = checkElimination(v, preferences);
      return { vehicle: v, tco, elim };
    })
    .sort((a, b) => a.tco.totalTCO - b.tco.totalTCO);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs">
      {/* Header and Period Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              TCO Simplificado (3 Anos)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-cyan-300 font-bold text-[11px]">
              Bahia (BA)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Custo acumulado em 3 anos composto estritamente por: IPVA (2,5% BA) + Seguro + Revisões + Consumo.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
          Período Fixado: <strong>3 Anos</strong>
        </div>
      </div>

      {/* Assumptions strip */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-xs flex items-center justify-between flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            <strong>Estado:</strong> Bahia (BA)
          </span>
          <span>
            <strong>Alíquota IPVA BA:</strong> {formatNumber(preferences.ipvaRatePercent ?? 2.5, 1)}%
          </span>
          <span>
            <strong>Km Anual Estimado:</strong> {formatNumber(preferences.annualKm, 0)} km/ano
          </span>
          <span>
            <strong>Gasolina:</strong> R$ {formatMoney(preferences.gasolinePricePerLiter)} / L
          </span>
          <span>
            <strong>Eletricidade:</strong> R$ {formatMoney(preferences.electricityPricePerKwh)} / kWh
          </span>
        </div>
      </div>

      {/* List of Vehicles Ranked by TCO */}
      {vehicles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-white/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum veículo para projeção de TCO
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Cadastre os carros candidatos para calcular o custo total simplificado em 3 anos na Bahia.
          </p>
          {onNewVehicle && (
            <button
              onClick={onNewVehicle}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
            >
              + Cadastrar Veículo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {calculatedList.map(({ vehicle, tco, elim }, index) => {
            const total = tco.totalTCO || 1;
            const ipvaPct = (tco.breakdown.ipva3Years / total) * 100;
            const insPct = (tco.breakdown.insurance3Years / total) * 100;
            const revPct = (tco.breakdown.revisions3Years / total) * 100;
            const consPct = (tco.breakdown.consumption3Years / total) * 100;

            return (
              <div
                key={vehicle.id}
                className={`rounded-3xl border backdrop-blur-2xl p-5 sm:p-6 transition-all ${
                  elim.isEliminated
                    ? 'border-white/40 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 opacity-70 shadow-xs'
                    : index === 0
                    ? 'border-emerald-400/60 dark:border-emerald-600/40 bg-white/80 dark:bg-slate-900/80 shadow-md'
                    : 'border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 shadow-sm'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/50 dark:border-white/5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">#{index + 1}</span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {vehicle.version} · {vehicle.powertrain}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Preço da Loja: R$ {formatMoney(vehicle.financial.storePrice || vehicle.financial.tablePrice)} · Concessionária: {vehicle.dealership || 'Não informada'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">TCO Total (3 Anos):</span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        R$ {formatMoney(tco.totalTCO)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Média Mensal:</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        R$ {formatMoney(tco.monthlyTCO)} / mês
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simplified 4 Cost Components Bar */}
                <div className="py-4 space-y-2">
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${ipvaPct}%` }}
                      className="bg-amber-500 h-full"
                      title={`IPVA: R$ ${formatMoney(tco.breakdown.ipva3Years)} (${formatNumber(ipvaPct, 1)}%)`}
                    />
                    <div
                      style={{ width: `${insPct}%` }}
                      className="bg-blue-600 h-full"
                      title={`Seguro: R$ ${formatMoney(tco.breakdown.insurance3Years)} (${formatNumber(insPct, 1)}%)`}
                    />
                    <div
                      style={{ width: `${revPct}%` }}
                      className="bg-purple-600 h-full"
                      title={`Revisões 3 anos: R$ ${formatMoney(tco.breakdown.revisions3Years)} (${formatNumber(revPct, 1)}%)`}
                    />
                    <div
                      style={{ width: `${consPct}%` }}
                      className="bg-emerald-600 h-full"
                      title={`Consumo 3 anos: R$ ${formatMoney(tco.breakdown.consumption3Years)} (${formatNumber(consPct, 1)}%)`}
                    />
                  </div>

                  {/* 4 Cards das Informações Requeridas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    {/* IPVA 3 Anos */}
                    <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 space-y-0.5">
                      <span className="text-amber-800 dark:text-amber-300 font-medium block">
                        IPVA (3 Anos BA 2,5%)
                      </span>
                      <strong className="text-slate-900 dark:text-white text-xs block tabular-nums">
                        R$ {formatMoney(tco.breakdown.ipva3Years)}
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        R$ {formatMoney(tco.breakdown.ipva3Years / 3)} / ano
                      </span>
                    </div>

                    {/* Seguro 3 Anos */}
                    <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 space-y-0.5">
                      <span className="text-blue-800 dark:text-blue-300 font-medium block">
                        Seguro (3 Anos)
                      </span>
                      <strong className="text-slate-900 dark:text-white text-xs block tabular-nums">
                        R$ {formatMoney(tco.breakdown.insurance3Years)}
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        R$ {formatMoney(tco.breakdown.insurance3Years / 3)} / ano
                      </span>
                    </div>

                    {/* Revisões 3 Anos */}
                    <div className="p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 space-y-0.5">
                      <span className="text-purple-800 dark:text-purple-300 font-medium block">
                        Revisões (3 Anos)
                      </span>
                      <strong className="text-slate-900 dark:text-white text-xs block tabular-nums">
                        R$ {formatMoney(tco.breakdown.revisions3Years)}
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        Concessionária autorizada
                      </span>
                    </div>

                    {/* Consumo 3 Anos */}
                    <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 space-y-0.5">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium block">
                        Consumo 3 Anos (Comb. + Elet.)
                      </span>
                      <strong className="text-slate-900 dark:text-white text-xs block tabular-nums">
                        R$ {formatMoney(tco.breakdown.consumption3Years)}
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        Média R$ {formatMoney(tco.breakdown.consumption3Years / 36)} / mês
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-white/40 dark:border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCalcVehicle(vehicle)}
                    className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver memória detalhada</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectVehicle(vehicle)}
                    className="px-3.5 py-1.5 rounded-xl border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium text-xs cursor-pointer transition-all"
                  >
                    Editar Custos
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
