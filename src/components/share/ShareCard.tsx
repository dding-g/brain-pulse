import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, getScoreColor, getScoreLabel } from '@/constants/theme';
import { getGameById } from '@/games/registry';
import type { GameResult } from '@/games/types';

/** Domain label mapping for the share card */
const DOMAIN_LABELS: Record<string, string> = {
  processing: 'Processing',
  attention: 'Attention',
  memory: 'Memory',
  reaction: 'Reaction',
  flexibility: 'Flexibility',
};

interface ShareCardProps {
  /** Composite score (0-100) */
  compositeScore: number;
  /** Individual game results */
  gameResults: GameResult[];
  /** Optional date string; defaults to today */
  date?: string;
}

export function ShareCard({ compositeScore, gameResults, date }: ShareCardProps) {
  const scoreColor = getScoreColor(compositeScore);
  const scoreLabel = getScoreLabel(compositeScore);

  const today = date ?? new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      {/* Decorative top accent line */}
      <View style={[styles.accentLine, { backgroundColor: scoreColor }]} />

      {/* Header: Logo + Date */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          Brain<Text style={styles.logoPulse}>Pulse</Text>
        </Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Main score section */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreCaption}>Brain Condition</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {compositeScore}
          </Text>
          <View style={styles.scoreMeta}>
            <Text style={[styles.toneLabel, { color: scoreColor }]}>
              {scoreLabel.ko}
            </Text>
            <Text style={styles.toneEn}>{scoreLabel.en}</Text>
          </View>
        </View>

        {/* Score ring / arc decoration (simple bar representation) */}
        <View style={styles.scoreBarOuter}>
          <View
            style={[
              styles.scoreBarInner,
              {
                width: `${compositeScore}%`,
                backgroundColor: scoreColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Game breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Game Scores</Text>
        {gameResults.map((result) => {
          const gameDef = getGameById(result.gameId);
          const color = getScoreColor(result.score);
          const domainKey = gameDef?.domain ?? 'processing';
          return (
            <View key={result.gameId} style={styles.gameRow}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>
                  {gameDef?.nameKo ?? result.gameId}
                </Text>
                <Text style={styles.gameDomain}>
                  {DOMAIN_LABELS[domainKey] ?? domainKey}
                </Text>
              </View>
              <View style={styles.gameScoreArea}>
                <View style={styles.miniBarTrack}>
                  <View
                    style={[
                      styles.miniBarFill,
                      {
                        width: `${result.score}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.gameScore, { color }]}>
                  {result.score}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>brainpulse.app</Text>
      </View>
    </View>
  );
}

// -- Card dimensions --
const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },

  // Accent
  accentLine: {
    height: 4,
    width: '100%',
    marginBottom: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoPulse: {
    color: Colors.primary,
  },
  date: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // Score section
  scoreSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontSize: 11,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreValue: {
    fontSize: 80,
    fontWeight: '800',
    lineHeight: 88,
  },
  scoreMeta: {
    alignItems: 'flex-start',
    gap: 2,
  },
  toneLabel: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  toneEn: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 13,
  },

  // Score progress bar
  scoreBarOuter: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  scoreBarInner: {
    height: '100%',
    borderRadius: 3,
  },

  // Breakdown
  breakdownSection: {
    gap: Spacing.sm,
  },
  breakdownTitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
    marginBottom: Spacing.xs,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  gameInfo: {
    flex: 1,
    gap: 1,
  },
  gameName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  gameDomain: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  gameScoreArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  miniBarTrack: {
    width: 80,
    height: 4,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  gameScore: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    width: 36,
    textAlign: 'right',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerDivider: {
    height: 1,
    width: 40,
    backgroundColor: Colors.border,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
    letterSpacing: 1,
  },
});
