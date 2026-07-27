import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library/legacy';

import type { MediaMode } from './media';
import { markManyAsSorted } from './sorted';

const ALBUM_PREFIX = 'PhotoSwiper';
const ALBUM_IDS_KEY = '@photoswiper/album-ids';

type AlbumIdMap = Record<string, string>;

/** Caractères interdits dans les noms de dossiers Android. */
function sanitizeFolderName(name: string): string {
  return name
    .trim()
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 60);
}

/** Chemin relatif MediaStore / disque : Pictures/PhotoSwiper/Favoris */
export function albumTitleForFolder(folderName: string): string {
  return `${ALBUM_PREFIX}/${sanitizeFolderName(folderName)}`;
}

export function getAlbumPath(folderName: string): string {
  return `Pictures/${albumTitleForFolder(folderName)}/`;
}

async function readAlbumIds(): Promise<AlbumIdMap> {
  try {
    const raw = await AsyncStorage.getItem(ALBUM_IDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AlbumIdMap;
  } catch {
    return {};
  }
}

async function saveAlbumId(folderName: string, albumId: string): Promise<void> {
  const map = await readAlbumIds();
  map[sanitizeFolderName(folderName)] = albumId;
  await AsyncStorage.setItem(ALBUM_IDS_KEY, JSON.stringify(map));
}

async function findAlbumByTitle(title: string): Promise<MediaLibrary.Album | null> {
  try {
    return await MediaLibrary.getAlbumAsync(title);
  } catch {
    return null;
  }
}

/**
 * Retrouve l'album PhotoSwiper correspondant au dossier.
 * Sur Android, BUCKET_DISPLAY_NAME est souvent le dernier segment du chemin.
 */
async function resolveAlbum(folderName: string): Promise<MediaLibrary.Album | null> {
  const key = sanitizeFolderName(folderName);
  const title = albumTitleForFolder(folderName);
  const leaf = key;

  const ids = await readAlbumIds();
  if (ids[key]) {
    try {
      const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
      const byId = albums.find((a) => a.id === ids[key]);
      if (byId) return byId;
    } catch {
      // ignore
    }
  }

  return (
    (await findAlbumByTitle(title)) ??
    (await findAlbumByTitle(leaf)) ??
    (await findAlbumByTitle(`${ALBUM_PREFIX} - ${leaf}`))
  );
}

async function ensureAlbumWritable(album: MediaLibrary.Album): Promise<void> {
  try {
    const needs = await MediaLibrary.albumNeedsMigrationAsync(album);
    if (needs) {
      await MediaLibrary.migrateAlbumIfNeededAsync(album);
    }
  } catch {
    // Migration optionnelle — on tente quand même le déplacement
  }
}

export type MoveResult = {
  ok: boolean;
  path?: string;
  error?: string;
};

/**
 * Déplace physiquement le fichier vers Pictures/PhotoSwiper/<dossier>/
 * et l'associe à l'album galerie correspondant (visible dans Photos / Fichiers).
 */
export async function moveAssetToFolder(
  asset: MediaLibrary.Asset,
  folderName: string,
): Promise<MoveResult> {
  const path = getAlbumPath(folderName);
  const title = albumTitleForFolder(folderName);

  try {
    let album = await resolveAlbum(folderName);

    if (!album) {
      // copyAsset=false → déplace le fichier dans le dossier physique
      album = await MediaLibrary.createAlbumAsync(title, asset, false);
      if (!album) {
        return {
          ok: false,
          error: 'Impossible de créer le dossier dans la galerie.',
        };
      }
      await saveAlbumId(folderName, album.id);
      await ensureAlbumWritable(album);
      return { ok: true, path };
    }

    await ensureAlbumWritable(album);
    const moved = await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    if (!moved) {
      return {
        ok: false,
        error: 'Déplacement refusé. Autorisez la modification du fichier dans la boîte de dialogue Android.',
      };
    }
    await saveAlbumId(folderName, album.id);
    return { ok: true, path };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('permission') || message.includes('Permission') || message.includes('grant')) {
      return {
        ok: false,
        error: 'Autorisez PhotoSwiper à modifier ce fichier pour le ranger dans le dossier.',
      };
    }
    return {
      ok: false,
      error: `Échec du rangement : ${message}`,
    };
  }
}

/**
 * Indexe les médias déjà présents dans les albums PhotoSwiper/*
 * pour qu'ils ne réapparaissent pas dans le deck.
 */
export async function syncFiledAlbumsIntoSorted(mode: MediaMode): Promise<number> {
  try {
    const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
    const ours = albums.filter(
      (a) =>
        a.title === ALBUM_PREFIX ||
        a.title.startsWith(`${ALBUM_PREFIX}/`) ||
        a.title.startsWith(`${ALBUM_PREFIX} - `),
    );
    if (ours.length === 0) return 0;

    const mediaType =
      mode === 'photos' ? MediaLibrary.MediaType.photo : MediaLibrary.MediaType.video;
    const ids: string[] = [];

    for (const album of ours) {
      let after: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const page = await MediaLibrary.getAssetsAsync({
          album,
          mediaType,
          first: 100,
          after,
        });
        for (const a of page.assets) {
          ids.push(a.id);
        }
        hasMore = page.hasNextPage;
        after = page.endCursor;
      }
    }

    await markManyAsSorted(mode, ids);
    return ids.length;
  } catch {
    return 0;
  }
}
