import * as MediaLibrary from 'expo-media-library/legacy';

import { getSortedIds, getSortedCount } from './sorted';

export type MediaMode = 'photos' | 'videos';

export type MediaAsset = MediaLibrary.Asset;

const PAGE_SIZE = 50;
/** Combien d'assets bruts charger par passe pour compenser le filtrage. */
const FETCH_CHUNK = 80;

function isPermissionUsable(response: MediaLibrary.PermissionResponse): boolean {
  return response.status === 'granted' || response.accessPrivileges === 'limited';
}

export async function requestMediaPermissions(): Promise<boolean> {
  try {
    const current = await MediaLibrary.getPermissionsAsync();
    if (isPermissionUsable(current)) {
      return true;
    }

    const response = await MediaLibrary.requestPermissionsAsync(false);
    return isPermissionUsable(response);
  } catch {
    return false;
  }
}

export async function getPermissionStatus(): Promise<MediaLibrary.PermissionStatus> {
  const { status } = await MediaLibrary.getPermissionsAsync();
  return status;
}

function mediaTypeForMode(mode: MediaMode): MediaLibrary.MediaTypeValue {
  return mode === 'photos' ? MediaLibrary.MediaType.photo : MediaLibrary.MediaType.video;
}

/** Fisher–Yates shuffle — ordre aléatoire à chaque session. */
export function shuffleAssets<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getMediaCount(mode: MediaMode): Promise<number> {
  try {
    const result = await MediaLibrary.getAssetsAsync({
      mediaType: mediaTypeForMode(mode),
      first: 1,
    });
    const sorted = await getSortedCount(mode);
    return Math.max(0, result.totalCount - sorted);
  } catch {
    return 0;
  }
}

export type MediaPage = {
  assets: MediaAsset[];
  hasMore: boolean;
  endCursor?: string;
};

async function fetchRawPage(mode: MediaMode, after?: string): Promise<MediaPage> {
  const result = await MediaLibrary.getAssetsAsync({
    mediaType: mediaTypeForMode(mode),
    first: FETCH_CHUNK,
    after,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  return {
    assets: result.assets,
    hasMore: result.hasNextPage,
    endCursor: result.endCursor,
  };
}

/**
 * Charge une page de médias non encore triés (exclus : gardés, rangés).
 * Continue de paginer tant que nécessaire pour remplir ~PAGE_SIZE cartes.
 */
export async function fetchMediaPage(
  mode: MediaMode,
  after?: string,
  excludeIds?: Set<string>,
): Promise<MediaPage> {
  try {
    const excluded = excludeIds ?? (await getSortedIds(mode));
    const collected: MediaAsset[] = [];
    let cursor = after;
    let hasMore = true;
    let lastCursor = after;
    let guard = 0;

    while (collected.length < PAGE_SIZE && hasMore && guard < 40) {
      guard += 1;
      const page = await fetchRawPage(mode, cursor);
      for (const asset of page.assets) {
        if (!excluded.has(asset.id)) {
          collected.push(asset);
          if (collected.length >= PAGE_SIZE) break;
        }
      }
      hasMore = page.hasMore;
      lastCursor = page.endCursor;
      cursor = page.endCursor;
      if (!page.hasMore) break;
    }

    return {
      assets: shuffleAssets(collected),
      hasMore,
      endCursor: lastCursor,
    };
  } catch {
    return { assets: [], hasMore: false };
  }
}

export async function deleteAsset(assetId: string): Promise<boolean> {
  return deleteAssets([assetId]);
}

/** Une seule confirmation Android pour tout le lot. */
export async function deleteAssets(assetIds: string[]): Promise<boolean> {
  if (assetIds.length === 0) return true;
  try {
    return await MediaLibrary.deleteAssetsAsync(assetIds);
  } catch {
    return false;
  }
}
