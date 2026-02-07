import { formatDuration, formatDate, getTodayString, clamp, delay } from '../utils';

describe('utils - formatDuration', () => {
  it('returns "0s" for 0ms', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('returns "0s" for 999ms (sub-second rounds down)', () => {
    expect(formatDuration(999)).toBe('0s');
  });

  it('returns "1s" for exactly 1000ms', () => {
    expect(formatDuration(1000)).toBe('1s');
  });

  it('returns "59s" for 59999ms (just under a minute)', () => {
    expect(formatDuration(59999)).toBe('59s');
  });

  it('returns "1m 0s" for exactly 60000ms', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
  });

  it('returns "2m 5s" for 125000ms', () => {
    expect(formatDuration(125000)).toBe('2m 5s');
  });

  it('returns "1m 30s" for 90000ms', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
  });

  it('returns "10m 0s" for 600000ms', () => {
    expect(formatDuration(600000)).toBe('10m 0s');
  });
});

describe('utils - formatDate', () => {
  it('formats date in Korean by default', () => {
    const result = formatDate('2024-03-15');
    // Korean format: M월 D일
    expect(result).toMatch(/^\d{1,2}월 \d{1,2}일$/);
  });

  it('formats "2024-01-01" in Korean', () => {
    const result = formatDate('2024-01-01', 'ko');
    expect(result).toMatch(/월.*일$/);
  });

  it('formats date in English', () => {
    const result = formatDate('2024-03-15', 'en');
    // en-US short month format, e.g. "Mar 15"
    expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}/);
  });

  it('defaults lang parameter to "ko"', () => {
    const koResult = formatDate('2024-06-20');
    const koExplicit = formatDate('2024-06-20', 'ko');
    expect(koResult).toBe(koExplicit);
  });

  it('handles edge date "2024-12-31" in Korean', () => {
    const result = formatDate('2024-12-31', 'ko');
    expect(result).toMatch(/\d{1,2}월 \d{1,2}일$/);
  });

  it('handles edge date "2024-02-29" (leap year)', () => {
    const result = formatDate('2024-02-29', 'ko');
    expect(result).toMatch(/월.*일$/);
  });
});

describe('utils - getTodayString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getTodayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the current date based on ISO string', () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(getTodayString()).toBe(expected);
  });
});

describe('utils - clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value is below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('returns max when value is above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('handles negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it('handles single-point range (min === max)', () => {
    expect(clamp(5, 3, 3)).toBe(3);
    expect(clamp(3, 3, 3)).toBe(3);
    expect(clamp(1, 3, 3)).toBe(3);
  });
});

describe('utils - delay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a Promise', () => {
    const result = delay(100);
    expect(result).toBeInstanceOf(Promise);
    jest.runAllTimers();
  });

  it('resolves after the specified delay', async () => {
    let resolved = false;
    const promise = delay(1000).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);
  });

  it('resolves with undefined', async () => {
    const promise = delay(0);
    jest.runAllTimers();
    const result = await promise;
    expect(result).toBeUndefined();
  });
});
