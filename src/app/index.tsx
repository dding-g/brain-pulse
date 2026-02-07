import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { getStreakCount, getTotalSessions } from '@/features/storage/mmkv';

export default function HomeScreen() {
  const router = useRouter();
  const streak = getStreakCount();
  const totalSessions = getTotalSessions();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.appName}>BrainPulse</Text>
        <Text style={styles.tagline}>오늘 뇌 컨디션은 어떨까?</Text>
      </View>

      <View style={styles.center}>
        {totalSessions > 0 ? (
          <View style={styles.lastScore}>
            <Text style={styles.lastScoreLabel}>Last Score</Text>
            <ScoreDisplay score={0} size="lg" />
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
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>연속</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>총 세션</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="뇌 컨디션 체크 시작"
          onPress={() => router.push('/condition-check')}
          size="lg"
        />
        <View style={styles.secondaryActions}>
          <Button
            title="기록"
            variant="secondary"
            onPress={() => router.push('/history')}
            size="md"
          />
          <Button
            title="설정"
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
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
