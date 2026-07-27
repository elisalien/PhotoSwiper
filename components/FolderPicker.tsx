import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/GlassPanel';
import { colors, radii, spacing, typography } from '@/theme';

type FolderPickerProps = {
  folders: string[];
  visible: boolean;
  onSelect: (folder: string) => void;
  onCancel: () => void;
};

export function FolderPicker({ folders, visible, onSelect, onCancel }: FolderPickerProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <GlassPanel style={styles.panel} intensity={50}>
        <Text style={styles.title}>Choisir un dossier</Text>
        <Text style={styles.subtitle}>Le fichier sera déplacé dans la galerie du téléphone</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {folders.map((folder) => (
            <Pressable key={folder} onPress={() => onSelect(folder)} style={styles.chipWrapper}>
              <LinearGradient
                colors={[colors.iridescent.start, colors.iridescent.mid, colors.iridescent.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chipBorder}
              >
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{folder}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.subtitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chipWrapper: {
    marginRight: spacing.sm,
  },
  chipBorder: {
    borderRadius: radii.full,
    padding: 1,
  },
  chip: {
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  chipText: {
    ...typography.label,
    color: colors.text.primary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.text.muted,
  },
});
