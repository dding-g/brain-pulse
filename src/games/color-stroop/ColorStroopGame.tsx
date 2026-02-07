import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import type { GameProps, GameResult } from '@/games/types';
import { GameHUD, useElapsedMs, useReactionTimer } from '@/games/components/GameHUD';
import { generateRounds } from './logic';
import type { ColorDef } from './types';

const GAME_ID = 'color-stroop';
const TIME_LIMIT = 45;
const ROUND_POOL_SIZE = 60;

export function ColorStroopGame({ difficulty, onComplete, onExit }: GameProps) {
  const rounds = useMemo(
    () => generateRounds(difficulty, ROUND_POOL_SIZE),
    [difficulty],
  );

  const [roundIdx, setRoundIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  const getElapsed = useElapsedMs();
  const { mark: markReaction, elapsed: getReaction } = useReactionTimer();

  const reactionTimes = useRef<number[]>([]);
  const correctRef = useRef(0);
  const totalRef = useRef(0);

  const wordScale = useSharedValue(1);

  const currentRound = rounds[roundIdx];

  useEffect(() => {
    markReaction();
    wordScale.value = 0.8;
    wordScale.value = withTiming(1, { duration: 200 });
  }, [roundIdx, markReaction, wordScale]);

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
    (selected: ColorDef) => {
      if (gameEnded || !currentRound) return;

      const rt = getReaction();
      reactionTimes.current.push(rt);

      const isCorrect = selected.name === currentRound.inkColor.name;
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

      wordScale.value = withSequence(
        withTiming(1.1, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );

      setTimeout(() => {
        setFeedback(null);
        if (roundIdx + 1 < rounds.length) {
          setRoundIdx((prev) => prev + 1);
        } else {
          finishGame();
        }
      }, 200);
    },
    [gameEnded, currentRound, getReaction, roundIdx, rounds.length, wordScale, finishGame],
  );

  const wordAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: wordScale.value }],
  }));

  if (!currentRound) return null;

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
        <Text style={styles.instruction}>Tap the INK COLOR</Text>

        <Animated.View style={[styles.wordContainer, wordAnimStyle]}>
          <Text style={[styles.word, { color: currentRound.inkColor.hex }]}>
            {currentRound.word}
          </Text>
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
              {feedback === 'correct' ? 'Correct!' : 'Wrong!'}
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.options}>
        {currentRound.options.map((color) => (
          <Pressable
            key={color.name}
            style={[styles.optionButton, { backgroundColor: color.hex }]}
            onPress={() => handleAnswer(color)}
          >
            <Text style={styles.optionText}>{color.name}</Text>
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
  instruction: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  wordContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    minWidth: 200,
    alignItems: 'center',
  },
  word: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 4,
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  optionButton: {
    width: '46%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  optionText: {
    ...Typography.bodyBold,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
