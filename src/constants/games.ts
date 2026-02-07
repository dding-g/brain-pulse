import type { GameMode } from '@/games/types';

export const MODE_CONFIG: Record<
  GameMode,
  { title: string; titleKo: string; description: string; descriptionKo: string; icon: string; gameCount: number; enabled: boolean }
> = {
  rest: {
    title: 'Rest',
    titleKo: '휴식',
    description: 'Light brain check for relaxed days',
    descriptionKo: '가벼운 뇌 컨디션 체크',
    icon: '🌙',
    gameCount: 3,
    enabled: false,
  },
  activation: {
    title: 'Activation',
    titleKo: '활성화',
    description: 'Standard daily brain condition check',
    descriptionKo: '일상 뇌 컨디션 측정',
    icon: '⚡',
    gameCount: 4,
    enabled: true,
  },
  development: {
    title: 'Development',
    titleKo: '개발',
    description: 'Intensive brain workout for growth',
    descriptionKo: '집중 뇌 트레이닝',
    icon: '🚀',
    gameCount: 5,
    enabled: false,
  },
};

export const SESSION_CONFIG = {
  maxGameDurationMs: 30_000,
  transitionDurationMs: 3_000,
  countdownSeconds: 3,
} as const;
