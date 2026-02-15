import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  type ViewToken,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { setOnboardingComplete } from '@/features/storage/mmkv';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

const PAGES: OnboardingPage[] = [
  {
    id: '1',
    emoji: '\uD83E\uDDE0',
    title: 'BrainPulse',
    description: '매일 5분, 뇌 컨디션을 체크하세요',
  },
  {
    id: '2',
    emoji: '\uD83C\uDFAE',
    title: '4가지 미니게임',
    description: '속도, 집중, 기억, 계산력을 측정합니다',
  },
  {
    id: '3',
    emoji: '\uD83D\uDCC8',
    title: '시작하기',
    description: '매일 기록하고 변화를 확인하세요',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<OnboardingPage>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOnboardingComplete();
    router.replace('/');
  }, [router]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingComplete();
    router.replace('/');
  }, [router]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderPage = useCallback(
    ({ item, index }: ListRenderItemInfo<OnboardingPage>) => (
      <View style={styles.page}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {/* Sub-icons for page 2 */}
        {index === 1 && (
          <View style={styles.gameIcons}>
            <View style={styles.gameIcon}>
              <Text style={styles.gameIconEmoji}>{'\u26A1'}</Text>
              <Text style={styles.gameIconLabel}>속도</Text>
            </View>
            <View style={styles.gameIcon}>
              <Text style={styles.gameIconEmoji}>{'\uD83C\uDFAF'}</Text>
              <Text style={styles.gameIconLabel}>집중</Text>
            </View>
            <View style={styles.gameIcon}>
              <Text style={styles.gameIconEmoji}>{'\uD83E\uDDE9'}</Text>
              <Text style={styles.gameIconLabel}>기억</Text>
            </View>
            <View style={styles.gameIcon}>
              <Text style={styles.gameIconEmoji}>{'\uD83E\uDDEE'}</Text>
              <Text style={styles.gameIconLabel}>계산</Text>
            </View>
          </View>
        )}

        {/* CTA button on last page */}
        {index === 2 && (
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={handleComplete}
          >
            <Text style={styles.ctaButtonText}>시작하기</Text>
          </Pressable>
        )}
      </View>
    ),
    [handleComplete],
  );

  const isLastPage = currentIndex === PAGES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip button */}
      {!isLastPage && (
        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      )}

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Page indicator dots */}
      <View style={styles.dotsContainer}>
        {PAGES.map((page, index) => (
          <View
            key={page.id}
            style={[
              styles.dot,
              index === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  gameIcons: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.lg,
  },
  gameIcon: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  gameIconEmoji: {
    fontSize: 32,
  },
  gameIconLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  ctaButton: {
    marginTop: Spacing.xxl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  ctaButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  dotInactive: {
    backgroundColor: Colors.surfaceLight,
  },
});
