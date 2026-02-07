import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function GameSessionScreen() {
  const router = useRouter();

  // TODO: Implement actual game session logic
  // This is a placeholder that will be replaced by the game-developer agent

  return (
    <ScreenContainer centered>
      <ProgressDots total={4} current={0} />

      <View style={styles.content}>
        <Text style={styles.title}>Game Session</Text>
        <Text style={styles.subtitle}>게임 세션이 여기에 표시됩니다</Text>
        <Text style={styles.description}>
          Mini-games will load here during a session.{'\n'}
          Each game runs for up to 30 seconds.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Skip to Report (Dev)"
          onPress={() => router.push('/report')}
          variant="secondary"
        />
        <Button
          title="나가기"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xxl,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  description: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
});
