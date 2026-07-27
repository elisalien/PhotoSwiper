import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors, radii } from '@/theme';

export type SwipeDirection = 'left' | 'right' | 'up' | null;

type ActionOverlayProps = {
  direction: SharedValue<SwipeDirection>;
  progress: SharedValue<number>;
};

export function ActionOverlay({ direction, progress }: ActionOverlayProps) {
  const deleteStyle = useAnimatedStyle(() => ({
    opacity: direction.value === 'left' ? progress.value : 0,
  }));

  const keepStyle = useAnimatedStyle(() => ({
    opacity: direction.value === 'right' ? progress.value : 0,
  }));

  const folderStyle = useAnimatedStyle(() => ({
    opacity: direction.value === 'up' ? progress.value : 0,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.badge, styles.deleteBadge, deleteStyle]}>
        <Ionicons name="trash-outline" size={28} color="#fff" />
        <Text style={styles.label}>Supprimer</Text>
      </Animated.View>

      <Animated.View style={[styles.badge, styles.keepBadge, keepStyle]}>
        <Ionicons name="checkmark-circle-outline" size={28} color="#fff" />
        <Text style={styles.label}>Garder</Text>
      </Animated.View>

      <Animated.View style={[styles.badge, styles.folderBadge, folderStyle]}>
        <LinearGradient
          colors={[colors.iridescent.start, colors.iridescent.mid, colors.iridescent.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.folderGradient}
        >
          <Ionicons name="folder-outline" size={28} color="#fff" />
          <Text style={styles.label}>Ranger</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 2,
  },
  deleteBadge: {
    top: 48,
    right: 24,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.25)',
    transform: [{ rotate: '12deg' }],
  },
  keepBadge: {
    top: 48,
    left: 24,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.25)',
    transform: [{ rotate: '-12deg' }],
  },
  folderBadge: {
    bottom: 120,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -60,
    overflow: 'hidden',
    borderWidth: 0,
  },
  folderGradient: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
