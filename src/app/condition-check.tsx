import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from '@/lib/haptics';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { setConditionReport } from '@/features/storage/mmkv';
import { logEvent } from '@/lib/analytics';
import type { ConditionReport } from '@/games/types';

type Rating = 1 | 2 | 3 | 4 | 5;

const QUESTIONS = [
  {
    key: 'sleepQuality' as const,
    label: '수면 품질',
    labelEn: 'Sleep Quality',
    emojis: ['😵', '😴', '😐', '🙂', '😊'],
    descriptions: ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'],
  },
  {
    key: 'energyLevel' as const,
    label: '에너지 레벨',
    labelEn: 'Energy Level',
    emojis: ['🪫', '😮\u200d💨', '😐', '💪', '⚡'],
    descriptions: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'],
  },
  {
    key: 'stressLevel' as const,
    label: '스트레스',
    labelEn: 'Stress Level',
    emojis: ['😌', '🙂', '😐', '😰', '🤯'],
    descriptions: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'],
  },
];

export default function ConditionCheckScreen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<ConditionReport>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      logEvent({ name: 'screen_view', params: { screen: 'condition_check' } });
    }, []),
  );

  const question = QUESTIONS[currentQuestion];
  const currentAnswer = answers[question.key];
  const allAnswered = QUESTIONS.every((q) => answers[q.key] !== undefined);

  function handleSelect(value: Rating) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnswers((prev) => ({ ...prev, [question.key]: value }));

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion((prev) => prev + 1), 300);
    }
  }

  function handleContinue() {
    const report = answers as ConditionReport;
    setConditionReport(report);
    logEvent({
      name: 'condition_check_complete',
      params: {
        sleep: report.sleepQuality,
        energy: report.energyLevel,
        stress: report.stressLevel,
      },
    });
    router.push('/mode-select');
  }

  function handleBack() {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else {
      router.back();
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button title="←" variant="ghost" size="sm" onPress={handleBack} />
        <Text style={styles.title}>컨디션 체크</Text>
        <View style={styles.placeholder} />
      </View>

      <ProgressDots total={QUESTIONS.length} current={currentQuestion} />

      <View style={styles.questionContainer}>
        <Text style={styles.questionLabel}>{question.label}</Text>
        <Text style={styles.questionLabelEn}>{question.labelEn}</Text>

        <View style={styles.emojiRow}>
          {question.emojis.map((emoji, i) => {
            const value = (i + 1) as Rating;
            const selected = currentAnswer === value;
            return (
              <Pressable
                key={i}
                style={[styles.emojiButton, selected && styles.emojiSelected]}
                onPress={() => handleSelect(value)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={[styles.emojiLabel, selected && styles.emojiLabelSelected]}>
                  {question.descriptions[i]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.navigation}>
        {allAnswered && (
          <Button title="다음" onPress={handleContinue} size="lg" />
        )}
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
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  questionLabel: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  questionLabelEn: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  emojiButton: {
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.transparent,
  },
  emojiSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundLight,
  },
  emoji: {
    fontSize: 32,
  },
  emojiLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  emojiLabelSelected: {
    color: Colors.primary,
  },
  navigation: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
