import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { getScoreColor } from '@/constants/theme';
import { getDailySummaries } from '@/features/storage/sqlite';
import { formatDate } from '@/lib/utils';
import type { DailySummary } from '@/games/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

  useEffect(() => {
    getDailySummaries(30).then(setSummaries);
  }, []);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="<" variant="ghost" size="sm" onPress={() => router.back()} />
        <Text style={styles.title}>기록</Text>
        <View style={styles.placeholder} />
      </View>

      {summaries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>아직 기록이 없습니다</Text>
          <Text style={styles.emptySubtext}>Start a brain check to see your history</Text>
        </View>
      ) : (
        <FlatList
          data={summaries}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.dayCard}>
              <View style={styles.dayRow}>
                <View>
                  <Text style={styles.dayDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.dayCount}>{item.sessionCount} sessions</Text>
                </View>
                <View style={styles.dayScore}>
                  <Text style={[styles.dayScoreValue, { color: getScoreColor(item.avgScore) }]}>
                    {Math.round(item.avgScore)}
                  </Text>
                  <Text style={styles.dayScoreLabel}>avg</Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  dayCard: {
    padding: Spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDate: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  dayCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  dayScore: {
    alignItems: 'center',
  },
  dayScoreValue: {
    ...Typography.scoreMini,
  },
  dayScoreLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
