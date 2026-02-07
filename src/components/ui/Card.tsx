import { Pressable, Text, View, StyleSheet, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Card({ children, onPress, disabled = false, style }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        disabled={disabled}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

interface ModeCardProps {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  onPress: () => void;
  enabled?: boolean;
}

export function ModeCard({ icon, title, subtitle, description, onPress, enabled = true }: ModeCardProps) {
  return (
    <Card onPress={onPress} disabled={!enabled} style={!enabled ? styles.disabledCard : undefined}>
      <View style={styles.modeCardContent}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.modeCardText}>
          <Text style={styles.modeTitle}>{title}</Text>
          <Text style={styles.modeSubtitle}>{subtitle}</Text>
          <Text style={styles.modeDescription}>{description}</Text>
        </View>
      </View>
      {!enabled && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  disabledCard: {
    opacity: 0.4,
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: 36,
  },
  modeCardText: {
    flex: 1,
  },
  modeTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  modeSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modeDescription: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  comingSoonText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
});
