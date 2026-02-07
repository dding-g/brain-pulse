import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Haptics } from '@/lib/haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import type { GameProps, GameResult } from '@/games/types';
import { GameHUD, useElapsedMs, useReactionTimer } from '@/games/components/GameHUD';
import { generateProblems } from './logic';

const GAME_ID = 'quick-math';
const TIME_LIMIT = 45;
const ROUND_POOL_SIZE = 50;

export function QuickMathGame({ difficulty, onComplete, onExit }: GameProps) {
  const problems = useMemo(
    () => generateProblems(difficulty, ROUND_POOL_SIZE),
    [difficulty],
  );

  const [problemIdx, setProblemIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  const getElapsed = useElapsedMs();
  const { mark: markReaction, elapsed: getReaction } = useReactionTimer();

  const reactionTimes = useRef<number[]>([]);
  const correctRef = useRef(0);
  const totalRef = useRef(0);

  const problemScale = useSharedValue(1);

  const currentProblem = problems[problemIdx];

  useEffect(() => {
    markReaction();
    problemScale.value = 0.85;
    problemScale.value = withTiming(1, { duration: 200 });
  }, [problemIdx, markReaction, problemScale]);

  const finishGame = useCallback(() => {
    if (gameEnded) return;
    setGameEnded(true);
    const elapsed = getElapsed();
    const avgReaction =
      reactionTimes.current.length > 0
        ? reactionTimes.current.reduce((a, b) => a + b, 0) /
          reactionTimes.current.length
        : 0;

    const result: GameResult = {
      gameId: GAME_ID,
      score: totalRef.current > 0
        ? Math.round((correctRef.current / totalRef.current) * 100)
        : 0,
      durationMs: elapsed,
      accuracy: totalRef.current > 0 ? correctRef.current / totalRef.current : 0,
      reactionTimeMs: Math.round(avgReaction),
      difficulty,
      correctCount: correctRef.current,
      totalCount: totalRef.current,
    };
    onComplete(result);
  }, [gameEnded, getElapsed, difficulty, onComplete]);

  const handleAnswer = useCallback(
    (selected: number) => {
      if (gameEnded || !currentProblem) return;

      const rt = getReaction();
      reactionTimes.current.push(rt);

      const isCorrect = selected === currentProblem.answer;
      const newCorrect = correctRef.current + (isCorrect ? 1 : 0);
      const newTotal = totalRef.current + 1;

      correctRef.current = newCorrect;
      totalRef.current = newTotal;
      setCorrect(newCorrect);
      setTotal(newTotal);

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFeedback('correct');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedback('wrong');
      }

      problemScale.value = withSequence(
        withTiming(1.08, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );

      setTimeout(() => {
        setFeedback(null);
        if (problemIdx + 1 < problems.length) {
          setProblemIdx((prev) => prev + 1);
        } else {
          finishGame();
        }
      }, 250);
    },
    [gameEnded, currentProblem, getReaction, problemIdx, problems.length, problemScale, finishGame],
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: problemScale.value }],
  }));

  if (!currentProblem) return null;

  return (
    <View style={styles.container}>
      <GameHUD
        timeLimit={TIME_LIMIT}
        correct={correct}
        total={total}
        onTimeUp={finishGame}
        onExit={onExit}
      />

      <View style={styles.gameArea}>
        <Animated.View style={[styles.problemContainer, animStyle]}>
          <Text style={styles.problem}>{currentProblem.display}</Text>
        </Animated.View>

        {feedback && (
          <Animated.View
            entering={FadeIn.duration(150)}
            style={[
              styles.feedbackBadge,
              feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            <Text style={styles.feedbackText}>
              {feedback === 'correct' ? 'Correct!' : `Answer: ${currentProblem.answer}`}
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.choices}>
        {currentProblem.choices.map((choice, idx) => (
          <Pressable
            key={`${problemIdx}-${idx}`}
            style={styles.choiceButton}
            onPress={() => handleAnswer(choice)}
          >
            <Text style={styles.choiceText}>{choice}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    minWidth: 240,
    alignItems: 'center',
  },
  problem: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  feedbackBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  feedbackCorrect: {
    backgroundColor: Colors.success + '33',
  },
  feedbackWrong: {
    backgroundColor: Colors.danger + '33',
  },
  feedbackText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  choiceButton: {
    width: '46%',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceText: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
});
