'use client';

import React from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { calculateTCO, calculateCategoryScores, formatMoney, formatNumber } from '@/lib/calculations';
import { X, Calculator } from 'lucide-react';

interface CalculationModalProps {
  vehicle: Vehicle | null;
  preferences: UserPreferences;
  isOpen: boolean;
  onClose: () => void;
}

export function CalculationModal({
  vehicle,
  preferences,
  isOpen,
  onClose,
}: CalculationModalProps) {
  if (!isOpen || !vehicle) return null;

  const tco3 = calculateTCO(vehicle, preferences);
  const scores = calculateCategoryScores(vehicle, preferences);
  const usedCar = preferences.usedCar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl backdrop-saturate-180 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 dark:border-white/10 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calc-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 dark:border-white/5 shrink-0 bg-white/40 dark:bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-cyan-300 border border-blue-500/20 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 id="calc-modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Memória de Cálculo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle.brand} {vehicle.model} {vehicle.version}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* 1. Preço & Negociação */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Preço e Negociação
            </h3>
            <div className="p-4 bg-white/60 dark:bg-white/5 rounded-2xl space-y-2 border border-white/50 dark:border-white/5 backdrop-blur-md">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Preço de Tabela:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  R$ {formatMoney(vehicle.financial.tablePrice)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Preço da Loja:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  R$ {formatMoney(vehicle.financial.storePrice)}
                </span>
              </div>
              {vehicle.financial.usedCarEvaluation > 0 && usedCar && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 space-y-1">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Avaliação do Usado na Loja:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">R$ {formatMoney(vehicle.financial.usedCarEvaluation)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Tabela FIPE do Usado ({usedCar.brand} {usedCar.model}):</span>
                    <span>R$ {formatMoney(usedCar.fipeValue)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Memória TCO 3 Anos Simplificada */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. TCO Simplificado (3 Anos — Bahia)
              </h3>
              <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold">
                Alíquota IPVA BA: {formatNumber(preferences.ipvaRatePercent ?? 2.5, 1)}%
              </span>
            </div>

            <ul className="space-y-2">
              {tco3.calculationMemory.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <span className="font-semibold text-slate-900 dark:text-white mr-1">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="p-4 bg-slate-950 text-white rounded-2xl flex items-center justify-between shadow-md border border-white/10">
              <div>
                <span className="text-slate-400 block text-[11px]">TCO Total Acumulado (3 Anos):</span>
                <span className="text-base font-bold tabular-nums">
                  R$ {formatMoney(tco3.totalTCO)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Custo Médio Mensal:</span>
                <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                  R$ {formatMoney(tco3.monthlyTCO)} / mês
                </span>
              </div>
            </div>
          </section>

          {/* 3. Ponderação da Nota Final */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Pontuação Geral e Categorias
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5">
                <span className="text-[10px] text-slate-500 block">Espaço & ISOFIX</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{scores.familySpace}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5">
                <span className="text-[10px] text-slate-500 block">TCO 3 Anos</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{scores.tco}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5">
                <span className="text-[10px] text-slate-500 block">Segurança</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{scores.safety}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5">
                <span className="text-[10px] text-slate-500 block">Nota Final</span>
                <span className="font-bold text-sm text-blue-600 dark:text-cyan-400">{scores.finalWeightedScore}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
