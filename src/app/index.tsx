import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Colors, Typography, Spacing } from '@/constants/theme';
import {
  getStreakCount,
  getTotalSessions,
  isOnboardingComplete,
} from '@/features/storage/mmkv';
import { getRecentSessions } from '@/features/storage/sqlite';
import { getTodayString } from '@/lib/utils';
import { logEvent } from '@/lib/analytics';
import type { SessionData } from '@/games/types';

export default function HomeScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [todaySession, setTodaySession] = useState<SessionData | null>(null);
  const [lastSession, setLastSession] = useState<SessionData | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  if (!isOnboardingComplete()) {
    return <Redirect href="/onboarding" />;
  }

  const loadData = useCallback(() => {
    setStreak(getStreakCount());
    setTotalSessions(getTotalSessions());

    const today = getTodayString();
    getRecentSessions(10).then((sessions) => {
      const todayResult = sessions.find(
        (s) => s.startedAt.slice(0, 10) === today,
      );
      setTodaySession(todayResult ?? null);

      if (sessions.length > 0) {
        setLastSession(sessions[0]);
      }

      if (todayResult) {
        const prev = sessions.find(
          (s) => s.startedAt.slice(0, 10) !== today,
        );
        setPreviousScore(prev?.compositeScore ?? null);
      } else if (sessions.length >= 2) {
        setPreviousScore(sessions[1].compositeScore);
      } else {
        setPreviousScore(null);
      }
    });
  }, []);

  useFocusEffect(loadData);

  useFocusEffect(
    useCallback(() => {
      logEvent({ name: 'screen_view', params: { screen: 'home' } });
    }, []),
  );

  const hasTodaySession = todaySession !== null;
  const displayScore = hasTodaySession
    ? todaySession.compositeScore
    : lastSession?.compositeScore ?? 0;

  const scoreDiff =
    previousScore !== null && displayScore > 0
      ? Math.round(displayScore - previousScore)
      : null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.appName}>BrainPulse</Text>
        <Text style={styles.tagline}>오늘 뇌 컨디션은 어떨까?</Text>
      </View>

      <View style={styles.center}>
        {hasTodaySession ? (
          <View style={styles.lastScore}>
            <Text style={styles.lastScoreLabel}>TODAY'S SCORE</Text>
            <ScoreDisplay score={todaySession.compositeScore} size="lg" />
            {scoreDiff !== null && scoreDiff !== 0 && (
              <View style={styles.trendContainer}>
                <Text
                  style={[
                    styles.trendText,
                    {
                      color:
                        scoreDiff > 0
                          ? Colors.success
                          : Colors.danger,
                    },
                  ]}
                >
                  {scoreDiff > 0 ? '▲' : '▼'} {Math.abs(scoreDiff)}점{' '}
                  {scoreDiff > 0 ? '상승' : '하락'}
                </Text>
              </View>
            )}
          </View>
        ) : lastSession ? (
          <View style={styles.lastScore}>
            <Text style={styles.lastScoreLabel}>LAST SCORE</Text>
            <ScoreDisplay score={lastSession.compositeScore} size="lg" />
            <Text style={styles.noTodayText}>오늘 아직 체크하지 않았어요</Text>
          </View>
        ) : (
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeEmoji}>🧠</Text>
            <Text style={styles.welcomeText}>
              매일 5분,{'\n'}뇌 컨디션을 체크하세요
            </Text>
            <Text style={styles.welcomeSubtext}>
              Train less, measure more.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {streak > 0 ? `🔥 ${streak}` : '0'}
          </Text>
          <Text style={styles.statLabel}>
            {streak > 0 ? `${streak}일 연속` : '연속 기록'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>총 세션</Text>
        </View>
      </View>

      {streak === 0 && totalSessions > 0 && (
        <Text style={styles.encourageText}>
          다시 시작해볼까요? 첫 걸음이 가장 중요해요!
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          title={hasTodaySession ? '다시 체크하기' : '뇌 컨디션 체크 시작'}
          onPress={() => router.push('/condition-check')}
          size="lg"
        />
        <View style={styles.secondaryActions}>
          <Button
            title="📊 기록"
            variant="secondary"
            onPress={() => router.push('/history')}
            size="md"
          />
          <Button
            title="⚙️ 설정"
            variant="ghost"
            onPress={() => router.push('/settings')}
            size="md"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  appName: {
    ...Typography.heading1,
    color: Colors.primary,
    letterSpacing: 1,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastScore: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lastScoreLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  noTodayText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  trendContainer: {
    marginTop: Spacing.xs,
  },
  trendText: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  welcomeBox: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  welcomeEmoji: {
    fontSize: 64,
  },
  welcomeText: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  welcomeSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  encourageText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
