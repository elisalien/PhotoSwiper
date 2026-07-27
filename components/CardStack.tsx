import { useCallback } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ActionOverlay, SwipeDirection } from '@/components/ActionOverlay';
import { SwipeCard } from '@/components/SwipeCard';
import { MediaAsset } from '@/services/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const UP_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 800;

type CardStackProps = {
  assets: MediaAsset[];
  isVideo: boolean;
  onSwipeLeft: (asset: MediaAsset) => void;
  onSwipeRight: (asset: MediaAsset) => void;
  onSwipeUp: (asset: MediaAsset) => void;
};

export function CardStack({
  assets,
  isVideo,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}: CardStackProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const direction = useSharedValue<SwipeDirection>(null);
  const progress = useSharedValue(0);

  const currentAsset = assets[0];
  const nextAsset = assets[1];

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    direction.value = null;
    progress.value = withTiming(0, { duration: 150 });
  }, [direction, progress, translateX, translateY]);

  const flyOut = useCallback(
    (targetX: number, targetY: number, callback: () => void) => {
      translateX.value = withTiming(targetX, { duration: 250 });
      translateY.value = withTiming(targetY, { duration: 250 }, () => {
        runOnJS(callback)();
      });
    },
    [translateX, translateY],
  );

  const handleSwipeLeft = useCallback(() => {
    if (!currentAsset) return;
    flyOut(-SCREEN_WIDTH * 1.5, 0, () => {
      onSwipeLeft(currentAsset);
    });
  }, [currentAsset, flyOut, onSwipeLeft]);

  const handleSwipeRight = useCallback(() => {
    if (!currentAsset) return;
    flyOut(SCREEN_WIDTH * 1.5, 0, () => {
      onSwipeRight(currentAsset);
    });
  }, [currentAsset, flyOut, onSwipeRight]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;

      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);

      if (e.translationY < -40 && absY > absX) {
        direction.value = 'up';
        progress.value = interpolate(absY, [0, UP_THRESHOLD], [0, 1], Extrapolation.CLAMP);
      } else if (e.translationX > 0 && absX > absY) {
        direction.value = 'right';
        progress.value = interpolate(absX, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
      } else if (e.translationX < 0 && absX > absY) {
        direction.value = 'left';
        progress.value = interpolate(absX, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
      } else {
        direction.value = null;
        progress.value = 0;
      }
    })
    .onEnd((e) => {
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);
      const velocityX = Math.abs(e.velocityX);
      const velocityY = Math.abs(e.velocityY);

      if (
        (e.translationY < -UP_THRESHOLD || (e.translationY < -60 && velocityY > VELOCITY_THRESHOLD)) &&
        absY > absX
      ) {
        if (currentAsset) {
          runOnJS(onSwipeUp)(currentAsset);
        }
        runOnJS(resetPosition)();
        return;
      }

      if (
        e.translationX > SWIPE_THRESHOLD ||
        (e.translationX > 60 && velocityX > VELOCITY_THRESHOLD && e.translationX > 0)
      ) {
        runOnJS(handleSwipeRight)();
        return;
      }

      if (
        e.translationX < -SWIPE_THRESHOLD ||
        (e.translationX < -60 && velocityX > VELOCITY_THRESHOLD && e.translationX < 0)
      ) {
        runOnJS(handleSwipeLeft)();
        return;
      }

      runOnJS(resetPosition)();
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-12, 0, 12])}deg`,
      },
    ],
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          Math.sqrt(translateX.value ** 2 + translateY.value ** 2),
          [0, SWIPE_THRESHOLD],
          [0.95, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      Math.sqrt(translateX.value ** 2 + translateY.value ** 2),
      [0, SWIPE_THRESHOLD],
      [0.6, 1],
      Extrapolation.CLAMP,
    ),
  }));

  if (!currentAsset) {
    return null;
  }

  return (
    <View style={styles.container}>
      {nextAsset && (
        <Animated.View style={[styles.cardContainer, styles.nextCard, nextCardStyle]}>
          <SwipeCard asset={nextAsset} isVideo={isVideo} isActive={false} />
        </Animated.View>
      )}

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardContainer, cardStyle]}>
          <ActionOverlay direction={direction} progress={progress} />
          <SwipeCard asset={currentAsset} isVideo={isVideo} isActive={true} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    ...StyleSheet.absoluteFill,
    marginHorizontal: 16,
    marginVertical: 24,
  },
  nextCard: {
    zIndex: 0,
  },
});
