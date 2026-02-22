import { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius, getScoreColor } from '@/constants/theme';
import { getSessionsForMonth } from '@/features/storage/sqlite';
import { getGameById } from '@/games/registry';
import { formatDate } from '@/lib/utils';
import { logEvent } from '@/lib/analytics';
import { MODE_CONFIG } from '@/constants/games';
import type { GameMode } from '@/games/types';
import type { SessionData } from '@/games/types';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0 = Sunday, which matches our grid (일/월/화/수/목/금/토)
  return new Date(year, month - 1, 1).getDay();
}

export default function HistoryScreen() {
  const router = useRouter();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      logEvent({ name: 'screen_view', params: { screen: 'history' } });
      loadSessions(currentYear, currentMonth);
    }, [currentYear, currentMonth]),
  );

  async function loadSessions(year: number, month: number) {
    const data = await getSessionsForMonth(year, month);
    setSessions(data);
    logEvent({ name: 'history_view', params: { session_count: data.length } });
  }

  // Build a map: day number -> best composite score for that day
  const dayScoreMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const session of sessions) {
      const day = new Date(session.startedAt).getDate();
      const existing = map.get(day);
      if (existing === undefined || session.compositeScore > existing) {
        map.set(day, session.compositeScore);
      }
    }
    return map;
  }, [sessions]);

  // Filtered sessions based on selected calendar day
  const displayedSessions = useMemo(() => {
    if (filterDay === null) return sessions;
    return sessions.filter((s) => new Date(s.startedAt).getDate() === filterDay);
  }, [sessions, filterDay]);

  function goToPrevMonth() {
    setFilterDay(null);
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    setFilterDay(null);
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleDayPress(day: number) {
    if (!dayScoreMap.has(day)) return;
    if (filterDay === day) {
      // Tap again to clear filter
      setFilterDay(null);
    } else {
      setFilterDay(day);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  function renderCalendar() {
    const cells: React.ReactNode[] = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const score = dayScoreMap.get(day);
      const isSelected = filterDay === day;
      const isToday = day === now.getDate() && currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
      cells.push(
        <Pressable
          key={day}
          style={[styles.calendarCell, isSelected && styles.calendarCellSelected, isToday && !isSelected && styles.calendarCellToday]}
          onPress={() => handleDayPress(day)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isToday && styles.calendarDayTextToday,
            ]}
          >
            {day}
          </Text>
          {score !== undefined && (
            <View
              style={[styles.calendarDot, { backgroundColor: getScoreColor(score) }]}
            />
          )}
        </Pressable>,
      );
    }

    return cells;
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="←" variant="ghost" size="sm" onPress={() => router.back()} />
        <Text style={styles.title}>기록</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Calendar */}
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={goToPrevMonth} style={styles.calendarNav}>
            <Text style={styles.calendarNavText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.calendarMonth}>
            {currentYear}년 {currentMonth}월
          </Text>
          <Pressable onPress={goToNextMonth} style={styles.calendarNav}>
            <Text style={styles.calendarNavText}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={styles.calendarDayLabels}>
          {DAY_LABELS.map((label) => (
            <Text key={label} style={styles.calendarDayLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>{renderCalendar()}</View>

        {filterDay !== null && (
          <Pressable onPress={() => setFilterDay(null)} style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {currentMonth}월 {filterDay}일 필터 해제
            </Text>
          </Pressable>
        )}
      </View>

      {/* Session list */}
      {displayedSessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>
            {filterDay !== null ? '선택한 날짜에 기록이 없습니다' : '아직 기록이 없습니다'}
          </Text>
          <Text style={styles.emptySubtext}>
            {filterDay !== null
              ? '다른 날짜를 선택해보세요'
              : '뇌 컨디션 체크를 시작해보세요!'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={displayedSessions}
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
                    {MODE_CONFIG[item.mode as GameMode]?.icon} {MODE_CONFIG[item.mode as GameMode]?.titleKo ?? item.mode} · {item.gameResults.length}개 게임
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

                {selectedSession.conditionBefore && (
                  <View style={styles.modalCondition}>
                    <Text style={styles.modalConditionTitle}>컨디션</Text>
                    <View style={styles.modalConditionRow}>
                      <View style={styles.modalConditionItem}>
                        <Text style={styles.modalConditionEmoji}>{['\ud83d\ude2b','\ud83d\ude34','\ud83d\ude10','\ud83d\ude0a','\ud83d\ude0e'][selectedSession.conditionBefore.sleepQuality - 1]}</Text>
                        <Text style={styles.modalConditionLabel}>수면</Text>
                      </View>
                      <View style={styles.modalConditionItem}>
                        <Text style={styles.modalConditionEmoji}>{['\ud83e\udeab','\ud83d\ude2e\u200d\ud83d\udca8','\ud83d\ude10','\ud83d\udcaa','\ud83d\udd25'][selectedSession.conditionBefore.energyLevel - 1]}</Text>
                        <Text style={styles.modalConditionLabel}>에너지</Text>
                      </View>
                      <View style={styles.modalConditionItem}>
                        <Text style={styles.modalConditionEmoji}>{['\ud83d\ude0c','\ud83d\ude42','\ud83d\ude10','\ud83d\ude30','\ud83e\udd2f'][selectedSession.conditionBefore.stressLevel - 1]}</Text>
                        <Text style={styles.modalConditionLabel}>스트레스</Text>
                      </View>
                    </View>
                  </View>
                )}

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

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  // Calendar styles
  calendar: {
    marginBottom: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  calendarNav: {
    padding: Spacing.sm,
  },
  calendarNavText: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 18,
  },
  calendarMonth: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  calendarDayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xs,
  },
  calendarDayLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    width: CELL_SIZE,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  calendarCellSelected: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  calendarDayText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  calendarDayTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: Colors.primary,
    fontWeight: '600',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 1,
  },
  filterBadge: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  filterBadgeText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  // Session list styles
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
  modalCondition: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  modalConditionTitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalConditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalConditionItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalConditionEmoji: {
    fontSize: 24,
  },
  modalConditionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
