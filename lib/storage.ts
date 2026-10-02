'use client';

import { useState, useSyncExternalStore, useCallback, useEffect } from 'react';
import { Vehicle, UserPreferences, ScenarioPreset } from '@/types/vehicle';
import {
  INITIAL_VEHICLES,
  INITIAL_PREFERENCES,
  SCENARIO_PRESETS,
  DEFAULT_USED_CAR,
} from './seed-data';
import {
  saveVehicleToFirestore,
  deleteVehicleFromFirestore,
  savePreferencesToFirestore,
  subscribeToVehicles,
  pushAllLocalToCloud,
  DEFAULT_WORKSPACE_ID,
} from './firestore-sync';

const VEHICLES_STORAGE_KEY = 'meu_proximo_carro_vehicles_v4';
const PREFERENCES_STORAGE_KEY = 'meu_proximo_carro_preferences_v4';
const SCENARIO_STORAGE_KEY = 'meu_proximo_carro_scenario_v4';
const USER_INITIALIZED_KEY = 'meu_proximo_carro_user_initialized_v4';

export function normalizeVehicle(raw: any): Vehicle {
  const storePrice = raw.financial?.storePrice ?? raw.financial?.negotiatedPrice ?? raw.financial?.advertisedPrice ?? 0;
  return {
    id: raw.id || `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    brand: raw.brand || '',
    model: raw.model || '',
    version: (raw.version || '').replace(/\s*\(?completa\)?/gi, '').trim(),
    powertrain: raw.powertrain || 'PHEV',
    motorizacaoDesc: raw.motorizacaoDesc || raw.fuel || '',
    status: raw.status || 'Quero visitar',
    yearManufacture: raw.yearManufacture || new Date().getFullYear(),
    yearModel: raw.yearModel || new Date().getFullYear(),
    dealership: raw.dealership || '',
    sellerName: raw.sellerName || '',
    notes: raw.notes || '',

    financial: {
      tablePrice: raw.financial?.tablePrice ?? storePrice,
      storePrice,
      usedCarEvaluation: raw.financial?.usedCarEvaluation ?? 0,
      paymentConditions: Array.isArray(raw.financial?.paymentConditions) ? raw.financial.paymentConditions : [],
    },

    familySpace: {
      isofixDistanceCm: raw.familySpace?.isofixDistanceCm !== undefined ? raw.familySpace.isofixDistanceCm : null,
      passengerCapacity: raw.familySpace?.passengerCapacity ?? 5,
      lengthMm: raw.familySpace?.lengthMm ?? 4500,
      widthMm: raw.familySpace?.widthMm ?? 1840,
      wheelbaseMm: raw.familySpace?.wheelbaseMm ?? 2680,
      weightKg: raw.familySpace?.weightKg ?? 1600,
    },

    trunk: {
      volumeLiters: raw.trunk?.volumeLiters ?? raw.trunk?.officialVolumeLiters ?? 500,
      spareTireKit: raw.trunk?.spareTireKit ?? (raw.trunk?.spareTire === 'Kit reparo' ? 'Kit reparo' : 'Estepe temporário'),
      electricTailgate: !!raw.trunk?.electricTailgate,
    },

    powertrainSpec: {
      totalPowerHp: raw.powertrainSpec?.totalPowerHp ?? raw.powertrainSpec?.combinedPowerHp ?? 200,
      torqueKgfm: raw.powertrainSpec?.torqueKgfm ?? (raw.powertrainSpec?.combinedTorqueNm ? Number((raw.powertrainSpec.combinedTorqueNm / 9.80665).toFixed(1)) : 35.0),
      zeroToHundredSeconds: raw.powertrainSpec?.zeroToHundredSeconds ?? 8.0,
      totalRangeKm: raw.powertrainSpec?.totalRangeKm ?? 900,
      drivetrain: raw.powertrainSpec?.drivetrain ?? 'FWD',
      batteryKwh: raw.powertrainSpec?.batteryKwh ?? 0,
      electricRangeKm: raw.powertrainSpec?.electricRangeKm ?? raw.powertrainSpec?.officialElectricRangeKm ?? 0,
    },

    consumption: {
      urbanKmL: raw.consumption?.urbanKmL ?? raw.consumption?.urbanGasolineKmL ?? 14.0,
      highwayKmL: raw.consumption?.highwayKmL ?? raw.consumption?.highwayGasolineKmL ?? 12.5,
    },

    safety: {
      airbagsCount: raw.safety?.airbagsCount ?? 6,
      hasAdas: raw.safety?.hasAdas ?? raw.safety?.hasAeb ?? false,
      hasBlindSpotAlert: raw.safety?.hasBlindSpotAlert ?? false,
      hasCamera360: raw.safety?.hasCamera360 ?? false,
    },

    warrantyCosts: {
      generalWarrantyYears: raw.warrantyCosts?.generalWarrantyYears ?? 5,
      batteryWarrantyYears: raw.warrantyCosts?.batteryWarrantyYears ?? 8,
      ipvaAnnual: raw.warrantyCosts?.ipvaAnnual ?? (storePrice * 0.025),
      insuranceAnnual: raw.warrantyCosts?.insuranceAnnual ?? raw.warrantyCosts?.annualInsuranceEstimate ?? 5000,
      revisions3Years: raw.warrantyCosts?.revisions3Years ?? raw.warrantyCosts?.revisionCost3Years ?? 3200,
      consumption3Years: raw.warrantyCosts?.consumption3Years ?? 12000,
    },

    comfortTech: {
      electricSeats: !!raw.comfortTech?.electricSeats,
      rearAirVents: !!raw.comfortTech?.rearAirVents,
      carPlayWireless: !!raw.comfortTech?.carPlayWireless,
      panoramicSunroof: !!raw.comfortTech?.panoramicSunroof,
    },

    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function getInitialVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return [];
  try {
    const isUserInitialized = localStorage.getItem(USER_INITIALIZED_KEY) === 'true';
    const stored = localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeVehicle);
        }
      } catch {}
    }

    if (isUserInitialized) {
      return [];
    }

    // Check candidate legacy keys
    const candidateKeys = [
      'carmatch_vehicles_v3',
      'carmatch_vehicles_v2',
      'carmatch_vehicles_v1',
      'carmatch_vehicles',
      'carmatch_vehicles_backup',
    ];

    for (const key of candidateKeys) {
      const oldStored = localStorage.getItem(key);
      if (oldStored) {
        try {
          const parsed = JSON.parse(oldStored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.map(normalizeVehicle);
            localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(valid));
            localStorage.setItem(USER_INITIALIZED_KEY, 'true');
            return valid;
          }
        } catch {}
      }
    }
  } catch (e) {
    console.error('Failed reading vehicles from localStorage', e);
  }
  return INITIAL_VEHICLES;
}

function getInitialPreferences(): UserPreferences {
  if (typeof window === 'undefined') return INITIAL_PREFERENCES;
  try {
    const candidateKeys = [
      PREFERENCES_STORAGE_KEY,
      'carmatch_preferences_v3',
      'carmatch_preferences_v2',
      'carmatch_preferences_v1',
      'carmatch_preferences',
    ];
    for (const key of candidateKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.selectedState = 'BA';
          parsed.ipvaRatePercent = 2.5;
          parsed.tcoYearsPeriod = 3;
          if (!parsed.usedCar) {
            parsed.usedCar = DEFAULT_USED_CAR;
          }
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(parsed));
          return { ...INITIAL_PREFERENCES, ...parsed };
        } catch {}
      }
    }
  } catch (e) {
    console.error('Failed reading preferences from localStorage', e);
  }
  return INITIAL_PREFERENCES;
}

function getInitialScenario(): string {
  if (typeof window === 'undefined') return 'padrao_familiar';
  try {
    const candidateKeys = [
      SCENARIO_STORAGE_KEY,
      'carmatch_scenario_v3',
      'carmatch_scenario_v2',
      'carmatch_scenario_v1',
    ];
    for (const key of candidateKeys) {
      const stored = localStorage.getItem(key);
      if (stored) return stored;
    }
  } catch (e) {
    console.error('Failed reading scenario from localStorage', e);
  }
  return 'padrao_familiar';
}

function subscribeToClient(callback: () => void) {
  return () => {};
}

export function useCarMatchStore() {
  const isHydrated = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>(getInitialVehicles);
  const [preferences, setPreferences] = useState<UserPreferences>(getInitialPreferences);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(getInitialScenario);

  // Real-time Firestore sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;

    const unsubscribe = subscribeToVehicles(
      DEFAULT_WORKSPACE_ID,
      (cloudVehicles) => {
        if (!isSubscribed) return;
        if (cloudVehicles && cloudVehicles.length > 0) {
          const normalized = cloudVehicles.map(normalizeVehicle);
          setVehicles(normalized);
          try {
            localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(normalized));
            localStorage.setItem(USER_INITIALIZED_KEY, 'true');
          } catch (e) {
            console.error('Failed saving cloud vehicles to localStorage', e);
          }
        }
      },
      (err) => {
        console.warn('Firestore subscription notice:', err);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Save preferences
  const savePreferences = useCallback(
    (newPrefs: UserPreferences) => {
      setPreferences(newPrefs);
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPrefs));
      } catch (e) {
        console.error('Failed to save preferences to localStorage', e);
      }
      savePreferencesToFirestore(newPrefs, activeScenarioId).catch(console.error);
    },
    [activeScenarioId]
  );

  // Upsert vehicle (add or edit)
  const upsertVehicle = useCallback((vehicle: Vehicle) => {
    try {
      localStorage.setItem(USER_INITIALIZED_KEY, 'true');
    } catch {}

    const now = new Date().toISOString();
    const updatedVehicle: Vehicle = normalizeVehicle({
      ...vehicle,
      createdAt: vehicle.createdAt || now,
      updatedAt: now,
    });

    setVehicles((prev) => {
      const index = prev.findIndex((v) => v.id === updatedVehicle.id);
      let updated: Vehicle[];
      if (index >= 0) {
        updated = prev.map((v, i) => (i === index ? updatedVehicle : v));
      } else {
        updated = [updatedVehicle, ...prev];
      }
      try {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist vehicle', e);
      }
      return updated;
    });

    saveVehicleToFirestore(updatedVehicle).catch(console.error);
  }, []);

  // Delete vehicle
  const deleteVehicle = useCallback((id: string) => {
    try {
      localStorage.setItem(USER_INITIALIZED_KEY, 'true');
    } catch {}

    setVehicles((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      try {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to delete vehicle from storage', e);
      }
      return updated;
    });

    deleteVehicleFromFirestore(id).catch(console.error);
  }, []);

  // Clear all vehicles
  const clearAllVehicles = useCallback(() => {
    try {
      localStorage.setItem(USER_INITIALIZED_KEY, 'true');
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify([]));
    } catch {}

    setVehicles((prev) => {
      prev.forEach((v) => {
        deleteVehicleFromFirestore(v.id).catch(console.error);
      });
      return [];
    });
  }, []);

  // One-click function to replace all cloud/deployed data with the platform data
  const syncToCloudNow = useCallback(async () => {
    return await pushAllLocalToCloud(vehicles, preferences, activeScenarioId);
  }, [vehicles, preferences, activeScenarioId]);

  // Apply a scenario
  const applyScenario = useCallback(
    (scenarioId: string) => {
      const preset = SCENARIO_PRESETS.find((s) => s.id === scenarioId);
      if (!preset) return;
      setActiveScenarioId(scenarioId);
      try {
        localStorage.setItem(SCENARIO_STORAGE_KEY, scenarioId);
      } catch (e) {
        console.error('Failed to save scenario', e);
      }

      setPreferences((prev) => {
        const updated: UserPreferences = {
          ...prev,
          annualKm: preset.annualKm,
          urbanSharePercent: preset.urbanSharePercent,
          gasolinePricePerLiter: preset.gasolinePrice,
          electricityPricePerKwh: preset.electricityPrice,
        };
        try {
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save updated prefs', e);
        }
        return updated;
      });
    },
    []
  );

  // Reset to initial seed data (only when user explicitly requests)
  const resetToSeedData = useCallback(() => {
    try {
      localStorage.setItem(USER_INITIALIZED_KEY, 'true');
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(INITIAL_PREFERENCES));
      localStorage.setItem(SCENARIO_STORAGE_KEY, 'padrao_familiar');
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
    setVehicles(INITIAL_VEHICLES);
    setPreferences(INITIAL_PREFERENCES);
    setActiveScenarioId('padrao_familiar');
    pushAllLocalToCloud(INITIAL_VEHICLES, INITIAL_PREFERENCES, 'padrao_familiar').catch(console.error);
  }, []);

  // Export full snapshot
  const exportData = useCallback(() => {
    return JSON.stringify(
      {
        version: 2,
        exportedAt: new Date().toISOString(),
        vehicles,
        preferences,
        activeScenarioId,
      },
      null,
      2
    );
  }, [vehicles, preferences, activeScenarioId]);

  // Import snapshot
  const importData = useCallback(
    (
      input: string | { vehicles: Vehicle[]; preferences?: UserPreferences; activeScenarioId?: string },
      mode: 'replace' | 'merge' = 'replace'
    ) => {
      try {
        let parsed: { vehicles: Vehicle[]; preferences?: UserPreferences; activeScenarioId?: string };
        if (typeof input === 'string') {
          parsed = JSON.parse(input);
        } else {
          parsed = input;
        }

        if (!parsed || !Array.isArray(parsed.vehicles)) {
          throw new Error('Formato de dados inválido: lista de veículos não encontrada.');
        }

        const normalizedVehicles = parsed.vehicles.map(normalizeVehicle);

        try {
          localStorage.setItem(USER_INITIALIZED_KEY, 'true');
        } catch {}

        if (mode === 'replace') {
          setVehicles(normalizedVehicles);
          try {
            localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(normalizedVehicles));
          } catch (e) {
            console.error('Failed to save imported vehicles', e);
          }
          // Push entire replacement to cloud, cleaning up old vehicles
          pushAllLocalToCloud(
            normalizedVehicles,
            parsed.preferences || preferences,
            parsed.activeScenarioId || activeScenarioId
          ).catch(console.error);
        } else {
          // Merge by ID or add new
          const map = new Map<string, Vehicle>();
          vehicles.forEach((v) => map.set(v.id, v));
          normalizedVehicles.forEach((v) => map.set(v.id, v));
          const merged = Array.from(map.values());

          setVehicles(merged);
          try {
            localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error('Failed to save imported vehicles', e);
          }
          merged.forEach((v) => saveVehicleToFirestore(v).catch(console.error));
        }

        if (parsed.preferences) {
          const mergedPrefs: UserPreferences = {
            ...preferences,
            ...parsed.preferences,
            selectedState: 'BA',
            ipvaRatePercent: 2.5,
            tcoYearsPeriod: 3,
            usedCar: parsed.preferences.usedCar || preferences.usedCar || DEFAULT_USED_CAR,
          };
          setPreferences(mergedPrefs);
          try {
            localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(mergedPrefs));
          } catch (e) {
            console.error('Failed to save imported preferences', e);
          }
          savePreferencesToFirestore(mergedPrefs, parsed.activeScenarioId || activeScenarioId).catch(console.error);
        }

        if (parsed.activeScenarioId) {
          setActiveScenarioId(parsed.activeScenarioId);
          try {
            localStorage.setItem(SCENARIO_STORAGE_KEY, parsed.activeScenarioId);
          } catch (e) {}
        }

        return { success: true, count: normalizedVehicles.length };
      } catch (err: any) {
        console.error('Import failed', err);
        return { success: false, error: err.message || 'Erro ao importar dados' };
      }
    },
    [vehicles, preferences, activeScenarioId]
  );

  return {
    isHydrated,
    vehicles,
    preferences,
    activeScenarioId,
    scenarios: SCENARIO_PRESETS,
    savePreferences,
    upsertVehicle,
    deleteVehicle,
    clearAllVehicles,
    syncToCloudNow,
    applyScenario,
    resetToSeedData,
    exportData,
    importData,
  };
}
