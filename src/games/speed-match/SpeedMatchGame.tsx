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
import { generateRounds, getConfig } from './logic';
import type { Shape } from './types';

const GAME_ID = 'speed-match';
const TIME_LIMIT = 45;
const ROUND_POOL_SIZE = 60;

const SHAPE_SYMBOLS: Record<Shape, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  star: '★',
  diamond: '◆',
  hexagon: '⬡',
  cross: '✚',
  heart: '♥',
  pentagon: '⬠',
  octagon: '⯃',
  arrow: '➤',
  moon: '☽',
};

export function SpeedMatchGame({ difficulty, onComplete, onExit }: GameProps) {
  const rounds = useMemo(
    () => generateRounds(difficulty, ROUND_POOL_SIZE),
    [difficulty],
  );
  const config = getConfig(difficulty);

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

  const scale = useSharedValue(1);
  const shapeOpacity = useSharedValue(1);

  const currentRound = rounds[roundIdx];

  // When moving to a new round, mark reaction start and animate
  useEffect(() => {
    if (currentRound && !currentRound.isFirst) {
      markReaction();
    }
    shapeOpacity.value = 0;
    shapeOpacity.value = withTiming(1, { duration: 200 });
  }, [roundIdx, currentRound, markReaction, shapeOpacity]);

  // Auto-advance on first round
  useEffect(() => {
    if (currentRound?.isFirst) {
      const timer = setTimeout(() => {
        setRoundIdx(1);
      }, config.displayTimeMs);
      return () => clearTimeout(timer);
    }
  }, [currentRound, config.displayTimeMs]);

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
    (userSaidMatch: boolean) => {
      if (gameEnded || !currentRound || currentRound.isFirst) return;

      const rt = getReaction();
      reactionTimes.current.push(rt);

      const isCorrect = userSaidMatch === currentRound.isMatch;
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

      scale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(1, { duration: 100 }),
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
    [gameEnded, currentRound, getReaction, roundIdx, rounds.length, scale, finishGame],
  );

  const shapeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: shapeOpacity.value,
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
        {currentRound.isFirst && (
          <Text style={styles.instruction}>Remember this shape</Text>
        )}
        {!currentRound.isFirst && (
          <Text style={styles.instruction}>Same or Different?</Text>
        )}

        <Animated.View style={[styles.shapeContainer, shapeAnimStyle]}>
          <Text style={[styles.shape, { color: currentRound.color }]}>
            {SHAPE_SYMBOLS[currentRound.shape]}
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

      {!currentRound.isFirst && (
        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.buttonDifferent]}
            onPress={() => handleAnswer(false)}
          >
            <Text style={styles.buttonText}>Different</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonSame]}
            onPress={() => handleAnswer(true)}
          >
            <Text style={styles.buttonText}>Same</Text>
          </Pressable>
        </View>
      )}
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
  shapeContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
  },
  shape: {
    fontSize: 80,
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
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  buttonSame: {
    backgroundColor: Colors.primary,
  },
  buttonDifferent: {
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    ...Typography.heading3,
    color: Colors.white,
  },
});
