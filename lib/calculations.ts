import { Vehicle, UserPreferences, PaymentCondition, RegisteredUsedCar } from '@/types/vehicle';

export type IsofixRating = 'Pendente' | 'Crítico' | 'Limítrofe' | 'Viável' | 'Bom' | 'Excelente';

export function formatMoney(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0,00';
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return rounded.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(val: number, decimals: number = 2): string {
  if (isNaN(val) || val === null || val === undefined) return '0,00';
  const factor = Math.pow(10, decimals);
  const rounded = Math.round((val + Number.EPSILON) * factor) / factor;
  return rounded.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function getIsofixRating(distanceCm: number | null | undefined): {
  rating: IsofixRating;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  description: string;
} {
  if (distanceCm === null || distanceCm === undefined || isNaN(distanceCm) || distanceCm === 0) {
    return {
      rating: 'Pendente',
      colorClass: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      badgeText: 'text-amber-800 dark:text-amber-300',
      description: 'Medição pendente de realização presencial na concessionária.',
    };
  }
  if (distanceCm < 43) {
    return {
      rating: 'Crítico',
      colorClass: 'text-red-700 dark:text-red-400',
      badgeBg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
      badgeText: 'text-red-800 dark:text-red-300',
      description: 'Espaço insuficiente para 2 cadeirinhas + adulto no centro.',
    };
  }
  if (distanceCm < 45) {
    return {
      rating: 'Limítrofe',
      colorClass: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      badgeText: 'text-amber-800 dark:text-amber-300',
      description: 'Abaixo do mínimo recomendado (45 cm). Aperto severo para passageiro central.',
    };
  }
  if (distanceCm < 47) {
    return {
      rating: 'Viável',
      colorClass: 'text-emerald-700 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      badgeText: 'text-emerald-800 dark:text-emerald-300',
      description: 'Atende ao requisito familiar mínimo (≥ 45 cm) com conforto aceitável.',
    };
  }
  if (distanceCm < 50) {
    return {
      rating: 'Bom',
      colorClass: 'text-blue-700 dark:text-blue-400',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      badgeText: 'text-blue-800 dark:text-blue-300',
      description: 'Acomodação confortável para adulto e cadeirinhas laterais.',
    };
  }
  return {
    rating: 'Excelente',
    colorClass: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    badgeText: 'text-cyan-800 dark:text-cyan-200',
    description: 'Espaço traseiro amplo de referência para uso familiar com 3 ocupantes.',
  };
}

export interface EliminationCheckResult {
  isEliminated: boolean;
  isPendingMeasurement: boolean;
  reason?: string;
  passedRequirements: string[];
  failedRequirements: string[];
}

export function checkElimination(
  vehicle: Vehicle,
  settings: UserPreferences
): EliminationCheckResult {
  const passedRequirements: string[] = [];
  const failedRequirements: string[] = [];
  let isPendingMeasurement = false;

  // 1. BEV Check (se ativado nas preferências)
  if (settings.excludeBEV && vehicle.powertrain === 'BEV') {
    failedRequirements.push('Veículo 100% elétrico (BEV) desativado nas preferências');
  } else {
    passedRequirements.push('Motorização elegível');
  }

  // 2. Regra de Passageiros & ISOFIX:
  // Se for até 4: tá descartado.
  // A partir de 5: a distância precisa ser maior ou igual a 45cm, aí passa.
  // Se for acima de 5 passageiros passa com qualquer distância de ISOFIX.
  const passengers = vehicle.familySpace?.passengerCapacity ?? 5;
  const isofixDist = vehicle.familySpace?.isofixDistanceCm;

  if (passengers <= 4) {
    failedRequirements.push(`Descartado: Capacidade de até 4 passageiros (${passengers} lugares)`);
  } else if (passengers === 5) {
    if (isofixDist === null || isofixDist === undefined || isNaN(isofixDist) || isofixDist === 0) {
      isPendingMeasurement = true;
      passedRequirements.push('Aguardando medição presencial do ISOFIX na concessionária (requer ≥ 45,00 cm)');
    } else if (isofixDist < 45) {
      failedRequirements.push(`Descartado: Distância ISOFIX de ${formatNumber(isofixDist, 2)} cm é inferior a 45,00 cm`);
    } else {
      passedRequirements.push(`Aprovado: 5 passageiros com ISOFIX ≥ 45,00 cm (${formatNumber(isofixDist, 2)} cm)`);
    }
  } else {
    // Acima de 5 passageiros (ex: 6 ou 7 lugares): passa com qualquer distância ISOFIX
    passedRequirements.push(`Aprovado: Acima de 5 passageiros (${passengers} lugares)`);
  }

  const isEliminated = failedRequirements.length > 0;

  return {
    isEliminated,
    isPendingMeasurement,
    reason: failedRequirements.length > 0 
      ? failedRequirements[0] 
      : (isPendingMeasurement ? 'Medição de ISOFIX pendente na concessionária' : undefined),
    passedRequirements,
    failedRequirements,
  };
}

export function calculatePaymentOption(
  storePrice: number,
  downPayment: number,
  usedCarEvaluation: number,
  useUsedCarAsDownPayment: boolean,
  months: number,
  mode: 'RATE_TO_INSTALLMENT' | 'INSTALLMENT_TO_RATE',
  monthlyRatePercent: number,
  installmentValue: number
): {
  financedAmount: number;
  calculatedMonthlyRatePercent: number;
  calculatedInstallmentValue: number;
  totalPaid: number;
  totalInterest: number;
} {
  const effectiveDownPayment = downPayment + (useUsedCarAsDownPayment ? usedCarEvaluation : 0);
  const financedAmount = Math.max(0, storePrice - effectiveDownPayment);

  if (financedAmount <= 0 || months <= 0) {
    return {
      financedAmount: 0,
      calculatedMonthlyRatePercent: 0,
      calculatedInstallmentValue: 0,
      totalPaid: effectiveDownPayment,
      totalInterest: 0,
    };
  }

  if (mode === 'RATE_TO_INSTALLMENT') {
    const i = monthlyRatePercent / 100;
    let pmt = 0;
    if (i <= 0.00001) {
      pmt = financedAmount / months;
    } else {
      const factor = Math.pow(1 + i, months);
      pmt = financedAmount * ((i * factor) / (factor - 1));
    }
    const roundedPmt = Math.round((pmt + Number.EPSILON) * 100) / 100;
    const totalFinancedPaid = roundedPmt * months;
    const totalPaid = effectiveDownPayment + totalFinancedPaid;
    const totalInterest = Math.max(0, totalFinancedPaid - financedAmount);

    return {
      financedAmount,
      calculatedMonthlyRatePercent: monthlyRatePercent,
      calculatedInstallmentValue: roundedPmt,
      totalPaid,
      totalInterest,
    };
  } else {
    // Mode: INSTALLMENT_TO_RATE (Calcular taxa de juros a partir do valor da parcela)
    const pmt = installmentValue;
    const totalFinancedPaid = pmt * months;
    const totalPaid = effectiveDownPayment + totalFinancedPaid;
    const totalInterest = Math.max(0, totalFinancedPaid - financedAmount);

    if (totalFinancedPaid <= financedAmount) {
      return {
        financedAmount,
        calculatedMonthlyRatePercent: 0,
        calculatedInstallmentValue: pmt,
        totalPaid,
        totalInterest: 0,
      };
    }

    // Bisection search for implicit monthly interest rate
    let low = 0;
    let high = 0.50; // up to 50% per month
    let rate = 0;
    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      const factor = Math.pow(1 + mid, months);
      const estPmt = financedAmount * ((mid * factor) / (factor - 1));
      if (estPmt < pmt) {
        low = mid;
      } else {
        high = mid;
      }
      rate = mid;
    }
    const ratePercent = Math.round((rate * 100 + Number.EPSILON) * 100) / 100;

    return {
      financedAmount,
      calculatedMonthlyRatePercent: ratePercent,
      calculatedInstallmentValue: pmt,
      totalPaid,
      totalInterest,
    };
  }
}

export function compareDimensions(
  candidateVal: number,
  usedCarVal: number,
  unit: string = 'mm'
): {
  diff: number;
  percentDiff: number;
  text: string;
  isPositive: boolean;
  isEqual: boolean;
} {
  const diff = candidateVal - usedCarVal;
  const percentDiff = usedCarVal > 0 ? (diff / usedCarVal) * 100 : 0;
  const sign = diff > 0 ? '+' : '';
  const text = diff === 0
    ? `Igual ao usado (${formatNumber(usedCarVal, 0)} ${unit})`
    : `${sign}${formatNumber(diff, 0)} ${unit} (${sign}${formatNumber(percentDiff, 1)}%) vs usado`;

  return {
    diff,
    percentDiff,
    text,
    isPositive: diff > 0,
    isEqual: diff === 0,
  };
}

export interface SimplifiedTCOResult {
  periodYears: 3;
  totalTCO: number;
  annualTCO: number;
  monthlyTCO: number;
  breakdown: {
    ipva3Years: number;
    insurance3Years: number;
    revisions3Years: number;
    consumption3Years: number;
  };
  calculationMemory: string[];
}

export function calculateTCO(
  vehicle: Vehicle,
  settings: UserPreferences
): SimplifiedTCOResult {
  const storePrice = vehicle.financial.storePrice || vehicle.financial.tablePrice || 0;
  const ipvaRate = (settings.ipvaRatePercent ?? 2.5) / 100;

  // 1. IPVA 3 anos (padrão Bahia 2,5%)
  const ipvaAnnual = vehicle.warrantyCosts.ipvaAnnual > 0 
    ? vehicle.warrantyCosts.ipvaAnnual 
    : storePrice * ipvaRate;
  const ipva3Years = ipvaAnnual * 3;

  // 2. Seguro 3 anos
  const insuranceAnnual = vehicle.warrantyCosts.insuranceAnnual > 0 
    ? vehicle.warrantyCosts.insuranceAnnual 
    : storePrice * 0.035;
  const insurance3Years = insuranceAnnual * 3;

  // 3. Revisões 3 anos
  const revisions3Years = vehicle.warrantyCosts.revisions3Years || 0;

  // 4. Consumo 3 anos (combustível + eletricidade)
  let consumption3Years = vehicle.warrantyCosts.consumption3Years || 0;
  if (consumption3Years <= 0) {
    // Estimativa se não preenchido diretamente
    const annualKm = settings.annualKm || 15000;
    const urbanKm = annualKm * ((settings.urbanSharePercent || 75) / 100);
    const roadKm = annualKm - urbanKm;
    const gasPrice = settings.gasolinePricePerLiter || 6.20;
    const urbanKmL = vehicle.consumption.urbanKmL || 12;
    const highwayKmL = vehicle.consumption.highwayKmL || 13;
    const annualLiters = (urbanKm / urbanKmL) + (roadKm / highwayKmL);
    const annualFuel = annualLiters * gasPrice;
    consumption3Years = Math.round((annualFuel * 3 + Number.EPSILON) * 100) / 100;
  }

  const totalTCO = Math.round((ipva3Years + insurance3Years + revisions3Years + consumption3Years + Number.EPSILON) * 100) / 100;
  const annualTCO = Math.round((totalTCO / 3 + Number.EPSILON) * 100) / 100;
  const monthlyTCO = Math.round((totalTCO / 36 + Number.EPSILON) * 100) / 100;

  const memory: string[] = [
    `IPVA 3 anos (Alíquota Bahia ${(ipvaRate * 100).toFixed(1)}%): R$ ${formatMoney(ipva3Years)} (R$ ${formatMoney(ipvaAnnual)}/ano)`,
    `Seguro 3 anos: R$ ${formatMoney(insurance3Years)} (R$ ${formatMoney(insuranceAnnual)}/ano)`,
    `Revisões programadas em 3 anos: R$ ${formatMoney(revisions3Years)}`,
    `Consumo estimado em 3 anos (combustível + eletricidade): R$ ${formatMoney(consumption3Years)}`,
  ];

  return {
    periodYears: 3,
    totalTCO,
    annualTCO,
    monthlyTCO,
    breakdown: {
      ipva3Years,
      insurance3Years,
      revisions3Years,
      consumption3Years,
    },
    calculationMemory: memory,
  };
}

export interface CategoryScores {
  familySpace: number; // 0 - 100
  tco: number; // 0 - 100
  safety: number; // 0 - 100
  powertrainEfficiency: number; // 0 - 100
  comfort: number; // 0 - 100
  warrantyResale: number; // 0 - 100
  technology: number; // 0 - 100
  finalWeightedScore: number;
}

export function calculateCategoryScores(
  vehicle: Vehicle,
  settings: UserPreferences
): CategoryScores {
  // 1. ESPAÇO & ISOFIX
  const isofixDist = vehicle.familySpace.isofixDistanceCm;
  const passengers = vehicle.familySpace.passengerCapacity || 5;
  let familySpaceScore = 50;

  if (passengers > 5) {
    familySpaceScore = 95;
  } else if (isofixDist !== null && isofixDist !== undefined && isofixDist > 0) {
    if (isofixDist >= 50) familySpaceScore = 100;
    else if (isofixDist >= 48) familySpaceScore = 90;
    else if (isofixDist >= 45) familySpaceScore = 75;
    else familySpaceScore = 30;
  } else {
    familySpaceScore = 60; // Pendente de medição
  }

  // 2. TCO (3 ANOS)
  const tco = calculateTCO(vehicle, settings);
  // Benchmark de R$ 30k a R$ 80k para 3 anos de TCO
  const tcoScore = Math.max(10, Math.min(100, Math.round(100 - ((tco.totalTCO - 30000) / 50000) * 80)));

  // 3. SEGURANÇA
  let safetyScore = 50;
  if (vehicle.safety.airbagsCount >= 7) safetyScore += 20;
  else if (vehicle.safety.airbagsCount >= 6) safetyScore += 15;
  if (vehicle.safety.hasAdas) safetyScore += 15;
  if (vehicle.safety.hasBlindSpotAlert) safetyScore += 10;
  if (vehicle.safety.hasCamera360) safetyScore += 5;
  safetyScore = Math.min(100, safetyScore);

  // 4. MOTORIZAÇÃO & EFICIÊNCIA
  let powScore = 50;
  if (vehicle.powertrainSpec.totalPowerHp >= 200) powScore += 20;
  else if (vehicle.powertrainSpec.totalPowerHp >= 150) powScore += 10;
  if (vehicle.powertrainSpec.zeroToHundredSeconds > 0 && vehicle.powertrainSpec.zeroToHundredSeconds <= 8.5) powScore += 15;
  if (vehicle.powertrain === 'PHEV' || vehicle.powertrain === 'HEV') powScore += 15;
  powScore = Math.min(100, powScore);

  // 5. CONFORTO
  let comfortScore = 40;
  if (vehicle.comfortTech.electricSeats) comfortScore += 15;
  if (vehicle.comfortTech.rearAirVents) comfortScore += 15;
  if (vehicle.comfortTech.panoramicSunroof) comfortScore += 15;
  if (vehicle.trunk.electricTailgate) comfortScore += 15;
  comfortScore = Math.min(100, comfortScore);

  // 6. GARANTIA & CUSTOS
  let warrantyScore = 50;
  if (vehicle.warrantyCosts.generalWarrantyYears >= 5) warrantyScore += 25;
  else if (vehicle.warrantyCosts.generalWarrantyYears >= 3) warrantyScore += 15;
  if (vehicle.warrantyCosts.batteryWarrantyYears >= 8) warrantyScore += 25;
  warrantyScore = Math.min(100, warrantyScore);

  // 7. TECNOLOGIA
  let techScore = 50;
  if (vehicle.comfortTech.carPlayWireless) techScore += 25;
  if (vehicle.safety.hasCamera360) techScore += 25;
  techScore = Math.min(100, techScore);

  const w = settings.weights;
  const totalWeight =
    w.familySpace +
    w.tco +
    w.safety +
    w.powertrainEfficiency +
    w.comfort +
    w.warrantyResale +
    w.technology;

  const weightedSum =
    familySpaceScore * w.familySpace +
    tcoScore * w.tco +
    safetyScore * w.safety +
    powScore * w.powertrainEfficiency +
    comfortScore * w.comfort +
    warrantyScore * w.warrantyResale +
    techScore * w.technology;

  const finalWeightedScore = Math.round(((weightedSum / totalWeight) + Number.EPSILON) * 10) / 10;

  return {
    familySpace: familySpaceScore,
    tco: tcoScore,
    safety: safetyScore,
    powertrainEfficiency: powScore,
    comfort: comfortScore,
    warrantyResale: warrantyScore,
    technology: techScore,
    finalWeightedScore,
  };
}

export interface PositionExplanation {
  headline: string;
  comparativeNote: string;
  strengths: string[];
  weaknesses: string[];
}

export function generatePositionExplanation(
  vehicle: Vehicle,
  scores: CategoryScores,
  allVehicles: Vehicle[],
  settings: UserPreferences
): PositionExplanation {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (vehicle.familySpace.passengerCapacity > 5) {
    strengths.push(`Capacidade ampliada para ${vehicle.familySpace.passengerCapacity} passageiros`);
  } else if (vehicle.familySpace.isofixDistanceCm && vehicle.familySpace.isofixDistanceCm >= 45) {
    strengths.push(`Espaço ISOFIX de ${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm atende ao requisito familiar (≥ 45,00 cm)`);
  }

  if (vehicle.powertrain === 'PHEV' || vehicle.powertrain === 'HEV') {
    strengths.push(`Eficiência de motorização ${vehicle.powertrain} com baixo consumo urbano`);
  }

  if (vehicle.safety.hasAdas) {
    strengths.push('Pacote completo de segurança ADAS');
  }

  if (vehicle.financial.storePrice <= 220000) {
    strengths.push(`Preço da loja competitivo (R$ ${formatMoney(vehicle.financial.storePrice)})`);
  }

  if (vehicle.familySpace.isofixDistanceCm === null) {
    weaknesses.push('Medição presencial da fita métrica pendente no showroom');
  } else if (vehicle.familySpace.isofixDistanceCm < 45 && vehicle.familySpace.passengerCapacity <= 5) {
    weaknesses.push(`Distância ISOFIX restrita (${formatNumber(vehicle.familySpace.isofixDistanceCm, 2)} cm)`);
  }

  if (vehicle.warrantyCosts.generalWarrantyYears < 5) {
    weaknesses.push(`Garantia geral de ${vehicle.warrantyCosts.generalWarrantyYears} anos`);
  }

  return {
    headline: `Pontuação ponderada de ${formatNumber(scores.finalWeightedScore, 1)} / 100`,
    comparativeNote: `Avaliado considerando TCO de 3 anos (IPVA BA 2,5%), dimensões vs usado e espaço familiar.`,
    strengths: strengths.length > 0 ? strengths : ['Bom equilíbrio para uso familiar'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Nenhum ponto impeditivo detectado'],
  };
}
