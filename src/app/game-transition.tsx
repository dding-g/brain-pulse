import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function GameTransitionScreen() {
  const router = useRouter();

  // TODO: Receive actual game result data via route params or state

  return (
    <ScreenContainer centered>
      <View style={styles.content}>
        <Text style={styles.label}>Game Complete</Text>
        <ScoreDisplay score={75} size="sm" />
        <Text style={styles.stats}>
          Accuracy: 85% | Time: 12s
        </Text>
      </View>

      <View style={styles.nextGame}>
        <Text style={styles.nextLabel}>Next Game</Text>
        <Text style={styles.nextName}>Loading...</Text>
      </View>

      <Button
        title="Continue"
        onPress={() => router.push('/game-session')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  label: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  stats: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  nextGame: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.xxl,
  },
  nextLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  nextName: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
});
