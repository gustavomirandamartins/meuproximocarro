'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import {
  calculateTCO,
  calculateCategoryScores,
  checkElimination,
  generatePositionExplanation,
  getIsofixRating,
  formatNumber,
  formatMoney,
  compareDimensions,
} from '@/lib/calculations';
import { StatusBadge, IsofixBadge } from '@/components/ui/StatusBadge';
import { CalculationModal } from '@/components/ui/CalculationModal';
import { ReportModal } from '@/components/ui/ReportModal';
import {
  Award,
  AlertTriangle,
  FileCheck,
  TrendingDown,
  TrendingUp,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface RankingViewProps {
  vehicles: Vehicle[];
  preferences: UserPreferences;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onNavigateToSettings: () => void;
  onUpdatePreferences?: (prefs: UserPreferences) => void;
  onNewVehicle?: () => void;
}

export function RankingView({
  vehicles,
  preferences,
  onSelectVehicle,
  onNavigateToSettings,
  onUpdatePreferences,
  onNewVehicle,
}: RankingViewProps) {
  const [selectedCalcVehicle, setSelectedCalcVehicle] = useState<Vehicle | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const [showLiveWeights, setShowLiveWeights] = useState<boolean>(false);
  const [showLiveCriteria, setShowLiveCriteria] = useState<boolean>(false);

  // Evaluate all vehicles
  const evaluatedVehicles = vehicles.map((v) => {
    const elim = checkElimination(v, preferences);
    const scores = calculateCategoryScores(v, preferences);
    const tco = calculateTCO(v, preferences);
    const storePrice = v.financial.storePrice || v.financial.tablePrice || 0;
    const explanation = generatePositionExplanation(v, scores, vehicles, preferences);

    // Custo-benefício complementar (Preço da Loja / Nota, TCO 3 Anos / Nota)
    const costBenefitPrice =
      scores.finalWeightedScore > 0
        ? storePrice / scores.finalWeightedScore
        : 0;
    const costBenefitTco =
      scores.finalWeightedScore > 0 ? tco.totalTCO / scores.finalWeightedScore : 0;

    return {
      vehicle: v,
      elim,
      scores,
      tco,
      storePrice,
      explanation,
      costBenefitPrice,
      costBenefitTco,
    };
  });

  // 1. Veículos viáveis (atendem a todos os requisitos), ordenados por nota ponderada decrescente
  const viableRanked = evaluatedVehicles
    .filter((item) => !item.elim.isEliminated)
    .sort((a, b) => b.scores.finalWeightedScore - a.scores.finalWeightedScore);

  // 2. Veículos desclassificados (colocados nas ÚLTIMAS POSIÇÕES do ranking)
  const disqualifiedRanked = evaluatedVehicles
    .filter((item) => item.elim.isEliminated)
    .sort((a, b) => b.scores.finalWeightedScore - a.scores.finalWeightedScore);

  // Ranking unificado: viáveis primeiro, desclassificados nas últimas posições
  const fullRanking = [...viableRanked, ...disqualifiedRanked];

  const [rankingFilter, setRankingFilter] = useState<'all' | 'viable' | 'disqualified'>('all');

  const displayedRanked =
    rankingFilter === 'viable'
      ? viableRanked
      : rankingFilter === 'disqualified'
      ? disqualifiedRanked
      : fullRanking;

  // Track position shifts to provide visual feedback (Subiu / Desceu)
  const prevRankingsRef = useRef<Record<string, number>>({});
  const [rankChanges, setRankChanges] = useState<Record<string, 'up' | 'down' | 'same'>>({});
  const rankedOrderKey = fullRanking.map((v) => v.vehicle.id).join(',');

  useEffect(() => {
    const newChanges: Record<string, 'up' | 'down' | 'same'> = {};
    const newPositions: Record<string, number> = {};

    fullRanking.forEach((item, currentIndex) => {
      newPositions[item.vehicle.id] = currentIndex;
      const prevIndex = prevRankingsRef.current[item.vehicle.id];
      if (prevIndex !== undefined) {
        if (currentIndex < prevIndex) {
          newChanges[item.vehicle.id] = 'up';
        } else if (currentIndex > prevIndex) {
          newChanges[item.vehicle.id] = 'down';
        } else {
          newChanges[item.vehicle.id] = 'same';
        }
      } else {
        newChanges[item.vehicle.id] = 'same';
      }
    });

    prevRankingsRef.current = newPositions;
    setRankChanges(newChanges);

    // Reset indicator after animation settles
    const timer = setTimeout(() => {
      setRankChanges({});
    }, 2500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankedOrderKey]);

  // Quick weight adjustment helpers for live interactive sliding
  const applyPresetWeights = (preset: {
    familySpace: number;
    tco: number;
    safety: number;
    powertrainEfficiency: number;
    comfort: number;
    warrantyResale: number;
    technology: number;
  }) => {
    if (!onUpdatePreferences) return;
    onUpdatePreferences({
      ...preferences,
      weights: preset,
    });
  };

  const handleLiveWeightChange = (key: keyof UserPreferences['weights'], value: number) => {
    if (!onUpdatePreferences) return;
    onUpdatePreferences({
      ...preferences,
      weights: {
        ...preferences.weights,
        [key]: value,
      },
    });
  };

  const handleLiveCriteriaChange = (key: keyof UserPreferences, value: any) => {
    if (!onUpdatePreferences) return;
    onUpdatePreferences({
      ...preferences,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            Ferramenta Analítica de Decisão
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ranking Ponderado
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Maior pontuação considerando suas prioridades atuais. (Nunca &ldquo;o melhor carro absoluto&rdquo;).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLiveWeights(!showLiveWeights)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer backdrop-blur-xl ${
              showLiveWeights
                ? 'bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 border-white/20 dark:border-white/10 shadow-[0_4px_14px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                : 'bg-white/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-200 border-white/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.5)]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Ajustar Pesos</span>
          </button>

          <button
            onClick={() => setShowLiveCriteria(!showLiveCriteria)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer backdrop-blur-xl ${
              showLiveCriteria
                ? 'bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 border-white/20 dark:border-white/10 shadow-[0_4px_14px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                : 'bg-white/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-200 border-white/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.5)]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Critérios Eliminatórios</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 backdrop-blur-xl transition-all flex items-center gap-1.5 min-h-[40px] shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.5)] cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>Gerar Relatório</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Weight & Criteria Simulator - iOS 27 Glassmorphic Control Deck */}
      <div className="p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/50 dark:border-white/10 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              Simular Prioridades — Veja os veículos deslizarem em tempo real:
            </span>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="text-blue-600 dark:text-cyan-400 hover:underline font-semibold text-xs self-start sm:self-auto cursor-pointer"
          >
            Configurações Completas
          </button>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              applyPresetWeights({
                familySpace: 30,
                tco: 20,
                safety: 15,
                powertrainEfficiency: 10,
                comfort: 10,
                warrantyResale: 10,
                technology: 5,
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer backdrop-blur-md ${
              preferences.weights.familySpace === 30 && preferences.weights.tco === 20
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/20'
                : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/15'
            }`}
          >
            Padrão Familiar (30% Espaço, 20% TCO)
          </button>

          <button
            type="button"
            onClick={() =>
              applyPresetWeights({
                familySpace: 50,
                tco: 15,
                safety: 15,
                powertrainEfficiency: 5,
                comfort: 5,
                warrantyResale: 5,
                technology: 5,
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer backdrop-blur-md ${
              preferences.weights.familySpace === 50
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/20'
                : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/15'
            }`}
          >
            Foco Máximo ISOFIX (50% Espaço)
          </button>

          <button
            type="button"
            onClick={() =>
              applyPresetWeights({
                familySpace: 20,
                tco: 45,
                safety: 10,
                powertrainEfficiency: 10,
                comfort: 5,
                warrantyResale: 5,
                technology: 5,
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer backdrop-blur-md ${
              preferences.weights.tco === 45
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/20'
                : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/15'
            }`}
          >
            Foco Econômico (45% Menor TCO)
          </button>

          <button
            type="button"
            onClick={() =>
              applyPresetWeights({
                familySpace: 20,
                tco: 15,
                safety: 15,
                powertrainEfficiency: 30,
                comfort: 10,
                warrantyResale: 5,
                technology: 5,
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer backdrop-blur-md ${
              preferences.weights.powertrainEfficiency === 30
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/20'
                : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/15'
            }`}
          >
            Foco Potência (30% Eficiência)
          </button>
        </div>

        {/* Expandable Live Sliders for Weights */}
        {showLiveWeights && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs animate-in fade-in duration-200">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Espaço Traseiro Familiar</span>
                <span className="text-blue-600 dark:text-cyan-400 tabular-nums">
                  {preferences.weights.familySpace}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={preferences.weights.familySpace}
                onChange={(e) => handleLiveWeightChange('familySpace', Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>TCO & Custos (3 Anos)</span>
                <span className="text-blue-600 dark:text-cyan-400 tabular-nums">
                  {preferences.weights.tco}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={preferences.weights.tco}
                onChange={(e) => handleLiveWeightChange('tco', Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Motorização & Eficiência</span>
                <span className="text-blue-600 dark:text-cyan-400 tabular-nums">
                  {preferences.weights.powertrainEfficiency}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={preferences.weights.powertrainEfficiency}
                onChange={(e) => handleLiveWeightChange('powertrainEfficiency', Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Expandable Live Criteria Controls (ISOFIX threshold, BEV toggle, adult central) */}
        {showLiveCriteria && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-200">
            {/* ISOFIX threshold selector */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                ISOFIX Mínimo Exigido:
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[40, 43, 45, 47].map((threshold) => (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() => handleLiveCriteriaChange('isofixMinDistanceCm', threshold)}
                    className={`py-1 rounded text-xs font-bold transition-colors ${
                      preferences.isofixMinDistanceCm === threshold
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {threshold} cm
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Altere a distância mínima para flexibilizar a compatibilidade com cadeirinhas.
              </span>
            </div>

            {/* Toggle BEV */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <span className="font-bold text-slate-900 dark:text-white block">
                Excluir 100% Elétricos (BEV):
              </span>
              <button
                type="button"
                onClick={() => handleLiveCriteriaChange('excludeBEV', !preferences.excludeBEV)}
                className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                  preferences.excludeBEV
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                }`}
              >
                <span>{preferences.excludeBEV ? 'BEVs Excluídos' : 'BEVs Permitidos'}</span>
                <span className="text-[10px] opacity-75">{preferences.excludeBEV ? 'Híbridos apenas' : 'Elétricos inclusos'}</span>
              </button>
            </div>

            {/* Toggle Auto Eliminate Incompatible */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <span className="font-bold text-slate-900 dark:text-white block">
                Filtrar Incompatíveis:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleLiveCriteriaChange(
                    'autoEliminateIncompatible',
                    !preferences.autoEliminateIncompatible
                  )
                }
                className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                  preferences.autoEliminateIncompatible
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{preferences.autoEliminateIncompatible ? 'Filtro Ativo' : 'Mostrar Todos'}</span>
                <span className="text-[10px] opacity-75">
                  {preferences.autoEliminateIncompatible ? 'Aplica regra passageiros/ISOFIX' : 'Sem eliminação'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* When zero vehicles registered */}
      {vehicles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum veículo cadastrado no ranking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Cadastre os carros candidatos à compra para visualizar o ranking analítico ponderado e simular prioridades em tempo real com animação de reordenação.
          </p>
          {onNewVehicle && (
            <button
              onClick={onNewVehicle}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              + Cadastrar Primeiro Veículo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Segmented Filter for Ranking Views */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setRankingFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  rankingFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos no Ranking ({fullRanking.length})
                {disqualifiedRanked.length > 0 && (
                  <span className="ml-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                    ({disqualifiedRanked.length} no final)
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRankingFilter('viable')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  rankingFilter === 'viable'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Apenas Aprovados ({viableRanked.length})
              </button>

              {disqualifiedRanked.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRankingFilter('disqualified')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    rankingFilter === 'disqualified'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  Desclassificados ({disqualifiedRanked.length})
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Desclassificados: Preço &gt; R$ 200k, Comp. &gt; 4500mm ou ISOFIX &lt; 45cm ocupam as últimas posições.
            </span>
          </div>

          {/* Full Ranked List with Framer Motion Layout Reordering Animation */}
          <motion.div layoutRoot className="space-y-4">
            {displayedRanked.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-500">
                Nenhum veículo nesta categoria de visualização.
              </div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {displayedRanked.map((item) => {
                  const { vehicle, scores, tco, explanation, costBenefitPrice, costBenefitTco } = item;
                  const isExpanded = expandedVehicleId === vehicle.id;
                  const isofixRating = getIsofixRating(vehicle.familySpace.isofixDistanceCm);
                  const changeState = rankChanges[vehicle.id];
                  const isDisqualified = item.elim.isEliminated;
                  const rankIndex = fullRanking.findIndex((x) => x.vehicle.id === vehicle.id);
                  const rankPosition = rankIndex >= 0 ? rankIndex + 1 : 1;

                  return (
                    <motion.div
                      layout
                      key={vehicle.id}
                      initial={{ opacity: 0, y: 24, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
                      transition={{
                        layout: { type: 'spring', damping: 25, stiffness: 260, mass: 0.8 },
                        opacity: { duration: 0.22 },
                      }}
                      className={`rounded-3xl border backdrop-blur-2xl backdrop-saturate-180 p-5 sm:p-6 transition-all ${
                        isDisqualified
                          ? 'border-rose-300/80 dark:border-rose-900/80 bg-rose-50/20 dark:bg-rose-950/15 shadow-[0_12px_36px_rgba(244,63,94,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)]'
                          : changeState === 'up'
                          ? 'border-emerald-400/80 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-500/10 shadow-[0_12px_36px_rgba(16,185,129,0.1),inset_0_1px_0_0_rgba(255,255,255,0.7)]'
                          : changeState === 'down'
                          ? 'border-amber-400/80 dark:border-amber-500/80 ring-2 ring-amber-500/20 bg-amber-500/10 shadow-[0_12px_36px_rgba(245,158,11,0.1),inset_0_1px_0_0_rgba(255,255,255,0.7)]'
                          : 'border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 hover:border-white/90 dark:hover:border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)]'
                      }`}
                    >
                      {/* Ranking Item Main Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: Position + Title */}
                        <div className="flex items-start gap-4">
                          <motion.div
                            layout
                            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold text-lg shrink-0 tabular-nums shadow-xs overflow-hidden relative backdrop-blur-md ${
                              isDisqualified
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                                : rankIndex === 0
                                ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                                : rankIndex === 1
                                ? 'bg-slate-400/20 text-slate-700 dark:text-slate-300 border border-slate-400/40'
                                : rankIndex === 2
                                ? 'bg-amber-700/15 text-amber-800 dark:text-amber-400 border border-amber-700/30'
                                : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-white/40 dark:border-white/5'
                            }`}
                          >
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={rankPosition}
                                initial={{ opacity: 0, y: -12, scale: 0.7 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 12, scale: 0.7 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                              >
                                #{rankPosition}
                              </motion.span>
                            </AnimatePresence>
                          </motion.div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-slate-500 font-semibold">{vehicle.brand}</span>
                              <StatusBadge status={vehicle.status} size="sm" />
                              {isDisqualified && (
                                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Desclassificado · Última Posição
                                </span>
                              )}
                              {changeState === 'up' && !isDisqualified && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                                >
                                  <TrendingUp className="w-3 h-3" /> Subiu
                                </motion.span>
                              )}
                              {changeState === 'down' && !isDisqualified && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                                >
                                  <TrendingDown className="w-3 h-3" /> Caiu
                                </motion.span>
                              )}
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                              {vehicle.model}
                            </h2>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {vehicle.version} · {vehicle.powertrain} · {vehicle.dealership}
                            </span>
                          </div>
                        </div>

                        {/* Right: Scores and TCO */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 text-right pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs text-slate-500 block">Dist. ISOFIX</span>
                            <span className={`text-sm font-bold tabular-nums block ${vehicle.familySpace.isofixDistanceCm !== null && vehicle.familySpace.isofixDistanceCm < (preferences.isofixMinDistanceCm ?? 45) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                              {vehicle.familySpace.isofixDistanceCm !== null && vehicle.familySpace.isofixDistanceCm !== undefined
                                ? `${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm`
                                : 'Em branco'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{isofixRating.rating}</span>
                          </div>

                          <div>
                            <span className="text-xs text-slate-500 block">TCO (3 Anos BA)</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                              R$ {formatMoney(tco.totalTCO)}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                              R$ {formatMoney(tco.monthlyTCO)}/mês
                            </span>
                          </div>

                          <div className="pl-4 sm:border-l border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-500 block">
                              {isDisqualified ? 'Status Ranking' : 'Nota Ponderada'}
                            </span>
                            <div className="flex items-baseline justify-end gap-1">
                              {isDisqualified ? (
                                <span className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                  #{rankPosition}
                                </span>
                              ) : (
                                <>
                                  <motion.span
                                    key={scores.finalWeightedScore.toFixed(1)}
                                    initial={{ scale: 1.18, color: '#2563eb' }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.25 }}
                                    className="text-2xl font-bold text-blue-600 dark:text-cyan-400 tabular-nums"
                                  >
                                    {scores.finalWeightedScore.toFixed(1)}
                                  </motion.span>
                                  <span className="text-xs text-slate-400">/ 100</span>
                                </>
                              )}
                            </div>
                            {isDisqualified && (
                              <span className="text-[10px] text-slate-400 block">Nota: {scores.finalWeightedScore.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Motivos de Desclassificação em Destaque Vermelho */}
                      {isDisqualified && (
                        <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-rose-700 dark:text-rose-400 block">
                              Desclassificado para as últimas posições por critérios eliminatórios:
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {item.elim.isPriceDisqualified && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-900 dark:text-rose-100 text-[11px] font-bold border border-rose-500/30">
                                  Valor de R$ {formatMoney(item.storePrice)} acima do teto de R$ {formatMoney(preferences.maxStorePrice ?? 200000)}
                                </span>
                              )}
                              {item.elim.isLengthDisqualified && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-900 dark:text-rose-100 text-[11px] font-bold border border-rose-500/30">
                                  Comprimento de {formatNumber(vehicle.familySpace.lengthMm, 0)} mm muito acima de {formatNumber(preferences.maxLengthMm ?? 4500, 0)} mm
                                </span>
                              )}
                              {item.elim.isIsofixDisqualified && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-900 dark:text-rose-100 text-[11px] font-bold border border-rose-500/30">
                                  Distância ISOFIX de {formatNumber(vehicle.familySpace.isofixDistanceCm || 0, 2)} cm abaixo do mínimo de {formatNumber(preferences.isofixMinDistanceCm ?? 45, 2)} cm
                                </span>
                              )}
                              {item.elim.disqualifications
                                .filter((d) => !['PRICE', 'LENGTH', 'ISOFIX'].includes(d.type))
                                .map((d, i) => (
                                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-900 dark:text-rose-100 text-[11px] font-bold border border-rose-500/30">
                                    {d.title}: {d.description}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Analytical Headline: Por que está nesta posição? */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Por que está nesta posição?
                      </span>
                      <button
                        onClick={() => setExpandedVehicleId(isExpanded ? null : vehicle.id)}
                        className="text-xs text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <span>{isExpanded ? 'Recolher detalhes' : 'Ver análise detalhada'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {explanation.headline}. {explanation.comparativeNote}
                    </p>

                    {/* Expanded Breakdown */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-white/40 dark:border-white/5 space-y-3 animate-in fade-in duration-200">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                              Pontos Fortes Principais
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

                          <div>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
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

                        {/* Dimensões & Peso */}
                        <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-white/50 dark:border-white/5 backdrop-blur-md text-xs shadow-2xs space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Dimensões & Peso (vs Usado Cadastrado)
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-500">Comp: </span>
                              <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.lengthMm, 0)} mm</strong>
                              {preferences.usedCar && (
                                <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                                  {compareDimensions(vehicle.familySpace.lengthMm, preferences.usedCar.lengthMm).text}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500">Larg: </span>
                              <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.widthMm, 0)} mm</strong>
                              {preferences.usedCar && (
                                <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                                  {compareDimensions(vehicle.familySpace.widthMm, preferences.usedCar.widthMm).text}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500">Entre-eixos: </span>
                              <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.wheelbaseMm, 0)} mm</strong>
                              {preferences.usedCar && (
                                <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                                  {compareDimensions(vehicle.familySpace.wheelbaseMm, preferences.usedCar.wheelbaseMm).text}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500">Peso: </span>
                              <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.familySpace.weightKg, 0)} kg</strong>
                              {preferences.usedCar && (
                                <span className="block text-[9px] text-blue-600 dark:text-cyan-400">
                                  {compareDimensions(vehicle.familySpace.weightKg, preferences.usedCar.weightKg, 'kg').text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desempenho, Consumo & Porta-malas vs Usado */}
                        {preferences.usedCar && (
                          <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-white/50 dark:border-white/5 backdrop-blur-md text-xs shadow-2xs space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              Comparativo vs Usado ({preferences.usedCar.brand} {preferences.usedCar.model})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500">Porta-Malas: </span>
                                {preferences.usedCar.trunkVolumeLiters ? (() => {
                                  const comp = compareDimensions(vehicle.trunk.volumeLiters, preferences.usedCar.trunkVolumeLiters, 'L', 'higher');
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {vehicle.trunk.volumeLiters} L
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.trunk.volumeLiters} L</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">0-100 km/h: </span>
                                {preferences.usedCar.zeroToHundredSeconds ? (() => {
                                  const comp = compareDimensions(vehicle.powertrainSpec.zeroToHundredSeconds, preferences.usedCar.zeroToHundredSeconds, 's', 'lower', 1);
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {vehicle.powertrainSpec.zeroToHundredSeconds} s
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.powertrainSpec.zeroToHundredSeconds} s</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">Potência: </span>
                                {preferences.usedCar.powerHp ? (() => {
                                  const comp = compareDimensions(vehicle.powertrainSpec.totalPowerHp, preferences.usedCar.powerHp, 'cv', 'higher');
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {vehicle.powertrainSpec.totalPowerHp} cv
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.powertrainSpec.totalPowerHp} cv</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">Torque: </span>
                                {preferences.usedCar.torqueKgfm ? (() => {
                                  const comp = compareDimensions(vehicle.powertrainSpec.torqueKgfm, preferences.usedCar.torqueKgfm, 'kgfm', 'higher', 1);
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {formatNumber(vehicle.powertrainSpec.torqueKgfm, 1)} kgfm
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{formatNumber(vehicle.powertrainSpec.torqueKgfm, 1)} kgfm</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">Autonomia: </span>
                                {preferences.usedCar.totalRangeKm && vehicle.powertrainSpec.totalRangeKm > 0 ? (() => {
                                  const comp = compareDimensions(vehicle.powertrainSpec.totalRangeKm, preferences.usedCar.totalRangeKm, 'km', 'higher');
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {vehicle.powertrainSpec.totalRangeKm} km
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.powertrainSpec.totalRangeKm ? `${vehicle.powertrainSpec.totalRangeKm} km` : '—'}</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">Airbags: </span>
                                {preferences.usedCar.airbagsCount ? (() => {
                                  const comp = compareDimensions(vehicle.safety.airbagsCount, preferences.usedCar.airbagsCount, 'airbags', 'higher');
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {vehicle.safety.airbagsCount}
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.safety.airbagsCount}</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">Consumo Urbano: </span>
                                {preferences.usedCar.urbanGasolineKmL ? (() => {
                                  const comp = compareDimensions(vehicle.consumption.urbanKmL, preferences.usedCar.urbanGasolineKmL, 'km/l', 'higher', 1);
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {vehicle.consumption.urbanKmL} km/l
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.consumption.urbanKmL} km/l</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">Consumo Estrada: </span>
                                {preferences.usedCar.highwayGasolineKmL ? (() => {
                                  const comp = compareDimensions(vehicle.consumption.highwayKmL, preferences.usedCar.highwayGasolineKmL, 'km/l', 'higher', 1);
                                  return (
                                    <>
                                      <strong className={`tabular-nums ${comp.isWorse ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                        {vehicle.consumption.highwayKmL} km/l
                                      </strong>
                                      <span className={`block text-[9px] ${comp.colorClass}`}>
                                        {comp.text}
                                      </span>
                                    </>
                                  );
                                })() : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">{vehicle.consumption.highwayKmL} km/l</strong>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">TCO 3 Anos: </span>
                                {preferences.usedCar.tco3Years ? (
                                  <>
                                    <strong className={`tabular-nums ${tco.totalTCO > preferences.usedCar.tco3Years ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                      R$ {formatMoney(tco.totalTCO)}
                                    </strong>
                                    <span className={`block text-[9px] font-semibold ${tco.totalTCO <= preferences.usedCar.tco3Years ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                      {tco.totalTCO <= preferences.usedCar.tco3Years
                                        ? `- R$ ${formatMoney(preferences.usedCar.tco3Years - tco.totalTCO)} vs usado`
                                        : `+ R$ ${formatMoney(tco.totalTCO - preferences.usedCar.tco3Years)} vs usado`}
                                    </span>
                                  </>
                                ) : (
                                  <strong className="text-slate-900 dark:text-white tabular-nums">R$ {formatMoney(tco.totalTCO)}</strong>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Complementary Indicators */}
                        <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-white/50 dark:border-white/5 backdrop-blur-md grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shadow-2xs">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Preço Efetivo / Nota:</span>
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              R$ {formatMoney(costBenefitPrice)} por ponto
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">TCO 3a / Nota:</span>
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              R$ {formatMoney(costBenefitTco)} por ponto
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Nota Espaço Familiar:</span>
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              {scores.familySpace} / 100
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Nota TCO & Custos:</span>
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              {scores.tco} / 100
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Buttons */}
                  <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/5 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setSelectedCalcVehicle(vehicle)}
                      className="text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Ver cálculo completo
                    </button>

                    <button
                      onClick={() => onSelectVehicle(vehicle)}
                      className="px-3.5 py-1.5 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 font-medium text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs backdrop-blur-md transition-all"
                    >
                      Abrir Detalhes
                    </button>
                  </div>
                </motion.div>
              );
            })}
              </AnimatePresence>
            )}
          </motion.div>

          {/* Card Explicativo das Regras de Desclassificação do Ranking */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Critérios de Desclassificação no Ranking
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Veículos que violam requisitos essenciais são mantidos na tabela, porém rebaixados para as <strong>últimas posições</strong>:
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Valor acima de R$ 200.000,00
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Comprimento muito acima de 4.500 mm
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Distância do ISOFIX abaixo de 45 cm
                  </span>
                </div>
              </div>
            </div>

            {onNavigateToSettings && (
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Ajustar Limites
              </button>
            )}
          </div>
        </div>
      )}

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
