import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, ensureAuth } from './firebase';
import { Vehicle, UserPreferences } from '@/types/vehicle';

export const DEFAULT_WORKSPACE_ID = 'familia_carmatch';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Sanitize vehicle data for Firestore (remove undefined, ensure valid types)
export function sanitizeVehicle(v: Vehicle): Record<string, any> {
  const clean = JSON.parse(JSON.stringify(v));
  return {
    ...clean,
    id: v.id,
    brand: v.brand || '',
    model: v.model || '',
    version: v.version || '',
    yearManufacture: Number(v.yearManufacture) || 2024,
    yearModel: Number(v.yearModel) || 2024,
    powertrain: v.powertrain || 'HEV',
    status: v.status || 'Quero visitar',
    updatedAt: new Date().toISOString(),
  };
}

// Sanitize preferences for Firestore
export function sanitizePreferences(prefs: UserPreferences, activeScenarioId?: string): Record<string, any> {
  const clean = JSON.parse(JSON.stringify(prefs));
  return {
    ...clean,
    activeScenarioId: activeScenarioId || 'padrao_familiar',
    updatedAt: new Date().toISOString(),
  };
}

// Initialize workspace document if it doesn't exist
export async function ensureWorkspace(workspaceId: string = DEFAULT_WORKSPACE_ID) {
  try {
    await ensureAuth();
    const wsRef = doc(db, 'workspaces', workspaceId);
    await setDoc(
      wsRef,
      {
        id: workspaceId,
        name: 'Meu Próximo Carro Família',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, `workspaces/${workspaceId}`);
    }
    console.warn('Failed to ensure workspace:', err);
  }
}

// Subscribe to vehicles collection in real time
export function subscribeToVehicles(
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  onUpdate: (vehicles: Vehicle[]) => void,
  onError?: (err: Error) => void
) {
  let unsubscribe: (() => void) | null = null;
  let isCancelled = false;

  ensureAuth()
    .then(() => {
      if (isCancelled) return;
      const colRef = collection(db, 'workspaces', workspaceId, 'vehicles');
      unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const vehicles: Vehicle[] = [];
          snapshot.forEach((docSnap) => {
            vehicles.push({
              id: docSnap.id,
              ...docSnap.data(),
            } as Vehicle);
          });
          onUpdate(vehicles);
        },
        (error: any) => {
          if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
            handleFirestoreError(error, OperationType.LIST, `workspaces/${workspaceId}/vehicles`);
          } else {
            console.warn('Firestore snapshot notice:', error);
            if (onError) onError(error);
          }
        }
      );
    })
    .catch((err) => {
      console.warn('Auth initialization notice:', err);
    });

  return () => {
    isCancelled = true;
    if (unsubscribe) unsubscribe();
  };
}

// Save single vehicle to Firestore
export async function saveVehicleToFirestore(
  vehicle: Vehicle,
  workspaceId: string = DEFAULT_WORKSPACE_ID
) {
  try {
    await ensureAuth();
    const clean = sanitizeVehicle(vehicle);
    const docRef = doc(db, 'workspaces', workspaceId, 'vehicles', vehicle.id);
    await setDoc(docRef, clean, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, `workspaces/${workspaceId}/vehicles/${vehicle.id}`);
    }
    console.warn(`Notice saving vehicle ${vehicle.id} to Firestore:`, err);
  }
}

// Delete single vehicle from Firestore
export async function deleteVehicleFromFirestore(
  vehicleId: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
) {
  try {
    await ensureAuth();
    const docRef = doc(db, 'workspaces', workspaceId, 'vehicles', vehicleId);
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${workspaceId}/vehicles/${vehicleId}`);
    }
    console.warn(`Notice deleting vehicle ${vehicleId} from Firestore:`, err);
  }
}

// Save preferences to Firestore
export async function savePreferencesToFirestore(
  prefs: UserPreferences,
  activeScenarioId?: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
) {
  try {
    await ensureAuth();
    const clean = sanitizePreferences(prefs, activeScenarioId);
    const docRef = doc(db, 'workspaces', workspaceId, 'config', 'preferences');
    await setDoc(docRef, clean, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, `workspaces/${workspaceId}/config/preferences`);
    }
    console.warn('Notice saving preferences to Firestore:', err);
  }
}

// Automatic seed/sync from local storage if cloud workspace is empty
export async function syncLocalVehiclesToCloudIfEmpty(
  localVehicles: Vehicle[],
  localPrefs: UserPreferences,
  activeScenarioId: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Promise<boolean> {
  if (!localVehicles || localVehicles.length === 0) return false;

  try {
    await ensureAuth();
    const colRef = collection(db, 'workspaces', workspaceId, 'vehicles');
    const existing = await getDocs(colRef);

    if (existing.empty) {
      await ensureWorkspace(workspaceId);

      for (const v of localVehicles) {
        await saveVehicleToFirestore(v, workspaceId);
      }

      await savePreferencesToFirestore(localPrefs, activeScenarioId, workspaceId);
      return true;
    }
    return false;
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      handleFirestoreError(err, OperationType.GET, `workspaces/${workspaceId}/vehicles`);
    }
    console.warn('Notice checking local-to-cloud sync:', err);
    return false;
  }
}

// Explicitly push and overwrite all vehicles in Firestore with the current platform data
export async function pushAllLocalToCloud(
  localVehicles: Vehicle[],
  localPrefs: UserPreferences,
  activeScenarioId?: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await ensureAuth();
    await ensureWorkspace(workspaceId);

    const colRef = collection(db, 'workspaces', workspaceId, 'vehicles');
    const existingSnap = await getDocs(colRef);
    const newIds = new Set(localVehicles.map((v) => v.id));

    // Delete existing documents in cloud that aren't in local list
    for (const docSnap of existingSnap.docs) {
      if (!newIds.has(docSnap.id)) {
        await deleteDoc(doc(db, 'workspaces', workspaceId, 'vehicles', docSnap.id));
      }
    }

    // Save all current local vehicles to cloud
    for (const v of localVehicles) {
      await saveVehicleToFirestore(v, workspaceId);
    }

    // Save preferences
    await savePreferencesToFirestore(localPrefs, activeScenarioId, workspaceId);

    return { success: true, count: localVehicles.length };
  } catch (err: any) {
    console.error('Error pushing data to cloud:', err);
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}
