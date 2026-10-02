'use client';

import React, { useState, useRef } from 'react';
import { Vehicle, UserPreferences } from '@/types/vehicle';
import { exportVehiclesToExcel, downloadExcelTemplate, parseVehiclesFromExcel } from '@/lib/excel';
import { formatMoney } from '@/lib/calculations';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileDown,
  X,
  Sparkles,
  CloudCheck,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  Database,
} from 'lucide-react';

interface ExcelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  preferences: UserPreferences;
  activeScenarioId: string;
  onImportData: (
    data: { vehicles: Vehicle[]; preferences?: UserPreferences; activeScenarioId?: string },
    mode: 'replace' | 'merge'
  ) => { success: boolean; count?: number; error?: string };
}

export function ExcelManagerModal({
  isOpen,
  onClose,
  vehicles,
  onImportData,
}: ExcelManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    vehicles: Vehicle[];
    errors: string[];
    summary: { total: number; valid: number; updated: number; created: number };
  } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportCurrent = () => {
    try {
      exportVehiclesToExcel(vehicles);
      setFeedback({
        type: 'success',
        text: `Planilha com ${vehicles.length} veículo(s) exportada com sucesso!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback({
        type: 'error',
        text: e.message || 'Erro ao exportar planilha Excel.',
      });
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate();
      setFeedback({
        type: 'success',
        text: 'Modelo em branco (.xlsx) com instruções baixado com sucesso!',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback({
        type: 'error',
        text: e.message || 'Erro ao gerar modelo Excel.',
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsProcessing(true);
    setFeedback(null);

    try {
      const parsed = await parseVehiclesFromExcel(file);
      setParsedPreview(parsed);
      if (parsed.vehicles.length === 0) {
        setFeedback({
          type: 'error',
          text: 'Nenhum veículo válido encontrado na planilha. Verifique se as colunas estão corretas.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Arquivo inválido. Certifique-se de carregar uma planilha (.xlsx).',
      });
      setParsedPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.vehicles.length === 0) return;

    const result = onImportData({ vehicles: parsedPreview.vehicles }, importMode);

    if (result.success) {
      setFeedback({
        type: 'success',
        text: `Sucesso! ${result.count} veículo(s) importado(s) e sincronizados no Firebase Firestore.`,
      });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setFeedback({
        type: 'error',
        text: result.error || 'Erro ao importar veículos.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/90 dark:bg-[#0a1636]/90 backdrop-blur-3xl backdrop-saturate-180 border border-white/60 dark:border-blue-500/20 rounded-3xl w-full max-w-2xl shadow-[0_25px_60px_-15px_rgba(0,16,64,0.35),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/50 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 border border-white/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Planilha Excel (.xlsx)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300">
                  Preenchimento Manual
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exporte, edite em lote no computador e reimporte com cálculo automático
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Status Banner */}
        <div className="px-5 py-3 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold">
              Firebase Firestore Ativo
            </span>
            <span className="text-[11px] text-blue-700 dark:text-blue-300 hidden sm:inline">
              — Seus dados são salvos continuamente na nuvem.
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shrink-0">
            {vehicles.length} carro(s) na base
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/50 dark:border-white/5 bg-slate-100/60 dark:bg-slate-950/40 backdrop-blur-xl p-1.5 gap-1">
          <button
            onClick={() => {
              setActiveTab('export');
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white/95 dark:bg-white/15 text-blue-700 dark:text-blue-300 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.8)] border border-white/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar para Excel</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('import');
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white/95 dark:bg-white/15 text-blue-700 dark:text-blue-300 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.8)] border border-white/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Planilha Preenchida</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 backdrop-blur-md animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-900 dark:text-rose-200 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* 1. ABA EXPORTAR */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Exportação Completa da Base Atual
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm">
                    {vehicles.length} veículo(s)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Baixe a planilha completa com todas as colunas organizadas: Preços de negociação, medições de fita métrica do ISOFIX, espaço familiar, consumo e notas de test drive.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleExportCurrent}
                    disabled={vehicles.length === 0}
                    className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white text-xs font-bold shadow-[0_4px_16px_rgba(37,99,235,0.3),inset_0_1px_0_0_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Base em Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Template Alternativo */}
              <div className="p-4 rounded-2xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileDown className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Baixar Modelo em Branco (Template de Preenchimento)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Contém cabeçalhos padronizados e uma linha de exemplo explicativa para preencher do zero.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Modelo (.xlsx)</span>
                </button>
              </div>

              {/* Dicas de preenchimento */}
              <div className="p-4 rounded-2xl border border-white/40 dark:border-white/5 bg-white/40 dark:bg-white/5 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200">Como funciona a edição manual:</p>
                <p>1. Abra o arquivo baixado no Microsoft Excel, Google Planilhas ou Apple Numbers.</p>
                <p>2. Altere os valores desejados (como Proposta Negociada, Distância ISOFIX, Consumo ou Notas).</p>
                <p>3. Para adicionar novos carros, adicione novas linhas e deixe a coluna <strong>ID</strong> vazia.</p>
                <p>4. Salve e volte nesta janela na aba <strong>Importar</strong> para atualizar a base.</p>
              </div>
            </div>
          )}

          {/* 2. ABA IMPORTAR */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                  Selecione o arquivo Excel (.xlsx) preenchido:
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-blue-400/50 dark:border-blue-500/30 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {importFile ? importFile.name : 'Clique para escolher ou arraste o arquivo .xlsx'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Formatos suportados: .xlsx, .xls
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Preview de Veículos Detectados */}
              {parsedPreview && (
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 space-y-3 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Veículos Detectados na Planilha:
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {parsedPreview.summary.valid} carro(s) válido(s)
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {parsedPreview.vehicles.map((v, i) => (
                      <div
                        key={v.id || i}
                        className="px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 text-xs flex items-center justify-between border border-white/40 dark:border-white/5"
                      >
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {v.brand} {v.model} {v.version} ({v.powertrain})
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          R$ {formatMoney(v.financial.storePrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {parsedPreview.errors.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                      <p className="font-bold">Avisos da planilha:</p>
                      {parsedPreview.errors.slice(0, 3).map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}

                  {/* Modo de Importação */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-4 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Modo:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Atualizar e Adicionar (Mesclar)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Substituir Base Completa</span>
                    </label>
                  </div>

                  {/* Botão de Confirmação */}
                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-3 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Salvar no Firebase Firestore</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white/40 dark:bg-white/5 border-t border-white/50 dark:border-white/5 flex items-center justify-end backdrop-blur-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-white/20 cursor-pointer transition-all shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
