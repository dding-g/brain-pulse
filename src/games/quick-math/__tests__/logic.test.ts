import type { DifficultyLevel } from '@/games/types';
import { generateProblem, generateProblems, getConfig } from '../logic';
import { DIFFICULTY_CONFIG } from '../types';
import type { MathOperator } from '../types';

describe('Quick Math - generateProblem', () => {
  const difficulties: DifficultyLevel[] = [1, 2, 3, 4, 5];

  it.each(difficulties)(
    'produces a valid problem structure for difficulty %d',
    (difficulty) => {
      const problem = generateProblem(difficulty);
      expect(typeof problem.a).toBe('number');
      expect(typeof problem.b).toBe('number');
      expect(typeof problem.operator).toBe('string');
      expect(typeof problem.answer).toBe('number');
      expect(typeof problem.display).toBe('string');
      expect(Array.isArray(problem.choices)).toBe(true);
    },
  );

  it('choices contain exactly 4 options', () => {
    for (let i = 0; i < 20; i++) {
      const problem = generateProblem(3);
      expect(problem.choices).toHaveLength(4);
    }
  });

  it('choices always include the correct answer', () => {
    for (let i = 0; i < 50; i++) {
      const problem = generateProblem(3);
      expect(problem.choices).toContain(problem.answer);
    }
  });

  it('wrong options (distractors) do not include the correct answer', () => {
    for (let i = 0; i < 50; i++) {
      const problem = generateProblem(3);
      const wrongOptions = problem.choices.filter((c) => c !== problem.answer);
      // There should be exactly 3 wrong options (the correct answer appears once)
      // The correct answer could appear once in choices
      const correctCount = problem.choices.filter(
        (c) => c === problem.answer,
      ).length;
      expect(correctCount).toBe(1);
      expect(wrongOptions).toHaveLength(3);
    }
  });

  it('display string is formatted correctly', () => {
    for (let i = 0; i < 20; i++) {
      const problem = generateProblem(2);
      expect(problem.display).toBe(
        `${problem.a} ${problem.operator} ${problem.b} = ?`,
      );
    }
  });

  describe('answer correctness per operator', () => {
    it('addition: a + b = answer', () => {
      // Generate many problems and check addition ones
      for (let i = 0; i < 100; i++) {
        const problem = generateProblem(1); // difficulty 1 has +, -
        if (problem.operator === '+') {
          expect(problem.answer).toBe(problem.a + problem.b);
        }
      }
    });

    it('subtraction: a - b = answer, and answer >= 0', () => {
      for (let i = 0; i < 100; i++) {
        const problem = generateProblem(1);
        if (problem.operator === '-') {
          expect(problem.answer).toBe(problem.a - problem.b);
          expect(problem.answer).toBeGreaterThanOrEqual(0);
          expect(problem.a).toBeGreaterThanOrEqual(problem.b);
        }
      }
    });

    it('multiplication: a * b = answer', () => {
      for (let i = 0; i < 100; i++) {
        const problem = generateProblem(2); // difficulty 2 has +, -, x
        if (problem.operator === '\u00D7') {
          expect(problem.answer).toBe(problem.a * problem.b);
        }
      }
    });

    it('division: a / b = answer (no remainder)', () => {
      for (let i = 0; i < 200; i++) {
        const problem = generateProblem(4); // difficulty 4 has all operators
        if (problem.operator === '\u00F7') {
          expect(problem.a % problem.b).toBe(0);
          expect(problem.answer).toBe(problem.a / problem.b);
        }
      }
    });
  });

  it.each(difficulties)(
    'operator comes from the valid set for difficulty %d',
    (difficulty) => {
      const config = DIFFICULTY_CONFIG[difficulty];
      for (let i = 0; i < 50; i++) {
        const problem = generateProblem(difficulty);
        expect(config.operators).toContain(problem.operator);
      }
    },
  );

  it('operands are positive integers', () => {
    for (const d of difficulties) {
      for (let i = 0; i < 30; i++) {
        const problem = generateProblem(d);
        expect(problem.a).toBeGreaterThan(0);
        expect(problem.b).toBeGreaterThan(0);
        expect(Number.isInteger(problem.a)).toBe(true);
        expect(Number.isInteger(problem.b)).toBe(true);
      }
    }
  });

  it('difficulty affects number ranges - higher difficulty allows larger numbers', () => {
    // Generate many problems at difficulty 1 vs 5 and compare max values
    let maxA_d1 = 0;
    let maxA_d5 = 0;

    for (let i = 0; i < 200; i++) {
      const p1 = generateProblem(1);
      const p5 = generateProblem(5);
      if (p1.operator === '+') maxA_d1 = Math.max(maxA_d1, p1.a);
      if (p5.operator === '+') maxA_d5 = Math.max(maxA_d5, p5.a);
    }

    // Difficulty 1 has maxDigits=1 (max 9), difficulty 5 has maxDigits=3 (max 999)
    expect(maxA_d1).toBeLessThanOrEqual(9);
    expect(maxA_d5).toBeGreaterThan(9);
  });

  it('all distractors are non-negative for non-negative answers', () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(3);
      // The logic ensures val >= 0 for distractors
      for (const choice of problem.choices) {
        expect(choice).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('Quick Math - generateProblems', () => {
  it('produces the correct number of problems', () => {
    const problems = generateProblems(3, 10);
    expect(problems).toHaveLength(10);
  });

  it('produces 0 problems when count is 0', () => {
    const problems = generateProblems(3, 0);
    expect(problems).toHaveLength(0);
  });

  it('each problem in the batch is valid', () => {
    const problems = generateProblems(2, 15);
    const config = DIFFICULTY_CONFIG[2];

    for (const problem of problems) {
      expect(problem.choices).toHaveLength(4);
      expect(problem.choices).toContain(problem.answer);
      expect(config.operators).toContain(problem.operator);
    }
  });
});

describe('Quick Math - getConfig', () => {
  it('returns correct config for each difficulty', () => {
    for (const d of [1, 2, 3, 4, 5] as DifficultyLevel[]) {
      const config = getConfig(d);
      expect(config).toEqual(DIFFICULTY_CONFIG[d]);
    }
  });

  it('maxDigits increases with difficulty', () => {
    const digits = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).maxDigits,
    );
    for (let i = 1; i < digits.length; i++) {
      expect(digits[i]).toBeGreaterThanOrEqual(digits[i - 1]);
    }
  });

  it('operators set grows with difficulty', () => {
    const counts = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).operators.length,
    );
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });

  it('timePerProblemMs decreases with difficulty', () => {
    const times = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).timePerProblemMs,
    );
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
  });
});
