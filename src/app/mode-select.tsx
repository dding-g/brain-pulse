import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ModeCard } from '@/components/ui/Card';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { MODE_CONFIG } from '@/constants/games';
import { setCurrentMode } from '@/features/storage/mmkv';
import type { GameMode } from '@/games/types';

const MODES: GameMode[] = ['rest', 'activation', 'development'];

export default function ModeSelectScreen() {
  const router = useRouter();

  function handleSelectMode(mode: GameMode) {
    setCurrentMode(mode);
    router.push('/game-session');
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>모드 선택</Text>
        <Text style={styles.subtitle}>Select Mode</Text>
      </View>

      <View style={styles.cards}>
        {MODES.map((mode) => {
          const config = MODE_CONFIG[mode];
          return (
            <ModeCard
              key={mode}
              icon={config.icon}
              title={config.titleKo}
              subtitle={config.title}
              description={`${config.descriptionKo} (${config.gameCount} games)`}
              onPress={() => handleSelectMode(mode)}
              enabled={config.enabled}
            />
          );
        })}
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          MVP에서는 활성화 모드만 사용 가능합니다
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  cards: {
    gap: Spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  hint: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
