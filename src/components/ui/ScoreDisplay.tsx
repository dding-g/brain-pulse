import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { getScoreColor, getScoreLabel } from '@/constants/theme';

interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'lg';
  showLabel?: boolean;
  lang?: 'ko' | 'en';
}

export function ScoreDisplay({ score, size = 'lg', showLabel = true, lang = 'ko' }: ScoreDisplayProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <View style={styles.container}>
      <Text
        style={[
          size === 'lg' ? styles.scoreLarge : styles.scoreSmall,
          { color },
        ]}
      >
        {score}
      </Text>
      {showLabel && (
        <Text style={[styles.label, { color }]}>
          {lang === 'ko' ? label.ko : label.en}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreLarge: {
    ...Typography.scoreDisplay,
  },
  scoreSmall: {
    ...Typography.scoreMini,
  },
  label: {
    ...Typography.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
