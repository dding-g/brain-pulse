import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius, getScoreColor, getScoreLabel } from '@/constants/theme';
import { captureAndShare } from '@/features/report/share-card';
import { useSession } from '@/features/session/context';
import { calculateCompositeScore } from '@/lib/scoring';
import { generateSessionId } from '@/lib/scoring';
import { updateStreak, incrementTotalSessions, getStreakCount } from '@/features/storage/mmkv';
import { updateDifficulty } from '@/features/adaptive/difficulty';
import { insertSession, upsertDailySummary, getSessionCountForDate } from '@/features/storage/sqlite';
import { getGameById } from '@/games/registry';
import { getTodayString } from '@/lib/utils';
import { submitSessionScores } from '@/lib/api';
import type { SessionData } from '@/games/types';

export default function ReportScreen() {
  const router = useRouter();
  const shareRef = useRef<View>(null);
  const { state, finishSession, resetSession } = useSession();
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState(0);

  const compositeScore = calculateCompositeScore(state.gameResults);
  const scoreLabel = getScoreLabel(compositeScore);
  const scoreColor = getScoreColor(compositeScore);

  useEffect(() => {
    if (saved || state.gameResults.length === 0) return;

    async function saveSession() {
      try {
        const sessionId = generateSessionId();
        const now = new Date().toISOString();
        const today = getTodayString();

        const sessionData: SessionData = {
          id: sessionId,
          startedAt: state.sessionStartedAt ?? now,
          endedAt: now,
          mode: state.mode ?? 'activation',
          gameResults: state.gameResults,
          compositeScore,
          conditionBefore: state.conditionReport!,
        };

        await insertSession(sessionData);

        // Update streak and stats
        const newStreak = updateStreak();
        setStreak(newStreak);
        incrementTotalSessions();

        // Update difficulty for each game
        for (const result of state.gameResults) {
          updateDifficulty(result);
        }

        // Update daily summary
        const sessionCountToday = await getSessionCountForDate(today);
        const prevScores = state.gameResults.map((r) => r.score);
        const bestScore = Math.max(...prevScores, compositeScore);

        await upsertDailySummary({
          date: today,
          avgScore: compositeScore,
          sessionCount: sessionCountToday,
          bestScore,
          streakCount: newStreak,
        });

        // Submit scores to backend (fire-and-forget, non-blocking)
        if (state.mode) {
          submitSessionScores(state.gameResults, state.mode);
        }

        finishSession();
        setSaved(true);
      } catch (e) {
        console.error('Failed to save session:', e);
        setSaved(true);
      }
    }

    saveSession();
  }, [saved]);

  function handleDone() {
    resetSession();
    router.replace('/');
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>오늘의 뇌 컨디션</Text>
          <Text style={styles.subtitle}>Today's Brain Condition</Text>
        </View>

        <View ref={shareRef} style={styles.shareCard} collapsable={false}>
          <ScoreDisplay score={compositeScore} size="lg" />

          <View style={styles.toneContainer}>
            <Text style={[styles.toneLabel, { color: scoreColor }]}>
              {scoreLabel.ko}
            </Text>
            <Text style={styles.toneMessage}>
              {compositeScore >= 90
                ? '오늘 뇌가 불타고 있어요!'
                : compositeScore >= 70
                  ? '좋은 컨디션이에요! 집중력이 높아요.'
                  : compositeScore >= 50
                    ? '보통 컨디션이에요. 무리하지 마세요.'
                    : '충분한 휴식이 필요해요.'}
            </Text>
          </View>

          <View style={styles.breakdown}>
            {state.gameResults.map((result) => {
              const gameDef = getGameById(result.gameId);
              const color = getScoreColor(result.score);
              return (
                <Card key={result.gameId} style={styles.gameCard}>
                  <View style={styles.gameCardRow}>
                    <View style={styles.gameCardInfo}>
                      <Text style={styles.gameCardName}>
                        {gameDef?.nameKo ?? result.gameId}
                      </Text>
                      <Text style={styles.gameCardDomain}>
                        {gameDef?.name ?? ''}
                      </Text>
                    </View>
                    <Text style={[styles.gameCardScore, { color }]}>
                      {result.score}
                    </Text>
                  </View>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        { width: `${result.score}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>

        {streak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakLabel}>연속 기록</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="공유하기"
            onPress={() => captureAndShare(shareRef)}
            variant="secondary"
          />
          <Button
            title="홈으로"
            onPress={handleDone}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  shareCard: {
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.xl,
  },
  toneContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toneLabel: {
    ...Typography.heading3,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  toneMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  breakdown: {
    width: '100%',
    gap: Spacing.sm,
  },
  gameCard: {
    padding: Spacing.md,
  },
  gameCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  gameCardInfo: {
    gap: 2,
  },
  gameCardName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  gameCardDomain: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  gameCardScore: {
    ...Typography.scoreMini,
  },
  scoreBar: {
    height: 4,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  streakContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  streakValue: {
    ...Typography.heading1,
    color: Colors.primary,
  },
  streakLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  actions: {
    gap: Spacing.md,
  },
});
