import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface GameHUDProps {
  /** Time limit in seconds */
  timeLimit: number;
  /** Current correct count */
  correct: number;
  /** Current total attempts */
  total: number;
  /** Called when time runs out */
  onTimeUp: () => void;
  /** Called when user taps exit */
  onExit: () => void;
  /** Optional label to show instead of score */
  label?: string;
}

export function GameHUD({
  timeLimit,
  correct,
  total,
  onTimeUp,
  onExit,
  label,
}: GameHUDProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: timeLimit * 1000 });
  }, [timeLimit, progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLimit]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const isLow = timeLeft <= 10;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.exitText}>✕</Text>
        </Pressable>
        <Text style={[styles.timer, isLow && styles.timerLow]}>
          {timeLeft}s
        </Text>
        <Text style={styles.score}>
          {label ?? `${correct}/${total}`}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            isLow && styles.barFillLow,
            barStyle,
          ]}
        />
      </View>
    </View>
  );
}

/** Hook to track elapsed time in ms since mount */
export function useElapsedMs(): () => number {
  const startRef = useRef(Date.now());
  return useCallback(() => Date.now() - startRef.current, []);
}

/** Hook for per-round reaction time tracking */
export function useReactionTimer() {
  const markRef = useRef(Date.now());
  const mark = useCallback(() => {
    markRef.current = Date.now();
  }, []);
  const elapsed = useCallback(() => Date.now() - markRef.current, []);
  return { mark, elapsed };
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exitText: {
    color: Colors.textSecondary,
    fontSize: 20,
    fontWeight: '600',
  },
  timer: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  timerLow: {
    color: Colors.danger,
  },
  score: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  barTrack: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  barFillLow: {
    backgroundColor: Colors.danger,
  },
});
