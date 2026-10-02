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
  subscribeToPreferences,
  DEFAULT_WORKSPACE_ID,
} from './firestore-sync';

export function normalizeVehicle(raw: any): Vehicle {
  const storePrice = raw.financial?.storePrice ?? raw.financial?.negotiatedPrice ?? raw.financial?.advertisedPrice ?? 0;
  return {
    id: raw.id || `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    brand: raw.brand || '',
    model: raw.model || '',
    version: (raw.version || '').replace(/\s*\(?completa\)?/gi, '').trim(),
    powertrain: raw.powertrain || 'PHEV',
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

function subscribeToClient(callback: () => void) {
  return () => {};
}

export function useCarMatchStore() {
  const isHydrated = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );

  // State starts empty and is strictly driven by Firestore real-time listener
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(INITIAL_PREFERENCES);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('padrao_familiar');
  const [firestoreReady, setFirestoreReady] = useState(false);

  // Real-time Firestore subscription — Firestore is the single source of truth
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Purge any legacy localStorage keys to ensure browser cache never interferes
    try {
      const legacyKeys = [
        'carmatch_vehicles',
        'carmatch_vehicles_v2',
        'carmatch_vehicles_v3',
        'carmatch_vehicles_v4',
        'carmatch_preferences',
        'carmatch_workspace_empty',
        'meu_proximo_carro_user_initialized',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      // Ignore
    }

    let isSubscribed = true;

    // Real-time subscription to cloud vehicles — Firestore drives the UI
    const unsubVehicles = subscribeToVehicles(
      DEFAULT_WORKSPACE_ID,
      (cloudVehicles) => {
        if (!isSubscribed) return;
        const normalized = cloudVehicles.map(normalizeVehicle);
        setVehicles(normalized);
        setFirestoreReady(true);
      },
      (err) => {
        console.warn('Firestore vehicles subscription notice:', err);
      }
    );

    // Real-time subscription to preferences
    const unsubPrefs = subscribeToPreferences(
      DEFAULT_WORKSPACE_ID,
      (cloudPrefs, cloudScenarioId) => {
        if (!isSubscribed) return;
        if (cloudPrefs) {
          const mergedUsedCar: RegisteredUsedCar = {
            ...DEFAULT_USED_CAR,
            ...(cloudPrefs.usedCar || {}),
            trunkVolumeLiters: cloudPrefs.usedCar?.trunkVolumeLiters ?? DEFAULT_USED_CAR.trunkVolumeLiters,
            zeroToHundredSeconds: cloudPrefs.usedCar?.zeroToHundredSeconds ?? DEFAULT_USED_CAR.zeroToHundredSeconds,
            powerHp: cloudPrefs.usedCar?.powerHp ?? DEFAULT_USED_CAR.powerHp,
            urbanGasolineKmL: cloudPrefs.usedCar?.urbanGasolineKmL ?? DEFAULT_USED_CAR.urbanGasolineKmL,
            highwayGasolineKmL: cloudPrefs.usedCar?.highwayGasolineKmL ?? DEFAULT_USED_CAR.highwayGasolineKmL,
            tco3Years: cloudPrefs.usedCar?.tco3Years ?? DEFAULT_USED_CAR.tco3Years,
          };

          setPreferences({
            ...INITIAL_PREFERENCES,
            ...cloudPrefs,
            selectedState: 'BA',
            ipvaRatePercent: 2.5,
            tcoYearsPeriod: 3,
            usedCar: mergedUsedCar,
          });
        }
        if (cloudScenarioId) {
          setActiveScenarioId(cloudScenarioId);
        }
      },
      (err) => {
        console.warn('Firestore preferences subscription notice:', err);
      }
    );

    return () => {
      isSubscribed = false;
      unsubVehicles();
      unsubPrefs();
    };
  }, []);

  // Save preferences — writes directly to Firestore
  const savePreferences = useCallback(
    (newPrefs: UserPreferences) => {
      setPreferences(newPrefs);
      savePreferencesToFirestore(newPrefs, activeScenarioId).catch(console.error);
    },
    [activeScenarioId]
  );

  // Upsert vehicle — writes directly to Firestore
  const upsertVehicle = useCallback((vehicle: Vehicle) => {
    const now = new Date().toISOString();
    const updatedVehicle: Vehicle = normalizeVehicle({
      ...vehicle,
      createdAt: vehicle.createdAt || now,
      updatedAt: now,
    });
    // Optimistic update
    setVehicles((prev) => {
      const index = prev.findIndex((v) => v.id === vehicle.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = updatedVehicle;
        return updated;
      }
      return [updatedVehicle, ...prev];
    });
    // Write to Firestore (real-time listener will confirm)
    saveVehicleToFirestore(updatedVehicle).catch(console.error);
  }, []);

  // Delete vehicle — deletes from Firestore
  const deleteVehicle = useCallback((id: string) => {
    // Optimistic removal
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    // Delete from Firestore
    deleteVehicleFromFirestore(id).catch(console.error);
  }, []);

  // Clear all vehicles
  const clearAllVehicles = useCallback(() => {
    setVehicles((prev) => {
      prev.forEach((v) => {
        deleteVehicleFromFirestore(v.id).catch(console.error);
      });
      return [];
    });
  }, []);

  // Apply a scenario
  const applyScenario = useCallback(
    (scenarioId: string) => {
      const preset = SCENARIO_PRESETS.find((s) => s.id === scenarioId);
      if (!preset) return;
      setActiveScenarioId(scenarioId);

      setPreferences((prev) => {
        const updated: UserPreferences = {
          ...prev,
          annualKm: preset.annualKm,
          urbanSharePercent: preset.urbanSharePercent,
          gasolinePricePerLiter: preset.gasolinePrice,
          electricityPricePerKwh: preset.electricityPrice,
        };
        savePreferencesToFirestore(updated, scenarioId).catch(console.error);
        return updated;
      });
    },
    []
  );

  // Reset preferences to factory defaults without modifying candidate vehicles
  const resetToSeedData = useCallback(() => {
    setPreferences(INITIAL_PREFERENCES);
    setActiveScenarioId('padrao_familiar');
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
          // Delete old vehicles from Firestore
          vehicles.forEach((v) => deleteVehicleFromFirestore(v.id).catch(console.error));
          finalVehicles = normalizedVehicles;
        } else {
          // Merge by ID or add new
          const map = new Map<string, Vehicle>();
          vehicles.forEach((v) => map.set(v.id, v));
          normalizedVehicles.forEach((v) => map.set(v.id, v));
          finalVehicles = Array.from(map.values());
        }

        setVehicles(finalVehicles);
        // Push all vehicles to Firestore
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
          savePreferencesToFirestore(mergedPrefs, parsed.activeScenarioId || activeScenarioId).catch(console.error);
        }

        if (parsed.activeScenarioId) {
          setActiveScenarioId(parsed.activeScenarioId);
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
    firestoreReady,
    vehicles,
    preferences,
    activeScenarioId,
    scenarios: SCENARIO_PRESETS,
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
