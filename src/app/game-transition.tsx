import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { SESSION_CONFIG } from '@/constants/games';
import { useSession } from '@/features/session/context';
import { getGamesForMode, getGameById } from '@/games/registry';
import { formatDuration } from '@/lib/utils';
import { logEvent } from '@/lib/analytics';

export default function GameTransitionScreen() {
  const router = useRouter();
  const { state, advanceGame } = useSession();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const advancedRef = useRef(false);

  const games = useMemo(
    () => getGamesForMode(state.mode ?? 'activation'),
    [state.mode],
  );

  useEffect(() => {
    logEvent({ name: 'screen_view', params: { screen: 'game_transition' } });
  }, []);

  const lastResult = state.gameResults[state.gameResults.length - 1];
  const completedGame = lastResult ? getGameById(lastResult.gameId) : null;
  const nextGameIndex = state.currentGameIndex + 1;
  const nextGame = games[nextGameIndex];

  const handleAdvance = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    advanceGame();
    router.back();
  }, [advanceGame, router]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(handleAdvance, SESSION_CONFIG.transitionDurationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fadeAnim, handleAdvance]);

  if (!lastResult) {
    return (
      <ScreenContainer centered>
        <Text style={styles.errorText}>결과를 불러올 수 없습니다</Text>
      </ScreenContainer>
    );
  }

  const accuracyPct = Math.round(lastResult.accuracy * 100);

  return (
    <Pressable style={styles.pressable} onPress={handleAdvance}>
      <ScreenContainer centered>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.completedLabel}>게임 완료!</Text>
          {completedGame && (
            <Text style={styles.completedName}>{completedGame.nameKo}</Text>
          )}

          <ScoreDisplay score={lastResult.score} size="lg" />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{accuracyPct}%</Text>
              <Text style={styles.statLabel}>정확도</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(lastResult.durationMs)}</Text>
              <Text style={styles.statLabel}>시간</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lastResult.correctCount}/{lastResult.totalCount}</Text>
              <Text style={styles.statLabel}>정답</Text>
            </View>
          </View>

          {nextGame && (
            <View style={styles.nextSection}>
              <Text style={styles.nextLabel}>다음 게임</Text>
              <View style={styles.nextCard}>
                <Text style={styles.nextName}>{nextGame.nameKo}</Text>
                <Text style={styles.nextNameEn}>{nextGame.name}</Text>
                <Text style={styles.nextDesc}>{nextGame.descriptionKo}</Text>
              </View>
            </View>
          )}

          <Text style={styles.tapHint}>탭하여 계속</Text>
        </Animated.View>
      </ScreenContainer>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  completedLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  completedName: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  nextSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    width: '100%',
  },
  nextLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextName: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  nextNameEn: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  nextDesc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
