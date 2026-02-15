import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import type { GameProps, GameResult } from '@/games/types';
import { GameHUD, useElapsedMs } from '@/games/components/GameHUD';
import { generateRounds, getConfig } from './logic';
import { GRID_SIZE } from './types';

const GAME_ID = 'n-back';
const TIME_LIMIT = 90;

export function NBackGame({ difficulty, onComplete, onExit }: GameProps) {
  const config = getConfig(difficulty);
  const rounds = useMemo(() => generateRounds(difficulty), [difficulty]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState<'showing' | 'waiting' | 'gap' | 'done'>('showing');
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [userResponded, setUserResponded] = useState(false);
  const [activeCell, setActiveCell] = useState<number>(-1);

  const getElapsed = useElapsedMs();
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const totalScorable = useRef(0);

  const pulseScale = useSharedValue(1);

  const currentRound = rounds[roundIdx];
  const isScorable = roundIdx >= config.nValue;

  const finishGame = useCallback(() => {
    if (gameEnded) return;
    setGameEnded(true);
    setPhase('done');

    const elapsed = getElapsed();
    const total = totalScorable.current;
    const correctCount = correctRef.current;

    const result: GameResult = {
      gameId: GAME_ID,
      score: total > 0 ? Math.round((correctCount / total) * 100) : 0,
      durationMs: elapsed,
      accuracy: total > 0 ? correctCount / total : 0,
      difficulty,
      correctCount,
      totalCount: total,
      rawMetrics: {
        nValue: config.nValue,
        totalRounds: rounds.length,
      },
    };
    onComplete(result);
  }, [gameEnded, getElapsed, difficulty, config.nValue, rounds.length, onComplete]);

  useEffect(() => {
    if (gameEnded || !currentRound) return;

    setPhase('showing');
    setUserResponded(false);
    setFeedback(null);
    setActiveCell(currentRound.position);

    pulseScale.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 200 }),
    );

    const showTimer = setTimeout(() => {
      setActiveCell(-1);
      if (isScorable) {
        setPhase('waiting');
      } else {
        setPhase('gap');
      }
    }, config.stimulusTimeMs);

    return () => clearTimeout(showTimer);
  }, [roundIdx, gameEnded, currentRound, config.stimulusTimeMs, isScorable, pulseScale]);

  useEffect(() => {
    if (phase !== 'waiting' || gameEnded) return;

    const waitTimer = setTimeout(() => {
      if (!userResponded && isScorable) {
        totalScorable.current += 1;
        answeredRef.current += 1;
        setAnswered((a) => a + 1);

        if (!currentRound.isMatch) {
          correctRef.current += 1;
          setCorrect((c) => c + 1);
        }
      }
      setPhase('gap');
    }, 2000);

    return () => clearTimeout(waitTimer);
  }, [phase, gameEnded, userResponded, isScorable, currentRound]);

  useEffect(() => {
    if (phase !== 'gap' || gameEnded) return;

    const gapTimer = setTimeout(() => {
      if (roundIdx + 1 >= rounds.length) {
        finishGame();
      } else {
        setRoundIdx((prev) => prev + 1);
      }
    }, config.interStimulusMs);

    return () => clearTimeout(gapTimer);
  }, [phase, gameEnded, roundIdx, rounds.length, config.interStimulusMs, finishGame]);

  const handleAnswer = useCallback(
    (userSaidMatch: boolean) => {
      if (gameEnded || userResponded || !isScorable || phase === 'gap' || phase === 'done') return;

      setUserResponded(true);
      totalScorable.current += 1;
      answeredRef.current += 1;
      setAnswered((a) => a + 1);

      const isCorrect = userSaidMatch === currentRound.isMatch;
      if (isCorrect) {
        correctRef.current += 1;
        setCorrect((c) => c + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFeedback('correct');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedback('wrong');
      }

      setTimeout(() => {
        setFeedback(null);
        setPhase('gap');
      }, 300);
    },
    [gameEnded, userResponded, isScorable, phase, currentRound],
  );

  const gridPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!currentRound) return null;

  return (
    <View style={styles.container}>
      <GameHUD
        timeLimit={TIME_LIMIT}
        correct={correct}
        total={answered}
        onTimeUp={finishGame}
        onExit={onExit}
        label={`${config.nValue}-Back`}
      />

      <View style={styles.gameArea}>
        <Text style={styles.instruction}>
          {isScorable
            ? `Same position as ${config.nValue} step${config.nValue > 1 ? 's' : ''} ago?`
            : 'Watch carefully...'}
        </Text>

        <Text style={styles.roundCounter}>
          {roundIdx + 1} / {rounds.length}
        </Text>

        <Animated.View style={[styles.grid, gridPulseStyle]}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => (
            <NBackCell
              key={idx}
              isActive={activeCell === idx}
              symbol={activeCell === idx ? currentRound.symbol : ''}
              color={activeCell === idx ? currentRound.color : Colors.surfaceLight}
            />
          ))}
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

      {isScorable && phase !== 'done' && (
        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.buttonNo]}
            onPress={() => handleAnswer(false)}
            disabled={userResponded}
          >
            <Text style={styles.buttonText}>Different</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonYes]}
            onPress={() => handleAnswer(true)}
            disabled={userResponded}
          >
            <Text style={styles.buttonText}>Match!</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

interface NBackCellProps {
  isActive: boolean;
  symbol: string;
  color: string;
}

function NBackCell({ isActive, symbol, color }: NBackCellProps) {
  return (
    <View style={[styles.cell, isActive && styles.cellActive]}>
      <Text style={[styles.cellSymbol, { color }]}>{symbol}</Text>
    </View>
  );
}

const CELL_SIZE = 90;
const CELL_GAP = 8;

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
    marginBottom: Spacing.sm,
  },
  roundCounter: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  grid: {
    width: CELL_SIZE * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1),
    height: CELL_SIZE * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
    backgroundColor: Colors.surface,
  },
  cellActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cellSymbol: {
    fontSize: 36,
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
  buttonYes: {
    backgroundColor: Colors.primary,
  },
  buttonNo: {
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    ...Typography.heading3,
    color: Colors.white,
  },
});
