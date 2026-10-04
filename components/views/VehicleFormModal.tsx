'use client';

import React, { useState } from 'react';
import { Vehicle, PowertrainType, VehicleStatus, UserPreferences, PaymentCondition } from '@/types/vehicle';
import { formatMoney, formatNumber, calculatePaymentOption, compareDimensions, checkElimination } from '@/lib/calculations';
import { PtBrNumberInput } from '@/components/ui/PtBrNumberInput';
import { X, ArrowRight, ArrowLeft, Check, Plus, Trash2, Calculator, Info, AlertTriangle } from 'lucide-react';

interface VehicleFormModalProps {
  vehicleToEdit: Vehicle | null;
  preferences?: UserPreferences;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
}

function createInitialVehicle(prefs?: UserPreferences): Vehicle {
  return {
    id: `vehicle-${Date.now()}`,
    brand: '',
    model: '',
    version: '',
    powertrain: 'PHEV',
    status: 'Quero visitar',
    yearManufacture: 0,
    yearModel: 0,
    dealership: '',
    sellerName: '',
    notes: '',

    financial: {
      tablePrice: 0,
      storePrice: 0,
      usedCarEvaluation: 0,
      paymentConditions: [],
    },

    familySpace: {
      isofixDistanceCm: null, // Em branco até medição presencial
      passengerCapacity: 5,
      lengthMm: 0,
      widthMm: 0,
      wheelbaseMm: 0,
      weightKg: 0,
    },

    trunk: {
      volumeLiters: 0,
      spareTireKit: 'Kit reparo',
      electricTailgate: false,
    },

    powertrainSpec: {
      totalPowerHp: 0,
      torqueKgfm: 0,
      zeroToHundredSeconds: 0,
      totalRangeKm: 0,
      drivetrain: 'FWD',
      batteryKwh: 0,
      electricRangeKm: 0,
    },

    consumption: {
      urbanKmL: 0,
      highwayKmL: 0,
    },

    safety: {
      airbagsCount: 0,
      hasAdas: false,
      hasBlindSpotAlert: false,
      hasCamera360: false,
    },

    warrantyCosts: {
      generalWarrantyYears: 0,
      batteryWarrantyYears: 0,
      ipvaAnnual: 0,
      insuranceAnnual: 0,
      revisions3Years: 0,
      consumption3Years: 0,
    },

    comfortTech: {
      electricSeats: false,
      rearAirVents: false,
      carPlayWireless: false,
      panoramicSunroof: false,
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function VehicleFormModal({
  vehicleToEdit,
  preferences,
  isOpen,
  onClose,
  onSave,
}: VehicleFormModalProps) {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 7;

  const usedCar = preferences?.usedCar;

  const [formData, setFormData] = useState<Vehicle>(() => {
    if (vehicleToEdit) {
      return {
        ...vehicleToEdit,
        familySpace: {
          ...vehicleToEdit.familySpace,
          isofixDistanceCm: vehicleToEdit.familySpace?.isofixDistanceCm ?? null,
          passengerCapacity: vehicleToEdit.familySpace?.passengerCapacity ?? 5,
        },
      };
    }
    return createInitialVehicle(preferences);
  });

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.brand.trim() || !formData.model.trim()) {
      setFormError('Por favor, informe a Marca e o Modelo do veículo.');
      setStep(1);
      return;
    }
    setFormError(null);
    const currentYear = new Date().getFullYear();
    const cleanedVehicle: Vehicle = {
      ...formData,
      yearManufacture: formData.yearManufacture || currentYear,
      yearModel: formData.yearModel || currentYear,
      version: (formData.version || '').replace(/\s*\(?completa\)?/gi, '').trim(),
    };
    onSave(cleanedVehicle);
    onClose();
  };

  // Payment Option state helper
  const handleAddPaymentCondition = () => {
    const downPayment = Math.round((formData.financial.storePrice || 0) * 0.5);
    const months = 24;
    const calc = calculatePaymentOption(
      formData.financial.storePrice || 0,
      downPayment,
      formData.financial.usedCarEvaluation || 0,
      true,
      months,
      'RATE_TO_INSTALLMENT',
      0.0,
      0
    );

    const newCond: PaymentCondition = {
      id: `cond-${Date.now()}`,
      name: `Opção ${formData.financial.paymentConditions.length + 1}`,
      downPayment,
      useUsedCarAsDownPayment: true,
      financedAmount: calc.financedAmount,
      months,
      mode: 'RATE_TO_INSTALLMENT',
      monthlyRatePercent: 0.0,
      installmentValue: calc.calculatedInstallmentValue,
      totalPaid: calc.totalPaid,
      totalInterest: calc.totalInterest,
    };

    setFormData((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        paymentConditions: [...prev.financial.paymentConditions, newCond],
      },
    }));
  };

  const handleUpdatePaymentCondition = (index: number, updates: Partial<PaymentCondition>) => {
    setFormData((prev) => {
      const list = [...prev.financial.paymentConditions];
      const current = { ...list[index], ...updates };
      const calc = calculatePaymentOption(
        prev.financial.storePrice || 0,
        current.downPayment,
        prev.financial.usedCarEvaluation || 0,
        current.useUsedCarAsDownPayment,
        current.months,
        current.mode,
        current.monthlyRatePercent,
        current.installmentValue
      );

      list[index] = {
        ...current,
        financedAmount: calc.financedAmount,
        monthlyRatePercent: current.mode === 'INSTALLMENT_TO_RATE' ? calc.calculatedMonthlyRatePercent : current.monthlyRatePercent,
        installmentValue: current.mode === 'RATE_TO_INSTALLMENT' ? calc.calculatedInstallmentValue : current.installmentValue,
        totalPaid: calc.totalPaid,
        totalInterest: calc.totalInterest,
      };

      return {
        ...prev,
        financial: {
          ...prev.financial,
          paymentConditions: list,
        },
      };
    });
  };

  const handleRemovePaymentCondition = (index: number) => {
    setFormData((prev) => {
      const list = prev.financial.paymentConditions.filter((_, i) => i !== index);
      return {
        ...prev,
        financial: {
          ...prev.financial,
          paymentConditions: list,
        },
      };
    });
  };

  const elimCheck = checkElimination(formData, preferences || {
    isofixMinDistanceCm: 45,
    autoEliminateIncompatible: true,
    excludeBEV: false,
    annualKm: 15000,
    urbanSharePercent: 75,
    gasolinePricePerLiter: 6.20,
    ethanolPricePerLiter: 4.10,
    electricityPricePerKwh: 0.95,
    selectedState: 'BA',
    ipvaRatePercent: 2.5,
    tcoYearsPeriod: 3,
    usedCar: usedCar!,
    weights: {
      familySpace: 30,
      tco: 20,
      safety: 15,
      powertrainEfficiency: 10,
      comfort: 10,
      warrantyResale: 10,
      technology: 5,
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl backdrop-saturate-180 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 dark:border-white/10 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/50 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                Etapa {step} de {totalSteps}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {step === 1 && 'Identificação & Concessionária'}
                {step === 2 && 'Preço & Negociação'}
                {step === 3 && 'Espaço & ISOFIX'}
                {step === 4 && 'Porta-malas & Praticidade'}
                {step === 5 && 'Motorização & Bateria'}
                {step === 6 && 'Consumo & Segurança'}
                {step === 7 && 'Conforto, Custos & Garantia'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {vehicleToEdit ? `Editar: ${formData.brand} ${formData.model || 'Veículo'}` : 'Cadastrar Novo Veículo'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
              title="Salvar veículo agora"
            >
              <Check className="w-4 h-4" />
              <span>Salvar</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/5 overflow-x-auto text-[11px] font-medium">
          {[
            { s: 1, label: 'Identificação' },
            { s: 2, label: 'Preço' },
            { s: 3, label: 'ISOFIX & Espaço' },
            { s: 4, label: 'Porta-malas' },
            { s: 5, label: 'Motor' },
            { s: 6, label: 'Segurança' },
            { s: 7, label: 'Custos' },
          ].map((item) => (
            <button
              key={item.s}
              type="button"
              onClick={() => setStep(item.s)}
              className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                step === item.s
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10'
              }`}
            >
              {item.s}. {item.label}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200/50 dark:bg-white/5 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300 font-bold flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-xs hover:underline cursor-pointer"
              >
                Fechar
              </button>
            </div>
          )}
          {/* ========================================================= */}
          {/* ETAPA 1: Identificação & Concessionária */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Versão <span className="text-[10px] text-slate-400 font-normal">(sem o texto &ldquo;Completa&rdquo;)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\s*\(?completa\)?/gi, '');
                      setFormData({ ...formData, version: clean });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Motorização
                  </label>
                  <select
                    value={formData.powertrain}
                    onChange={(e) => setFormData({ ...formData, powertrain: e.target.value as PowertrainType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PHEV">PHEV (Plug-in)</option>
                    <option value="HEV">HEV (Híbrido)</option>
                    <option value="REEV">REEV (Extensor)</option>
                    <option value="MHEV">MHEV (Leve)</option>
                    <option value="BEV">BEV (100% Elétrico)</option>
                    <option value="Combustão">Combustão</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Quero visitar">Quero visitar</option>
                    <option value="Visitei">Visitei</option>
                    <option value="Testado">Testado</option>
                    <option value="Aguardando proposta">Aguardando proposta</option>
                    <option value="Finalista">Finalista</option>
                    <option value="Eliminado">Eliminado</option>
                    <option value="Comprado">Comprado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Ano Fabricação
                  </label>
                  <PtBrNumberInput
                    value={formData.yearManufacture}
                    onChange={(val) => setFormData({ ...formData, yearManufacture: val })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Ano Modelo
                  </label>
                  <PtBrNumberInput
                    value={formData.yearModel}
                    onChange={(val) => setFormData({ ...formData, yearModel: val })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Concessionária
                  </label>
                  <input
                    type="text"
                    value={formData.dealership}
                    onChange={(e) => setFormData({ ...formData, dealership: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Nome do Vendedor
                  </label>
                  <input
                    type="text"
                    value={formData.sellerName || ''}
                    onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 2: Preço & Negociação */}
          {/* ========================================================= */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Preço de Tabela (R$)
                  </label>
                  <PtBrNumberInput
                    isCurrency
                    value={formData.financial.tablePrice}
                    onChange={(val) => setFormData({
                      ...formData,
                      financial: { ...formData.financial, tablePrice: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Preço da Loja (R$) *
                  </label>
                  <PtBrNumberInput
                    isCurrency
                    value={formData.financial.storePrice}
                    onChange={(val) => {
                      const ipvaBA = Math.round(val * ((preferences?.ipvaRatePercent ?? 2.5) / 100));
                      setFormData({
                        ...formData,
                        financial: { ...formData.financial, storePrice: val },
                        warrantyCosts: { ...formData.warrantyCosts, ipvaAnnual: ipvaBA },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Avaliação do Usado com Tabela FIPE Automática */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Avaliação do Carro Usado Cadastrado
                    </span>
                  </div>
                  {usedCar && (
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-cyan-300">
                      {usedCar.brand} {usedCar.model} ({usedCar.yearModel})
                    </span>
                  )}
                </div>

                {usedCar && (
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/60 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tabela FIPE Oficial Atualizada:</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        R$ {formatMoney(usedCar.fipeValue)}
                      </span>
                    </div>
                    {formData.financial.usedCarEvaluation > 0 && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Diferença vs FIPE:</span>
                        <span className={`text-xs font-bold ${formData.financial.usedCarEvaluation >= usedCar.fipeValue ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formData.financial.usedCarEvaluation >= usedCar.fipeValue ? '+' : ''}
                          R$ {formatMoney(formData.financial.usedCarEvaluation - usedCar.fipeValue)}
                          {' '}({formatNumber(((formData.financial.usedCarEvaluation - usedCar.fipeValue) / usedCar.fipeValue) * 100, 1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Proposta de Avaliação da Concessionária para o seu Usado (R$)
                  </label>
                  <PtBrNumberInput
                    isCurrency
                    value={formData.financial.usedCarEvaluation}
                    onChange={(val) => setFormData({
                      ...formData,
                      financial: { ...formData.financial, usedCarEvaluation: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Condições de Pagamento Oferecidas */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Condições de Pagamento Oferecidas
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Insira as diversas opções da concessionária. O app calcula o valor da parcela a partir dos juros, ou a taxa a partir da parcela.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPaymentCondition}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Opção</span>
                  </button>
                </div>

                {formData.financial.paymentConditions.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500">
                    Nenhuma condição de financiamento inserida. Clique em &ldquo;Adicionar Opção&rdquo; para simular parcelas e juros.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.financial.paymentConditions.map((cond, idx) => (
                      <div
                        key={cond.id || idx}
                        className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={cond.name}
                            onChange={(e) => handleUpdatePaymentCondition(idx, { name: e.target.value })}
                            className="font-bold text-slate-900 dark:text-white text-xs bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentCondition(idx)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                            title="Remover condição"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Valor da Entrada (R$)</label>
                            <PtBrNumberInput
                              isCurrency
                              value={cond.downPayment}
                              onChange={(val) => handleUpdatePaymentCondition(idx, { downPayment: val })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Prazo (Meses)</label>
                            <PtBrNumberInput
                              value={cond.months}
                              onChange={(val) => handleUpdatePaymentCondition(idx, { months: val })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                            />
                          </div>

                          <div className="flex items-end pb-1">
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cond.useUsedCarAsDownPayment}
                                onChange={(e) => handleUpdatePaymentCondition(idx, { useUsedCarAsDownPayment: e.target.checked })}
                                className="rounded accent-blue-600"
                              />
                              <span>Somar carro usado na entrada</span>
                            </label>
                          </div>
                        </div>

                        {/* Modo de cálculo */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentCondition(idx, { mode: 'RATE_TO_INSTALLMENT' })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                cond.mode === 'RATE_TO_INSTALLMENT'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Juros (% a.m.) ➔ Calcular Parcela
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentCondition(idx, { mode: 'INSTALLMENT_TO_RATE' })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                cond.mode === 'INSTALLMENT_TO_RATE'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Parcela (R$) ➔ Calcular Juros
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">
                                {cond.mode === 'RATE_TO_INSTALLMENT' ? 'Taxa de Juros Mensal (% a.m.)' : 'Taxa Calculada (% a.m.)'}
                              </label>
                              <PtBrNumberInput
                                allowDecimals
                                decimalPlaces={2}
                                disabled={cond.mode === 'INSTALLMENT_TO_RATE'}
                                value={cond.monthlyRatePercent}
                                onChange={(val) => handleUpdatePaymentCondition(idx, { monthlyRatePercent: val })}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-cyan-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">
                                {cond.mode === 'RATE_TO_INSTALLMENT' ? 'Parcela Calculada (R$)' : 'Valor da Parcela (R$)'}
                              </label>
                              <PtBrNumberInput
                                isCurrency
                                disabled={cond.mode === 'RATE_TO_INSTALLMENT'}
                                value={cond.installmentValue}
                                onChange={(val) => handleUpdatePaymentCondition(idx, { installmentValue: val })}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                            <span>Saldo Financiado: <strong>R$ {formatMoney(cond.financedAmount)}</strong></span>
                            <span>Total de Juros: <strong>R$ {formatMoney(cond.totalInterest)}</strong></span>
                            <span>Total Pago a Prazo: <strong>R$ {formatMoney(cond.totalPaid)}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 3: Espaço & ISOFIX */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Critério de Decisão Familiar (Passageiros & ISOFIX)
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    elimCheck.isEliminated
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      : (elimCheck.isPendingMeasurement
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300')
                  }`}>
                    {elimCheck.isEliminated ? 'Descartado' : (elimCheck.isPendingMeasurement ? 'Medição Pendente' : 'Aprovado')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  • Até 4 passageiros: descartado.<br />
                  • A partir de 5 passageiros: a distância ISOFIX precisa ser maior ou igual a 45,00 cm para passar.<br />
                  • Acima de 5 passageiros: passa com qualquer distância de ISOFIX.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 dark:text-slate-400 font-medium">
                      Distância entre ISOFIX Internos (cm)
                    </label>
                    <span className="text-[10px] text-slate-400">Pode ficar em branco</span>
                  </div>
                  <PtBrNumberInput
                    allowNull
                    allowDecimals
                    decimalPlaces={1}
                    value={formData.familySpace.isofixDistanceCm}
                    onChange={(val) => setFormData({
                      ...formData,
                      familySpace: { ...formData.familySpace, isofixDistanceCm: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formData.familySpace.isofixDistanceCm === null
                      ? 'Nenhuma estimativa oficial. Medição pendente com fita métrica no showroom.'
                      : `Medição informada: ${formatNumber(formData.familySpace.isofixDistanceCm, 2)} cm`}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Quantidade de Passageiros (sem cadeirinha) *
                  </label>
                  <select
                    value={formData.familySpace.passengerCapacity}
                    onChange={(e) => setFormData({
                      ...formData,
                      familySpace: { ...formData.familySpace, passengerCapacity: Number(e.target.value) },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={4}>4 passageiros (Descartado pelo critério familiar)</option>
                    <option value={5}>5 passageiros (Requer ISOFIX ≥ 45,00 cm)</option>
                    <option value={6}>6 passageiros (Aprovado com qualquer distância)</option>
                    <option value={7}>7 passageiros (Aprovado com qualquer distância)</option>
                  </select>
                </div>
              </div>

              {/* Dimensões e Peso com Comparativo */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Dimensões e Peso (Comparativo com Carro Usado)
                  </h3>
                  {usedCar && (
                    <span className="text-[11px] text-slate-500">
                      Usado: {usedCar.brand} {usedCar.model}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      Comprimento (mm)
                    </label>
                    <PtBrNumberInput
                      value={formData.familySpace.lengthMm}
                      onChange={(val) => setFormData({
                        ...formData,
                        familySpace: { ...formData.familySpace, lengthMm: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                    {usedCar && (
                      <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                        {compareDimensions(formData.familySpace.lengthMm, usedCar.lengthMm).text}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      Largura (mm)
                    </label>
                    <PtBrNumberInput
                      value={formData.familySpace.widthMm}
                      onChange={(val) => setFormData({
                        ...formData,
                        familySpace: { ...formData.familySpace, widthMm: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                    {usedCar && (
                      <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                        {compareDimensions(formData.familySpace.widthMm, usedCar.widthMm).text}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      Entre-eixos (mm)
                    </label>
                    <PtBrNumberInput
                      value={formData.familySpace.wheelbaseMm}
                      onChange={(val) => setFormData({
                        ...formData,
                        familySpace: { ...formData.familySpace, wheelbaseMm: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                    {usedCar && (
                      <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                        {compareDimensions(formData.familySpace.wheelbaseMm, usedCar.wheelbaseMm).text}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      Peso (kg)
                    </label>
                    <PtBrNumberInput
                      value={formData.familySpace.weightKg}
                      onChange={(val) => setFormData({
                        ...formData,
                        familySpace: { ...formData.familySpace, weightKg: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                    {usedCar && (
                      <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                        {compareDimensions(formData.familySpace.weightKg, usedCar.weightKg, 'kg').text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 4: Porta-malas & Praticidade */}
          {/* ========================================================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Volume do Porta-malas (Litros)
                </label>
                <PtBrNumberInput
                  value={formData.trunk.volumeLiters}
                  onChange={(val) => setFormData({
                    ...formData,
                    trunk: { ...formData.trunk, volumeLiters: val },
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {usedCar?.trunkVolumeLiters && (
                  <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                    {compareDimensions(formData.trunk.volumeLiters, usedCar.trunkVolumeLiters, 'L').text}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Kit Reparo / Estepe
                </label>
                <select
                  value={formData.trunk.spareTireKit}
                  onChange={(e) => setFormData({
                    ...formData,
                    trunk: { ...formData.trunk, spareTireKit: e.target.value as any },
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Kit reparo">Kit de reparo (selante + compressor)</option>
                  <option value="Estepe temporário">Estepe temporário (fino)</option>
                  <option value="Estepe convencional">Estepe integral (mesma medida)</option>
                  <option value="Sem estepe">Sem estepe / Sem kit</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Abertura Elétrica do Porta-malas
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Tampa traseira com acionamento elétrico por botão ou chave
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.trunk.electricTailgate}
                  onChange={(e) => setFormData({
                    ...formData,
                    trunk: { ...formData.trunk, electricTailgate: e.target.checked },
                  })}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 5: Motorização & Bateria */}
          {/* ========================================================= */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Potência Total (cv)
                  </label>
                  <PtBrNumberInput
                    value={formData.powertrainSpec.totalPowerHp}
                    onChange={(val) => setFormData({
                      ...formData,
                      powertrainSpec: { ...formData.powertrainSpec, totalPowerHp: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                  {usedCar?.powerHp && (
                    <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                      {compareDimensions(formData.powertrainSpec.totalPowerHp, usedCar.powerHp, 'cv').text}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Torque (kgfm)
                  </label>
                  <PtBrNumberInput
                    allowDecimals
                    decimalPlaces={1}
                    value={formData.powertrainSpec.torqueKgfm}
                    onChange={(val) => setFormData({
                      ...formData,
                      powertrainSpec: { ...formData.powertrainSpec, torqueKgfm: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    0-100 km/h (s)
                  </label>
                  <PtBrNumberInput
                    allowDecimals
                    decimalPlaces={1}
                    value={formData.powertrainSpec.zeroToHundredSeconds}
                    onChange={(val) => setFormData({
                      ...formData,
                      powertrainSpec: { ...formData.powertrainSpec, zeroToHundredSeconds: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                  {usedCar?.zeroToHundredSeconds && (
                    <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                      {compareDimensions(formData.powertrainSpec.zeroToHundredSeconds, usedCar.zeroToHundredSeconds, 's').text}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Autonomia Total (km)
                  </label>
                  <PtBrNumberInput
                    value={formData.powertrainSpec.totalRangeKm}
                    onChange={(val) => setFormData({
                      ...formData,
                      powertrainSpec: { ...formData.powertrainSpec, totalRangeKm: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Tração
                  </label>
                  <select
                    value={formData.powertrainSpec.drivetrain}
                    onChange={(e) => setFormData({
                      ...formData,
                      powertrainSpec: { ...formData.powertrainSpec, drivetrain: e.target.value as any },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="FWD">Dianteira (FWD)</option>
                    <option value="AWD">Integral / 4x4 (AWD)</option>
                    <option value="RWD">Traseira (RWD)</option>
                  </select>
                </div>
              </div>

              {/* Dados de Eletrificação e Bateria */}
              <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/30 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Dados de Eletrificação e Bateria
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Capacidade da Bateria (kWh)
                    </label>
                    <PtBrNumberInput
                      allowDecimals
                      decimalPlaces={1}
                      value={formData.powertrainSpec.batteryKwh}
                      onChange={(val) => setFormData({
                        ...formData,
                        powertrainSpec: { ...formData.powertrainSpec, batteryKwh: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Autonomia Elétrica (km)
                    </label>
                    <PtBrNumberInput
                      value={formData.powertrainSpec.electricRangeKm}
                      onChange={(val) => setFormData({
                        ...formData,
                        powertrainSpec: { ...formData.powertrainSpec, electricRangeKm: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 6: Consumo & Segurança */}
          {/* ========================================================= */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Consumo Cidade (km/l)
                  </label>
                  <PtBrNumberInput
                    allowDecimals
                    decimalPlaces={1}
                    value={formData.consumption.urbanKmL}
                    onChange={(val) => setFormData({
                      ...formData,
                      consumption: { ...formData.consumption, urbanKmL: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                  {usedCar?.urbanGasolineKmL && (
                    <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                      {compareDimensions(formData.consumption.urbanKmL, usedCar.urbanGasolineKmL, 'km/l').text}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Consumo Estrada (km/l)
                  </label>
                  <PtBrNumberInput
                    allowDecimals
                    decimalPlaces={1}
                    value={formData.consumption.highwayKmL}
                    onChange={(val) => setFormData({
                      ...formData,
                      consumption: { ...formData.consumption, highwayKmL: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                  {usedCar?.highwayGasolineKmL && (
                    <p className="text-[10px] text-blue-600 dark:text-cyan-400 mt-1 font-medium">
                      {compareDimensions(formData.consumption.highwayKmL, usedCar.highwayGasolineKmL, 'km/l').text}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Quantidade de Airbags
                  </label>
                  <PtBrNumberInput
                    value={formData.safety.airbagsCount}
                    onChange={(val) => setFormData({
                      ...formData,
                      safety: { ...formData.safety, airbagsCount: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Itens de Segurança
                </span>

                <div className="space-y-2">
                  <label className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold block text-slate-900 dark:text-white">ADAS (Assistência Avançada ao Condutor)</span>
                      <span className="text-[11px] text-slate-500">Frenagem autônoma, piloto adaptativo, centralização de faixa</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.safety.hasAdas}
                      onChange={(e) => setFormData({
                        ...formData,
                        safety: { ...formData.safety, hasAdas: e.target.checked },
                      })}
                      className="w-5 h-5 accent-blue-600"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold block text-slate-900 dark:text-white">Alerta de Ponto Cego (BSM)</span>
                      <span className="text-[11px] text-slate-500">Detecção de veículos nos espelhos retrovisores</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.safety.hasBlindSpotAlert}
                      onChange={(e) => setFormData({
                        ...formData,
                        safety: { ...formData.safety, hasBlindSpotAlert: e.target.checked },
                      })}
                      className="w-5 h-5 accent-blue-600"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold block text-slate-900 dark:text-white">Câmera 360º</span>
                      <span className="text-[11px] text-slate-500">Visão panorâmica para manobras seguras</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.safety.hasCamera360}
                      onChange={(e) => setFormData({
                        ...formData,
                        safety: { ...formData.safety, hasCamera360: e.target.checked },
                      })}
                      className="w-5 h-5 accent-blue-600"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 7: Conforto, Custos & Garantia */}
          {/* ========================================================= */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Garantia Geral (Anos)
                  </label>
                  <PtBrNumberInput
                    value={formData.warrantyCosts.generalWarrantyYears}
                    onChange={(val) => setFormData({
                      ...formData,
                      warrantyCosts: { ...formData.warrantyCosts, generalWarrantyYears: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Garantia da Bateria (Anos)
                  </label>
                  <PtBrNumberInput
                    value={formData.warrantyCosts.batteryWarrantyYears}
                    onChange={(val) => setFormData({
                      ...formData,
                      warrantyCosts: { ...formData.warrantyCosts, batteryWarrantyYears: val },
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Custos TCO (3 Anos) */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Custos Financeiros e TCO (3 Anos)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      IPVA Anual (R$) (Bahia: 2,5%)
                    </label>
                    <PtBrNumberInput
                      isCurrency
                      value={formData.warrantyCosts.ipvaAnnual}
                      onChange={(val) => setFormData({
                        ...formData,
                        warrantyCosts: { ...formData.warrantyCosts, ipvaAnnual: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      Seguro Anual Estimado (R$)
                    </label>
                    <PtBrNumberInput
                      isCurrency
                      value={formData.warrantyCosts.insuranceAnnual}
                      onChange={(val) => setFormData({
                        ...formData,
                        warrantyCosts: { ...formData.warrantyCosts, insuranceAnnual: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      Revisões Acumuladas em 3 Anos (R$)
                    </label>
                    <PtBrNumberInput
                      isCurrency
                      value={formData.warrantyCosts.revisions3Years}
                      onChange={(val) => setFormData({
                        ...formData,
                        warrantyCosts: { ...formData.warrantyCosts, revisions3Years: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5 font-medium">
                      Consumo 3 Anos (Combustível + Eletricidade) (R$)
                    </label>
                    <PtBrNumberInput
                      isCurrency
                      value={formData.warrantyCosts.consumption3Years}
                      onChange={(val) => setFormData({
                        ...formData,
                        warrantyCosts: { ...formData.warrantyCosts, consumption3Years: val },
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Itens de Conforto e Tecnologia */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Itens de Conforto e Tecnologia
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-900 dark:text-white">Bancos Elétricos</span>
                    <input
                      type="checkbox"
                      checked={formData.comfortTech.electricSeats}
                      onChange={(e) => setFormData({
                        ...formData,
                        comfortTech: { ...formData.comfortTech, electricSeats: e.target.checked },
                      })}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </label>

                  <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-900 dark:text-white">Saída de Ar Traseira</span>
                    <input
                      type="checkbox"
                      checked={formData.comfortTech.rearAirVents}
                      onChange={(e) => setFormData({
                        ...formData,
                        comfortTech: { ...formData.comfortTech, rearAirVents: e.target.checked },
                      })}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </label>

                  <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-900 dark:text-white">CarPlay sem Fio</span>
                    <input
                      type="checkbox"
                      checked={formData.comfortTech.carPlayWireless}
                      onChange={(e) => setFormData({
                        ...formData,
                        comfortTech: { ...formData.comfortTech, carPlayWireless: e.target.checked },
                      })}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </label>

                  <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-900 dark:text-white">Teto Panorâmico</span>
                    <input
                      type="checkbox"
                      checked={formData.comfortTech.panoramicSunroof}
                      onChange={(e) => setFormData({
                        ...formData,
                        comfortTech: { ...formData.comfortTech, panoramicSunroof: e.target.checked },
                      })}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-white/50 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < totalSteps && (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <span>Avançar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Veículo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
