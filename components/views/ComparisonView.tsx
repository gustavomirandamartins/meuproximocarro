'use client';

import React, { useState } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { calculateTCO, calculateCategoryScores, checkElimination, getIsofixRating, formatMoney, formatNumber, compareDimensions } from '@/lib/calculations';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Check, X, Scale, AlertTriangle } from 'lucide-react';

interface ComparisonViewProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  onEditVehicle: (vehicle: Vehicle) => void;
  onNewVehicle?: () => void;
}

export function ComparisonView({
  vehicles,
  preferences,
  onEditVehicle,
  onNewVehicle,
}: ComparisonViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const viable = vehicles.filter((v) => !checkElimination(v, preferences).isEliminated);
    const initial = viable.length >= 2 ? viable : vehicles;
    return initial.slice(0, 3).map((v) => v.id);
  });

  const [onlyDifferences, setOnlyDifferences] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const usedCar = preferences.usedCar;

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 3000);
  };

  const toggleSelectVehicle = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        showWarning('Mantenha ao menos 2 veículos selecionados para comparar.');
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 5) {
        showWarning('Máximo de 5 veículos na comparação simultânea.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedVehicles = vehicles.filter((v) => selectedIds.includes(v.id));

  // Compute calculated values for comparison
  const calculatedMap = selectedVehicles.map((v) => {
    return {
      vehicle: v,
      elim: checkElimination(v, preferences),
      scores: calculateCategoryScores(v, preferences),
      tco: calculateTCO(v, preferences),
    };
  });

  const hasDiff = (extractor: (item: (typeof calculatedMap)[0]) => any) => {
    if (calculatedMap.length <= 1) return false;
    const first = extractor(calculatedMap[0]);
    return calculatedMap.some((item) => extractor(item) !== first);
  };

  const getBestIndex = (
    extractor: (item: (typeof calculatedMap)[0]) => number,
    direction: 'max' | 'min'
  ) => {
    let bestVal = direction === 'max' ? -Infinity : Infinity;
    let bestIdx = -1;

    calculatedMap.forEach((item, idx) => {
      const val = extractor(item);
      if (typeof val === 'number' && !isNaN(val)) {
        if (direction === 'max' && val > bestVal) {
          bestVal = val;
          bestIdx = idx;
        } else if (direction === 'min' && val < bestVal) {
          bestVal = val;
          bestIdx = idx;
        }
      }
    });

    return bestIdx;
  };

  const bestIsofixIdx = getBestIndex((item) => item.vehicle.familySpace.isofixDistanceCm || 0, 'max');
  const bestTcoIdx = getBestIndex((item) => item.tco.totalTCO, 'min');
  const bestScoreIdx = getBestIndex((item) => item.scores.finalWeightedScore, 'max');
  const bestPriceIdx = getBestIndex((item) => item.vehicle.financial.storePrice || item.vehicle.financial.tablePrice, 'min');
  const bestPowerIdx = getBestIndex((item) => item.vehicle.powertrainSpec.totalPowerHp, 'max');

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Comparação Lado a Lado
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analise dimensões comparadas ao seu usado ({usedCar?.brand} {usedCar?.model}), TCO simplificado de 3 anos (IPVA BA 2,5%) e espaço familiar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-xs">
            <input
              type="checkbox"
              checked={onlyDifferences}
              onChange={(e) => setOnlyDifferences(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Ver apenas diferenças
            </span>
          </label>
        </div>
      </div>

      {warningMessage && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
          {warningMessage}
        </div>
      )}

      {/* Vehicle Selection Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Selecionar veículos para o comparativo ({selectedIds.length}/5):
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {vehicles.map((v) => {
            const isSelected = selectedIds.includes(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggleSelectVehicle(v.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/20'
                }`}
              >
                <span>{v.brand} {v.model}</span>
                {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {selectedVehicles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-white/50 dark:border-white/10">
          Nenhum veículo selecionado para comparação.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 shadow-sm backdrop-blur-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
                <th className="p-4 font-bold text-slate-900 dark:text-white min-w-[200px] w-1/4">
                  Especificação
                </th>
                {calculatedMap.map(({ vehicle, scores }, idx) => (
                  <th key={vehicle.id} className="p-4 min-w-[220px] border-l border-slate-200/80 dark:border-slate-800 align-top">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                        Nota: {formatNumber(scores.finalWeightedScore, 1)} / 100
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-500 font-normal">
                        {vehicle.version} ({vehicle.powertrain})
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* SEÇÃO 1: PREÇO & NEGOCIAÇÃO */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                <td colSpan={calculatedMap.length + 1} className="px-4 py-2 uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                  1. Preço & Negociação
                </td>
              </tr>

              {(!onlyDifferences || hasDiff((i) => i.vehicle.financial.storePrice)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Preço da Loja</td>
                  {calculatedMap.map(({ vehicle }, idx) => (
                    <td key={vehicle.id} className={`p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums ${idx === bestPriceIdx ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' : ''}`}>
                      R$ {formatMoney(vehicle.financial.storePrice || vehicle.financial.tablePrice)}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.financial.tablePrice)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Preço de Tabela</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums text-slate-600 dark:text-slate-400">
                      R$ {formatMoney(vehicle.financial.tablePrice)}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.financial.usedCarEvaluation)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Avaliação do Usado na Loja</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      R$ {formatMoney(vehicle.financial.usedCarEvaluation)}
                      {usedCar && (
                        <span className="block text-[10px] text-slate-500">
                          FIPE: R$ {formatMoney(usedCar.fipeValue)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* SEÇÃO 2: ESPAÇO & ISOFIX */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                <td colSpan={calculatedMap.length + 1} className="px-4 py-2 uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                  2. Espaço & ISOFIX (Decisão Familiar)
                </td>
              </tr>

              {(!onlyDifferences || hasDiff((i) => i.vehicle.familySpace.isofixDistanceCm)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Distância ISOFIX Interna</td>
                  {calculatedMap.map(({ vehicle }, idx) => {
                    const isBest = idx === bestIsofixIdx;
                    return (
                      <td key={vehicle.id} className={`p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums ${isBest ? 'bg-blue-50/50 dark:bg-blue-950/20 font-bold' : ''}`}>
                        {vehicle.familySpace.isofixDistanceCm !== null && vehicle.familySpace.isofixDistanceCm !== undefined
                          ? `${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm`
                          : 'Em branco (pendente no showroom)'}
                      </td>
                    );
                  })}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.familySpace.passengerCapacity)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Capacidade de Passageiros</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800">
                      {vehicle.familySpace.passengerCapacity || 5} passageiros
                    </td>
                  ))}
                </tr>
              )}

              {/* Dimensões vs Usado */}
              {(!onlyDifferences || hasDiff((i) => i.vehicle.familySpace.lengthMm)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Comprimento</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{formatNumber(vehicle.familySpace.lengthMm, 0)} mm</strong>
                      {usedCar && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400">
                          {compareDimensions(vehicle.familySpace.lengthMm, usedCar.lengthMm).text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.familySpace.widthMm)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Largura</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{formatNumber(vehicle.familySpace.widthMm, 0)} mm</strong>
                      {usedCar && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400">
                          {compareDimensions(vehicle.familySpace.widthMm, usedCar.widthMm).text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.familySpace.wheelbaseMm)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Entre-eixos</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{formatNumber(vehicle.familySpace.wheelbaseMm, 0)} mm</strong>
                      {usedCar && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400">
                          {compareDimensions(vehicle.familySpace.wheelbaseMm, usedCar.wheelbaseMm).text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.familySpace.weightKg)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Peso</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{formatNumber(vehicle.familySpace.weightKg, 0)} kg</strong>
                      {usedCar && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400">
                          {compareDimensions(vehicle.familySpace.weightKg, usedCar.weightKg, 'kg').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* SEÇÃO 3: PORTA-MALAS */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                <td colSpan={calculatedMap.length + 1} className="px-4 py-2 uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                  3. Porta-malas & Praticidade
                </td>
              </tr>

              {(!onlyDifferences || hasDiff((i) => i.vehicle.trunk.volumeLiters)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Volume Porta-malas</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{vehicle.trunk.volumeLiters} Litros</strong>
                      {usedCar?.trunkVolumeLiters && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400">
                          {compareDimensions(vehicle.trunk.volumeLiters, usedCar.trunkVolumeLiters, 'L').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.trunk.spareTireKit)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Kit Reparo / Estepe</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800">
                      {vehicle.trunk.spareTireKit}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.trunk.electricTailgate)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Abertura Elétrica</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800">
                      {vehicle.trunk.electricTailgate ? 'Sim' : 'Não'}
                    </td>
                  ))}
                </tr>
              )}

              {/* SEÇÃO 4: MOTORIZAÇÃO & BATERIA */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                <td colSpan={calculatedMap.length + 1} className="px-4 py-2 uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                  4. Motorização & Bateria
                </td>
              </tr>

              {(!onlyDifferences || hasDiff((i) => i.vehicle.powertrainSpec.totalPowerHp)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Potência Total</td>
                  {calculatedMap.map(({ vehicle }, idx) => (
                    <td key={vehicle.id} className={`p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums ${idx === bestPowerIdx ? 'font-bold text-blue-600 dark:text-cyan-400' : ''}`}>
                      <strong>{vehicle.powertrainSpec.totalPowerHp} cv</strong>
                      {usedCar?.powerHp && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                          {compareDimensions(vehicle.powertrainSpec.totalPowerHp, usedCar.powerHp, 'cv').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.powertrainSpec.torqueKgfm)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Torque Total</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      {formatNumber(vehicle.powertrainSpec.torqueKgfm, 1)} kgfm
                      {usedCar?.torqueKgfm && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                          {compareDimensions(vehicle.powertrainSpec.torqueKgfm, usedCar.torqueKgfm, 'kgfm').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.powertrainSpec.zeroToHundredSeconds)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">0 a 100 km/h</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{formatNumber(vehicle.powertrainSpec.zeroToHundredSeconds, 1)} s</strong>
                      {usedCar?.zeroToHundredSeconds && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                          {compareDimensions(vehicle.powertrainSpec.zeroToHundredSeconds, usedCar.zeroToHundredSeconds, 's').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.powertrainSpec.totalRangeKm)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Autonomia Total</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      {vehicle.powertrainSpec.totalRangeKm ? `${vehicle.powertrainSpec.totalRangeKm} km` : '—'}
                      {usedCar?.totalRangeKm && vehicle.powertrainSpec.totalRangeKm > 0 && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                          {compareDimensions(vehicle.powertrainSpec.totalRangeKm, usedCar.totalRangeKm, 'km').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.powertrainSpec.electricRangeKm)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Autonomia Elétrica (km)</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      {vehicle.powertrainSpec.electricRangeKm ? `${vehicle.powertrainSpec.electricRangeKm} km` : '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* SEÇÃO 5: CONSUMO & SEGURANÇA */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                <td colSpan={calculatedMap.length + 1} className="px-4 py-2 uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                  5. Consumo & Segurança
                </td>
              </tr>

              {(!onlyDifferences || hasDiff((i) => i.vehicle.consumption.urbanKmL)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Consumo Cidade</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{formatNumber(vehicle.consumption.urbanKmL, 1)} km/l</strong>
                      {usedCar?.urbanGasolineKmL && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                          {compareDimensions(vehicle.consumption.urbanKmL, usedCar.urbanGasolineKmL, 'km/l').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.consumption.highwayKmL)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Consumo Estrada</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{formatNumber(vehicle.consumption.highwayKmL, 1)} km/l</strong>
                      {usedCar?.highwayGasolineKmL && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                          {compareDimensions(vehicle.consumption.highwayKmL, usedCar.highwayGasolineKmL, 'km/l').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.safety.airbagsCount)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">Airbags</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                      <strong>{vehicle.safety.airbagsCount} airbags</strong>
                      {usedCar?.airbagsCount && (
                        <span className="block text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                          {compareDimensions(vehicle.safety.airbagsCount, usedCar.airbagsCount, 'airbags').text}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {(!onlyDifferences || hasDiff((i) => i.vehicle.safety.hasAdas)) && (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">ADAS</td>
                  {calculatedMap.map(({ vehicle }) => (
                    <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800">
                      {vehicle.safety.hasAdas ? 'Sim' : 'Não'}
                    </td>
                  ))}
                </tr>
              )}

              {/* SEÇÃO 6: CUSTOS & TCO 3 ANOS */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                <td colSpan={calculatedMap.length + 1} className="px-4 py-2 uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                  6. TCO Simplificado (3 Anos na Bahia)
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 font-bold">
                <td className="p-3.5 text-slate-900 dark:text-white">TCO Total (3 Anos)</td>
                {calculatedMap.map(({ vehicle, tco }, idx) => (
                  <td key={vehicle.id} className={`p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums ${idx === bestTcoIdx ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''}`}>
                    <strong>R$ {formatMoney(tco.totalTCO)}</strong>
                    {usedCar?.tco3Years && (
                      <span className={`block text-[10px] font-normal ${tco.totalTCO <= usedCar.tco3Years ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {tco.totalTCO <= usedCar.tco3Years
                          ? `- R$ ${formatMoney(usedCar.tco3Years - tco.totalTCO)} vs usado`
                          : `+ R$ ${formatMoney(tco.totalTCO - usedCar.tco3Years)} vs usado`}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                <td className="p-3.5 text-slate-600 dark:text-slate-400">IPVA (3 Anos BA 2,5%)</td>
                {calculatedMap.map(({ vehicle, tco }) => (
                  <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                    R$ {formatMoney(tco.breakdown.ipva3Years)}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                <td className="p-3.5 text-slate-600 dark:text-slate-400">Seguro (3 Anos)</td>
                {calculatedMap.map(({ vehicle, tco }) => (
                  <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                    R$ {formatMoney(tco.breakdown.insurance3Years)}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                <td className="p-3.5 text-slate-600 dark:text-slate-400">Revisões (3 Anos)</td>
                {calculatedMap.map(({ vehicle, tco }) => (
                  <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                    R$ {formatMoney(tco.breakdown.revisions3Years)}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                <td className="p-3.5 text-slate-600 dark:text-slate-400">Consumo (3 Anos)</td>
                {calculatedMap.map(({ vehicle, tco }) => (
                  <td key={vehicle.id} className="p-3.5 border-l border-slate-100 dark:border-slate-800 tabular-nums">
                    R$ {formatMoney(tco.breakdown.consumption3Years)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
