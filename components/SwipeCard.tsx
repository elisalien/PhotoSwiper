import { Image, StyleSheet, View } from 'react-native';

import { VideoPlayer } from '@/components/VideoPlayer';
import { MediaAsset } from '@/services/media';
import { colors, radii } from '@/theme';

type SwipeCardProps = {
  asset: MediaAsset;
  isVideo: boolean;
  isActive: boolean;
};

export function SwipeCard({ asset, isVideo, isActive }: SwipeCardProps) {
  return (
    <View style={styles.card}>
      {isVideo ? (
        <VideoPlayer uri={asset.uri} isActive={isActive} />
      ) : (
        <Image source={{ uri: asset.uri }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.vignette} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.bg.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
