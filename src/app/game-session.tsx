import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useSession } from '@/features/session/context';
import { getGamesForMode } from '@/games/registry';
import { getDifficultyForGame } from '@/features/adaptive/difficulty';
import type { GameResult } from '@/games/types';

export default function GameSessionScreen() {
  const router = useRouter();
  const { state, completeGame } = useSession();

  const games = useMemo(
    () => getGamesForMode(state.mode ?? 'activation'),
    [state.mode],
  );

  const currentGame = games[state.currentGameIndex];
  const totalGames = games.length;
  const isLastGame = state.currentGameIndex >= totalGames - 1;

  const difficulty = currentGame ? getDifficultyForGame(currentGame.id) : 1;

  const handleComplete = useCallback(
    (result: GameResult) => {
      completeGame(result);

      if (isLastGame) {
        router.replace('/report');
      } else {
        router.push('/game-transition');
      }
    },
    [completeGame, isLastGame, router],
  );

  const handleExit = useCallback(() => {
    Alert.alert(
      '세션 종료',
      '진행 중인 세션을 종료하시겠습니까?\n결과가 저장되지 않습니다.',
      [
        { text: '계속하기', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ],
    );
  }, [router]);

  if (!currentGame) {
    return (
      <ScreenContainer centered>
        <Text style={styles.errorText}>게임을 불러올 수 없습니다</Text>
      </ScreenContainer>
    );
  }

  const GameComponent = currentGame.component;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ProgressDots total={totalGames} current={state.currentGameIndex} />
        <View style={styles.gameInfo}>
          <Text style={styles.gameName}>{currentGame.nameKo}</Text>
          <Text style={styles.gameNameEn}>{currentGame.name}</Text>
        </View>
      </View>

      <View style={styles.gameContainer}>
        <GameComponent
          key={`${currentGame.id}-${state.currentGameIndex}`}
          difficulty={difficulty}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gameInfo: {
    alignItems: 'center',
    gap: 2,
  },
  gameName: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  gameNameEn: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  gameContainer: {
    flex: 1,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
