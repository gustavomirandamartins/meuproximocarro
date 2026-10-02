'use client';

import React, { useState } from 'react';
import { UserPreferences, ScenarioPreset } from '@/types/vehicle';
import { SCENARIO_PRESETS } from '@/lib/seed-data';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Fuel,
  Shield,
  Percent,
  Check,
  AlertTriangle,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';

interface SettingsViewProps {
  preferences: UserPreferences;
  activeScenarioId: string;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onApplyScenario: (scenarioId: string) => void;
  onResetSeedData: () => void;
  onOpenDataSync?: () => void;
}

export function SettingsView({
  preferences,
  activeScenarioId,
  onUpdatePreferences,
  onApplyScenario,
  onResetSeedData,
  onOpenDataSync,
}: SettingsViewProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Calculate sum of weights
  const weightsSum =
    prefs.weights.familySpace +
    prefs.weights.tco +
    prefs.weights.safety +
    prefs.weights.powertrainEfficiency +
    prefs.weights.comfort +
    prefs.weights.warrantyResale +
    prefs.weights.technology;

  const handleWeightChange = (key: keyof UserPreferences['weights'], value: number) => {
    setPrefs((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: value,
      },
    }));
  };

  const handleNormalizeWeights = () => {
    if (weightsSum === 0) return;
    const ratio = 100 / weightsSum;
    setPrefs((prev) => {
      const w = prev.weights;
      const normalized = {
        familySpace: Math.round(w.familySpace * ratio),
        tco: Math.round(w.tco * ratio),
        safety: Math.round(w.safety * ratio),
        powertrainEfficiency: Math.round(w.powertrainEfficiency * ratio),
        comfort: Math.round(w.comfort * ratio),
        warrantyResale: Math.round(w.warrantyResale * ratio),
        technology: Math.round(w.technology * ratio),
      };
      // Compensate rounding remainder
      const sumNew = Object.values(normalized).reduce((a, b) => a + b, 0);
      const diff = 100 - sumNew;
      normalized.familySpace += diff;
      return { ...prev, weights: normalized };
    });
  };

  const handleSave = () => {
    onUpdatePreferences(prefs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 py-6 text-slate-800 dark:text-slate-200 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/40 dark:border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Configurações e Cenários
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Defina pesos de decisão, filtros eliminatórios e premissas financeiras de combustível e IPVA.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 font-semibold flex items-center gap-1.5 self-start sm:self-auto min-h-[40px] shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[0_4px_16px_rgba(255,255,255,0.1),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:opacity-95 transition-all cursor-pointer backdrop-blur-xl"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : null}
          <span>{savedSuccess ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* 1. SELEÇÃO RÁPIDA DE CENÁRIOS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Cenários de Uso Pré-Definidos</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Aplique instantaneamente premissas de quilometragem e preços de energia:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCENARIO_PRESETS.map((scenario) => {
            const isActive = activeScenarioId === scenario.id;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => {
                  onApplyScenario(scenario.id);
                  setPrefs((prev) => ({
                    ...prev,
                    annualKm: scenario.annualKm,
                    urbanSharePercent: scenario.urbanSharePercent,
                    gasolinePricePerLiter: scenario.gasolinePrice,
                    electricityPricePerKwh: scenario.electricityPrice,
                  }));
                }}
                className={`p-4 rounded-2xl text-left border transition-all backdrop-blur-2xl backdrop-saturate-180 cursor-pointer ${
                  isActive
                    ? 'border-blue-500/80 dark:border-cyan-400/80 bg-blue-50/70 dark:bg-blue-950/50 shadow-[0_8px_25px_rgba(37,99,235,0.15),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_25px_rgba(14,165,233,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                    : 'border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 shadow-[0_8px_24px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {scenario.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-300 px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-800">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {scenario.description}
                </p>
                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {scenario.annualKm.toLocaleString('pt-BR')} km/ano · Gas: R${' '}
                  {scenario.gasolinePrice.toFixed(2)} · Luz: R${' '}
                  {scenario.electricityPrice.toFixed(2)}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. PESOS DA PONTUAÇÃO (TOTAL 100%) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-180 border border-white/60 dark:border-white/10 space-y-4 shadow-[0_12px_36px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Pesos de Importância (Soma: {weightsSum}%)
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              O ranking analítico multiplica a nota de cada categoria por estes pesos.
            </p>
          </div>

          {weightsSum !== 100 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-700 dark:text-amber-400 font-semibold text-xs">
                A soma dos pesos é {weightsSum}% (recomendado: 100%)
              </span>
              <button
                type="button"
                onClick={handleNormalizeWeights}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-bold hover:bg-amber-500/30 text-xs backdrop-blur-md cursor-pointer transition-colors"
              >
                Normalizar para 100%
              </button>
            </div>
          )}
        </div>

        {/* Sliders Grid */}
        <div className="space-y-3 pt-2">
          {[
            {
              key: 'familySpace' as const,
              label: 'Espaço Familiar (ISOFIX, Adulto Central)',
              desc: 'Prioridade máxima para acomodar 2 cadeirinhas e 1 adulto',
            },
            {
              key: 'tco' as const,
              label: 'TCO & Custos (5 Anos)',
              desc: 'Depreciação, combustível, seguro, IPVA e pneus',
            },
            {
              key: 'safety' as const,
              label: 'Segurança & Assistência ADAS',
              desc: 'Airbags, frenagem autônoma, sensores e câmeras 360',
            },
            {
              key: 'powertrainEfficiency' as const,
              label: 'Motorização & Eficiência Energética',
              desc: 'Potência combinada, autonomia elétrica e consumo',
            },
            {
              key: 'comfort' as const,
              label: 'Conforto & Suspensão',
              desc: 'Acústica, maciez de rodar, ventilação de bancos e teto',
            },
            {
              key: 'warrantyResale' as const,
              label: 'Garantia & Pós-Venda',
              desc: 'Garantia de fábrica, preço de revisões e valor residual',
            },
            {
              key: 'technology' as const,
              label: 'Tecnologia de Bordo',
              desc: 'Multimídia, espelhamento sem fio e cluster digital',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </span>
                </div>
                <span className="text-base font-bold text-blue-600 dark:text-cyan-400 tabular-nums">
                  {prefs.weights[item.key]}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={prefs.weights[item.key]}
                onChange={(e) => handleWeightChange(item.key, Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200/80 dark:bg-slate-700/80 rounded-lg cursor-pointer"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 3. FILTROS ELIMINATÓRIOS OBRIGATÓRIOS */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-180 border border-white/60 dark:border-white/10 space-y-4 shadow-[0_12px_36px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Requisitos Eliminatórios Mínimos
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Veículos que não atendem aos critérios marcados são categorizados como &ldquo;Eliminados&rdquo;.
          </p>
        </div>

        <div className="space-y-3">
          {/* ISOFIX Mínimo */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Distância Mínima entre pontos ISOFIX
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Padrão recomendado: 45 cm (acomoda adulto entre 2 cadeirinhas laterais)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="35"
                max="55"
                value={prefs.isofixMinDistanceCm}
                onChange={(e) =>
                  setPrefs({ ...prefs, isofixMinDistanceCm: Number(e.target.value) })
                }
                className="w-24 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white tabular-nums shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-bold">cm</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-white/50 dark:border-white/5 bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.autoEliminateIncompatible}
                onChange={(e) =>
                  setPrefs({ ...prefs, autoEliminateIncompatible: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold block text-slate-900 dark:text-white">
                  Eliminar automaticamente incompatíveis
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Exclui carros com até 4 passageiros ou 5 passageiros com ISOFIX &lt; 45 cm
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-white/50 dark:border-white/5 bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.excludeBEV}
                onChange={(e) => setPrefs({ ...prefs, excludeBEV: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold block text-slate-900 dark:text-white">
                  Excluir 100% Elétricos (BEV)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Manter foco exclusivamente em Híbridos e Combustão
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* 4. PREMISSAS FINANCEIRAS & DE USO */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-180 border border-white/60 dark:border-white/10 space-y-4 shadow-[0_12px_36px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Premissas Financeiras e Tributárias
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Configure preços de abastecimento e regras tributárias locais para cálculo preciso de TCO.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Quilometragem Anual (km)
            </label>
            <input
              type="number"
              value={prefs.annualKm}
              onChange={(e) => setPrefs({ ...prefs, annualKm: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              % Proporção Urbana
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={prefs.urbanSharePercent}
              onChange={(e) =>
                setPrefs({ ...prefs, urbanSharePercent: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Preço Gasolina (R$ / Litro)
            </label>
            <input
              type="number"
              step="0.05"
              value={prefs.gasolinePricePerLiter}
              onChange={(e) =>
                setPrefs({ ...prefs, gasolinePricePerLiter: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Preço Eletricidade (R$ / kWh)
            </label>
            <input
              type="number"
              step="0.05"
              value={prefs.electricityPricePerKwh}
              onChange={(e) =>
                setPrefs({ ...prefs, electricityPricePerKwh: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 dark:text-slate-400 font-medium">
                Estado de Licenciamento
              </label>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-cyan-300 bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-300/60 dark:border-blue-700/50">
                Principal: Bahia (BA)
              </span>
            </div>
            <select
              value={prefs.selectedState}
              onChange={(e) => {
                const st = e.target.value;
                let defaultRate = 2.5; // Alíquota Bahia: 2,5%
                if (st === 'BA') defaultRate = 2.5;
                else if (st === 'SP') defaultRate = 4.0;
                else if (st === 'RJ') defaultRate = 4.0;
                else if (st === 'MG') defaultRate = 4.0;
                else if (st === 'PR') defaultRate = 3.5;
                else if (st === 'DF') defaultRate = 3.0;
                else if (st === 'RS') defaultRate = 3.0;
                else if (st === 'SC') defaultRate = 2.0;
                else if (st === 'PE') defaultRate = 2.4;
                else if (st === 'CE') defaultRate = 3.0;
                else if (st === 'GO') defaultRate = 3.75;
                else defaultRate = 2.5;
                setPrefs({ ...prefs, selectedState: st, ipvaRatePercent: defaultRate });
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="BA">Bahia (BA) — Estado Principal (2,5%)</option>
              <option value="SP">São Paulo (SP) (4,0%)</option>
              <option value="RJ">Rio de Janeiro (RJ) (4,0%)</option>
              <option value="MG">Minas Gerais (MG) (4,0%)</option>
              <option value="PR">Paraná (PR) (3,5%)</option>
              <option value="DF">Distrito Federal (DF) (3,0%)</option>
              <option value="RS">Rio Grande do Sul (RS) (3,0%)</option>
              <option value="SC">Santa Catarina (SC) (2,0%)</option>
              <option value="PE">Pernambuco (PE) (2,4%)</option>
              <option value="CE">Ceará (CE) (3,0%)</option>
              <option value="GO">Goiás (GO) (3,75%)</option>
              <option value="Outro">Outro Estado</option>
            </select>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Alíquota IPVA para a Bahia: 2,5%.
            </p>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Alíquota IPVA (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={prefs.ipvaRatePercent}
              onChange={(e) =>
                setPrefs({ ...prefs, ipvaRatePercent: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>
        </div>
      </section>

      {/* SEÇÃO DO CARRO USADO CADASTRADO */}
      <section className="space-y-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/10 backdrop-blur-2xl">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Seu Carro Usado Cadastrado (Referência)</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Dados do seu veículo atual usados para cálculo automático de deságio na Tabela FIPE e comparativo de dimensões e peso em todos os cards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Marca</label>
            <input
              type="text"
              value={prefs.usedCar?.brand || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, brand: e.target.value },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Modelo</label>
            <input
              type="text"
              value={prefs.usedCar?.model || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, model: e.target.value },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Versão</label>
            <input
              type="text"
              value={prefs.usedCar?.version || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, version: e.target.value },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Ano Modelo</label>
            <input
              type="number"
              value={prefs.usedCar?.yearModel || 2021}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, yearModel: Number(e.target.value) },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tabela FIPE (R$)</label>
            <input
              type="number"
              step="0.01"
              value={prefs.usedCar?.fipeValue || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, fipeValue: Number(e.target.value) },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Comprimento (mm)</label>
            <input
              type="number"
              value={prefs.usedCar?.lengthMm || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, lengthMm: Number(e.target.value) },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Largura (mm)</label>
            <input
              type="number"
              value={prefs.usedCar?.widthMm || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, widthMm: Number(e.target.value) },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Entre-eixos (mm)</label>
            <input
              type="number"
              value={prefs.usedCar?.wheelbaseMm || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, wheelbaseMm: Number(e.target.value) },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Peso (kg)</label>
            <input
              type="number"
              value={prefs.usedCar?.weightKg || ''}
              onChange={(e) => setPrefs({
                ...prefs,
                usedCar: { ...prefs.usedCar, weightKg: Number(e.target.value) },
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
        </div>
      </section>

      {/* 5. PLANILHA EXCEL (EXPORTAÇÃO & IMPORTAÇÃO) */}
      {onOpenDataSync && (
        <section className="p-5 sm:p-6 rounded-3xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-950/30 backdrop-blur-2xl backdrop-saturate-180 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_12px_36px_rgba(37,99,235,0.08),inset_0_1px_0_0_rgba(255,255,255,0.7)]">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Base de Dados em Planilha Excel (.xlsx)</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 max-w-xl">
              Exporte toda a base de veículos para uma planilha Excel (.xlsx), preencha ou edite especificações manualmente no computador e importe de volta para atualizar o ranking e o Firebase.
            </p>
          </div>

          <button
            onClick={onOpenDataSync}
            className="px-4 py-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs shadow-[0_4px_16px_rgba(37,99,235,0.25),inset_0_1px_0_0_rgba(255,255,255,0.3)] flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 transition-all backdrop-blur-xl"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar / Importar Excel</span>
          </button>
        </section>
      )}

      {/* 6. REDEFINIR PREFERÊNCIAS */}
      <section className="p-5 sm:p-6 rounded-3xl border border-white/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xl backdrop-saturate-180 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.4)]">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">
            Redefinir Preferências de Fábrica e Limpar Armazenamento
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Restaura os pesos analíticos, filtros eliminatórios recomendados e limpa dados do armazenamento local.
          </p>
        </div>

        {resetConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResetSeedData();
                setResetConfirm(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Sim, Redefinir
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setResetConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 min-h-[38px] self-start sm:self-auto cursor-pointer transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Redefinir Padrões</span>
          </button>
        )}
      </section>
    </div>
  );
}
