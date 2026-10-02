'use client';

import React, { useState } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { calculateTCO, calculateCategoryScores, checkElimination, generatePositionExplanation, formatMoney } from '@/lib/calculations';
import { X, Printer, Copy, Check, FileCheck, Share2 } from 'lucide-react';

interface ReportModalProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({
  vehicles,
  preferences,
  isOpen,
  onClose,
}: ReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter viable vehicles and sort by final weighted score descending
  const scoredVehicles = vehicles
    .map((v) => {
      const elim = checkElimination(v, preferences);
      const scores = calculateCategoryScores(v, preferences);
      const tco = calculateTCO(v, preferences);
      const explanation = generatePositionExplanation(v, scores, vehicles, preferences);
      return { vehicle: v, elimination: elim, scores, tco, explanation };
    })
    .sort((a, b) => {
      if (a.elimination.isEliminated && !b.elimination.isEliminated) return 1;
      if (!a.elimination.isEliminated && b.elimination.isEliminated) return -1;
      return b.scores.finalWeightedScore - a.scores.finalWeightedScore;
    });

  const finalists = scoredVehicles.filter((s) => !s.elimination.isEliminated).slice(0, 3);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      '======================================================',
      'MEU PRÓXIMO CARRO — RELATÓRIO ANALÍTICO DE DECISÃO FAMILIAR',
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `Critérios eliminatórios: ISOFIX >= ${preferences.isofixMinDistanceCm} cm, adulto central obrigatório, BEV excluído: ${preferences.excludeBEV ? 'Sim' : 'Não'}`,
      '======================================================\n',
      'FINALISTAS RECOMENDADOS:\n',
    ];

    finalists.forEach((f, idx) => {
      lines.push(`${idx + 1}. ${f.vehicle.brand} ${f.vehicle.model} ${f.vehicle.version}`);
      lines.push(`   • Nota Ponderada: ${f.scores.finalWeightedScore.toFixed(1)}/100`);
      lines.push(`   • Distância ISOFIX: ${f.vehicle.familySpace.isofixDistanceCm} cm (Medido)`);
      lines.push(`   • Preço da Loja: R$ ${formatMoney(f.vehicle.financial.storePrice)}`);
      lines.push(`   • TCO 3 Anos Estimado: R$ ${formatMoney(f.tco.totalTCO)} (R$ ${formatMoney(f.tco.monthlyTCO)}/mês)`);
      lines.push(`   • Justificativa: ${f.explanation.headline}`);
      lines.push(`   • Pontos Fortes: ${f.explanation.strengths.join('; ')}`);
      lines.push(`   • Pontos Fracos: ${f.explanation.weaknesses.join('; ')}\n`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl backdrop-saturate-180 w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] border border-white/60 dark:border-white/10 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 dark:border-white/5 shrink-0 bg-white/40 dark:bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-cyan-300 border border-blue-500/20 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Relatório Analítico dos Finalistas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Priorização familiar baseada em medições reais e TCO 3 anos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/15 flex items-center gap-1.5 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/15 flex items-center gap-1.5 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-800 dark:text-slate-200 print:text-black">
          {/* Summary Banner */}
          <div className="p-4 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/50 dark:border-white/5 backdrop-blur-md space-y-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Parâmetros da Decisão Familiar
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">ISOFIX Mínimo:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{preferences.isofixMinDistanceCm} cm</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Adulto Central:</span>
                <span className="font-semibold text-slate-900 dark:text-white">Obrigatório</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Km Projetado:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{preferences.annualKm.toLocaleString('pt-BR')} km/ano</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Período TCO:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {preferences.tcoYearsPeriod || 3} anos (IPVA {preferences.selectedState === 'BA' ? 'Bahia' : preferences.selectedState} {preferences.ipvaRatePercent ?? 2.5}%)
                </span>
              </div>
            </div>
          </div>

          {/* Finalists list */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Top Finalistas Qualificados
            </h3>

            {finalists.map(({ vehicle, scores, tco, explanation }, idx) => (
              <div
                key={vehicle.id}
                className="p-5 sm:p-6 rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-2xl space-y-4 shadow-[0_10px_35px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/40 dark:border-white/5">
                  <div>
                    <span className="text-xs font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                      Opção #{idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {vehicle.brand} {vehicle.model}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {vehicle.version} · {vehicle.powertrain}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {scores.finalWeightedScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 block">Nota Ponderada Geral</span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Distância ISOFIX:</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {vehicle.familySpace.isofixDistanceCm} cm
                    </span>
                  </div>
                  <div className="p-3 bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Preço da Loja:</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      R$ {formatMoney(vehicle.financial.storePrice)}
                    </span>
                  </div>
                  <div className="p-3 bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">TCO 3 Anos:</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      R$ {formatMoney(tco.totalTCO)}
                    </span>
                  </div>
                  <div className="p-3 bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Custo Mensal TCO:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      R$ {formatMoney(tco.monthlyTCO)} / mês
                    </span>
                  </div>
                </div>

                {/* Strengths and Weaknesses */}
                <div className="space-y-2 text-xs">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {explanation.headline}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                        Vantagens Principais
                      </span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                        {explanation.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-md">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block mb-1">
                        Pontos de Atenção / Limitações
                      </span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                        {explanation.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white/40 dark:bg-white/5 border-t border-white/50 dark:border-white/5 flex justify-end shrink-0 backdrop-blur-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/20 transition-all shadow-sm cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
