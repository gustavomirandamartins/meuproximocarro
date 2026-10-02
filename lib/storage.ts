'use client';

import { useState, useSyncExternalStore, useCallback, useEffect } from 'react';
import { Vehicle, UserPreferences, ScenarioPreset, RegisteredUsedCar } from '@/types/vehicle';
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
  syncLocalVehiclesToCloudIfEmpty,
  DEFAULT_WORKSPACE_ID,
} from './firestore-sync';

const VEHICLES_STORAGE_KEY = 'meu_proximo_carro_vehicles_v4';
const PREFERENCES_STORAGE_KEY = 'meu_proximo_carro_preferences_v4';
const SCENARIO_STORAGE_KEY = 'meu_proximo_carro_scenario_v4';
const DELETED_IDS_KEY = 'meu_proximo_carro_deleted_ids';

function getDeletedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function addDeletedId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedIds();
    current.add(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

function removeDeletedId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedIds();
    current.delete(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

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
      tablePrice: raw.financial?.tablePrice ?? 0,
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
  if (typeof window === 'undefined') return INITIAL_VEHICLES;
  try {
    const deleted = getDeletedIds();
    // Check all possible local storage keys to recover user data without erasing it
    const candidateKeys = [
      VEHICLES_STORAGE_KEY,
      'carmatch_vehicles_v3',
      'carmatch_vehicles_v2',
      'carmatch_vehicles_v1',
      'carmatch_vehicles',
      'carmatch_vehicles_backup',
    ];

    for (const key of candidateKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed
              .filter((v: any) => v && v.id && !deleted.has(v.id))
              .map(normalizeVehicle);
            if (valid.length > 0) {
              localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(valid));
              localStorage.setItem('carmatch_vehicles_backup', JSON.stringify(valid));
              return valid;
            }
          }
        } catch (e) {
          console.warn('Failed parsing stored vehicles from', key, e);
        }
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

  // Real-time Firestore sync & initial local data push
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;

    // 1. Initial push if cloud is empty but local has vehicles
    const local = getInitialVehicles();
    const localPrefs = getInitialPreferences();
    const localScenario = getInitialScenario();

    if (local.length > 0) {
      syncLocalVehiclesToCloudIfEmpty(local, localPrefs, localScenario).catch(console.error);
    }

    // 2. Real-time subscription to cloud vehicles
    // CRITICAL: We MERGE cloud vehicles with local vehicles so that locally registered
    // vehicles are NEVER clobbered, erased, or reverted by incoming snapshots!
    const unsubscribe = subscribeToVehicles(
      DEFAULT_WORKSPACE_ID,
      (cloudVehicles) => {
        if (!isSubscribed) return;
        if (cloudVehicles && cloudVehicles.length > 0) {
          const deleted = getDeletedIds();
          setVehicles((prev) => {
            const map = new Map<string, Vehicle>();

            // Cloud vehicles (only if not deleted by the user)
            cloudVehicles.forEach((cv) => {
              if (!deleted.has(cv.id)) {
                map.set(cv.id, normalizeVehicle(cv));
              }
            });

            // Local vehicles take priority and MUST NEVER be deleted by cloud snapshot
            prev.forEach((lv) => {
              if (!deleted.has(lv.id)) {
                map.set(lv.id, lv);
              }
            });

            const merged = Array.from(map.values());
            try {
              localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(merged));
              localStorage.setItem('carmatch_vehicles_backup', JSON.stringify(merged));
            } catch (e) {
              console.error('Failed saving merged vehicles to localStorage', e);
            }
            return merged;
          });
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

  // Save vehicles
  const saveVehicles = useCallback((newVehicles: Vehicle[]) => {
    const normalized = newVehicles.map(normalizeVehicle);
    setVehicles(normalized);
    try {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem('carmatch_vehicles_backup', JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to save vehicles to localStorage', e);
    }
    normalized.forEach((v) => saveVehicleToFirestore(v).catch(console.error));
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

  // Upsert vehicle (add or edit) - ALWAYS saves locally immediately and pushes to cloud
  const upsertVehicle = useCallback((vehicle: Vehicle) => {
    removeDeletedId(vehicle.id);
    setVehicles((prev) => {
      const index = prev.findIndex((v) => v.id === vehicle.id);
      let updated: Vehicle[];
      const now = new Date().toISOString();
      const updatedVehicle: Vehicle = normalizeVehicle({
        ...vehicle,
        createdAt: vehicle.createdAt || now,
        updatedAt: now,
      });
      if (index >= 0) {
        updated = [...prev];
        updated[index] = updatedVehicle;
      } else {
        updated = [updatedVehicle, ...prev];
      }
      try {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('carmatch_vehicles_backup', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist vehicle', e);
      }
      // Asynchronously push to Firestore without blocking UI
      saveVehicleToFirestore(updatedVehicle).catch(console.error);
      return updated;
    });
  }, []);

  // Delete vehicle - records deleted ID so it is NEVER restored by cloud snapshots
  const deleteVehicle = useCallback((id: string) => {
    addDeletedId(id);
    setVehicles((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      try {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('carmatch_vehicles_backup', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to delete vehicle from storage', e);
      }
      deleteVehicleFromFirestore(id).catch(console.error);
      return updated;
    });
  }, []);

  // Clear all vehicles
  const clearAllVehicles = useCallback(() => {
    setVehicles((prev) => {
      prev.forEach((v) => {
        addDeletedId(v.id);
        deleteVehicleFromFirestore(v.id).catch(console.error);
      });
      try {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify([]));
        localStorage.setItem('carmatch_vehicles_backup', JSON.stringify([]));
      } catch (e) {
        console.error('Failed to clear vehicles', e);
      }
      return [];
    });
  }, []);

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

  // Reset to initial seed data
  const resetToSeedData = useCallback(() => {
    try {
      localStorage.removeItem(DELETED_IDS_KEY);
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
      localStorage.setItem('carmatch_vehicles_backup', JSON.stringify(INITIAL_VEHICLES));
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(INITIAL_PREFERENCES));
      localStorage.setItem(SCENARIO_STORAGE_KEY, 'padrao_familiar');
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
    setVehicles(INITIAL_VEHICLES);
    setPreferences(INITIAL_PREFERENCES);
    setActiveScenarioId('padrao_familiar');
    INITIAL_VEHICLES.forEach((v) => saveVehicleToFirestore(v).catch(console.error));
    savePreferencesToFirestore(INITIAL_PREFERENCES, 'padrao_familiar').catch(console.error);
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

        let finalVehicles: Vehicle[];
        if (mode === 'replace') {
          finalVehicles = normalizedVehicles;
        } else {
          // Merge by ID or add new
          const map = new Map<string, Vehicle>();
          vehicles.forEach((v) => map.set(v.id, v));
          normalizedVehicles.forEach((v) => map.set(v.id, v));
          finalVehicles = Array.from(map.values());
        }

        setVehicles(finalVehicles);
        try {
          localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(finalVehicles));
          localStorage.setItem('carmatch_vehicles_backup', JSON.stringify(finalVehicles));
        } catch (e) {
          console.error('Failed to save imported vehicles', e);
        }

        // Push imported vehicles to cloud
        finalVehicles.forEach((v) => saveVehicleToFirestore(v).catch(console.error));

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
    saveVehicles,
    savePreferences,
    upsertVehicle,
    deleteVehicle,
    clearAllVehicles,
    applyScenario,
    resetToSeedData,
    exportData,
    importData,
  };
}
