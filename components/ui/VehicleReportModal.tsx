'use client';

import React, { useState } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import {
  calculateTCO,
  calculateCategoryScores,
  checkElimination,
  getIsofixRating,
  formatMoney,
  formatNumber,
  compareDimensions,
  generatePositionExplanation,
} from '@/lib/calculations';
import { StatusBadge } from './StatusBadge';
import { BrandLogo } from './BrandLogo';
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  Car,
  DollarSign,
  Users,
  Package,
  Zap,
  Shield,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Scale,
  Award,
  Info,
  Archive,
} from 'lucide-react';

interface VehicleReportModalProps {
  vehicle: Vehicle | null;
  preferences: UserPreferences;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleReportModal({
  vehicle,
  preferences,
  isOpen,
  onClose,
}: VehicleReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !vehicle) return null;

  const tco = calculateTCO(vehicle, preferences);
  const scores = calculateCategoryScores(vehicle, preferences);
  const elim = checkElimination(vehicle, preferences);
  const isofixRating = getIsofixRating(vehicle.familySpace.isofixDistanceCm);
  const explanation = generatePositionExplanation(vehicle, scores, [vehicle], preferences);
  const usedCar = preferences.usedCar;
  const dimComparison = usedCar ? {
    diffLengthMm: vehicle.familySpace.lengthMm - (usedCar.lengthMm || 0),
    diffWidthMm: vehicle.familySpace.widthMm - (usedCar.widthMm || 0),
    diffWheelbaseMm: vehicle.familySpace.wheelbaseMm - (usedCar.wheelbaseMm || 0),
  } : null;

