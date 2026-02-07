import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current && styles.completed,
            i === current && styles.active,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  completed: {
    backgroundColor: Colors.primary,
  },
  active: {
    backgroundColor: Colors.primaryLight,
    width: 24,
    borderRadius: 4,
  },
});
