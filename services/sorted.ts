import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MediaMode } from './media';

const SORTED_KEY = '@photoswiper/sorted-ids';
const ALBUMS_MIGRATED_KEY = '@photoswiper/albums-migrated-v1';

type SortedStore = {
  photos: string[];
  videos: string[];
};

async function readStore(): Promise<SortedStore> {
  try {
    const raw = await AsyncStorage.getItem(SORTED_KEY);
    if (!raw) return { photos: [], videos: [] };
    const parsed = JSON.parse(raw) as Partial<SortedStore>;
    return {
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
    };
  } catch {
    return { photos: [], videos: [] };
  }
}

async function writeStore(store: SortedStore): Promise<void> {
  await AsyncStorage.setItem(SORTED_KEY, JSON.stringify(store));
}

export async function getSortedIds(mode: MediaMode): Promise<Set<string>> {
  const store = await readStore();
  return new Set(mode === 'photos' ? store.photos : store.videos);
}

export async function getSortedCount(mode: MediaMode): Promise<number> {
  const store = await readStore();
  return mode === 'photos' ? store.photos.length : store.videos.length;
}

export async function markAsSorted(mode: MediaMode, assetId: string): Promise<void> {
  const store = await readStore();
  const list = mode === 'photos' ? store.photos : store.videos;
  if (list.includes(assetId)) return;
  list.push(assetId);
  await writeStore(store);
}

export async function markManyAsSorted(mode: MediaMode, assetIds: string[]): Promise<void> {
  if (assetIds.length === 0) return;
  const store = await readStore();
  const list = mode === 'photos' ? store.photos : store.videos;
  const set = new Set(list);
  let changed = false;
  for (const id of assetIds) {
    if (!set.has(id)) {
      set.add(id);
      list.push(id);
      changed = true;
    }
  }
  if (changed) await writeStore(store);
}

export async function unmarkAsSorted(mode: MediaMode, assetId: string): Promise<void> {
  const store = await readStore();
  if (mode === 'photos') {
    store.photos = store.photos.filter((id) => id !== assetId);
  } else {
    store.videos = store.videos.filter((id) => id !== assetId);
  }
  await writeStore(store);
}

/** Remet à zéro l'historique de swipe (gardés + rangés). Les fichiers restent sur le téléphone. */
export async function resetSortedHistory(): Promise<void> {
  await writeStore({ photos: [], videos: [] });
}

export async function getSortedTotals(): Promise<{ photos: number; videos: number }> {
  const store = await readStore();
  return { photos: store.photos.length, videos: store.videos.length };
}

export async function hasAlbumsMigrationRun(): Promise<boolean> {
  return (await AsyncStorage.getItem(ALBUMS_MIGRATED_KEY)) === '1';
}

export async function markAlbumsMigrationDone(): Promise<void> {
  await AsyncStorage.setItem(ALBUMS_MIGRATED_KEY, '1');
}
