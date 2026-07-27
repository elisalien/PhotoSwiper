import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/GlassPanel';
import { getMediaCount, requestMediaPermissions } from '@/services/media';
import { colors, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const granted = await requestMediaPermissions();
        if (cancelled) return;

        if (!granted) {
          setPermissionDenied(true);
          setPhotoCount(0);
          setVideoCount(0);
          return;
        }

        const [photos, videos] = await Promise.all([
          getMediaCount('photos'),
          getMediaCount('videos'),
        ]);
        if (cancelled) return;
        setPhotoCount(photos);
        setVideoCount(videos);
      } catch {
        if (cancelled) return;
        setPermissionDenied(true);
        setPhotoCount(0);
        setVideoCount(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LinearGradient colors={[colors.bg.primary, colors.bg.secondary, colors.bg.tertiary]} style={styles.fill}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.brand}>
          <LinearGradient
            colors={[colors.iridescent.start, colors.iridescent.mid, colors.iridescent.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="sparkles" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>PhotoSwiper</Text>
          <Text style={styles.subtitle}>Triez votre galerie en un geste</Text>
        </View>

        {permissionDenied && (
          <GlassPanel style={styles.permissionBanner} bordered={false}>
            <Text style={styles.permissionBannerText}>
              Autorisez l&apos;accès à la galerie pour compter et trier vos médias.
            </Text>
          </GlassPanel>
        )}

        <View style={styles.cards}>
          <ModeCard
            icon="images-outline"
            title="Photos"
            count={photoCount}
            onPress={() => router.push('/swipe/photos')}
          />
          <ModeCard
            icon="videocam-outline"
            title="Vidéos"
            count={videoCount}
            onPress={() => router.push('/swipe/videos')}
          />
        </View>

        <Pressable onPress={() => router.push('/settings')} style={styles.settingsLink}>
          <Ionicons name="settings-outline" size={18} color={colors.text.muted} />
          <Text style={styles.settingsText}>Paramètres</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function ModeCard({
  icon,
  title,
  count,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number | null;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}>
      <GlassPanel style={styles.modeCard}>
        <View style={styles.modeIconWrap}>
          <Ionicons name={icon} size={36} color={colors.iridescent.mid} />
        </View>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeCount}>
          {count !== null ? `${count} ${title.toLowerCase()}` : 'Chargement…'}
        </Text>
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  permissionBanner: {
    marginBottom: spacing.md,
  },
  permissionBannerText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cards: {
    gap: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  cardPressable: {
    borderRadius: 20,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  modeCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  modeIconWrap: {
    marginBottom: spacing.md,
  },
  modeTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
    fontSize: 24,
  },
  modeCount: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  settingsText: {
    ...typography.body,
    color: colors.text.muted,
  },
});
