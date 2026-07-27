import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/GlassPanel';
import { getAlbumPath } from '@/services/folders';
import { addFolder, getFolders, removeFolder } from '@/services/settings';
import { getSortedTotals, resetSortedHistory } from '@/services/sorted';
import { colors, radii, spacing, typography } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [folders, setFolders] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState('');
  const [sortedTotals, setSortedTotals] = useState<{ photos: number; videos: number } | null>(null);

  const loadFolders = useCallback(async () => {
    setFolders(await getFolders());
  }, []);

  const loadTotals = useCallback(async () => {
    setSortedTotals(await getSortedTotals());
  }, []);

  useEffect(() => {
    loadFolders();
    loadTotals();
  }, [loadFolders, loadTotals]);

  const handleAdd = async () => {
    const trimmed = newFolder.trim();
    if (!trimmed) return;
    const updated = await addFolder(trimmed);
    setFolders(updated);
    setNewFolder('');
  };

  const handleRemove = (name: string) => {
    Alert.alert('Supprimer le dossier', `Retirer « ${name} » de la liste ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setFolders(await removeFolder(name));
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset swipe',
      'Remettre toutes les photos et vidéos dans le deck de tri ? Les fichiers sur le téléphone ne sont pas modifiés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await resetSortedHistory();
            await loadTotals();
            Alert.alert('Terminé', 'L’historique de swipe a été réinitialisé.');
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={[colors.bg.primary, colors.bg.secondary, colors.bg.tertiary]} style={styles.fill}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Dossiers prédéfinis</Text>
        <Text style={styles.sectionDesc}>
          Swipez vers le haut pour ranger un média. Le fichier est déplacé physiquement vers{' '}
          {getAlbumPath('…')} — visible dans la galerie et l&apos;explorateur de fichiers Android.
        </Text>

        <View style={styles.folderList}>
          {folders.map((folder) => (
            <GlassPanel key={folder} style={styles.folderItem} bordered={false}>
              <View style={styles.folderRow}>
                <Ionicons name="folder-outline" size={22} color={colors.iridescent.mid} />
                <View style={styles.folderInfo}>
                  <Text style={styles.folderName}>{folder}</Text>
                  <Text style={styles.folderPath}>{getAlbumPath(folder)}</Text>
                </View>
                <Pressable onPress={() => handleRemove(folder)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.text.muted} />
                </Pressable>
              </View>
            </GlassPanel>
          ))}
        </View>

        <GlassPanel style={styles.addPanel} bordered={false}>
          <Text style={styles.addLabel}>Nouveau dossier</Text>
          <View style={styles.addRow}>
            <TextInput
              value={newFolder}
              onChangeText={setNewFolder}
              placeholder="Ex. Souvenirs"
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable onPress={handleAdd} style={styles.addButton}>
              <LinearGradient
                colors={[colors.iridescent.start, colors.iridescent.mid, colors.iridescent.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </GlassPanel>

        <GlassPanel style={styles.gesturesPanel} bordered={false}>
          <Text style={styles.gesturesTitle}>Gestes</Text>
          <GestureRow icon="arrow-back" color="#ef4444" label="Gauche — Supprimer définitivement" />
          <GestureRow icon="arrow-forward" color="#22c55e" label="Droite — Garder" />
          <GestureRow
            icon="arrow-up"
            color={colors.iridescent.mid}
            label="Haut — Ranger dans un dossier"
          />
        </GlassPanel>

        <GlassPanel style={styles.resetPanel} bordered={false}>
          <Text style={styles.gesturesTitle}>Historique de tri</Text>
          <Text style={styles.resetDesc}>
            {sortedTotals
              ? `${sortedTotals.photos} photos et ${sortedTotals.videos} vidéos déjà triées (exclues des swipes).`
              : 'Chargement…'}
          </Text>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={styles.resetButtonText}>Reset swipe</Text>
          </Pressable>
        </GlassPanel>
      </ScrollView>
    </LinearGradient>
  );
}

function GestureRow({
  icon,
  color,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}) {
  return (
    <View style={styles.gestureRow}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.gestureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...typography.subtitle,
    color: colors.text.primary,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  sectionDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  folderList: {
    gap: spacing.sm,
  },
  folderItem: {
    paddingVertical: spacing.sm,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    ...typography.body,
    color: colors.text.primary,
  },
  folderPath: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  addPanel: {
    marginTop: spacing.sm,
  },
  addLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  addButton: {
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gesturesPanel: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  gesturesTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  gestureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gestureLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  resetPanel: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  resetDesc: {
    ...typography.caption,
    color: colors.text.muted,
    lineHeight: 18,
  },
  resetButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
  },
  resetButtonText: {
    ...typography.label,
    color: '#fff',
  },
});
