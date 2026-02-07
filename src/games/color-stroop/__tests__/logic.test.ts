import type { DifficultyLevel } from '@/games/types';
import { generateRounds, getConfig } from '../logic';
import { DIFFICULTY_CONFIG } from '../types';
import type { ColorDef } from '../types';

const ALL_COLORS: ColorDef[] = [
  { name: 'RED', nameKo: '빨강', hex: '#F44336' },
  { name: 'BLUE', nameKo: '파랑', hex: '#2196F3' },
  { name: 'GREEN', nameKo: '초록', hex: '#4CAF50' },
  { name: 'YELLOW', nameKo: '노랑', hex: '#FFEB3B' },
  { name: 'PURPLE', nameKo: '보라', hex: '#9C27B0' },
  { name: 'ORANGE', nameKo: '주황', hex: '#FF9800' },
];

describe('Color Stroop - generateRounds', () => {
  const difficulties: DifficultyLevel[] = [1, 2, 3, 4, 5];

  it('produces the requested number of rounds', () => {
    for (const d of difficulties) {
      const rounds = generateRounds(d, 15);
      expect(rounds).toHaveLength(15);
    }
  });

  it('produces correct count for a single round', () => {
    const rounds = generateRounds(3, 1);
    expect(rounds).toHaveLength(1);
  });

  it.each(difficulties)(
    'congruent/incongruent ratio roughly matches config for difficulty %d',
    (difficulty) => {
      const config = DIFFICULTY_CONFIG[difficulty];
      const count = 500;
      const rounds = generateRounds(difficulty, count);

      const congruentCount = rounds.filter((r) => r.isCongruent).length;
      const actualRatio = congruentCount / count;

      // Allow +/- 0.1 tolerance for randomness
      expect(actualRatio).toBeGreaterThan(config.congruentRatio - 0.1);
      expect(actualRatio).toBeLessThan(config.congruentRatio + 0.1);
    },
  );

  it('congruent rounds have matching word and ink color', () => {
    const rounds = generateRounds(3, 100);
    const congruent = rounds.filter((r) => r.isCongruent);

    for (const round of congruent) {
      expect(round.inkColor.name).toBe(round.wordColor.name);
      expect(round.word).toBe(round.inkColor.name);
    }
  });

  it('incongruent rounds have different word and ink color', () => {
    const rounds = generateRounds(3, 100);
    const incongruent = rounds.filter((r) => !r.isCongruent);

    for (const round of incongruent) {
      expect(round.inkColor.name).not.toBe(round.wordColor.name);
    }
  });

  it.each(difficulties)(
    'all colors and words come from valid pool for difficulty %d',
    (difficulty) => {
      const config = DIFFICULTY_CONFIG[difficulty];
      const validColorNames = ALL_COLORS.slice(0, config.numColors).map(
        (c) => c.name,
      );
      const rounds = generateRounds(difficulty, 50);

      for (const round of rounds) {
        expect(validColorNames).toContain(round.word);
        expect(validColorNames).toContain(round.inkColor.name);
        expect(validColorNames).toContain(round.wordColor.name);
      }
    },
  );

  it('options always include the correct answer (inkColor)', () => {
    const rounds = generateRounds(3, 50);
    for (const round of rounds) {
      const optionNames = round.options.map((o) => o.name);
      expect(optionNames).toContain(round.inkColor.name);
    }
  });

  it('options contain exactly 4 entries', () => {
    const rounds = generateRounds(3, 50);
    for (const round of rounds) {
      expect(round.options).toHaveLength(4);
    }
  });

  it('each option has valid ColorDef properties', () => {
    const rounds = generateRounds(4, 20);
    for (const round of rounds) {
      for (const option of round.options) {
        expect(typeof option.name).toBe('string');
        expect(typeof option.nameKo).toBe('string');
        expect(typeof option.hex).toBe('string');
        expect(option.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('word and wordKo are consistent with wordColor', () => {
    const rounds = generateRounds(3, 30);
    for (const round of rounds) {
      expect(round.word).toBe(round.wordColor.name);
      expect(round.wordKo).toBe(round.wordColor.nameKo);
    }
  });
});

describe('Color Stroop - getConfig', () => {
  it('returns correct config for each difficulty', () => {
    for (const d of [1, 2, 3, 4, 5] as DifficultyLevel[]) {
      const config = getConfig(d);
      expect(config).toEqual(DIFFICULTY_CONFIG[d]);
    }
  });

  it('congruentRatio decreases as difficulty increases', () => {
    const ratios = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).congruentRatio,
    );
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeLessThanOrEqual(ratios[i - 1]);
    }
  });

  it('displayTimeMs decreases as difficulty increases', () => {
    const times = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).displayTimeMs,
    );
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
  });
});
