import * as XLSX from 'xlsx';
import { Vehicle, PowertrainType, VehicleStatus } from '@/types/vehicle';

/**
 * Mapeamento das colunas da planilha Excel para as propriedades do Meu Próximo Carro
 * Estrutura conforme os 7 blocos definidos pelo usuário.
 */
export const EXCEL_COLUMNS = [
  // 1. Identificação & Concessionária
  { header: 'ID (Não alterar ao editar)', key: 'id', width: 28 },
  { header: 'Marca*', key: 'brand', width: 14 },
  { header: 'Modelo*', key: 'model', width: 20 },
  { header: 'Versão', key: 'version', width: 24 },
  { header: 'Motorização (HEV/PHEV/REEV/MHEV/BEV/Combustão)*', key: 'powertrain', width: 22 },
  { header: 'Status*', key: 'status', width: 18 },
  { header: 'Ano Fabricação', key: 'yearManufacture', width: 14 },
  { header: 'Ano Modelo', key: 'yearModel', width: 12 },
  { header: 'Concessionária / Loja*', key: 'dealership', width: 24 },
  { header: 'Nome do Vendedor', key: 'sellerName', width: 20 },
  { header: 'Notas / Observações', key: 'notes', width: 32 },

  // 2. Preço & Negociação
  { header: 'Preço de Tabela (R$)', key: 'financial_tablePrice', width: 18 },
  { header: 'Preço da Loja (R$)*', key: 'financial_storePrice', width: 18 },
  { header: 'Avaliação do Usado (R$)', key: 'financial_usedCarEvaluation', width: 20 },

  // 3. Espaço & ISOFIX
  { header: 'Distância ISOFIX Interna (cm - medir no local)', key: 'family_isofixDistanceCm', width: 26 },
  { header: 'Qtd Passageiros sem Cadeirinha*', key: 'family_passengerCapacity', width: 24 },
  { header: 'Comprimento (mm)', key: 'family_lengthMm', width: 16 },
  { header: 'Largura (mm)', key: 'family_widthMm', width: 16 },
  { header: 'Entre-eixos (mm)', key: 'family_wheelbaseMm', width: 16 },
  { header: 'Peso (kg)', key: 'family_weightKg', width: 14 },

  // 4. Porta-malas & Praticidade
  { header: 'Volume Porta-malas (L)*', key: 'trunk_volumeLiters', width: 20 },
  { header: 'Kit Reparo ou Estepe (Kit reparo/Estepe temporário/Estepe convencional/Sem estepe)', key: 'trunk_spareTireKit', width: 28 },
  { header: 'Abertura Elétrica (Sim/Não)', key: 'trunk_electricTailgate', width: 20 },

  // 5. Motorização & Bateria
  { header: 'Potência Total (cv)*', key: 'power_totalPowerHp', width: 18 },
  { header: 'Torque (kgfm)*', key: 'power_torqueKgfm', width: 16 },
  { header: '0-100 km/h (s)', key: 'power_zeroToHundredSeconds', width: 16 },
  { header: 'Autonomia Total (km)', key: 'power_totalRangeKm', width: 18 },
  { header: 'Tração (FWD/AWD/RWD)', key: 'power_drivetrain', width: 16 },
  { header: 'Capacidade Bateria (kWh)', key: 'power_batteryKwh', width: 20 },
  { header: 'Autonomia Elétrica (km)', key: 'power_electricRangeKm', width: 20 },

  // 6. Consumo & Segurança
  { header: 'Consumo Cidade (km/l)', key: 'consumption_urbanKmL', width: 18 },
  { header: 'Consumo Estrada (km/l)', key: 'consumption_highwayKmL', width: 18 },
  { header: 'Quantidade de Airbags', key: 'safety_airbagsCount', width: 18 },
  { header: 'ADAS (Sim/Não)', key: 'safety_hasAdas', width: 16 },
  { header: 'Alerta Ponto Cego (Sim/Não)', key: 'safety_hasBlindSpotAlert', width: 20 },
  { header: 'Câmera 360º (Sim/Não)', key: 'safety_hasCamera360', width: 18 },

  // 7. Conforto, Custos & Garantia
  { header: 'Garantia Geral (anos)', key: 'warranty_generalWarrantyYears', width: 18 },
  { header: 'Garantia Bateria (anos)', key: 'warranty_batteryWarrantyYears', width: 18 },
  { header: 'IPVA Anual Estimado (R$)', key: 'warranty_ipvaAnnual', width: 20 },
  { header: 'Seguro Anual Estimado (R$)', key: 'warranty_insuranceAnnual', width: 20 },
  { header: 'Revisões 3 Anos (R$)', key: 'warranty_revisions3Years', width: 18 },
  { header: 'Consumo 3 Anos (R$)', key: 'warranty_consumption3Years', width: 18 },
  { header: 'Bancos Elétricos (Sim/Não)', key: 'comfort_electricSeats', width: 20 },
  { header: 'Saída de Ar Traseira (Sim/Não)', key: 'comfort_rearAirVents', width: 20 },
  { header: 'CarPlay Sem Fio (Sim/Não)', key: 'comfort_carPlayWireless', width: 20 },
  { header: 'Teto Panorâmico (Sim/Não)', key: 'comfort_panoramicSunroof', width: 20 },
];

