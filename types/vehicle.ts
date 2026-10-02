export type PowertrainType = 'HEV' | 'PHEV' | 'REEV' | 'MHEV' | 'BEV' | 'Combustão';

export type VehicleStatus = 
  | 'Quero visitar' 
  | 'Visitei' 
  | 'Testado' 
  | 'Aguardando proposta' 
  | 'Finalista' 
  | 'Eliminado' 
  | 'Comprado';

export interface PaymentCondition {
  id: string;
  name: string; // Ex: "Entrada 50% + 24x Taxa Zero", "Financiamento 36x Loja"
  downPayment: number;
  useUsedCarAsDownPayment: boolean;
  financedAmount: number;
  months: number;
  mode: 'RATE_TO_INSTALLMENT' | 'INSTALLMENT_TO_RATE';
  monthlyRatePercent: number; // % a.m.
  installmentValue: number; // R$ parcela
  totalPaid: number;
  totalInterest: number;
}

export interface RegisteredUsedCar {
  brand: string;
  model: string;
  version: string;
  yearModel: number;
  fipeValue: number; // Tabela FIPE atualizada (R$)
  lengthMm: number; // Comprimento (mm)
  widthMm: number; // Largura (mm)
  wheelbaseMm: number; // Entre-eixos (mm)
  weightKg: number; // Peso (kg)
  trunkVolumeLiters?: number; // Volume Porta-Malas (L)
  zeroToHundredSeconds?: number; // 0-100 km/h (s)
  powerHp?: number; // Potência (cv)
  torqueKgfm?: number; // Torque (kgfm)
  totalRangeKm?: number; // Autonomia total (km)
  airbagsCount?: number; // Quantidade de airbags
  urbanGasolineKmL?: number; // Consumo (Gasolina) Urbano / Cidade (km/l)
  highwayGasolineKmL?: number; // Consumo (Gasolina) Estrada / Rodovia (km/l)
  tco3Years?: number; // TCO 3 anos (R$)
  fipeLastUpdated?: string;
}

export interface Vehicle {
  id: string;

  // 1. Identificação & Concessionária
  brand: string;
  model: string;
  version: string; // Versão (sem o texto "Completa")
  powertrain: PowertrainType; // Motorização
  status: VehicleStatus;
  yearManufacture: number;
  yearModel: number;
  dealership: string;
  sellerName?: string;
  notes?: string;

  // 2. Preço & Negociação
  financial: {
    tablePrice: number; // Preço de tabela
    storePrice: number; // Preço da Loja
    usedCarEvaluation: number; // Avaliação do usado
    paymentConditions: PaymentCondition[]; // Diversas opções oferecidas
  };

  // 3. Espaço & ISOFIX
  familySpace: {
    isofixDistanceCm: number | null; // Distância entre pontos ISOFIX internos (pode ficar em branco até o preenchimento)
    passengerCapacity: number; // Quantidade de passageiros (sem cadeirinha)
    lengthMm: number; // Comprimento (mm)
    widthMm: number; // Largura (mm)
    wheelbaseMm: number; // Entre eixos (mm)
    weightKg: number; // Peso (kg)
  };

  // 4. Porta-malas & Praticidade
  trunk: {
    volumeLiters: number; // Volume porta malas
    spareTireKit: 'Kit reparo' | 'Estepe temporário' | 'Estepe convencional' | 'Sem estepe';
    electricTailgate: boolean; // Abertura elétrica
  };

  // 5. Motorização & Bateria
  powertrainSpec: {
    totalPowerHp: number; // Potência Total (cv)
    torqueKgfm: number; // Torque (kgfm)
    zeroToHundredSeconds: number; // 0-100 km/h (s)
    totalRangeKm: number; // Autonomia total (km)
    drivetrain: 'FWD' | 'AWD' | 'RWD'; // Tração
    batteryKwh?: number; // Capacidade (kWh)
    electricRangeKm?: number; // Autonomia Elétrica (km)
  };

  // 6. Consumo & Segurança
  consumption: {
    urbanKmL: number; // Consumo cidade (km/l)
    highwayKmL: number; // Consumo estrada (km/l)
  };
  safety: {
    airbagsCount: number; // Quantidade airbags
    hasAdas: boolean; // ADAS
    hasBlindSpotAlert: boolean; // Alerta Ponto Cego
    hasCamera360: boolean; // Câmera 360º
  };

  // 7. Conforto, Custos & Garantia
  warrantyCosts: {
    generalWarrantyYears: number; // Garantia geral (anos)
    batteryWarrantyYears: number; // Garantia bateria (anos)
    ipvaAnnual: number; // IPVA anual (R$)
    insuranceAnnual: number; // Seguro anual (R$)
    revisions3Years: number; // Revisões 3 anos (R$)
    consumption3Years: number; // Consumo 3 anos (combustível + eletricidade) (R$)
  };
  comfortTech: {
    electricSeats: boolean; // Bancos elétricos
    rearAirVents: boolean; // Saída de ar traseira
    carPlayWireless: boolean; // CarPlay sem fio
    panoramicSunroof: boolean; // Teto panorâmico
  };

  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  isofixMinDistanceCm: number; // default 45
  autoEliminateIncompatible: boolean;
  excludeBEV: boolean;
  
  annualKm: number; // default 15000
  urbanSharePercent: number; // default 75
  gasolinePricePerLiter: number; // R$ 6.20
  ethanolPricePerLiter: number; // R$ 4.10
  electricityPricePerKwh: number; // R$ 0.95
  selectedState: string; // 'BA'
  ipvaRatePercent: number; // 2.5% na Bahia
  tcoYearsPeriod: 3; // TCO simplificado de 3 anos
  
  usedCar: RegisteredUsedCar; // Carro usado cadastrado para comparativo e tabela FIPE
  
  weights: {
    familySpace: number; // 30
    tco: number; // 20
    safety: number; // 15
    powertrainEfficiency: number; // 10
    comfort: number; // 10
    warrantyResale: number; // 10
    technology: number; // 5
  };
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  annualKm: number;
  urbanSharePercent: number;
  gasolinePrice: number;
  electricityPrice: number;
}
