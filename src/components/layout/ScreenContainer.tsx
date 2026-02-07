import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  centered?: boolean;
}

export function ScreenContainer({ children, centered }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, centered && styles.centered]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
