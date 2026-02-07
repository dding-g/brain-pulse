import { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { captureAndShare } from '@/features/report/share-card';

export default function ReportScreen() {
  const router = useRouter();
  const shareRef = useRef<View>(null);

  // TODO: Get actual session data from state/storage

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Results</Text>
        <Text style={styles.subtitle}>오늘의 뇌 컨디션</Text>
      </View>

      <View ref={shareRef} style={styles.shareCard} collapsable={false}>
        <ScoreDisplay score={72} size="lg" />

        <View style={styles.breakdown}>
          <Card style={styles.domainCard}>
            <Text style={styles.domainLabel}>Reaction</Text>
            <Text style={styles.domainScore}>78</Text>
          </Card>
          <Card style={styles.domainCard}>
            <Text style={styles.domainLabel}>Memory</Text>
            <Text style={styles.domainScore}>65</Text>
          </Card>
          <Card style={styles.domainCard}>
            <Text style={styles.domainLabel}>Attention</Text>
            <Text style={styles.domainScore}>74</Text>
          </Card>
          <Card style={styles.domainCard}>
            <Text style={styles.domainLabel}>Flexibility</Text>
            <Text style={styles.domainScore}>70</Text>
          </Card>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="공유하기"
          onPress={() => captureAndShare(shareRef)}
          variant="secondary"
        />
        <Button
          title="홈으로"
          onPress={() => router.replace('/')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  shareCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.xl,
  },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  domainCard: {
    width: '45%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  domainLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  domainScore: {
    ...Typography.scoreMini,
    color: Colors.textPrimary,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
