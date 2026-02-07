import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import type { GameProps, GameResult } from '@/games/types';
import { GameHUD, useElapsedMs } from '@/games/components/GameHUD';
import { generateRound, checkSequence, getConfig } from './logic';

const GAME_ID = 'sequence-memory';
const TIME_LIMIT = 45;
const MAX_STRIKES = 3;

type Phase = 'showing' | 'input' | 'result';

export function SequenceMemoryGame({ difficulty, onComplete, onExit }: GameProps) {
  const config = useMemo(() => getConfig(difficulty), [difficulty]);
  const [sequenceLength, setSequenceLength] = useState(config.startLength);
  const [round, setRound] = useState(() =>
    generateRound(config.gridSize, config.startLength),
  );
  const [phase, setPhase] = useState<Phase>('showing');
  const [userInput, setUserInput] = useState<number[]>([]);
  const [highlightTile, setHighlightTile] = useState<number | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  const getElapsed = useElapsedMs();
  const correctRef = useRef(0);
  const totalRef = useRef(0);

  const totalTiles = config.gridSize * config.gridSize;
  const screenWidth = Dimensions.get('window').width;
  const gridPadding = Spacing.lg * 2;
  const gapSize = Spacing.xs;
  const tileSize =
    (screenWidth - gridPadding - gapSize * (config.gridSize - 1)) / config.gridSize;

  // Show sequence animation
  useEffect(() => {
    if (phase !== 'showing') return;

    const { flashDurationMs, pauseBetweenMs } = config;
    const timers: ReturnType<typeof setTimeout>[] = [];

    round.sequence.forEach((tileIdx, i) => {
      const showAt = i * (flashDurationMs + pauseBetweenMs);
      const hideAt = showAt + flashDurationMs;

      timers.push(
        setTimeout(() => setHighlightTile(tileIdx), showAt),
        setTimeout(() => setHighlightTile(null), hideAt),
      );
    });

    const totalTime =
      round.sequence.length * (flashDurationMs + pauseBetweenMs);
    timers.push(
      setTimeout(() => {
        setPhase('input');
        setHighlightTile(null);
      }, totalTime),
    );

    return () => timers.forEach(clearTimeout);
  }, [phase, round, config]);

  const finishGame = useCallback(() => {
    if (gameEnded) return;
    setGameEnded(true);
    const elapsed = getElapsed();

    const result: GameResult = {
      gameId: GAME_ID,
      score: totalRef.current > 0
        ? Math.round((correctRef.current / totalRef.current) * 100)
        : 0,
      durationMs: elapsed,
      accuracy: totalRef.current > 0 ? correctRef.current / totalRef.current : 0,
      difficulty,
      correctCount: correctRef.current,
      totalCount: totalRef.current,
      rawMetrics: {
        maxSequenceLength: sequenceLength,
        strikes,
      },
    };
    onComplete(result);
  }, [gameEnded, getElapsed, difficulty, onComplete, sequenceLength, strikes]);

  const startNextRound = useCallback(
    (newLength: number) => {
      setUserInput([]);
      setFeedback(null);
      setRound(generateRound(config.gridSize, newLength));
      setPhase('showing');
    },
    [config.gridSize],
  );

  const handleTileTap = useCallback(
    (tileIdx: number) => {
      if (phase !== 'input' || gameEnded) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newInput = [...userInput, tileIdx];
      setUserInput(newInput);

      // Briefly highlight tapped tile
      setHighlightTile(tileIdx);
      setTimeout(() => setHighlightTile(null), 150);

      // Check so far
      const { correct: isOk } = checkSequence(
        round.sequence.slice(0, newInput.length),
        newInput,
      );

      if (!isOk) {
        // Wrong tap
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedback('wrong');
        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        totalRef.current += 1;
        setTotal(totalRef.current);

        setTimeout(() => {
          if (newStrikes >= MAX_STRIKES) {
            finishGame();
          } else {
            // Replay same sequence
            startNextRound(sequenceLength);
          }
        }, 500);
        return;
      }

      // Completed full sequence
      if (newInput.length === round.sequence.length) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFeedback('correct');
        correctRef.current += 1;
        totalRef.current += 1;
        setCorrect(correctRef.current);
        setTotal(totalRef.current);

        const newLength = Math.min(sequenceLength + 1, config.maxLength);
        setSequenceLength(newLength);

        setTimeout(() => {
          startNextRound(newLength);
        }, 600);
      }
    },
    [
      phase, gameEnded, userInput, round, strikes, sequenceLength,
      config.maxLength, finishGame, startNextRound,
    ],
  );

  return (
    <View style={styles.container}>
      <GameHUD
        timeLimit={TIME_LIMIT}
        correct={correct}
        total={total}
        onTimeUp={finishGame}
        onExit={onExit}
        label={`Len: ${sequenceLength} | ✕ ${strikes}/${MAX_STRIKES}`}
      />

      <View style={styles.gameArea}>
        {phase === 'showing' && (
          <Text style={styles.instruction}>Watch the sequence...</Text>
        )}
        {phase === 'input' && (
          <Text style={styles.instruction}>Repeat the sequence!</Text>
        )}

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

        <View
          style={[
            styles.grid,
            {
              width: tileSize * config.gridSize + gapSize * (config.gridSize - 1),
            },
          ]}
        >
          {Array.from({ length: totalTiles }).map((_, idx) => {
            const isHighlighted = highlightTile === idx;
            const isUserTapped = userInput.includes(idx) && phase === 'input';

            return (
              <Pressable
                key={idx}
                onPress={() => handleTileTap(idx)}
                disabled={phase !== 'input'}
                style={[
                  styles.tile,
                  {
                    width: tileSize,
                    height: tileSize,
                  },
                  isHighlighted && styles.tileHighlighted,
                  isUserTapped && !isHighlighted && styles.tileTapped,
                ]}
              />
            );
          })}
        </View>

        {/* Progress dots showing which position in sequence user is at */}
        {phase === 'input' && (
          <View style={styles.progressDots}>
            {round.sequence.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < userInput.length && styles.dotFilled,
                ]}
              />
            ))}
          </View>
        )}
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
  feedbackBadge: {
    marginBottom: Spacing.md,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  tileHighlighted: {
    backgroundColor: Colors.primary,
  },
  tileTapped: {
    backgroundColor: Colors.surfaceLight,
  },
  progressDots: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surfaceLight,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
});
