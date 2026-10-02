'use client';

import React, { useState } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { getIsofixRating, checkElimination, formatNumber } from '@/lib/calculations';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface DealershipQuickTestViewProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  selectedVehicleId?: string;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onNewVehicle?: () => void;
}

export function DealershipQuickTestView({
  vehicles,
  preferences,
  selectedVehicleId,
  onUpdateVehicle,
  onNewVehicle,
}: DealershipQuickTestViewProps) {
  const [currentId, setCurrentId] = useState<string>(
    selectedVehicleId || (vehicles.length > 0 ? vehicles[0].id : '')
  );

  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const currentVehicle = vehicles.find((v) => v.id === currentId) || vehicles[0];

  if (!currentVehicle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum veículo disponível para teste
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Cadastre o modelo antes de ir à concessionária para preencher a medição da fita métrica no smartphone.
          </p>
          {onNewVehicle && (
            <button
              onClick={onNewVehicle}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-sm transition-colors cursor-pointer"
            >
              + Cadastrar Veículo
            </button>
          )}
        </div>
      </div>
    );
  }

  const triggerAutoSave = (updated: Vehicle) => {
    onUpdateVehicle(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const isofixRating = getIsofixRating(currentVehicle.familySpace.isofixDistanceCm);
  const elimCheck = checkElimination(currentVehicle, preferences);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6 text-xs">
      {/* Banner de Modo Concessionária Ativo */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/90 dark:bg-amber-500/80 backdrop-blur-2xl backdrop-saturate-180 text-slate-950 shadow-[0_12px_36px_rgba(245,158,11,0.2),inset_0_1px_0_0_rgba(255,255,255,0.7)] border border-amber-300/60 dark:border-amber-400/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-white/10">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">
              Modo Concessionária
            </h1>
            <p className="text-xs font-medium text-slate-900/80">
              Medição presencial da fita métrica e validação de espaço com salvamento instantâneo.
            </p>
          </div>
        </div>

        {savedFeedback && (
          <div className="px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold animate-in fade-in flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salvo</span>
          </div>
        )}
      </div>

      {/* Vehicle Quick Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Carro Sendo Avaliado Agora:
        </label>
        <div className="relative">
          <select
            value={currentVehicle.id}
            onChange={(e) => setCurrentId(e.target.value)}
            className="w-full h-14 pl-4 pr-10 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl backdrop-saturate-180 border border-white/60 dark:border-white/10 text-slate-900 dark:text-white text-base font-bold shadow-[0_4px_16px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.06)] appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.powertrain}) — {v.dealership || 'Sem concessionária'}
              </option>
            ))}
          </select>
          <ChevronDown className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Resultado da Validação em Tempo Real */}
      <div className={`p-4 rounded-3xl border backdrop-blur-2xl transition-all ${
        elimCheck.isEliminated
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-200'
          : (elimCheck.isPendingMeasurement
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-200'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200')
      }`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          {elimCheck.isEliminated ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${elimCheck.isPendingMeasurement ? 'text-amber-600' : 'text-emerald-600'}`} />
          )}
          <span>
            {elimCheck.isEliminated 
              ? 'Veículo Incompatível / Descartado' 
              : (elimCheck.isPendingMeasurement ? 'Medição de ISOFIX Pendente' : 'Veículo Aprovado para a Família')}
          </span>
        </div>
        <p className="mt-1 text-xs opacity-90">
          {elimCheck.reason || 'Atende a todos os critérios de espaço familiar para a compra.'}
        </p>
      </div>

      {/* MEDIÇÃO DA FITA MÉTRICA & QUANTIDADE DE PASSAGEIROS */}
      <section className="space-y-4 p-5 sm:p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-180 border border-white/60 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            1. Medição da Fita Métrica no Local
          </h2>
          <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold shadow-2xs ${isofixRating.badgeBg} ${isofixRating.badgeText}`}>
            {isofixRating.rating}
          </span>
        </div>

        {/* Medição Rápida da Fita Métrica */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Distância Medida entre Pontos ISOFIX Internos:
              </span>
              <span className="text-[11px] text-slate-500">
                Pode ficar em branco enquanto não for medido presencialmente.
              </span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {currentVehicle.familySpace.isofixDistanceCm !== null && currentVehicle.familySpace.isofixDistanceCm !== undefined
                ? `${formatNumber(currentVehicle.familySpace.isofixDistanceCm, 2)} cm`
                : 'Em branco (pendente)'}
            </span>
          </div>

          {/* Quick Adjustment Buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[40, 43, 45, 46.5, 48].map((presetCm) => (
              <button
                key={presetCm}
                type="button"
                onClick={() => {
                  const updated: Vehicle = {
                    ...currentVehicle,
                    familySpace: {
                      ...currentVehicle.familySpace,
                      isofixDistanceCm: presetCm,
                    },
                  };
                  triggerAutoSave(updated);
                }}
                className={`h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentVehicle.familySpace.isofixDistanceCm === presetCm
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/20'
                }`}
              >
                {presetCm} cm
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="range"
              min="35"
              max="55"
              step="0.5"
              value={currentVehicle.familySpace.isofixDistanceCm ?? 45}
              onChange={(e) => {
                const val = Number(e.target.value);
                const updated: Vehicle = {
                  ...currentVehicle,
                  familySpace: {
                    ...currentVehicle.familySpace,
                    isofixDistanceCm: val,
                  },
                };
                triggerAutoSave(updated);
              }}
              className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Botão para limpar / deixar em branco */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const updated: Vehicle = {
                  ...currentVehicle,
                  familySpace: {
                    ...currentVehicle.familySpace,
                    isofixDistanceCm: null,
                  },
                };
                triggerAutoSave(updated);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Deixar em branco (medir no local)</span>
            </button>
          </div>
        </div>

        {/* Quantidade de Passageiros */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/55 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white block">
            Quantidade de Passageiros (sem cadeirinha):
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[4, 5, 6, 7].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  const updated: Vehicle = {
                    ...currentVehicle,
                    familySpace: {
                      ...currentVehicle.familySpace,
                      passengerCapacity: num,
                    },
                  };
                  triggerAutoSave(updated);
                }}
                className={`h-12 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  currentVehicle.familySpace.passengerCapacity === num
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/50 dark:border-white/10'
                }`}
              >
                <span className="text-sm">{num}</span>
                <span className="text-[10px] font-normal opacity-80">lugares</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Regra: Se até 4 passageiros, descartado. A partir de 5, requer ISOFIX ≥ 45,00 cm. Acima de 5 (6 ou 7 lugares), passa com qualquer distância de ISOFIX.
          </p>
        </div>

        {/* Notas da Visita no Local */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Observações e Anotações da Visita na Concessionária:
          </label>
          <textarea
            rows={3}
            value={currentVehicle.notes || ''}
            onChange={(e) => {
              const updated: Vehicle = {
                ...currentVehicle,
                notes: e.target.value,
              };
              triggerAutoSave(updated);
            }}
            placeholder="Anotações sobre a proposta comercial, brindes ofertados, avaliação do gerente para o usado..."
            className="w-full p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/10 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </section>
    </div>
  );
}
