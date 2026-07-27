import SwipeScreen from '@/components/SwipeScreen';
import { MediaMode } from '@/services/media';
import { useLocalSearchParams } from 'expo-router';

export default function SwipeRoute() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const mediaMode: MediaMode = mode === 'videos' ? 'videos' : 'photos';

  return <SwipeScreen mode={mediaMode} />;
}
