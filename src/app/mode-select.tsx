import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ModeCard } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { MODE_CONFIG } from '@/constants/games';
import { setCurrentMode, getConditionReport } from '@/features/storage/mmkv';
import { useSession } from '@/features/session/context';
import type { GameMode } from '@/games/types';

const MODES: GameMode[] = ['rest', 'activation', 'development'];

function getRecommendation(sleep: number, energy: number, stress: number): { mode: GameMode; message: string } {
  if (sleep <= 2 || energy <= 2 || stress >= 4) {
    return { mode: 'rest', message: '컨디션이 좋지 않아요. 가벼운 체크를 추천합니다.' };
  }
  if (sleep >= 4 && energy >= 4 && stress <= 2) {
    return { mode: 'development', message: '컨디션이 최고예요! 집중 모드를 추천합니다.' };
  }
  return { mode: 'activation', message: '오늘 컨디션을 체크해볼까요?' };
}

export default function ModeSelectScreen() {
  const router = useRouter();
  const { startSession } = useSession();
  const condition = getConditionReport();

  const recommendation = condition
    ? getRecommendation(condition.sleepQuality, condition.energyLevel, condition.stressLevel)
    : null;

  function handleSelectMode(mode: GameMode) {
    if (!MODE_CONFIG[mode].enabled) return;
    setCurrentMode(mode);
    if (condition) {
      startSession(mode, condition);
    }
    router.push('/game-session');
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="<" variant="ghost" size="sm" onPress={() => router.back()} />
        <Text style={styles.title}>모드 선택</Text>
        <View style={styles.placeholder} />
      </View>

      {recommendation && (
        <View style={styles.recommendationBubble}>
          <Text style={styles.recommendationText}>{recommendation.message}</Text>
          {recommendation.mode !== 'activation' && (
            <Text style={styles.recommendationHint}>
              (MVP: 활성화 모드만 사용 가능)
            </Text>
          )}
        </View>
      )}

      <View style={styles.cards}>
        {MODES.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isRecommended = recommendation?.mode === mode;
          return (
            <View key={mode}>
              {isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>추천</Text>
                </View>
              )}
              <ModeCard
                icon={config.icon}
                title={config.titleKo}
                subtitle={config.title}
                description={`${config.descriptionKo} (${config.gameCount} games)`}
                onPress={() => handleSelectMode(mode)}
                enabled={config.enabled}
              />
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

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
  recommendationBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  recommendationText: {
    ...Typography.body,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  recommendationHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  cards: {
    gap: Spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  recommendedBadge: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  recommendedText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