  const storePrice = vehicle.financial?.storePrice || vehicle.financial?.tablePrice || 0;
  const tablePrice = vehicle.financial?.tablePrice || 0;
  const discount = tablePrice > storePrice ? tablePrice - storePrice : 0;
  const discountPercent = tablePrice > 0 ? (discount / tablePrice) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      '=================================================================',
      `DOSSIÊ COMPLETO DO VEÍCULO: ${vehicle.brand} ${vehicle.model} ${vehicle.version}`.toUpperCase(),
      `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      '=================================================================\n',
      '1. RESULTADO DA AVALIAÇÃO & PONTUAÇÃO',
      `• Nota Final Ponderada: ${scores.finalWeightedScore.toFixed(1)} / 100`,
      `• Critérios Técnicos Objetivos (50%): ${scores.technicalScore.toFixed(1)} / 100 (+${(scores.technicalScore * 0.5).toFixed(1)} pts)`,
      `• Minha Impressão Geral (50%): ${scores.userImpressionRaw !== null ? `${scores.userImpressionRaw.toFixed(1)} / 10 (+${(scores.userImpressionRaw * 5).toFixed(1)} pts)` : 'Pendente de avaliação'}`,
      `• Status: ${elim.isPendingMeasurement ? 'PENDENTE MEDIÇÃO ISOFIX (Nota Zero eliminatória)' : elim.isEliminated ? `DESCLASSIFICADO (${elim.reason})` : 'APROVADO / CLASSIFICADO'}`,
      `• Parecer: ${explanation.headline}`,
      '\n2. IDENTIFICAÇÃO & CONCESSIONÁRIA',
      `• Marca/Modelo/Versão: ${vehicle.brand} ${vehicle.model} ${vehicle.version}`,
      `• Motorização: ${vehicle.powertrain}`,
      `• Status do Processo: ${vehicle.status}`,
      `• Ano Fab./Modelo: ${vehicle.yearManufacture} / ${vehicle.yearModel}`,
      `• Concessionária / Loja: ${vehicle.dealership || 'Não informada'}`,
      `• Nome do Vendedor: ${vehicle.sellerName || 'Não informado'}`,
      `• Arquivado: ${vehicle.isArchived ? 'Sim (escondido dos rankings)' : 'Não (ativo)'}`,
      vehicle.notes ? `• Anotações Gerais: "${vehicle.notes}"` : '',
      '\n3. PREÇO & NEGOCIAÇÃO FINANCEIRA',
      `• Preço da Loja: R$ ${formatMoney(storePrice)}`,
      `• Preço de Tabela (FIPE): R$ ${formatMoney(tablePrice)}`,
      discount > 0 ? `• Desconto Ofertado: R$ ${formatMoney(discount)} (${discountPercent.toFixed(1)}%)` : '',
      `• Avaliação do Carro Usado: R$ ${formatMoney(vehicle.financial.usedCarEvaluation)}`,
      '\n4. ESPAÇO FAMILIAR & ISOFIX',
      `• Distância ISOFIX Interna: ${vehicle.familySpace.isofixDistanceCm !== null ? `${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm (${isofixRating.rating})` : 'Pendente de medição na concessionária'}`,
      `• Capacidade de Passageiros: ${vehicle.familySpace.passengerCapacity} pessoas`,
      `• Comprimento: ${formatNumber(vehicle.familySpace.lengthMm, 0)} mm`,
      `• Largura: ${formatNumber(vehicle.familySpace.widthMm, 0)} mm`,
      `• Entre-eixos: ${formatNumber(vehicle.familySpace.wheelbaseMm, 0)} mm`,
      `• Peso: ${formatNumber(vehicle.familySpace.weightKg, 0)} kg`,
      '\n5. PORTA-MALAS & PRATICIDADE',
      `• Volume do Porta-Malas: ${vehicle.trunk.volumeLiters} Litros`,
      `• Tipo de Estepe: ${vehicle.trunk.spareTireKit}`,
      `• Tampa Elétrica: ${vehicle.trunk.electricTailgate ? 'Sim' : 'Não'}`,
      '\n6. MOTORIZAÇÃO, DESEMPENHO & BATERIA',
      `• Potência Total: ${vehicle.powertrainSpec.totalPowerHp} cv`,
      `• Torque: ${formatNumber(vehicle.powertrainSpec.torqueKgfm, 1)} kgfm`,
      `• Aceleração 0 a 100 km/h: ${formatNumber(vehicle.powertrainSpec.zeroToHundredSeconds, 1)} s`,
      `• Autonomia Total: ${vehicle.powertrainSpec.totalRangeKm} km`,
      `• Tração: ${vehicle.powertrainSpec.drivetrain}`,
      vehicle.powertrainSpec.batteryKwh ? `• Bateria: ${vehicle.powertrainSpec.batteryKwh} kWh` : '',
      vehicle.powertrainSpec.electricRangeKm ? `• Autonomia Elétrica: ${vehicle.powertrainSpec.electricRangeKm} km` : '',
      '\n7. CONSUMO & SEGURANÇA',
      `• Consumo Urbano: ${vehicle.consumption.urbanKmL ? `${formatNumber(vehicle.consumption.urbanKmL, 1)} km/l` : '—'}`,
      `• Consumo Rodoviário: ${vehicle.consumption.highwayKmL ? `${formatNumber(vehicle.consumption.highwayKmL, 1)} km/l` : '—'}`,
      `• Airbags: ${vehicle.safety.airbagsCount}`,
      `• ADAS Completo: ${vehicle.safety.hasAdas ? 'Sim' : 'Não'}`,
      `• Alerta de Ponto Cego: ${vehicle.safety.hasBlindSpotAlert ? 'Sim' : 'Não'}`,
      `• Câmera 360º: ${vehicle.safety.hasCamera360 ? 'Sim' : 'Não'}`,
      '\n8. CUSTOS, GARANTIA & TCO (3 ANOS NA BAHIA - ALÍQUOTA 2,5%)',
      `• TCO Total em 3 Anos: R$ ${formatMoney(tco.totalTCO)}`,
      `• Custo Médio Mensal: R$ ${formatMoney(tco.monthlyTCO)} / mês`,
      `• IPVA 3 Anos: R$ ${formatMoney(tco.breakdown.ipva3Years)} (Anual: R$ ${formatMoney(vehicle.warrantyCosts.ipvaAnnual)})`,
      `• Seguro 3 Anos: R$ ${formatMoney(tco.breakdown.insurance3Years)} (Anual: R$ ${formatMoney(vehicle.warrantyCosts.insuranceAnnual)})`,
      `• Revisões 3 Anos: R$ ${formatMoney(tco.breakdown.revisions3Years)}`,
      `• Consumo 3 Anos: R$ ${formatMoney(tco.breakdown.consumption3Years)}`,
      `• Garantia Geral: ${vehicle.warrantyCosts.generalWarrantyYears} anos | Garantia Bateria: ${vehicle.warrantyCosts.batteryWarrantyYears} anos`,
      '\n9. AVALIAÇÃO DO USUÁRIO — MINHA IMPRESSÃO GERAL (PESO 50%)',
      `• Nota Pessoal: ${scores.userImpressionRaw !== null ? `${formatNumber(scores.userImpressionRaw, 1)} / 10` : 'Pendente de avaliação'}`,
      `• Test-Drive Realizado: ${vehicle.userImpression?.testDriveConducted ? 'Sim' : 'Não'}`,
      vehicle.userImpression?.notes ? `• Anotações ao Volante: "${vehicle.userImpression.notes}"` : '• Anotações ao Volante: Sem anotações',
      '\n10. PONTOS FORTES & ATENÇÃO',
      `• Pontos Fortes: ${explanation.strengths.join('; ')}`,
      `• Pontos de Atenção: ${explanation.weaknesses.join('; ')}`,
      '=================================================================',
    ];

    navigator.clipboard.writeText(lines.filter(Boolean).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-report-title"
      >
        {/* Top Control Bar (Non-printable) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-xl shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 id="vehicle-report-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Relatório Completo do Veículo
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ficha analítica com todas as especificações e avaliações registradas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[36px]"
              title="Copiar relatório formatado em texto para a área de transferência"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[36px]"
              title="Imprimir ou salvar em PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200 print:p-0 print:overflow-visible print:text-black">
          {/* Header Banner */}
          <div className="p-5 rounded-3xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3.5">
                <BrandLogo brand={vehicle.brand} model={vehicle.model} size="lg" showFallbackText />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                      {vehicle.brand}
                    </span>
                    <StatusBadge status={vehicle.status} size="sm" />
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {vehicle.powertrain}
                    </span>
                    {vehicle.isArchived && (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-500 text-slate-950 flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Arquivado (Oculto dos rankings)
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {vehicle.model}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {vehicle.version || 'Versão Padrão'} · Fabricação {vehicle.yearManufacture} / Modelo {vehicle.yearModel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {vehicle.dealership || 'Concessionária não informada'}
                </span>
                {vehicle.sellerName && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Vendedor: {vehicle.sellerName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Emitido em: {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Score & Evaluation Card */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 shadow-xs shrink-0 min-w-[200px]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Nota Final Ponderada
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span
                  className={`text-3xl sm:text-4xl font-black tabular-nums ${
                    elim.isPendingMeasurement
                      ? 'text-amber-600 dark:text-amber-400'
                      : elim.isEliminated
                      ? 'text-rose-600 dark:text-rose-400 line-through'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatNumber(scores.finalWeightedScore, 1)}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>

