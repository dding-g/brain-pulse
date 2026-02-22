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
      '난이도 초기화',
      '모든 난이도가 기본값으로 초기화됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '초기화', style: 'destructive', onPress: () => resetDifficulty() },
      ],
    );
  }

  function handleDeleteAllData() {
    Alert.alert(
      '모든 데이터 삭제',
      '모든 세션 기록, 점수, 설정이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllSessions();
              clearAllData();
              logEvent({ name: 'data_cleared' });
              Alert.alert('완료', '모든 데이터가 삭제되었습니다.');
            } catch {
              Alert.alert('오류', '데이터 삭제에 실패했습니다. 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  }

  function handlePrivacyPolicy() {
    Alert.alert('개인정보 처리방침', '준비 중입니다');
  }

  function handleContact() {
    Linking.openURL('mailto:brainpulse@example.com');
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="←" variant="ghost" size="sm" onPress={() => router.back()} />
        <Text style={styles.title}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일반</Text>

          <Card>
            <Pressable style={styles.settingRow} onPress={handleLanguageToggle}>
              <Text style={styles.settingLabel}>Language / 언어</Text>
              <Text style={styles.settingValue}>{lang === 'ko' ? '한국어' : 'English'}</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데이터</Text>

          <Card>
            <Pressable style={styles.settingRow} onPress={handleResetDifficulty}>
              <Text style={styles.settingLabel}>난이도 초기화</Text>
              <Text style={styles.settingValueDanger}>초기화</Text>
            </Pressable>
          </Card>

          <Card>
            <Pressable style={styles.settingRow} onPress={handleDeleteAllData}>
              <Text style={styles.settingLabel}>모든 데이터 삭제</Text>
              <Text style={styles.settingValueDanger}>삭제</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>

          <Card>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>앱 버전</Text>
              <Text style={styles.settingValue}>v1.0.0</Text>
            </View>
          </Card>

          <Card>
            <Pressable style={styles.settingRow} onPress={handleContact}>
              <Text style={styles.settingLabel}>문의하기</Text>
              <Text style={styles.settingValue}>brainpulse@example.com</Text>
            </Pressable>
          </Card>

          <Card>
            <Pressable style={styles.settingRow} onPress={handlePrivacyPolicy}>
              <Text style={styles.settingLabel}>개인정보 처리방침</Text>
              <Text style={styles.settingValueNav}>{'>'}</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>BrainPulse v1.0.0</Text>
          <Text style={styles.footerText}>당신의 뇌 건강을 위해 만들었습니다</Text>
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
