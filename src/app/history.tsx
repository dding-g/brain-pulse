import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius, getScoreColor } from '@/constants/theme';
import { getRecentSessions } from '@/features/storage/sqlite';
import { getGameById } from '@/games/registry';
import { formatDate, formatDuration } from '@/lib/utils';
import type { SessionData } from '@/games/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);

  useFocusEffect(
    useCallback(() => {
      getRecentSessions(50).then(setSessions);
    }, []),
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="<" variant="ghost" size="sm" onPress={() => router.back()} />
        <Text style={styles.title}>기록</Text>
        <View style={styles.placeholder} />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>아직 기록이 없습니다</Text>
          <Text style={styles.emptySubtext}>Start a brain check to see your history</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={styles.sessionCard}
              onPress={() => setSelectedSession(item)}
            >
              <View style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionDate}>
                    {formatDate(item.startedAt.slice(0, 10))}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {new Date(item.startedAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.sessionMode}>
                    {item.mode} - {item.gameResults.length} games
                  </Text>
                </View>
                <View style={styles.sessionScore}>
                  <Text
                    style={[
                      styles.sessionScoreValue,
                      { color: getScoreColor(item.compositeScore) },
                    ]}
                  >
                    {Math.round(item.compositeScore)}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      <Modal
        visible={selectedSession !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSession && (
              <>
                <Text style={styles.modalTitle}>세션 상세</Text>
                <Text style={styles.modalDate}>
                  {formatDate(selectedSession.startedAt.slice(0, 10))}
                </Text>
                <Text
                  style={[
                    styles.modalScore,
                    { color: getScoreColor(selectedSession.compositeScore) },
                  ]}
                >
                  {Math.round(selectedSession.compositeScore)}
                </Text>

                <View style={styles.modalBreakdown}>
                  {selectedSession.gameResults.map((result) => {
                    const gameDef = getGameById(result.gameId);
                    return (
                      <View key={result.gameId} style={styles.modalGameRow}>
                        <Text style={styles.modalGameName}>
                          {gameDef?.nameKo ?? result.gameId}
                        </Text>
                        <View style={styles.modalGameStats}>
                          <Text style={styles.modalGameAccuracy}>
                            {Math.round(result.accuracy * 100)}%
                          </Text>
                          <Text
                            style={[
                              styles.modalGameScore,
                              { color: getScoreColor(result.score) },
                            ]}
                          >
                            {result.score}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <Button
                  title="닫기"
                  onPress={() => setSelectedSession(null)}
                  variant="secondary"
                />
              </>
            )}
          </View>
        </View>
      </Modal>
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
  sessionCard: {
    padding: Spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  sessionTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sessionMode: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  sessionScore: {
    alignItems: 'center',
  },
  sessionScoreValue: {
    ...Typography.scoreMini,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    maxHeight: '80%',
  },
  modalTitle: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalDate: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalScore: {
    ...Typography.scoreDisplay,
    textAlign: 'center',
  },
  modalBreakdown: {
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  modalGameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  modalGameName: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  modalGameStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalGameAccuracy: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modalGameScore: {
    ...Typography.bodyBold,
  },
});
