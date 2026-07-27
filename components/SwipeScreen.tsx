import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardStack } from '@/components/CardStack';
import { FolderPicker } from '@/components/FolderPicker';
import { GlassPanel } from '@/components/GlassPanel';
import {
  cancelQueuedDelete,
  confirmDeleteSwipe,
  flushDeletes,
  getPendingDeleteCount,
  keepAsset,
  moveAsset,
  queueDelete,
  UndoState,
} from '@/services/actions';
import {
  fetchMediaPage,
  getMediaCount,
  MediaAsset,
  MediaMode,
  requestMediaPermissions,
} from '@/services/media';
import { syncFiledAlbumsIntoSorted } from '@/services/folders';
import { getFolders } from '@/services/settings';
import {
  getSortedIds,
  hasAlbumsMigrationRun,
  markAlbumsMigrationDone,
  markAsSorted,
  unmarkAsSorted,
} from '@/services/sorted';
import { colors, spacing, typography } from '@/theme';

/** Seuil : flush auto pour une seule boîte Android (évite un lot trop gros). */
const AUTO_FLUSH_THRESHOLD = 25;

type SwipeScreenProps = {
  mode: MediaMode;
};

export default function SwipeScreen({ mode }: SwipeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isVideo = mode === 'videos';
  const flushingRef = useRef(false);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [folders, setFolders] = useState<string[]>([]);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [pendingFolderAsset, setPendingFolderAsset] = useState<MediaAsset | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [flushing, setFlushing] = useState(false);
  const excludedRef = useRef<Set<string>>(new Set());

  const title = isVideo ? 'Vidéos' : 'Photos';

  const runFlush = useCallback(async (): Promise<boolean> => {
    if (flushingRef.current) return true;
    if (getPendingDeleteCount() === 0) return true;

    flushingRef.current = true;
    setFlushing(true);
    try {
      const { deleted, failed } = await flushDeletes();
      setPendingCount(getPendingDeleteCount());
      if (failed) {
        Alert.alert(
          'Suppression annulée',
          'Les fichiers restent dans la file. Vous pourrez confirmer plus tard.',
        );
        return false;
      }
      if (deleted > 0) {
        setUndoState(null);
      }
      return true;
    } finally {
      flushingRef.current = false;
      setFlushing(false);
      setPendingCount(getPendingDeleteCount());
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await requestMediaPermissions();
      setHasPermission(granted);
      if (!granted) {
        return;
      }

      // Une seule fois : indexer les médias déjà rangés dans PhotoSwiper/*
      if (!(await hasAlbumsMigrationRun())) {
        await syncFiledAlbumsIntoSorted('photos');
        await syncFiledAlbumsIntoSorted('videos');
        await markAlbumsMigrationDone();
      }
      const excluded = await getSortedIds(mode);
      excludedRef.current = excluded;

      const [count, folderList, page] = await Promise.all([
        getMediaCount(mode),
        getFolders(),
        fetchMediaPage(mode, undefined, excluded),
      ]);

      setRemaining(count);
      setFolders(folderList);
      setAssets(page.assets);
      setEndCursor(page.endCursor);
      setHasMore(page.hasMore);
    } catch {
      setHasPermission(false);
      setAssets([]);
      setRemaining(0);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Flush la file à la sortie de l'écran (une seule confirmation Android)
  useFocusEffect(
    useCallback(() => {
      return () => {
        void runFlush();
      };
    }, [runFlush]),
  );

  const loadMoreIfNeeded = useCallback(async () => {
    if (!hasMore || !endCursor || assets.length > 5) return;
    const page = await fetchMediaPage(mode, endCursor, excludedRef.current);
    setAssets((prev) => {
      const seen = new Set(prev.map((a) => a.id));
      const next = page.assets.filter((a) => !seen.has(a.id));
      return [...prev, ...next];
    });
    setEndCursor(page.endCursor);
    setHasMore(page.hasMore);
  }, [assets.length, endCursor, hasMore, mode]);

  useEffect(() => {
    loadMoreIfNeeded();
  }, [loadMoreIfNeeded, assets.length]);

  const removeAsset = useCallback((asset: MediaAsset) => {
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    setRemaining((r) => Math.max(0, r - 1));
  }, []);

  const handleSwipeLeft = useCallback(
    async (asset: MediaAsset) => {
      await confirmDeleteSwipe();
      excludedRef.current.add(asset.id);
      await markAsSorted(mode, asset.id);
      removeAsset(asset);
      const state = queueDelete(asset);
      setUndoState(state);
      setPendingCount(state.pendingCount);

      if (state.pendingCount >= AUTO_FLUSH_THRESHOLD) {
        await runFlush();
      }
    },
    [mode, removeAsset, runFlush],
  );

  const handleSwipeRight = useCallback(
    async (asset: MediaAsset) => {
      await keepAsset();
      excludedRef.current.add(asset.id);
      await markAsSorted(mode, asset.id);
      removeAsset(asset);
    },
    [mode, removeAsset],
  );

  const handleSwipeUp = useCallback((asset: MediaAsset) => {
    setPendingFolderAsset(asset);
    setFolderPickerVisible(true);
  }, []);

  const handleFolderSelect = useCallback(
    async (folder: string) => {
      if (!pendingFolderAsset) return;
      setFolderPickerVisible(false);
      const asset = pendingFolderAsset;
      setPendingFolderAsset(null);
      const result = await moveAsset(asset, folder);
      if (result.ok) {
        excludedRef.current.add(asset.id);
        await markAsSorted(mode, asset.id);
        removeAsset(asset);
      } else {
        Alert.alert(
          'Rangement impossible',
          result.error ??
            'Impossible de déplacer le fichier dans le dossier de la galerie. Réessayez et acceptez la demande Android.',
        );
      }
    },
    [mode, pendingFolderAsset, removeAsset],
  );

  const handleFolderCancel = useCallback(() => {
    setFolderPickerVisible(false);
    setPendingFolderAsset(null);
  }, []);

  const handleUndo = useCallback(async () => {
    if (!undoState) return;
    const restored = cancelQueuedDelete(undoState.asset.id);
    if (restored) {
      excludedRef.current.delete(restored.id);
      await unmarkAsSorted(mode, restored.id);
      setAssets((prev) => [restored, ...prev]);
      setRemaining((r) => r + 1);
    }
    setUndoState(null);
    setPendingCount(getPendingDeleteCount());
  }, [mode, undoState]);

  const handleBack = useCallback(async () => {
    await runFlush();
    router.back();
  }, [router, runFlush]);

  if (loading) {
    return (
      <LinearGradient colors={[colors.bg.primary, colors.bg.secondary, colors.bg.tertiary]} style={styles.fill}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.iridescent.mid} />
        </View>
      </LinearGradient>
    );
  }

  if (!hasPermission) {
    return (
      <LinearGradient colors={[colors.bg.primary, colors.bg.secondary, colors.bg.tertiary]} style={styles.fill}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <GlassPanel style={styles.permissionPanel}>
            <Ionicons name="images-outline" size={48} color={colors.iridescent.mid} />
            <Text style={styles.permissionTitle}>Accès à la galerie requis</Text>
            <Text style={styles.permissionText}>
              PhotoSwiper a besoin d&apos;accéder à vos {isVideo ? 'vidéos' : 'photos'} pour fonctionner.
            </Text>
            <Pressable onPress={loadInitial} style={styles.permissionButton}>
              <LinearGradient
                colors={[colors.iridescent.start, colors.iridescent.mid, colors.iridescent.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.permissionButtonGradient}
              >
                <Text style={styles.permissionButtonText}>Autoriser</Text>
              </LinearGradient>
            </Pressable>
          </GlassPanel>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.bg.primary, colors.bg.secondary, colors.bg.tertiary]} style={styles.fill}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleBack} style={styles.iconButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerCount}>{remaining} restantes</Text>
        </View>
        {pendingCount > 0 ? (
          <Pressable onPress={runFlush} style={styles.flushButton} hitSlop={8} disabled={flushing}>
            <Ionicons name="trash" size={16} color="#ef4444" />
            <Text style={styles.flushCount}>{pendingCount}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/settings')} style={styles.iconButton} hitSlop={12}>
            <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.stackArea}>
        {assets.length > 0 ? (
          <CardStack
            key={assets[0]?.id ?? 'empty'}
            assets={assets}
            isVideo={isVideo}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
          />
        ) : (
          <GlassPanel style={styles.emptyPanel}>
            <Ionicons
              name={isVideo ? 'videocam-outline' : 'images-outline'}
              size={48}
              color={colors.iridescent.mid}
            />
            <Text style={styles.emptyTitle}>Tout est trié !</Text>
            <Text style={styles.emptyText}>
              Vous avez parcouru toutes vos {isVideo ? 'vidéos' : 'photos'}.
            </Text>
            {pendingCount > 0 && (
              <Pressable onPress={runFlush} style={styles.permissionButton} disabled={flushing}>
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.permissionButtonGradient}
                >
                  <Text style={styles.permissionButtonText}>
                    {flushing ? 'Suppression…' : `Confirmer ${pendingCount} suppression${pendingCount > 1 ? 's' : ''}`}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </GlassPanel>
        )}
      </View>

      <View style={[styles.hints, { paddingBottom: insets.bottom + spacing.md }]}>
        <Hint icon="arrow-back" label="Supprimer" color="#ef4444" />
        <Hint icon="arrow-up" label="Ranger" color={colors.iridescent.mid} />
        <Hint icon="arrow-forward" label="Garder" color="#22c55e" />
      </View>

      {undoState && (
        <Pressable
          onPress={handleUndo}
          style={[styles.undoToast, { bottom: insets.bottom + 80 }]}
        >
          <GlassPanel intensity={60} style={styles.undoPanel}>
            <Text style={styles.undoText}>
              {undoState.pendingCount} en file — Annuler la dernière
            </Text>
          </GlassPanel>
        </Pressable>
      )}

      <FolderPicker
        folders={folders}
        visible={folderPickerVisible}
        onSelect={handleFolderSelect}
        onCancel={handleFolderCancel}
      />
    </LinearGradient>
  );
}

function Hint({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.hint}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.hintLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  headerCount: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flushButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  flushCount: {
    ...typography.label,
    color: '#ef4444',
    fontSize: 13,
  },
  stackArea: {
    flex: 1,
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  hint: {
    alignItems: 'center',
    gap: 4,
  },
  hintLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  emptyPanel: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  permissionPanel: {
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  permissionTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  permissionButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  permissionButtonGradient: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    ...typography.label,
    color: '#fff',
  },
  undoToast: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 200,
  },
  undoPanel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  undoText: {
    ...typography.caption,
    color: colors.text.primary,
  },
});