              <div className="text-[10px] space-y-0.5 text-right">
                <div className="text-slate-600 dark:text-slate-300">
                  Técnica: <strong>{formatNumber(scores.technicalScore, 1)}/100</strong> (50%)
                </div>
                <div className="text-blue-600 dark:text-cyan-400 font-medium">
                  Impressão: <strong>{scores.userImpressionRaw !== null ? `${formatNumber(scores.userImpressionRaw, 1)}/10` : 'Pendente'}</strong> (50%)
                </div>
              </div>
            </div>
          </div>

          {/* Eliminatory or Warning Alert */}
          {elim.isPendingMeasurement ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold">Medição de ISOFIX Pendente (Critério Eliminatório)</strong>
                <span className="text-[11px]">
                  A nota final do veículo permanece zerada até que a distância entre os pontos ISOFIX seja medida presencialmente na concessionária com fita métrica (exige ≥ {preferences.isofixMinDistanceCm ?? 45} cm).
                </span>
              </div>
            </div>
          ) : elim.isEliminated ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold">Veículo Desclassificado Pelos Critérios Familiares</strong>
                <span className="text-[11px]">{elim.reason}</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-300/60 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold">Veículo Aprovado nos Requisitos Familiares</strong>
                <span className="text-[11px]">
                  Atende às exigências de espaço, orçamento (até R$ {formatMoney(preferences.maxStorePrice ?? 200000)}) e acomodação de passageiros.
                </span>
              </div>
            </div>
          )}

          {/* 4 Key Pillars Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 block text-[11px]">Preço da Loja</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums block">
                R$ {formatMoney(storePrice)}
              </span>
              {discount > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                  Economia de R$ {formatMoney(discount)}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 block text-[11px]">Espaço ISOFIX</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums block">
                {vehicle.familySpace.isofixDistanceCm !== null ? `${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm` : 'Pendente'}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isofixRating.badgeBg} ${isofixRating.badgeText}`}>
                {isofixRating.rating}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 block text-[11px]">TCO 3 Anos (BA)</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums block">
                R$ {formatMoney(tco.totalTCO)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                R$ {formatMoney(tco.monthlyTCO)} / mês
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 block text-[11px]">Minha Impressão (50%)</span>
              <span className="text-base font-extrabold text-blue-600 dark:text-cyan-400 tabular-nums block">
                {scores.userImpressionRaw !== null ? `${formatNumber(scores.userImpressionRaw, 1)} / 10` : 'Pendente'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {vehicle.userImpression?.testDriveConducted ? 'Test-drive realizado' : 'Sem test-drive'}
              </span>
            </div>
          </div>

          {/* DETAILED 8 CADASTRO BLOCKS */}
          <div className="space-y-6 pt-2">
            {/* Bloco 1: Identificação & Concessionária */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Car className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  1. Identificação & Concessionária
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Marca</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.brand}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Modelo</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.model}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Versão</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.version || '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Motorização</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vehicle.powertrain}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Ano Fab. / Modelo</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.yearManufacture} / {vehicle.yearModel}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Status de Compra</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.status}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Concessionária</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.dealership || '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Vendedor</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.sellerName || '—'}</span>
                </div>
              </div>
              {vehicle.notes && (
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 text-[11px] text-slate-700 dark:text-slate-300">
                  <strong className="block text-[10px] text-slate-500 uppercase">Observações Gerais:</strong>
                  {vehicle.notes}
                </div>
              )}
            </section>

            {/* Bloco 2: Preço & Negociação Financeira */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  2. Preço & Negociação Financeira
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Preço de Tabela (FIPE)</span>
                  <span className="font-bold text-slate-900 dark:text-white">R$ {formatMoney(tablePrice)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Preço da Loja (Negociado)</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">R$ {formatMoney(storePrice)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Avaliação do Seu Usado</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {vehicle.financial.usedCarEvaluation > 0 ? `R$ ${formatMoney(vehicle.financial.usedCarEvaluation)}` : 'Não ofertado'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Diferença / Saldo</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    R$ {formatMoney(Math.max(0, storePrice - (vehicle.financial.usedCarEvaluation || 0)))}
                  </span>
                </div>
              </div>

              {/* Condições de Pagamento Cadastradas */}
              {vehicle.financial.paymentConditions && vehicle.financial.paymentConditions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    Condições / Planos de Pagamento Registrados:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicle.financial.paymentConditions.map((cond) => (
                      <div key={cond.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span>{cond.name}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {cond.months}x de R$ {formatMoney(cond.installmentValue)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                          <div>Entrada: R$ {formatMoney(cond.downPayment)}</div>
                          <div>Financiado: R$ {formatMoney(cond.financedAmount)}</div>
                          <div>Taxa: {cond.monthlyRatePercent.toFixed(2)}% a.m.</div>
                          <div>Total com Juros: R$ {formatMoney(cond.totalPaid)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Bloco 3: Espaço Familiar & ISOFIX */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  3. Espaço Familiar, Dimensões & ISOFIX
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Distância ISOFIX Interna</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {vehicle.familySpace.isofixDistanceCm !== null ? `${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm` : 'Pendente'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isofixRating.badgeBg} ${isofixRating.badgeText}`}>
                      {isofixRating.rating}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Capacidade sem Cadeirinha</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {vehicle.familySpace.passengerCapacity} passageiros
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Comprimento</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatNumber(vehicle.familySpace.lengthMm, 0)} mm
                  </span>
                  {dimComparison && (
                    <span className={`text-[10px] block ${dimComparison.diffLengthMm > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {dimComparison.diffLengthMm > 0 ? `+${dimComparison.diffLengthMm} mm vs usado` : `${dimComparison.diffLengthMm} mm vs usado`}
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Largura</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatNumber(vehicle.familySpace.widthMm, 0)} mm
                  </span>
                  {dimComparison && (
                    <span className="text-[10px] text-slate-500 block">
                      {dimComparison.diffWidthMm > 0 ? `+${dimComparison.diffWidthMm} mm` : `${dimComparison.diffWidthMm} mm`}
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Entre-eixos</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatNumber(vehicle.familySpace.wheelbaseMm, 0)} mm
                  </span>
                  {dimComparison && (
                    <span className="text-[10px] text-slate-500 block">
                      {dimComparison.diffWheelbaseMm > 0 ? `+${dimComparison.diffWheelbaseMm} mm` : `${dimComparison.diffWheelbaseMm} mm`}
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Peso</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatNumber(vehicle.familySpace.weightKg, 0)} kg
                  </span>
                </div>
              </div>
            </section>

            {/* Bloco 4: Porta-Malas & Praticidade */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  4. Porta-Malas & Praticidade
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Volume Oficial</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {vehicle.trunk.volumeLiters} Litros
                  </span>
                  {usedCar?.trunkVolumeLiters && (
                    <span className={`text-[10px] block ${vehicle.trunk.volumeLiters >= usedCar.trunkVolumeLiters ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {vehicle.trunk.volumeLiters >= usedCar.trunkVolumeLiters
                        ? `+${vehicle.trunk.volumeLiters - usedCar.trunkVolumeLiters} L maior que o seu usado`
                        : `${vehicle.trunk.volumeLiters - usedCar.trunkVolumeLiters} L vs usado`}
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Tipo de Estepe</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vehicle.trunk.spareTireKit}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Tampa com Abertura Elétrica</span>
                  <span className={`font-bold ${vehicle.trunk.electricTailgate ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {vehicle.trunk.electricTailgate ? 'Sim (Disponível)' : 'Não'}
                  </span>
                </div>
              </div>
            </section>

            {/* Bloco 5: Motorização & Desempenho */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  5. Motorização, Desempenho & Bateria
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Potência Total</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{vehicle.powertrainSpec.totalPowerHp} cv</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Torque Combinado</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatNumber(vehicle.powertrainSpec.torqueKgfm, 1)} kgfm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">0 a 100 km/h</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatNumber(vehicle.powertrainSpec.zeroToHundredSeconds, 1)} s</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Tração</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vehicle.powertrainSpec.drivetrain}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Autonomia Total</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vehicle.powertrainSpec.totalRangeKm} km</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Capacidade Bateria</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {vehicle.powertrainSpec.batteryKwh ? `${vehicle.powertrainSpec.batteryKwh} kWh` : '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 col-span-2">
                  <span className="text-slate-500 block text-[10px]">Autonomia 100% Elétrica</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {vehicle.powertrainSpec.electricRangeKm ? `${vehicle.powertrainSpec.electricRangeKm} km (Modo EV)` : '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* Bloco 6: Consumo & Segurança */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  6. Consumo & Segurança
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Consumo Urbano (Cidade)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {vehicle.consumption.urbanKmL ? `${formatNumber(vehicle.consumption.urbanKmL, 1)} km/l` : '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Consumo Rodoviário (Estrada)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {vehicle.consumption.highwayKmL ? `${formatNumber(vehicle.consumption.highwayKmL, 1)} km/l` : '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Airbags</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vehicle.safety.airbagsCount} airbags</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Pacote ADAS Ativo</span>
                  <span className={`font-bold ${vehicle.safety.hasAdas ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {vehicle.safety.hasAdas ? 'Sim (Completo)' : 'Não'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Alerta de Ponto Cego</span>
                  <span className={`font-bold ${vehicle.safety.hasBlindSpotAlert ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {vehicle.safety.hasBlindSpotAlert ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Câmera 360º</span>
                  <span className={`font-bold ${vehicle.safety.hasCamera360 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {vehicle.safety.hasCamera360 ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </section>

            {/* Bloco 7: Custos, Garantia & TCO (3 Anos na Bahia) */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  7. Custos, Garantia & TCO Simplificado (3 Anos BA - 2,5%)
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">TCO Acumulado 3 Anos</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">R$ {formatMoney(tco.totalTCO)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Custo Médio Mensal</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">R$ {formatMoney(tco.monthlyTCO)}/mês</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">IPVA 3 Anos (2,5% BA)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R$ {formatMoney(tco.breakdown.ipva3Years)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Seguro 3 Anos</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R$ {formatMoney(tco.breakdown.insurance3Years)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Revisões 3 Anos</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R$ {formatMoney(tco.breakdown.revisions3Years)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Consumo 3 Anos (Comb.+Energ.)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R$ {formatMoney(tco.breakdown.consumption3Years)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Garantia Geral</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.warrantyCosts.generalWarrantyYears} anos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-slate-500 block text-[10px]">Garantia da Bateria</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.warrantyCosts.batteryWarrantyYears} anos</span>
                </div>
              </div>

              {/* Itens de conforto e tecnologia */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <span className="font-bold text-slate-700 dark:text-slate-300">Conforto & Tecnologia:</span>
                <span className={vehicle.comfortTech.electricSeats ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {vehicle.comfortTech.electricSeats ? '✓ Bancos Elétricos' : '✗ Bancos Manuais'}
                </span>
                <span className={vehicle.comfortTech.rearAirVents ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {vehicle.comfortTech.rearAirVents ? '✓ Saída Ar Traseira' : '✗ Sem Saída Traseira'}
                </span>
                <span className={vehicle.comfortTech.carPlayWireless ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {vehicle.comfortTech.carPlayWireless ? '✓ CarPlay Sem Fio' : '✗ CarPlay com Fio'}
                </span>
                <span className={vehicle.comfortTech.panoramicSunroof ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {vehicle.comfortTech.panoramicSunroof ? '✓ Teto Panorâmico' : '✗ Sem Teto Panorâmico'}
                </span>
              </div>
            </section>

            {/* Bloco 8: Avaliação do Usuário — Minha Impressão Geral (Peso 50%) */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  8. Avaliação do Usuário — Minha Impressão Geral (Peso 50%)
                </h3>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/60 dark:border-blue-800/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs">Nota Pessoal:</span>
                    <span className="text-xl font-black text-blue-700 dark:text-cyan-300 tabular-nums">
                      {scores.userImpressionRaw !== null ? `${formatNumber(scores.userImpressionRaw, 1)} / 10` : 'Pendente de avaliação'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (contribui com {scores.userImpressionRaw !== null ? `${(scores.userImpressionRaw * 5).toFixed(1)} pts` : '0 pts'} na nota final)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className={`px-2 py-0.5 rounded-md ${vehicle.userImpression?.testDriveConducted ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {vehicle.userImpression?.testDriveConducted ? '✓ Test-drive realizado presencialmente' : '✗ Test-drive ainda não realizado'}
                    </span>
                  </div>
                </div>

                {vehicle.userImpression?.notes ? (
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/60 text-xs text-slate-800 dark:text-slate-200 italic">
                    &ldquo;{vehicle.userImpression.notes}&rdquo;
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Nenhuma anotação subjetiva ou percepção de condução cadastrada ainda.
                  </p>
                )}
              </div>
            </section>

            {/* Justificativa e Diagnóstico */}
            <section className="space-y-2 pt-1">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Award className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Diagnóstico Automático
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[11px] uppercase">
                    Pontos Fortes Detectados:
                  </span>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                    {explanation.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block text-[11px] uppercase">
                    Pontos de Atenção / Fragilidades:
                  </span>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                    {explanation.weaknesses.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer (Non-printable) */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs print:hidden shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Meu Próximo Carro — Sistema de Decisão de Compra Familiar
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-90 cursor-pointer"
            >
              Imprimir / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
