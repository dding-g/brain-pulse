import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { getPreferredLanguage, setPreferredLanguage, clearAllData } from '@/features/storage/mmkv';
import { clearAllSessions } from '@/features/storage/sqlite';
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

  function handleDeleteAllData() {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your session history, scores, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllSessions();
              clearAllData();
              logEvent({ name: 'data_cleared' });
              Alert.alert('Done', 'All data has been deleted.');
            } catch {
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ],
    );
  }

  function handlePrivacyPolicy() {
    Alert.alert('Privacy Policy', 'Coming soon');
  }

  function handleContact() {
    Linking.openURL('mailto:brainpulse@example.com');
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="<" variant="ghost" size="sm" onPress={() => router.back()} />
        <Text style={styles.title}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          <Card>
            <Pressable style={styles.settingRow} onPress={handleDeleteAllData}>
              <Text style={styles.settingLabel}>Delete All Data</Text>
              <Text style={styles.settingValueDanger}>Delete</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <Card>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingValue}>v1.0.0</Text>
            </View>
          </Card>

          <Card>
            <Pressable style={styles.settingRow} onPress={handleContact}>
              <Text style={styles.settingLabel}>Contact</Text>
              <Text style={styles.settingValue}>brainpulse@example.com</Text>
            </Pressable>
          </Card>

          <Card>
            <Pressable style={styles.settingRow} onPress={handlePrivacyPolicy}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingValueNav}>{'>'}</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>BrainPulse v1.0.0</Text>
          <Text style={styles.footerText}>Made with care for your brain</Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    flex: 1,
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
  settingValueNav: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
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
