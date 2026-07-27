import * as Haptics from 'expo-haptics';
import { deleteAssets, MediaAsset } from './media';
import { moveAssetToFolder } from './folders';

/** Files marqués pour suppression — la confirmation système Android n'apparaît qu'au flush. */
const pendingDeleteQueue = new Map<string, MediaAsset>();

export type UndoState = {
  asset: MediaAsset;
  pendingCount: number;
};

export function getPendingDeleteCount(): number {
  return pendingDeleteQueue.size;
}

export function getPendingDeleteIds(): string[] {
  return Array.from(pendingDeleteQueue.keys());
}

export function queueDelete(asset: MediaAsset): UndoState {
  pendingDeleteQueue.set(asset.id, asset);
  return { asset, pendingCount: pendingDeleteQueue.size };
}

export function cancelQueuedDelete(assetId: string): MediaAsset | null {
  const asset = pendingDeleteQueue.get(assetId) ?? null;
  if (asset) {
    pendingDeleteQueue.delete(assetId);
  }
  return asset;
}

/**
 * Supprime tous les médias en file d'attente en un seul appel.
 * Android affiche alors UNE seule boîte de dialogue pour tout le lot.
 */
export async function flushDeletes(): Promise<{ deleted: number; failed: boolean }> {
  const ids = Array.from(pendingDeleteQueue.keys());
  if (ids.length === 0) {
    return { deleted: 0, failed: false };
  }

  const assets = Array.from(pendingDeleteQueue.values());
  pendingDeleteQueue.clear();

  try {
    const ok = await deleteAssets(ids);
    if (!ok) {
      // Remettre en file si l'utilisateur a annulé la boîte système
      for (const asset of assets) {
        pendingDeleteQueue.set(asset.id, asset);
      }
      return { deleted: 0, failed: true };
    }
    return { deleted: ids.length, failed: false };
  } catch {
    for (const asset of assets) {
      pendingDeleteQueue.set(asset.id, asset);
    }
    return { deleted: 0, failed: true };
  }
}

export async function keepAsset(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function moveAsset(
  asset: MediaAsset,
  folderName: string,
): Promise<{ ok: boolean; path?: string; error?: string }> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  return moveAssetToFolder(asset, folderName);
}

export async function confirmDeleteSwipe(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
