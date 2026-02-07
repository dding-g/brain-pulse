import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { getPreferredLanguage, setPreferredLanguage } from '@/features/storage/mmkv';
import { resetDifficulty } from '@/features/adaptive/difficulty';
import { logEvent } from '@/lib/analytics';

export default function SettingsScreen() {
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      logEvent({ name: 'screen_view', params: { screen: 'settings' } });
    }, []),
  );

  const lang = getPreferredLanguage();

  function handleLanguageToggle() {
    setPreferredLanguage(lang === 'ko' ? 'en' : 'ko');
  }

  function handleResetDifficulty() {
    Alert.alert(
      'Reset Difficulty',
      'All difficulty levels will be reset to default. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetDifficulty() },
      ],
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="<" variant="ghost" size="sm" onPress={() => router.back()} />
        <Text style={styles.title}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>

        <Card>
          <Pressable style={styles.settingRow} onPress={handleLanguageToggle}>
            <Text style={styles.settingLabel}>Language / 언어</Text>
            <Text style={styles.settingValue}>{lang === 'ko' ? '한국어' : 'English'}</Text>
          </Pressable>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <Card>
          <Pressable style={styles.settingRow} onPress={handleResetDifficulty}>
            <Text style={styles.settingLabel}>Reset Difficulty</Text>
            <Text style={styles.settingValueDanger}>Reset</Text>
          </Pressable>
        </Card>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>BrainPulse v1.0.0</Text>
        <Text style={styles.footerText}>Made with care for your brain</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  section: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  settingValue: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  settingValueDanger: {
    ...Typography.body,
    color: Colors.danger,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  version: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
