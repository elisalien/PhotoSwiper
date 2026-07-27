import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radii } from '@/theme';

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  bordered?: boolean;
};

export function GlassPanel({
  children,
  style,
  intensity = 40,
  bordered = true,
}: GlassPanelProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {bordered && (
        <LinearGradient
          colors={[colors.iridescent.start, colors.iridescent.mid, colors.iridescent.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[styles.blur, bordered && styles.blurBordered]}
      >
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.glass.bg,
  },
  blurBordered: {
    margin: 1,
    borderRadius: radii.md - 1,
  },
  inner: {
    padding: 16,
  },
});