function boolToText(val: boolean | undefined | null): string {
  if (val === true) return 'Sim';
  if (val === false) return 'Não';
  return 'Não';
}

function textToBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'sim' || s === 's' || s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function parseNum(val: any, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[R$\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Converte a lista de veículos em linhas prontas para o Excel
 */
export function vehiclesToExcelRows(vehicles: Vehicle[]) {
  return vehicles.map((v) => ({
    'ID (Não alterar ao editar)': v.id,
    'Marca*': v.brand || '',
    'Modelo*': v.model || '',
    'Versão': v.version || '',
    'Motorização (HEV/PHEV/REEV/MHEV/BEV/Combustão)*': v.powertrain || 'PHEV',
    'Status*': v.status || 'Quero visitar',
    'Ano Fabricação': v.yearManufacture || 2024,
    'Ano Modelo': v.yearModel || 2025,
    'Concessionária / Loja*': v.dealership || '',
    'Nome do Vendedor': v.sellerName || '',
    'Notas / Observações': v.notes || '',

    // 2. Preço & Negociação
    'Preço de Tabela (R$)': v.financial?.tablePrice ?? 0,
    'Preço da Loja (R$)*': v.financial?.storePrice ?? 0,
    'Avaliação do Usado (R$)': v.financial?.usedCarEvaluation ?? 0,

    // 3. Espaço & ISOFIX
    'Distância ISOFIX Interna (cm - medir no local)': v.familySpace?.isofixDistanceCm ?? '',
    'Qtd Passageiros sem Cadeirinha*': v.familySpace?.passengerCapacity ?? 5,
    'Comprimento (mm)': v.familySpace?.lengthMm ?? 0,
    'Largura (mm)': v.familySpace?.widthMm ?? 0,
    'Entre-eixos (mm)': v.familySpace?.wheelbaseMm ?? 0,
    'Peso (kg)': v.familySpace?.weightKg ?? 0,

    // 4. Porta-malas & Praticidade
    'Volume Porta-malas (L)*': v.trunk?.volumeLiters ?? 450,
    'Kit Reparo ou Estepe (Kit reparo/Estepe temporário/Estepe convencional/Sem estepe)': v.trunk?.spareTireKit || 'Kit reparo',
    'Abertura Elétrica (Sim/Não)': boolToText(v.trunk?.electricTailgate),

    // 5. Motorização & Bateria
    'Potência Total (cv)*': v.powertrainSpec?.totalPowerHp ?? 200,
    'Torque (kgfm)*': v.powertrainSpec?.torqueKgfm ?? 35,
    '0-100 km/h (s)': v.powertrainSpec?.zeroToHundredSeconds ?? 8.0,
    'Autonomia Total (km)': v.powertrainSpec?.totalRangeKm ?? 1000,
    'Tração (FWD/AWD/RWD)': v.powertrainSpec?.drivetrain || 'FWD',
    'Capacidade Bateria (kWh)': v.powertrainSpec?.batteryKwh ?? 0,
    'Autonomia Elétrica (km)': v.powertrainSpec?.electricRangeKm ?? 0,

    // 6. Consumo & Segurança
    'Consumo Cidade (km/l)': v.consumption?.urbanKmL ?? 15,
    'Consumo Estrada (km/l)': v.consumption?.highwayKmL ?? 14,
    'Quantidade de Airbags': v.safety?.airbagsCount ?? 6,
    'ADAS (Sim/Não)': boolToText(v.safety?.hasAdas),
    'Alerta Ponto Cego (Sim/Não)': boolToText(v.safety?.hasBlindSpotAlert),
    'Câmera 360º (Sim/Não)': boolToText(v.safety?.hasCamera360),

    // 7. Conforto, Custos & Garantia
    'Garantia Geral (anos)': v.warrantyCosts?.generalWarrantyYears ?? 5,
    'Garantia Bateria (anos)': v.warrantyCosts?.batteryWarrantyYears ?? 8,
    'IPVA Anual Estimado (R$)': v.warrantyCosts?.ipvaAnnual ?? 0,
    'Seguro Anual Estimado (R$)': v.warrantyCosts?.insuranceAnnual ?? 0,
    'Revisões 3 Anos (R$)': v.warrantyCosts?.revisions3Years ?? 0,
    'Consumo 3 Anos (R$)': v.warrantyCosts?.consumption3Years ?? 0,
    'Bancos Elétricos (Sim/Não)': boolToText(v.comfortTech?.electricSeats),
    'Saída de Ar Traseira (Sim/Não)': boolToText(v.comfortTech?.rearAirVents),
    'CarPlay Sem Fio (Sim/Não)': boolToText(v.comfortTech?.carPlayWireless),
    'Teto Panorâmico (Sim/Não)': boolToText(v.comfortTech?.panoramicSunroof),
  }));
}

/**
 * Exporta os veículos para download em formato .xlsx
 */
export function exportVehiclesToExcel(vehicles: Vehicle[], customFileName?: string) {
  const rows = vehiclesToExcelRows(vehicles);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Definir larguras de colunas
  worksheet['!cols'] = EXCEL_COLUMNS.map((col) => ({ wch: col.width || 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos');

  // Adicionar aba de instruções
  const instructionRows = [
    { 'GUIA DE PREENCHIMENTO': 'MEU PRÓXIMO CARRO - PLANILHA DE VEÍCULOS' },
    { 'GUIA DE PREENCHIMENTO': '' },
    { 'GUIA DE PREENCHIMENTO': '1. CAMPOS OBRIGATÓRIOS:' },
    { 'GUIA DE PREENCHIMENTO': '   - Marca, Modelo, Motorização, Status, Concessionária, Preço da Loja, Qtd Passageiros, Volume Porta-malas, Potência Total, Torque.' },
    { 'GUIA DE PREENCHIMENTO': '' },
    { 'GUIA DE PREENCHIMENTO': '2. ESPAÇO ISOFIX:' },
    { 'GUIA DE PREENCHIMENTO': '   - O campo "Distância ISOFIX Interna (cm)" pode ficar vazio enquanto você não medir com a trena no showroom.' },
    { 'GUIA DE PREENCHIMENTO': '   - Regra Familiar: até 4 passageiros = eliminado; a partir de 5 = passa se ISOFIX >= 45cm; acima de 5 = passa sempre.' },
    { 'GUIA DE PREENCHIMENTO': '' },
    { 'GUIA DE PREENCHIMENTO': '3. TCO (TOTAL COST OF OWNERSHIP):' },
    { 'GUIA DE PREENCHIMENTO': '   - Simplificado para 3 anos na Bahia (Alíquota IPVA 2,5%).' },
    { 'GUIA DE PREENCHIMENTO': '   - Composto por: IPVA (3 anos) + Seguro (3 anos) + Revisões 3 Anos + Consumo 3 Anos.' },
  ];
  const instructionSheet = XLSX.utils.json_to_sheet(instructionRows);
  instructionSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instruções');

  const fileName = customFileName || `meu_proximo_carro_veiculos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Gera e baixa uma planilha modelo/template vazia com exemplos
 */
export function downloadExcelTemplate() {
  const sampleVehicle: Vehicle = {
    id: 'exemplo_byd_song_plus',
    brand: 'BYD',
    model: 'Song Plus',
    version: 'DM-i Premium',
    powertrain: 'PHEV',
    status: 'Finalista',
    yearManufacture: 2024,
    yearModel: 2025,
    dealership: 'BYD Parvi Salvador',
    sellerName: 'Marcos Bahia',
    notes: 'Excelente acabamento e espaço interno.',
    financial: {
      tablePrice: 249800,
      storePrice: 239800,
      usedCarEvaluation: 110000,
      paymentConditions: [],
    },
    familySpace: {
      isofixDistanceCm: 46.5,
      passengerCapacity: 5,
      lengthMm: 4705,
      widthMm: 1890,
      wheelbaseMm: 2765,
      weightKg: 1700,
    },
    trunk: {
      volumeLiters: 574,
      spareTireKit: 'Kit reparo',
      electricTailgate: true,
    },
    powertrainSpec: {
      totalPowerHp: 235,
      torqueKgfm: 40.8,
      zeroToHundredSeconds: 7.9,
      totalRangeKm: 1105,
      drivetrain: 'FWD',
      batteryKwh: 18.3,
      electricRangeKm: 105,
    },
    consumption: {
      urbanKmL: 18.4,
      highwayKmL: 15.6,
    },
    safety: {
      airbagsCount: 6,
      hasAdas: true,
      hasBlindSpotAlert: true,
      hasCamera360: true,
    },
    warrantyCosts: {
      generalWarrantyYears: 6,
      batteryWarrantyYears: 8,
      ipvaAnnual: 5995,
      insuranceAnnual: 5800,
      revisions3Years: 2450,
      consumption3Years: 12200,
    },
    comfortTech: {
      electricSeats: true,
      rearAirVents: true,
      carPlayWireless: true,
      panoramicSunroof: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  exportVehiclesToExcel([sampleVehicle], 'meu_proximo_carro_modelo_preenchimento.xlsx');
}

/**
 * Lê e analisa uma planilha Excel enviada pelo usuário, convertendo para veículos
 */
export async function parseVehiclesFromExcel(file: File): Promise<{
  vehicles: Vehicle[];
  errors: string[];
  summary: { total: number; valid: number; updated: number; created: number };
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('A planilha está vazia.');
        }

        const sheetName = workbook.SheetNames.includes('Veículos') ? 'Veículos' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

        const vehicles: Vehicle[] = [];
        const errors: string[] = [];
        let updatedCount = 0;
        let createdCount = 0;

        rawRows.forEach((row, index) => {
          const rowNum = index + 2;

          const brand = String(row['Marca*'] || row['Marca'] || '').trim();
          const model = String(row['Modelo*'] || row['Modelo'] || '').trim();

          if (!brand || !model) {
            errors.push(`Linha ${rowNum}: Marca e Modelo são obrigatórios. Linha ignorada.`);
            return;
          }

          const rawId = String(row['ID (Não alterar ao editar)'] || row['ID'] || '').trim();
          const isNew = !rawId;
          const id = rawId || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

          if (isNew) createdCount++;
          else updatedCount++;

          const storePrice = parseNum(row['Preço da Loja (R$)*'] || row['Preço da Loja'] || row['Preço Negociado / Proposta (R$)*'] || row['Preço'] || 0);
          const tablePrice = parseNum(row['Preço de Tabela (R$)'] || row['Preço Tabela Fipe (R$)'] || storePrice);
          const usedCarEvaluation = parseNum(row['Avaliação do Usado (R$)'] || row['Avaliação do Seu Carro Usado (R$)'] || 0);

          const rawIsofix = row['Distância ISOFIX Interna (cm - medir no local)'] ?? row['Distância entre pontos ISOFIX (cm)*'];
          const isofixDistanceCm = (rawIsofix !== undefined && rawIsofix !== null && rawIsofix !== '') 
            ? parseNum(rawIsofix) 
            : null;

          const vehicle: Vehicle = {
            id,
            brand,
            model,
            version: String(row['Versão'] || '').replace(/\s*\(?completa\)?/gi, '').trim(),
            powertrain: (row['Motorização (HEV/PHEV/REEV/MHEV/BEV/Combustão)*'] || row['Motorização'] || 'PHEV') as PowertrainType,
            status: (row['Status*'] || row['Status'] || 'Quero visitar') as VehicleStatus,
            yearManufacture: parseNum(row['Ano Fabricação'] || row['Ano Fab.'], 2024),
            yearModel: parseNum(row['Ano Modelo'] || row['Ano Mod.'], 2025),
            dealership: String(row['Concessionária / Loja*'] || row['Concessionária / Loja'] || row['Concessionária'] || 'Concessionária Local').trim(),
            sellerName: row['Nome do Vendedor'] || row['Nome Vendedor'] || '',
            notes: row['Notas / Observações'] || row['Notas / Observações Gerais'] || '',

            financial: {
              tablePrice,
              storePrice,
              usedCarEvaluation,
              paymentConditions: [],
            },

            familySpace: {
              isofixDistanceCm,
              passengerCapacity: parseNum(row['Qtd Passageiros sem Cadeirinha*'] || row['Qtd Passageiros'] || 5),
              lengthMm: parseNum(row['Comprimento (mm)'], 0),
              widthMm: parseNum(row['Largura (mm)'], 0),
              wheelbaseMm: parseNum(row['Entre-eixos (mm)'], 0),
              weightKg: parseNum(row['Peso (kg)'], 0),
            },

            trunk: {
              volumeLiters: parseNum(row['Volume Porta-malas (L)*'] || row['Porta-malas Volume Oficial (Litros)'], 450),
              spareTireKit: (row['Kit Reparo ou Estepe (Kit reparo/Estepe temporário/Estepe convencional/Sem estepe)'] || row['Tipo de Estepe'] || 'Kit reparo') as any,
              electricTailgate: textToBool(row['Abertura Elétrica (Sim/Não)'] || row['Tampa Porta-malas Elétrica? (Sim/Não)']),
            },

            powertrainSpec: {
              totalPowerHp: parseNum(row['Potência Total (cv)*'] || row['Potência Combinada (cv)'], 200),
              torqueKgfm: parseNum(row['Torque (kgfm)*'] || row['Torque Combinado (Nm)'] ? parseNum(row['Torque Combinado (Nm)']) / 9.80665 : 35),
              zeroToHundredSeconds: parseNum(row['0-100 km/h (s)'] || row['Aceleração 0-100 km/h (s)'], 8.0),
              totalRangeKm: parseNum(row['Autonomia Total (km)'], 1000),
              drivetrain: (row['Tração (FWD/AWD/RWD)'] || 'FWD') as any,
              batteryKwh: parseNum(row['Capacidade Bateria (kWh)'], 0),
              electricRangeKm: parseNum(row['Autonomia Elétrica (km)'] || row['Autonomia Elétrica Oficial (km)'], 0),
            },

            consumption: {
              urbanKmL: parseNum(row['Consumo Cidade (km/l)'] || row['Consumo Urbano Gasolina (km/l)'], 15),
              highwayKmL: parseNum(row['Consumo Estrada (km/l)'] || row['Consumo Rodoviário Gasolina (km/l)'], 14),
            },

            safety: {
              airbagsCount: parseNum(row['Quantidade de Airbags'] || row['Airbags (Qtd)'], 6),
              hasAdas: textToBool(row['ADAS (Sim/Não)'] || row['Piloto Automático Adaptativo / ADAS']),
              hasBlindSpotAlert: textToBool(row['Alerta Ponto Cego (Sim/Não)']),
              hasCamera360: textToBool(row['Câmera 360º (Sim/Não)']),
            },

            warrantyCosts: {
              generalWarrantyYears: parseNum(row['Garantia Geral (anos)'], 5),
              batteryWarrantyYears: parseNum(row['Garantia Bateria (anos)'], 8),
              ipvaAnnual: parseNum(row['IPVA Anual Estimado (R$)'], storePrice * 0.025),
              insuranceAnnual: parseNum(row['Seguro Anual Estimado (R$)'], storePrice * 0.03),
              revisions3Years: parseNum(row['Revisões 3 Anos (R$)'], 2500),
              consumption3Years: parseNum(row['Consumo 3 Anos (R$)'], 12000),
            },

            comfortTech: {
              electricSeats: textToBool(row['Bancos Elétricos (Sim/Não)']),
              rearAirVents: textToBool(row['Saída de Ar Traseira (Sim/Não)']),
              carPlayWireless: textToBool(row['CarPlay Sem Fio (Sim/Não)']),
              panoramicSunroof: textToBool(row['Teto Panorâmico (Sim/Não)']),
            },

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          vehicles.push(vehicle);
        });

        resolve({
          vehicles,
          errors,
          summary: {
            total: rawRows.length,
            valid: vehicles.length,
            updated: updatedCount,
            created: createdCount,
          },
        });
      } catch (err: any) {
        reject(new Error(`Falha ao processar arquivo Excel: ${err.message || err}`));
      }
    };

    reader.onerror = () => reject(new Error('Erro na leitura do arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}
